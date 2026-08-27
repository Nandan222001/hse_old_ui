#!/usr/bin/env bash
# Diagnose why the release APK shows "—" for every stat tile.
#
# The app swallows API errors (.catch(() => {}) in DashboardScreen), so the
# reason never reaches the screen. This asks production the same questions the
# app asks and prints the status codes.
#
# Usage:   ./diagnose_prod.sh <email> <password>
# Example: ./diagnose_prod.sh worker@example.com 'the-password'
#
# The password is only sent to https://api.ehsera.com to obtain a token. It is
# not written to disk or echoed.

set -uo pipefail
API="https://api.ehsera.com/api/v1"
EMAIL="${1:-}"; PASS="${2:-}"

if [ -z "$EMAIL" ] || [ -z "$PASS" ]; then
  echo "usage: $0 <email> <password>"; exit 1
fi

echo "== 1. login =="
LOGIN=$(curl -s --max-time 25 -w '\n%{http_code}' -X POST "$API/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"username\":\"$EMAIL\",\"password\":\"$PASS\"}")
CODE=$(printf '%s' "$LOGIN" | tail -1)
BODY=$(printf '%s' "$LOGIN" | sed '$d')
echo "   login -> $CODE"
if [ "$CODE" != "200" ]; then
  echo "   body: $(printf '%s' "$BODY" | head -c 300)"
  echo "   (login failed - nothing else can be checked)"; exit 1
fi

TOKEN=$(printf '%s' "$BODY" | python3 -c 'import sys,json; d=json.load(sys.stdin); d=d.get("data",d); print(d.get("access_token",""))')
printf '%s' "$BODY" | python3 -c '
import sys, json
d = json.load(sys.stdin); d = d.get("data", d); u = d.get("user", {}) or {}
print("   user :", u.get("full_name"), "| role:", u.get("role"),
      "| org:", u.get("org_id") or u.get("organisation_id"),
      "| employee_id:", u.get("employee_id"))
'

echo
echo "== 2. the endpoints the dashboard calls =="
for p in \
  "/worker/my-kpis" \
  "/worker/tasks" \
  "/worker/incidents" \
  "/capa/my-actions" \
  "/notifications" \
  "/hazard-register" \
  "/unsafe-act-register" \
  "/incident-workflow/my-reports"
do
  OUT=$(curl -s --max-time 25 -w '\n%{http_code}' -H "Authorization: Bearer $TOKEN" "$API$p")
  C=$(printf '%s' "$OUT" | tail -1)
  B=$(printf '%s' "$OUT" | sed '$d')
  printf "   %-34s %s" "$p" "$C"
  if [ "$C" != "200" ]; then
    printf "   <-- %s" "$(printf '%s' "$B" | tr -d '\n' | head -c 160)"
  fi
  echo
done

echo
echo "== 2b. WHAT /worker/my-kpis ACTUALLY RETURNS =="
curl -s --max-time 25 -H "Authorization: Bearer $TOKEN" "$API/worker/my-kpis" \
  | python3 -c '
import sys, json
raw = sys.stdin.read()
print("   raw:", raw[:400])
try:
    d = json.loads(raw)
    inner = d.get("data", d)
    print("   ---")
    for k in ("my_incidents","my_near_misses","hours_logged_month","my_open_capa","period_label"):
        v = inner.get(k, "<MISSING>")
        print(f"   {k:22} {v!r}")
except Exception as e:
    print("   not json:", e)
'

echo
echo "== 2c. CAPA-OWNER CHECK (the \"No such employee\" path) =="
echo "   The backend validates: employees WHERE id=<picked> AND organisation_id=<your org>."
echo "   If your org is None, that matches nothing and every submit 404s."
for EP in "/employees" "/team/members" "/capa/owners"; do
  OUT=$(curl -s --max-time 25 -w '\n%{http_code}' -H "Authorization: Bearer $TOKEN" "$API$EP")
  C=$(printf '%s' "$OUT" | tail -1); B=$(printf '%s' "$OUT" | sed '$d')
  printf "   %-22s %s" "$EP" "$C"
  if [ "$C" = "200" ]; then
    printf "   %s" "$(printf '%s' "$B" | python3 -c '
import sys, json
try:
    d = json.load(sys.stdin); d = d.get("data", d)
    items = d if isinstance(d, list) else d.get("items", [])
    print(f"{len(items)} people returned", end="")
    if items:
        f = items[0]
        print(f" | first: id={f.get(chr(105)+chr(100))} org={f.get(chr(111)+chr(114)+chr(103)+chr(97)+chr(110)+chr(105)+chr(115)+chr(97)+chr(116)+chr(105)+chr(111)+chr(110)+chr(95)+chr(105)+chr(100))}", end="")
except Exception as e:
    print("unparsed", end="")
')"
  fi
  echo
done

echo
echo "== 3. has migration 080 run on production? =="
echo "   (a 500 mentioning 'act_type' below means it has NOT)"
curl -s --max-time 25 -H "Authorization: Bearer $TOKEN" "$API/unsafe-act-register?limit=1" \
  | tr -d '\n' | grep -o "act_type\|Unknown column[^\"]*" | head -2 \
  || echo "   no schema error detected"
echo
echo "done."
