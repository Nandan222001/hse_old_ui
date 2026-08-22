import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, CheckCircle2, ChevronRight, CircleDot, Clock3, FileSearch,
  Flame, GraduationCap, Loader2, Lock, Search, ShieldCheck, Siren, Users,
  UserRound, Wrench, type LucideIcon,
} from "lucide-react";
import {
  getIncidentTrail, getTrackedIncidents, STAGE_ORDER,
  type IncidentTrailResponse, type StageKey, type TrackedIncident, type TrailAction,
  type TrailPerson,
} from "../../services/incident-trail.service";
import { IncidentsTabBar } from "../components/audits/IncidentsTabBar";

/**
 * Admin incident lifecycle tracker.
 *
 * One screen answering "what has happened to this incident, by whom, when" for
 * all eight stages of the workflow engine (HSE_Workflow_Engine_Slide.pptx).
 * Left: every incident with its current stage. Right: the full action trail.
 */

const STAGE_ICON: Record<StageKey, LucideIcon> = {
  RECORD: FileSearch,
  ASSESS: Siren,
  RESPOND: Flame,
  INVESTIGATE: Search,
  IMPROVE: Wrench,
  VERIFY: ShieldCheck,
  LEARN: GraduationCap,
  CLOSE: Lock,
};

const PRIORITY_COLOR: Record<string, string> = {
  P1: "#DC2626", P2: "#EA580C", P3: "#CA8A04", P4: "#2563EB", P5: "#64748B",
};

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function StatePill({ state }: Readonly<{ state: string }>) {
  const map: Record<string, { bg: string; fg: string; text: string }> = {
    complete: { bg: "#DCFCE7", fg: "#15803D", text: "Complete" },
    current: { bg: "#DBEAFE", fg: "#1D4ED8", text: "In progress" },
    skipped: { bg: "#FEF3C7", fg: "#B45309", text: "No action recorded" },
    pending: { bg: "#F1F5F9", fg: "#64748B", text: "Not reached" },
  };
  const s = map[state] ?? map.pending;
  return (
    <span className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.4px]"
      style={{ background: s.bg, color: s.fg, fontWeight: 700 }}>
      {s.text}
    </span>
  );
}

function ActionRow({ action }: Readonly<{ action: TrailAction }>) {
  return (
    <li className="relative pl-5 pb-3 last:pb-0">
      <span className="absolute left-0 top-[6px] h-2 w-2 rounded-full"
        style={{ background: action.timestamp_inferred ? "#CBD5E1" : "#4A57B9" }} />
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="text-[12.5px]" style={{ color: "#111827", fontWeight: 600 }}>
          {action.action}
        </span>
        {action.reference && (
          <span className="rounded px-1.5 py-0.5 text-[10px]"
            style={{ background: "#EEF2FB", color: "#4A57B9", fontWeight: 700 }}>
            {action.reference}
          </span>
        )}
        {action.capa_status && (
          <span className="text-[10.5px]" style={{ color: "#64748B" }}>
            status: {action.capa_status}
          </span>
        )}
      </div>
      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[11px]" style={{ color: "#64748B" }}>
        <span className="inline-flex items-center gap-1">
          <Clock3 className="h-3 w-3" />
          {formatDateTime(action.occurred_at)}
        </span>
        {action.actor_id ? (
          <span className="inline-flex items-center gap-1">
            <UserRound className="h-3 w-3" />
            <span style={{ color: "#334155", fontWeight: 600 }}>{action.actor_name ?? "Unknown employee"}</span>
            <span className="rounded px-1 py-0.5 tabular-nums"
              style={{ background: "#F1F5F9", color: "#475569", fontWeight: 700 }}>
              {action.actor_ref}
            </span>
            {action.actor_job_role && <span>· {action.actor_job_role}</span>}
            {action.actor_username && <span style={{ color: "#94A3B8" }}>· @{action.actor_username}</span>}
          </span>
        ) : (
          <span style={{ color: "#B45309" }}>actor not recorded</span>
        )}
        <span style={{ color: "#94A3B8" }}>{action.source}</span>
      </div>
      {action.timestamp_inferred && (
        <div className="mt-0.5 text-[10.5px]" style={{ color: "#B45309" }}>
          Time inferred — this action has no timestamp of its own
          {action.inferred_from ? `, shown against ${action.inferred_from}` : ""}.
        </div>
      )}
      {action.detail && (
        <p className="mt-1 rounded-md px-2 py-1.5 text-[11.5px] leading-snug"
          style={{ background: "#F8FAFC", color: "#374151" }}>
          {action.detail}
        </p>
      )}
    </li>
  );
}

