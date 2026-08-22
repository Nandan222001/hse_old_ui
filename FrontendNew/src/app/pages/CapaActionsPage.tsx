import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ChevronRight, ClipboardList } from "lucide-react";
import { getAllCapaActions, type CapaListItem } from "../../services/capa.service";

const PAGE_SIZE = 25;

// Windowed page list so very large datasets don't render hundreds of page buttons.
function getPageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result: (number | "…")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push("…");
    result.push(p);
    prev = p;
  }
  return result;
}

function priorityColor(band: string | null) {
  switch ((band || "").toLowerCase()) {
    case "critical":
    case "high":
      return { background: "#FFF1F2", color: "#BE123C" };
    case "medium":
      return { background: "#FFF7ED", color: "#C2410C" };
    default:
      return { background: "#F1F5F9", color: "#475569" };
  }
}

export function CapaActionsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const overdueOnly = searchParams.get("overdue") === "1";

  const [items, setItems] = useState<CapaListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [overdueOnly]);

  useEffect(() => {
    setLoading(true);
    getAllCapaActions(page, PAGE_SIZE, overdueOnly)
      .then((res) => {
        setItems(res.data);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, overdueOnly]);

  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[19px]" style={{ color: "#0F172A", fontWeight: 700 }}>CAPA Actions</h1>
        <p className="mt-0.5 text-[12.5px]" style={{ color: "#64748B" }}>
          Every corrective/preventive action raised for your organisation, real incident references included.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setSearchParams(overdueOnly ? {} : { overdue: "1" }, { replace: true })}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold border"
          style={
            overdueOnly
              ? { background: "#FFF7ED", borderColor: "#F4D6B0", color: "#B45309" }
              : { background: "#EEF2FF", borderColor: "#D8E1F5", color: "#4A57B9" }
          }
        >
          {overdueOnly ? "Showing overdue only — click to show all" : "Showing all actions — click to show overdue only"}
        </button>
      </div>

      <div className="rounded-2xl border bg-white p-4 md:p-5" style={{ borderColor: "#D9E4F6", boxShadow: "0 8px 18px rgba(15, 23, 42, 0.08)" }}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" style={{ color: "#4A57B9" }} />
            <h2 className="text-[clamp(1.05rem,2vw,1.3rem)]" style={{ color: "#111827", fontWeight: 700 }}>
              {overdueOnly ? "Overdue CAPA" : "All CAPA Actions"} — {total}
            </h2>
          </div>
        </div>

        {(() => {
          if (loading && items.length === 0) {
            return <p className="py-6 text-center text-[13px]" style={{ color: "#9CA3AF" }}>Loading…</p>;
          }
          if (items.length === 0) {
            return <p className="py-6 text-center text-[13px]" style={{ color: "#9CA3AF" }}>{overdueOnly ? "No overdue CAPA actions" : "No CAPA actions recorded yet"}</p>;
          }
          return (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  <thead>
                    <tr style={{ background: "#F8FAFC" }}>
                      {["Reference", "Action", "Priority", "Status", "Due Date", "Assignee"].map((h) => (
                        <th key={h} className="px-3 py-2 text-left text-[11px] uppercase" style={{ color: "#64748B", fontWeight: 700 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row) => {
                      // incident_id is the reliable link for incident-raised CAPAs —
                      // subject_id alone misses older rows never backfilled with
                      // subject_family, which is why this can't check family first.
                      const incidentNum = row.incident_id ?? (row.subject_family === "incident" ? row.subject_id : null);
                      const incidentRef = incidentNum ? `INC-${String(incidentNum).padStart(5, "0")}` : null;
                      const label = (row.description || row.capa_type || "Corrective Action")
                        .replace(/\s*\b(for|addressing)\s+INC-?\d+\b\.?/gi, "")
                        .trim() || row.capa_type || "Corrective Action";
                      const pColor = priorityColor(row.priority_band);
                      return (
                        <tr
                          key={row.id}
                          className="hover:bg-[#F8FAFC] transition-colors"
                          style={{ borderTop: "1px solid #E2E8F0" }}
                        >
                          <td className="px-3 py-2 text-[13px] whitespace-nowrap">
                            {incidentRef ? (
                              <button
                                onClick={() => navigate(`/violations/${incidentRef}`)}
                                className="font-semibold hover:underline"
                                style={{ color: "#4A57B9" }}
                              >
                                {incidentRef}
                              </button>
                            ) : (
                              <span style={{ color: "#94A3B8" }}>{row.capa_ref || "—"}</span>
                            )}
                          </td>
                          <td className="max-w-[320px] px-3 py-2 text-[13px]" style={{ color: "#111827" }}>
                            <span className="block truncate" title={label}>{label}</span>
                          </td>
                          <td className="px-3 py-2 text-[13px]">
                            <span className="inline-flex rounded-full px-2 py-1 text-[11px] font-bold" style={pColor}>
                              {row.priority_band || "—"}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-[13px]" style={{ color: row.is_overdue ? "#C2410C" : "#334155", fontWeight: row.is_overdue ? 700 : 400 }}>
                            {row.status || "—"}
                          </td>
                          <td className="px-3 py-2 text-[13px] whitespace-nowrap" style={{ color: "#334155" }}>
                            {row.due_date ? new Date(row.due_date).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-3 py-2 text-[13px]" style={{ color: "#334155" }}>
                            {row.responsible_person_name || "Unassigned"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 flex items-center justify-between flex-wrap gap-3">
                <span className="text-[12px]" style={{ color: "#64748B" }}>
                  Showing {rangeStart}–{rangeEnd} of {total} actions
                </span>
                <div className="flex items-center gap-1 flex-wrap">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1 rounded-md text-[12px] border disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                    style={{ color: "#374151", borderColor: "#E2E8F0" }}
                  >
                    ← Previous
                  </button>
                  {getPageNumbers(page, totalPages).map((p, idx) =>
                    p === "…" ? (
                      <span key={`ellipsis-${idx}`} className="px-1.5 text-[12px]" style={{ color: "#94A3B8" }}>…</span>
                    ) : (
                      <button
                        type="button"
                        key={p}
                        onClick={() => setPage(p)}
                        className="min-w-[28px] px-2 py-1 rounded-md text-[12px] border"
                        style={
                          p === page
                            ? { background: "#4A57B9", borderColor: "#4A57B9", color: "#fff", fontWeight: 600 }
                            : { color: "#374151", borderColor: "#E2E8F0" }
                        }
                      >
                        {p}
                      </button>
                    )
                  )}
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="px-2.5 py-1 rounded-md text-[12px] border disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                    style={{ color: "#374151", borderColor: "#E2E8F0" }}
                  >
                    Next <ChevronRight className="inline h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
