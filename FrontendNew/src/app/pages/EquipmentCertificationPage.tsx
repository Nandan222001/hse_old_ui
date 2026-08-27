import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getEquipmentSummary,
  getEquipmentList,
  getEquipmentFilterOptions,
  type EquipmentSummary,
  type EquipmentRow,
} from "../../services/equipment-register.service";

// ── Shared card wrapper — same pattern as VendorsPage/ActionsPage ──────────────
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border bg-white p-5 shadow-[0_6px_16px_rgba(15,23,42,0.08)] ${className}`}
      style={{ borderColor: "#D8E2F4" }}
    >
      {children}
    </div>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 text-[15px]" style={{ color: "#111827", fontWeight: 700 }}>
      {children}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="py-6 text-center text-[12px]" style={{ color: "#9CA3AF" }}>{text}</div>
  );
}

function KpiCard({
  title, value, unit, note, tone,
}: {
  title: string; value: number | null; unit: string; note: string; tone: "good" | "warn" | "bad" | "neutral";
}) {
  const color = value === null ? "#9CA3AF"
    : tone === "good" ? "#166534" : tone === "warn" ? "#B45309" : tone === "bad" ? "#B91C1C" : "#111827";
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <div className="text-[40px] leading-none" style={{ color, fontWeight: 700 }}>
        {value === null ? "N/A" : `${value}${unit}`}
      </div>
      <p className="mt-2 text-[11px] leading-snug" style={{ color: "#9CA3AF" }}>{note}</p>
    </Card>
  );
}

function StatusPill({ text, tone }: { text: string; tone: "green" | "amber" | "red" | "slate" }) {
  const map = {
    green: { bg: "#DCFCE7", color: "#166534" },
    amber: { bg: "#FEF3C7", color: "#B45309" },
    red: { bg: "#FEE2E2", color: "#B91C1C" },
    slate: { bg: "#F1F5F9", color: "#64748B" },
  }[tone];
  return (
    <span className="text-[10px] px-2.5 py-0.5 rounded-full whitespace-nowrap" style={{ background: map.bg, color: map.color, fontWeight: 700 }}>
      {text}
    </span>
  );
}

function Skeleton({ h = "h-4" }: { h?: string }) {
  return <div className={`${h} rounded-lg animate-pulse`} style={{ background: "#F1F5F9" }} />;
}

const STATUS_TONE: Record<string, "green" | "amber" | "red" | "slate"> = {
  "Operational": "green",
  "Under Maintenance": "amber",
};

const PAGE_SIZE = 25;

export function EquipmentCertificationPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<EquipmentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [sceFilter, setSceFilter] = useState("All Equipment");
  const [currentPage, setCurrentPage] = useState(1);

  const [equipmentRows, setEquipmentRows] = useState<EquipmentRow[]>([]);
  const [equipmentTotal, setEquipmentTotal] = useState(0);
  const [equipmentTotalPages, setEquipmentTotalPages] = useState(0);
  const [equipmentLoading, setEquipmentLoading] = useState(false);
  const [equipmentTypes, setEquipmentTypes] = useState<string[]>([]);
  const [equipmentStatuses, setEquipmentStatuses] = useState<string[]>([]);

  useEffect(() => {
    getEquipmentSummary()
      .then(setSummary)
      .catch(() => setError("Failed to load equipment data"))
      .finally(() => setLoading(false));
    getEquipmentFilterOptions()
      .then((opts) => {
        setEquipmentTypes(opts.types);
        setEquipmentStatuses(opts.statuses);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setSearchTerm(searchInput.trim()), searchInput ? 300 : 0);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter, sceFilter]);

  useEffect(() => {
    setEquipmentLoading(true);
    getEquipmentList(currentPage, PAGE_SIZE, {
      status: statusFilter,
      equipment_type: typeFilter,
      sce: sceFilter === "Safety-Critical Only" ? "Yes" : sceFilter === "Non-Critical Only" ? "No" : undefined,
      q: searchTerm || undefined,
    })
      .then((res) => {
        setEquipmentRows(res.data);
        setEquipmentTotal(res.total);
        setEquipmentTotalPages(res.totalPages);
      })
      .catch(() => {})
      .finally(() => setEquipmentLoading(false));
  }, [currentPage, statusFilter, typeFilter, sceFilter, searchTerm]);

  if (loading) {
    return (
      <div className="space-y-5">
        <div><Skeleton h="h-7" /><div className="mt-2"><Skeleton h="h-4" /></div></div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><Skeleton h="h-24" /></Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 mx-auto mb-2" style={{ color: "#EF4444" }} />
          <p className="text-[14px]" style={{ color: "#6B7280" }}>
            {error || "No data available"}
          </p>
        </div>
      </div>
    );
  }

  const totalEquipment = summary.total_equipment;
  const operationalCount = summary.status_counts["Operational"] ?? 0;
  const underMaintenanceCount = summary.status_counts["Under Maintenance"] ?? 0;
  const sceCount = summary.sce_count;
  const sceOverdueCount = summary.sce_overdue_count;
  const mtbfAvg = summary.mtbf_avg_hours;
  const pmCompliance = summary.pm_compliance_pct;
  const typeChartData = summary.equipment_by_type.slice(0, 8);

  const totalVisible = equipmentTotal;
  const startIndex = totalVisible === 0 ? 0 : (currentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalVisible);

  const hasActiveFilters =
    Boolean(searchInput.trim()) ||
    statusFilter !== "All Status" ||
    typeFilter !== "All Types" ||
    sceFilter !== "All Equipment";

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div>
        <h1 className="text-[22px]" style={{ color: "#0A0A0A", fontWeight: 700 }}>Assets</h1>
        <p className="mt-0.5 text-[13px]" style={{ color: "#6B7280" }}>
          Welcome, {user?.name ?? "User"} — Module 4: Assets &amp; Operations, {totalEquipment} equipment item{totalEquipment !== 1 ? "s" : ""} registered
        </p>
      </div>

      {/* Module 4 KPIs */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Equipment"
          value={totalEquipment}
          unit=""
          note={`${operationalCount} operational, ${underMaintenanceCount} under maintenance`}
          tone="neutral"
        />
        <KpiCard
          title="PM Compliance"
          value={pmCompliance}
          unit="%"
          note={summary.pm_compliance_note}
          tone={
            pmCompliance === null ? "neutral"
              : pmCompliance >= 90 ? "good"
              : pmCompliance >= 60 ? "warn" : "bad"
          }
        />
        <KpiCard
          title="Fleet MTBF"
          value={mtbfAvg}
          unit=" hrs"
          note="Mean time between failures, averaged across the register"
          tone={mtbfAvg === null ? "neutral" : "good"}
        />
        <KpiCard
          title="SCE Overdue"
          value={sceOverdueCount}
          unit={` of ${sceCount}`}
          note="Safety-critical equipment past its PM due date"
          tone={sceOverdueCount === 0 ? "good" : sceOverdueCount >= sceCount / 2 ? "bad" : "warn"}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.4fr_1fr]">
        {/* Equipment by Type */}
        <Card>
          <CardTitle>Equipment by Type</CardTitle>
          {typeChartData.length === 0 ? (
            <EmptyState text="No equipment registered" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={typeChartData} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid stroke="#E2E8F0" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="type" tick={{ fill: "#111827", fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 12 }} labelStyle={{ fontWeight: 600, color: "#111827" }} />
                <Bar dataKey="count" fill="#64748B" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
          <p className="mt-2 text-[11px]" style={{ color: "#9CA3AF" }}>
            Registered equipment grouped by type, top 8 shown.
          </p>
        </Card>

        {/* Data gap summary */}
        <Card>
          <CardTitle>Data Gap Summary</CardTitle>
          <div className="space-y-2">
            <div className="rounded-xl border px-3 py-2 text-[12px]" style={{ borderColor: "#EEF2F7", background: "#FBFCFE", color: "#4B5563" }}>
              {summary.inspection_compliance_note}
            </div>
            <div className="rounded-xl border px-3 py-2 text-[12px]" style={{ borderColor: "#EEF2F7", background: "#FBFCFE", color: "#4B5563" }}>
              {summary.pm_compliance_note}
            </div>
          </div>
        </Card>
      </div>

      {/* Equipment Register */}
      <Card>
        <CardTitle>Equipment Register</CardTitle>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center mb-3">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search equipment..."
            className="h-10 w-full rounded-lg border px-4 text-[13px] outline-none"
            style={{ borderColor: "#D8E2F4", color: "#0F172A" }}
          />
          <div className="grid gap-3 grid-cols-3 flex-shrink-0">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 rounded-lg border bg-white px-3 text-[13px] outline-none" style={{ borderColor: "#D8E2F4", color: "#0F172A" }}>
              <option>All Status</option>
              {equipmentStatuses.map((item) => <option key={item}>{item}</option>)}
            </select>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-10 rounded-lg border bg-white px-3 text-[13px] outline-none" style={{ borderColor: "#D8E2F4", color: "#0F172A" }}>
              <option>All Types</option>
              {equipmentTypes.map((item) => <option key={item}>{item}</option>)}
            </select>
            <select value={sceFilter} onChange={(e) => setSceFilter(e.target.value)} className="h-10 rounded-lg border bg-white px-3 text-[13px] outline-none" style={{ borderColor: "#D8E2F4", color: "#0F172A" }}>
              {["All Equipment", "Safety-Critical Only", "Non-Critical Only"].map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                setStatusFilter("All Status");
                setTypeFilter("All Types");
                setSceFilter("All Equipment");
              }}
              className="h-10 rounded-lg border px-4 text-[13px] font-semibold flex-shrink-0"
              style={{ borderColor: "#D8E1F5", color: "#4A57B9", background: "#F5F7FF" }}
            >
              Clear Filters
            </button>
          )}
        </div>
        {equipmentRows.length === 0 ? (
          <EmptyState text={equipmentLoading ? "Loading…" : "No equipment found matching your filters"} />
        ) : (
          <>
            <div className="mb-2 text-[12px]" style={{ color: "#9CA3AF" }}>
              Showing {startIndex + 1}–{endIndex} of {totalVisible} equipment items
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px]">
                <thead>
                  <tr style={{ background: "#F8FAFC" }}>
                    {["Equipment", "Type", "Location", "Status", "Next PM Due", "Operating Hrs YTD", "MTBF (hrs)", "SCE"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-[11px] uppercase" style={{ color: "#64748B", fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {equipmentRows.map((row) => (
                    <tr key={row.id} style={{ borderTop: "1px solid #E2E8F0" }}>
                      <td className="px-3 py-2">
                        <div className="text-[11px] font-mono" style={{ color: "#9CA3AF" }}>{row.equipment_code}</div>
                        <div className="text-[13px]" style={{ color: "#0F172A", fontWeight: 600 }}>{row.equipment_name}</div>
                      </td>
                      <td className="px-3 py-2 text-[13px]" style={{ color: "#334155" }}>{row.equipment_type ?? "—"}</td>
                      <td className="px-3 py-2 text-[13px]" style={{ color: "#334155" }}>{row.location_station ?? "—"}</td>
                      <td className="px-3 py-2"><StatusPill text={row.status ?? "Unknown"} tone={STATUS_TONE[row.status ?? ""] ?? "slate"} /></td>
                      <td className="px-3 py-2 text-[13px]" style={{ color: row.pm_overdue ? "#B91C1C" : "#334155", fontWeight: row.pm_overdue ? 700 : 400 }}>
                        {row.next_pm_due ?? "—"}{row.pm_overdue ? " (overdue)" : ""}
                      </td>
                      <td className="px-3 py-2 text-[13px]" style={{ color: "#334155" }}>{row.operating_hours_ytd?.toLocaleString() ?? "—"}</td>
                      <td className="px-3 py-2 text-[13px]" style={{ color: "#334155" }}>{row.mtbf_hours_estimated?.toLocaleString() ?? "—"}</td>
                      <td className="px-3 py-2">
                        {row.safety_critical_sce ? <StatusPill text="SCE" tone="amber" /> : <span style={{ color: "#CBD5E1" }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-[12px]" style={{ color: "#6B7280" }}>
                Showing {startIndex + 1}–{endIndex} of {totalVisible} equipment items
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  className="rounded-md px-3 py-1.5 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ color: currentPage === 1 ? "#94A3B8" : "#4A57B9", background: "#F4F7F4", border: "1px solid #E2E8F0" }}
                >
                  Previous
                </button>
                <span className="px-2 text-[13px]" style={{ color: "#475569" }}>
                  Page {equipmentTotalPages === 0 ? 0 : currentPage} of {equipmentTotalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= equipmentTotalPages}
                  onClick={() => setCurrentPage((page) => Math.min(equipmentTotalPages, page + 1))}
                  className="rounded-md px-3 py-1.5 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ color: currentPage >= equipmentTotalPages ? "#94A3B8" : "#4A57B9", background: "#F4F7F4", border: "1px solid #E2E8F0" }}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