function PersonCard({ person }: Readonly<{ person: TrailPerson }>) {
  const initials = (person.name ?? "?")
    .split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="rounded-lg border p-2.5" style={{ borderColor: "#E3E9F6", background: "#FCFDFF" }}>
      <div className="flex items-start gap-2.5">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] text-white"
          style={{ background: "linear-gradient(135deg, #505AB6, #7890F6)", fontWeight: 700 }}>
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[12.5px]" style={{ color: "#111827", fontWeight: 700 }}>
              {person.name ?? "Employee record missing"}
            </span>
            <span className="rounded px-1.5 py-0.5 text-[10px] tabular-nums"
              style={{ background: "#EEF2FB", color: "#3E4FB1", fontWeight: 700 }}>
              {person.employee_ref}
            </span>
            {!person.is_active && !person.record_missing && (
              <span className="rounded px-1.5 py-0.5 text-[9.5px]"
                style={{ background: "#F1F5F9", color: "#64748B", fontWeight: 700 }}>Inactive</span>
            )}
          </div>

          <div className="mt-0.5 flex flex-wrap gap-x-2 text-[11px]" style={{ color: "#64748B" }}>
            {person.job_role && <span>{person.job_role}</span>}
            {person.department && <span>· {person.department}</span>}
            {person.employment_type && <span>· {person.employment_type}</span>}
          </div>

          <div className="mt-1 flex flex-wrap gap-1">
            {person.workflow_roles.map((role) => (
              <span key={role} className="rounded-full px-2 py-0.5 text-[10px]"
                style={{ background: "#E4EAFC", color: "#2C3A8C", fontWeight: 700 }}>
                {role}
              </span>
            ))}
          </div>

          <div className="mt-1.5 text-[11px]" style={{ color: "#475569" }}>
            {person.action_count > 0 ? (
              <>
                <span style={{ fontWeight: 700 }}>{person.action_count}</span> action
                {person.action_count === 1 ? "" : "s"}: {person.actions.join(", ")}
              </>
            ) : (
              // Named on the incident but with no action carrying their id — a
              // real state (assignment without a recorded step), not an error.
              <span style={{ color: "#94A3B8" }}>Named on the incident, no recorded action</span>
            )}
          </div>

          {person.username && (
            <div className="mt-1 text-[10.5px]" style={{ color: "#94A3B8" }}>
              login @{person.username}{person.email ? ` · ${person.email}` : ""}
            </div>
          )}
          {person.record_missing && (
            <div className="mt-1 text-[10.5px]" style={{ color: "#B91C1C" }}>
              The incident references this employee id but no employee row exists.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StageBlock({ stage }: Readonly<{ stage: IncidentTrailResponse["stages"][number] }>) {
  const Icon = STAGE_ICON[stage.key];
  const done = stage.state === "complete";
  const current = stage.state === "current";
  const accent = done ? "#15803D" : current ? "#4A57B9" : stage.state === "skipped" ? "#B45309" : "#CBD5E1";

  return (
    <div className="relative pl-9 pb-5 last:pb-0">
      <span className="absolute left-[13px] top-7 bottom-0 w-px" style={{ background: "#E5EAF5" }} />
      <span className="absolute left-0 top-0 flex h-[27px] w-[27px] items-center justify-center rounded-full border-2 bg-white"
        style={{ borderColor: accent }}>
        {done ? <CheckCircle2 className="h-4 w-4" style={{ color: accent }} />
          : current ? <CircleDot className="h-4 w-4" style={{ color: accent }} />
            : <Icon className="h-3.5 w-3.5" style={{ color: accent }} />}
      </span>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] tabular-nums" style={{ color: "#94A3B8", fontWeight: 700 }}>
          {String(stage.number).padStart(2, "0")}
        </span>
        <span className="text-[13px] uppercase tracking-[0.6px]" style={{ color: "#1F2937", fontWeight: 700 }}>
          {stage.label}
        </span>
        <StatePill state={stage.state} />
        <span className="text-[11px]" style={{ color: "#94A3B8" }}>
          {stage.action_count} action{stage.action_count === 1 ? "" : "s"}
        </span>
      </div>
      <p className="mt-0.5 text-[11.5px]" style={{ color: "#6B7280" }}>{stage.description}</p>

      {stage.actions.length > 0 ? (
        <ul className="relative mt-2 border-l" style={{ borderColor: "#E5EAF5" }}>
          {stage.actions.map((a) => <ActionRow key={`${a.sequence}-${a.source}`} action={a} />)}
        </ul>
      ) : (
        <p className="mt-1.5 text-[11.5px]" style={{ color: "#94A3B8" }}>
          {stage.state === "skipped"
            ? "The incident moved past this stage with nothing recorded against it."
            : "Nothing recorded yet."}
        </p>
      )}
    </div>
  );
}

export function IncidentTrackingPage() {
  const [items, setItems] = useState<TrackedIncident[]>([]);
  const [stageCounts, setStageCounts] = useState<Record<string, number>>({});
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [trail, setTrail] = useState<IncidentTrailResponse | null>(null);
  const [stageFilter, setStageFilter] = useState<StageKey | "">("");
  const [query, setQuery] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingTrail, setLoadingTrail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    setLoadingList(true);
    setError(null);
    try {
      const data = await getTrackedIncidents({ stage: stageFilter || undefined, q: query || undefined });
      setItems(data.items);
      setStageCounts(data.stage_counts ?? {});
      setSelectedId((prev) => (prev && data.items.some((i) => i.id === prev) ? prev : data.items[0]?.id ?? null));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load incidents");
      setItems([]);
    } finally {
      setLoadingList(false);
    }
  }, [stageFilter, query]);

  useEffect(() => {
    const t = setTimeout(loadList, query ? 300 : 0);
    return () => clearTimeout(t);
  }, [loadList, query]);

  useEffect(() => {
    if (!selectedId) { setTrail(null); return; }
    let cancelled = false;
    setLoadingTrail(true);
    getIncidentTrail(selectedId)
      .then((data) => { if (!cancelled) setTrail(data); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : "Could not load trail"); })
      .finally(() => { if (!cancelled) setLoadingTrail(false); });
    return () => { cancelled = true; };
  }, [selectedId]);

  const totalTracked = useMemo(
    () => Object.values(stageCounts).reduce((sum, n) => sum + n, 0),
    [stageCounts],
  );

  return (
    <div className="space-y-4">
      <IncidentsTabBar />
      <div>
        <h1 className="text-[19px]" style={{ color: "#0F172A", fontWeight: 700 }}>Incident Lifecycle Tracking</h1>
        <p className="mt-0.5 text-[12.5px]" style={{ color: "#64748B" }}>
          Every action on every incident, stage 01 Record through stage 08 Close — who did it and when.
        </p>
      </div>

      {/* Stage pipeline — click to filter */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
        {STAGE_ORDER.map((key, idx) => {
          const Icon = STAGE_ICON[key];
          const active = stageFilter === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setStageFilter(active ? "" : key)}
              className="rounded-lg border p-2.5 text-left transition-all"
              style={{
                borderColor: active ? "#4A57B9" : "#DDE5F4",
                background: active ? "#EEF2FB" : "#FFFFFF",
                boxShadow: active ? "0 4px 12px rgba(74,87,185,0.18)" : "none",
              }}
            >
              <div className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5" style={{ color: "#4A57B9" }} />
                <span className="text-[10px] tabular-nums" style={{ color: "#94A3B8", fontWeight: 700 }}>
                  {String(idx + 1).padStart(2, "0")}
                </span>
              </div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.4px] truncate" style={{ color: "#334155", fontWeight: 700 }}>
                {key}
              </div>
              <div className="text-[17px] tabular-nums" style={{ color: "#0F172A", fontWeight: 700 }}>
                {stageCounts[key] ?? 0}
              </div>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="rounded-lg border px-3 py-2 text-[12px]"
          style={{ borderColor: "#FECACA", background: "#FEF2F2", color: "#B91C1C" }}>
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(300px,380px)_1fr]">
        {/* ── List ─────────────────────────────────────────────────────── */}
        <div className="rounded-lg border bg-white" style={{ borderColor: "#DDE5F4" }}>
          <div className="border-b p-2.5" style={{ borderColor: "#E9EEF8" }}>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: "#94A3B8" }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search incidents…"
                className="w-full rounded-md border py-1.5 pl-8 pr-2 text-[12.5px] outline-none"
                style={{ borderColor: "#DDE5F4", color: "#111827" }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px]" style={{ color: "#64748B" }}>
              <span>{items.length} shown{stageFilter ? ` · ${stageFilter}` : ""}</span>
              <span>{totalTracked} tracked</span>
            </div>
          </div>

          <div className="max-h-[62vh] overflow-y-auto">
            {loadingList ? (
              <div className="flex items-center justify-center gap-2 py-8 text-[12px]" style={{ color: "#64748B" }}>
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : items.length === 0 ? (
              <p className="py-8 text-center text-[12px]" style={{ color: "#94A3B8" }}>No incidents match.</p>
            ) : (
              items.map((inc) => {
                const active = inc.id === selectedId;
                return (
                  <button
                    key={inc.id}
                    type="button"
                    onClick={() => setSelectedId(inc.id)}
                    className="flex w-full items-start gap-2 border-b px-3 py-2.5 text-left transition-colors"
                    style={{ borderColor: "#F1F5F9", background: active ? "#EEF2FB" : "transparent" }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11.5px]" style={{ color: "#4A57B9", fontWeight: 700 }}>{inc.reference}</span>
                        {inc.priority && (
                          <span className="rounded px-1.5 py-0.5 text-[9.5px]"
                            style={{ background: `${PRIORITY_COLOR[inc.priority] ?? "#64748B"}1A`,
                              color: PRIORITY_COLOR[inc.priority] ?? "#64748B", fontWeight: 700 }}>
                            {inc.priority}
                          </span>
                        )}
                        {inc.is_hipo && (
                          <span className="rounded px-1.5 py-0.5 text-[9.5px]"
                            style={{ background: "#FEE2E2", color: "#B91C1C", fontWeight: 700 }}>HiPo</span>
                        )}
                        {inc.is_overdue && (
                          <span className="rounded px-1.5 py-0.5 text-[9.5px]"
                            style={{ background: "#FEF3C7", color: "#B45309", fontWeight: 700 }}>Overdue</span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-[12px]" style={{ color: "#1F2937" }}>
                        {inc.description || inc.incident_type || "—"}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[10.5px]" style={{ color: "#64748B" }}>
                        <span style={{ fontWeight: 700, color: "#334155" }}>
                          {inc.stage_number ? `${String(inc.stage_number).padStart(2, "0")} ${inc.stage}` : "unmapped"}
                        </span>
                        <span>· {inc.action_count} actions</span>
                        {inc.capa_total > 0 && <span>· CAPA {inc.capa_closed}/{inc.capa_total}</span>}
                      </div>
                      {inc.participants.length > 0 && (
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          <Users className="h-3 w-3" style={{ color: "#A3AEC6" }} />
                          {inc.participants.slice(0, 3).map((p) => (
                            <span key={p.employee_id} className="rounded px-1.5 py-0.5 text-[9.5px]"
                              style={{ background: "#F1F5F9", color: "#475569" }}
                              title={`${p.name ?? "Unknown"} · ${p.employee_ref} · ${p.workflow_role}`}>
                              {p.name ?? p.employee_ref} <span style={{ color: "#94A3B8" }}>{p.employee_ref}</span>
                            </span>
                          ))}
                          {inc.participants.length > 3 && (
                            <span className="text-[9.5px]" style={{ color: "#94A3B8" }}>
                              +{inc.participants.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="mt-1 h-3.5 w-3.5 flex-shrink-0" style={{ color: active ? "#4A57B9" : "#CBD5E1" }} />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Trail ────────────────────────────────────────────────────── */}
        <div className="rounded-lg border bg-white p-4" style={{ borderColor: "#DDE5F4" }}>
          {loadingTrail ? (
            <div className="flex items-center justify-center gap-2 py-10 text-[12px]" style={{ color: "#64748B" }}>
              <Loader2 className="h-4 w-4 animate-spin" /> Loading trail…
            </div>
          ) : !trail ? (
            <p className="py-10 text-center text-[12px]" style={{ color: "#94A3B8" }}>
              Select an incident to see every action recorded against it.
            </p>
          ) : (
            <>
              <div className="border-b pb-3" style={{ borderColor: "#E9EEF8" }}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[15px]" style={{ color: "#0F172A", fontWeight: 700 }}>{trail.incident.reference}</span>
                  <span className="rounded-full px-2 py-0.5 text-[10.5px]"
                    style={{ background: "#EEF2FB", color: "#4A57B9", fontWeight: 700 }}>
                    {trail.incident.workflow_status}
                  </span>
                  {trail.incident.statutory_reportable && (
                    <span className="rounded-full px-2 py-0.5 text-[10.5px]"
                      style={{ background: "#FEE2E2", color: "#B91C1C", fontWeight: 700 }}>Statutory</span>
                  )}
                </div>
                <p className="mt-1 text-[12.5px]" style={{ color: "#374151" }}>{trail.incident.description || "—"}</p>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px]" style={{ color: "#64748B" }}>
                  <span>Reported {formatDateTime(trail.incident.reported_at)}</span>
                  <span>{trail.incident.closed_at ? `Closed ${formatDateTime(trail.incident.closed_at)}` : "Not closed"}</span>
                  <span style={{ fontWeight: 700, color: "#334155" }}>{trail.total_actions} actions tracked</span>
                </div>
              </div>

              {trail.skipped_stages.length > 0 && (
                <div className="mt-3 flex items-start gap-2 rounded-md px-3 py-2 text-[11.5px]"
                  style={{ background: "#FFFBEB", color: "#92400E" }}>
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                  <span>
                    Passed <strong>{trail.skipped_stages.join(", ")}</strong> with no action recorded.
                  </span>
                </div>
              )}

              {trail.chronology_warnings.length > 0 && (
                <div className="mt-2 flex items-start gap-2 rounded-md px-3 py-2 text-[11.5px]"
                  style={{ background: "#FEF2F2", color: "#B91C1C" }}>
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                  <span>
                    {trail.chronology_warnings.length} action
                    {trail.chronology_warnings.length === 1 ? " carries a timestamp" : "s carry timestamps"} earlier
                    than a preceding stage. Actions are ordered by stage, not by clock — the underlying
                    timestamps are written from mixed time bases and cannot be compared directly.
                  </span>
                </div>
              )}

              {/* Who was involved — the whole cast, before the step by step */}
              <div className="mt-3 rounded-lg border p-3" style={{ borderColor: "#E3E9F6", background: "#F9FBFF" }}>
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" style={{ color: "#4A57B9" }} />
                  <span className="text-[11.5px] uppercase tracking-[0.6px]" style={{ color: "#334155", fontWeight: 700 }}>
                    People involved
                  </span>
                  <span className="text-[11px]" style={{ color: "#94A3B8" }}>
                    {trail.people.length} identified
                  </span>
                </div>

                {trail.people.length === 0 ? (
                  <p className="mt-2 text-[11.5px]" style={{ color: "#B45309" }}>
                    No employee is recorded against any action on this incident.
                  </p>
                ) : (
                  <div className="mt-2.5 grid gap-2 md:grid-cols-2">
                    {trail.people.map((p) => <PersonCard key={p.employee_id} person={p} />)}
                  </div>
                )}

                {(trail.named_in_report.injured_person || trail.named_in_report.witnesses.length > 0) && (
                  <div className="mt-2.5 border-t pt-2.5" style={{ borderColor: "#E9EEF8" }}>
                    <div className="text-[10.5px] uppercase tracking-[0.5px]" style={{ color: "#94A3B8", fontWeight: 700 }}>
                      Also named in the report
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px]" style={{ color: "#475569" }}>
                      {trail.named_in_report.injured_person && (
                        <span>
                          Injured: <strong>{trail.named_in_report.injured_person}</strong>
                          {trail.named_in_report.injured_body_part ? ` (${trail.named_in_report.injured_body_part})` : ""}
                        </span>
                      )}
                      {trail.named_in_report.witnesses.length > 0 && (
                        <span>Witnesses: <strong>{trail.named_in_report.witnesses.join(", ")}</strong></span>
                      )}
                    </div>
                    <p className="mt-1 text-[10.5px]" style={{ color: "#94A3B8" }}>
                      Entered as free text — these are not linked to an employee record, so they carry no employee ID.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4">
                {trail.stages.map((s) => <StageBlock key={s.key} stage={s} />)}
              </div>

              {trail.unstaged_actions.length > 0 && (
                <div className="mt-2 border-t pt-3" style={{ borderColor: "#E9EEF8" }}>
                  <div className="text-[11px] uppercase tracking-[0.6px]" style={{ color: "#94A3B8", fontWeight: 700 }}>
                    Not mapped to a stage
                  </div>
                  <ul className="mt-2 border-l" style={{ borderColor: "#E5EAF5" }}>
                    {trail.unstaged_actions.map((a) => <ActionRow key={`u-${a.sequence}`} action={a} />)}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
