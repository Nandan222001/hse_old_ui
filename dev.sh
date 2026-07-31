#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# HSE mobile dev helper.
# Ensures the whole stack a USB-connected phone needs is up, in one command:
#   1. Backend API on :8000        (FastAPI / uvicorn --reload)
#   2. Metro bundler on :8081      (react-native start)
#   3. adb reverse tunnels         (phone localhost:8000/8081 -> this PC)
#
# The adb reverses drop whenever the phone is replugged or adb/backend restarts,
# which is why "no numbers" keeps happening. Re-run this anytime that occurs:
#
#     ./dev.sh            # ensure everything is up (starts what's down)
#     ./dev.sh reverse    # only re-apply the adb reverses (fastest fix)
#     ./dev.sh status     # just report, start nothing
# ─────────────────────────────────────────────────────────────────────────────
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT/backend"
MOBILE_DIR="$ROOT/mobile"
LOG_DIR="$ROOT/.devlogs"
mkdir -p "$LOG_DIR"

green() { printf '\033[32m%s\033[0m\n' "$1"; }
red()   { printf '\033[31m%s\033[0m\n' "$1"; }
yellow(){ printf '\033[33m%s\033[0m\n' "$1"; }

# port_reachable <port> : 0 if something answers HTTP on localhost:<port>
port_reachable() { curl -s -o /dev/null --max-time 3 "http://localhost:$1/" >/dev/null 2>&1; }
metro_running()  { curl -s --max-time 3 "http://localhost:8081/status" 2>/dev/null | grep -q "packager-status:running"; }

apply_reverses() {
  if adb get-state >/dev/null 2>&1; then
    adb reverse tcp:8000 tcp:8000 >/dev/null 2>&1
    adb reverse tcp:8081 tcp:8081 >/dev/null 2>&1
    green "✓ adb reverse set (8000 + 8081) — device: $(adb get-serialno 2>/dev/null)"
  else
    red   "✗ No adb device. Plug in the phone via USB and enable USB debugging, then re-run."
  fi
}

status() {
  echo "── Status ─────────────────────────────"
  port_reachable 8000 && green "✓ Backend  :8000  UP" || red "✗ Backend  :8000  DOWN"
  metro_running       && green "✓ Metro    :8081  UP" || red "✗ Metro    :8081  DOWN"
  if adb get-state >/dev/null 2>&1; then
    echo "  adb reverses:"; adb reverse --list 2>/dev/null | sed 's/^/    /'
  else
    yellow "  adb: no device connected"
  fi
  echo "───────────────────────────────────────"
}

start_backend() {
  if port_reachable 8000; then green "✓ Backend already UP (:8000)"; return; fi
  yellow "… starting backend (:8000) — logs: $LOG_DIR/backend.log"
  ( cd "$BACKEND_DIR" && nohup python3.11 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload >"$LOG_DIR/backend.log" 2>&1 & )
}

start_metro() {
  if metro_running; then green "✓ Metro already UP (:8081)"; return; fi
  yellow "… starting Metro (:8081) — logs: $LOG_DIR/metro.log"
  ( cd "$MOBILE_DIR" && nohup npx react-native start >"$LOG_DIR/metro.log" 2>&1 & )
}

case "${1:-up}" in
  reverse) apply_reverses ;;
  status)  status ;;
  up|"")
    start_backend
    start_metro
    yellow "… waiting for services to come up"
    for _ in $(seq 1 20); do port_reachable 8000 && metro_running && break; sleep 1; done
    apply_reverses
    status
    green "Done. If the app still shows no numbers: in the app log out and log back in (fresh token)."
    ;;
  *) echo "usage: ./dev.sh [up|reverse|status]"; exit 1 ;;
esac
