import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AlertTriangle, ShieldCheck, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getVendorSummary,
  type VendorSummary,
} from "../../services/vendors.service";

// ── Shared card wrapper ───────────────────────────────────────────────────────
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

// ── Module 5 KPI card — client's own formula in the subtitle, not a
// re-classification of it ("Needs Attention"-style labels caused the same
// complaint on the Compliance page — see analytics.py's compliance_label). ──
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

// ── Page skeleton loader ──────────────────────────────────────────────────────
function Skeleton({ h = "h-4" }: { h?: string }) {
  return <div className={`${h} rounded-lg animate-pulse`} style={{ background: "#F1F5F9" }} />;
}

const PREQUAL_TONE: Record<string, "green" | "amber" | "red" | "slate"> = {
  approved: "green",
  conditional: "amber",
  barred: "red",
  pending: "slate",
};

// ── Main page ─────────────────────────────────────────────────────────────────
export function VendorsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<VendorSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getVendorSummary()
      .then(setData)
      .catch(() => setError("Failed to load vendor data"))
      .finally(() => setLoading(false));
  }, []);

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

  if (error || !data) {
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

  const kpis = data.kpis ?? {
    contractor_trir: {
      value: null,
      contractor_injuries: 0,
      contractor_hours: 0,
      note: "No KPI data available yet",
    },
    induction_compliance_pct: {
      value: null,
      valid: 0,
      total: 0,
      note: "No KPI data available yet",
    },
    incident_contribution_pct: {
      value: null,
      contractor_injuries: 0,
      total_site_injuries: 0,
      note: "No KPI data available yet",
    },
    safety_score: {
      value: null,
      company_count: 0,
      note: "No KPI data available yet",
    },
  };
  const exposureHours = data.exposure_hours ?? [];
  const atRiskWorkers = data.at_risk_workers ?? [];
  const register = data.register ?? [];
  const totalContractors = data.total_contractors ?? 0;
  const expiringSoonCount = data.expiring_soon_count ?? 0;

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div>
        <h1 className="text-[22px]" style={{ color: "#0A0A0A", fontWeight: 700 }}>Vendors</h1>
        <p className="mt-0.5 text-[13px]" style={{ color: "#6B7280" }}>
          Welcome, {user?.name ?? "User"} — Module 5: Contractors &amp; Vendors, {totalContractors} contractor{totalContractors !== 1 ? "s" : ""} registered
        </p>
      </div>

      {/* Module 5 KPIs — same four the client's own spec defines */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Contractor TRIR"
          value={kpis.contractor_trir.value}
          unit=""
          note={`${kpis.contractor_trir.contractor_injuries} injuries × 200,000 ÷ ${kpis.contractor_trir.contractor_hours.toLocaleString()} hrs. ${kpis.contractor_trir.note}`}
          tone={kpis.contractor_trir.value === null ? "neutral" : kpis.contractor_trir.value === 0 ? "good" : "warn"}
        />
        <KpiCard
          title="Induction Compliance"
          value={kpis.induction_compliance_pct.value}
          unit="%"
          note={`${kpis.induction_compliance_pct.valid} of ${kpis.induction_compliance_pct.total} inductions valid today. ${kpis.induction_compliance_pct.note}`}
          tone={
            kpis.induction_compliance_pct.value === null ? "neutral"
              : kpis.induction_compliance_pct.value >= 90 ? "good"
              : kpis.induction_compliance_pct.value >= 60 ? "warn" : "bad"
          }
        />
        <KpiCard
          title="Incident Contribution"
          value={kpis.incident_contribution_pct.value}
          unit="%"
          note={`${kpis.incident_contribution_pct.contractor_injuries} of ${kpis.incident_contribution_pct.total_site_injuries} site injuries. ${kpis.incident_contribution_pct.note}`}
          tone={kpis.incident_contribution_pct.value === null ? "neutral" : kpis.incident_contribution_pct.value > 30 ? "bad" : "good"}
        />
        <KpiCard
          title="Contractor Safety Score"
          value={kpis.safety_score.value}
          unit="/100"
          note={`Averaged across ${kpis.safety_score.company_count} companies. ${kpis.safety_score.note}`}
          tone={
            kpis.safety_score.value === null ? "neutral"
              : kpis.safety_score.value >= 75 ? "good"
              : kpis.safety_score.value >= 60 ? "warn" : "bad"
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.4fr_1fr]">
        {/* Exposure Hours */}
        <Card>
          <CardTitle>Contractor Exposure Hours</CardTitle>
          {exposureHours.length === 0 ? (
            <EmptyState text="No contractor hours logged" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={exposureHours} margin={{ top: 16, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 12 }} labelStyle={{ fontWeight: 600, color: "#111827" }} />
                <Bar dataKey="hours" fill="#64748B" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
          <p className="mt-2 text-[11px]" style={{ color: "#9CA3AF" }}>
            Trailing 12 months, real logged hours per contractor company.
          </p>
        </Card>

        {/* Induction status */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <CardTitle>Inductions Needing Attention</CardTitle>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" style={{ color: "#94A3B8" }} />
              <span className="text-[11px]" style={{ color: "#94A3B8" }}>{expiringSoonCount} expiring within 30 days</span>
            </div>
          </div>
          {atRiskWorkers.length === 0 ? (
            <EmptyState text="No expired or soon-to-expire inductions" />
          ) : (
            <div className="space-y-2">
              {atRiskWorkers.map((w, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border px-3 py-2" style={{ borderColor: "#EEF2F7", background: "#FBFCFE" }}>
                  <div className="min-w-0">
                    <div className="text-[12px] truncate" style={{ color: "#0F172A", fontWeight: 600 }}>{w.full_name}</div>
                    <div className="text-[11px] truncate" style={{ color: "#6B7280" }}>{w.company_name}{w.badge_no ? ` · ${w.badge_no}` : ""}</div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <StatusPill text={w.status} tone={w.status === "Expired" ? "red" : "amber"} />
                    <div className="mt-1 text-[10px]" style={{ color: "#9CA3AF" }}>
                      {w.induction_valid_until ? new Date(w.induction_valid_until).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

        {/* Contractor Register */}
        <Card>
          <CardTitle>Contractor Register</CardTitle>
          {register.length === 0 ? (
            <EmptyState text="No contractor companies registered" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
              <thead>
                <tr style={{ background: "#F8FAFC" }}>
                  {["Company", "Service Type", "Prequalification", "ISO 45001", "Safety Score", "Contract", "Status"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-[11px] uppercase" style={{ color: "#64748B", fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {register.map((c) => (
                  <tr key={c.id} style={{ borderTop: "1px solid #E2E8F0" }}>
                    <td className="px-3 py-2 text-[13px]" style={{ color: "#0F172A", fontWeight: 600 }}>{c.company_name}</td>
                    <td className="px-3 py-2 text-[13px]" style={{ color: "#334155" }}>{c.service_type ?? "—"}</td>
                    <td className="px-3 py-2"><StatusPill text={c.prequalification_status} tone={PREQUAL_TONE[c.prequalification_status] ?? "slate"} /></td>
                    <td className="px-3 py-2">
                      <StatusPill text={c.iso_45001_certified ? "Certified" : "Not Certified"} tone={c.iso_45001_certified ? "green" : "slate"} />
                    </td>
                    <td className="px-3 py-2 text-[13px]" style={{ color: "#0F172A", fontWeight: 600 }}>
                      {c.safety_score !== null ? `${c.safety_score}/100` : "—"}
                    </td>
                    <td className="px-3 py-2 text-[12px]" style={{ color: "#6B7280" }}>
                      {c.contract_start_date ?? "—"} → {c.contract_end_date ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      <StatusPill text={c.active ? "Active" : "Suspended"} tone={c.active ? "green" : "red"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
