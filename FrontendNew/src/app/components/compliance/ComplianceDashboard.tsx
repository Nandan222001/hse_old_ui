import { useEffect, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, BarChart, Bar } from "recharts";
import { getComplianceSummary, type ComplianceSummary } from "../../../services/analytics.service";
import { useAuth } from "../../context/AuthContext";

// Client feedback (Compliance Section): "unnecessary classification lines
// should be removed" — this used to tag every card "Client KPI" vs
// "Supplementary", a meta-classification of the metric rather than
// information about it. Comparison against the previous 12-month period
// (the client's own correction: "not previous year, previous period")
// replaces it below instead.
function PeriodDelta({ pointsDelta }: { pointsDelta: number | null }) {
  if (pointsDelta === null) {
    return (
      <span className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px]" style={{ background: "#F1F5F9", color: "#94A3B8", fontWeight: 700 }}>
        Not enough data for prior 12 months
      </span>
    );
  }
  const up = pointsDelta >= 0;
  return (
    <span
      className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px]"
      style={{ background: up ? "#DCFCE7" : "#FEE2E2", color: up ? "#166534" : "#B91C1C", fontWeight: 700 }}
    >
      {up ? "▲" : "▼"} {Math.abs(pointsDelta)}pp vs previous 12 months
    </span>
  );
}

export function ComplianceDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<ComplianceSummary | null>(null);

  useEffect(() => {
    getComplianceSummary().then(setSummary).catch(console.error);
  }, []);

  const findingsBySeverity = summary?.findings_by_severity ?? [];
  const complianceTrend = summary?.compliance_trend ?? [];
  const nonConformanceRows = summary?.non_conformance_rows ?? [];
  const mom = summary?.compliance_trend_mom ?? null;

  return (
    <div className="space-y-4">
      <div>
        <h1>Welcome, {user?.name || "User"}</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <div className="rounded-2xl border bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: "#D8E2F4" }}>
          <div className="text-[18px]" style={{ color: "#111827", fontWeight: 700 }}>Permit Compliance</div>
          <div className="mt-2 text-[54px] leading-none" style={{ color: "#111827", fontWeight: 700 }}>{summary ? `${summary.permit_compliance_pct}%` : "—"}</div>
          <div className="mt-1 text-[14px]" style={{ color: "#4B5563" }}>PTW Compliance Rate</div>
          {summary && <PeriodDelta pointsDelta={summary.permit_compliance_prev_12mo_delta} />}
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: "#D8E2F4" }}>
          <div className="text-[18px]" style={{ color: "#111827", fontWeight: 700 }}>LOTO Compliance</div>
          <div className="mt-2 text-[54px] leading-none" style={{ color: "#111827", fontWeight: 700 }}>
            {summary?.loto_compliance_pct != null ? `${summary.loto_compliance_pct}%` : "N/A"}
          </div>
          <div className="mt-1 text-[14px]" style={{ color: "#4B5563" }}>
            {summary?.loto_compliance_pct != null ? "Lockout/Isolation permits, no deviation" : "No lockout permits recorded"}
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: "#D8E2F4" }}>
          <div className="text-[18px]" style={{ color: "#111827", fontWeight: 700 }}>Corrective Action Closure Rate</div>
          <div className="mt-2 text-[54px] leading-none" style={{ color: "#111827", fontWeight: 700 }}>{summary ? `${summary.corrective_action_closure_rate}%` : "—"}</div>
          <div className="mt-1 text-[14px]" style={{ color: "#4B5563" }}>CAPA actions closed</div>
          {summary && <PeriodDelta pointsDelta={summary.corrective_action_closure_prev_12mo_delta} />}
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: "#D8E2F4" }}>
          <div className="text-[18px]" style={{ color: "#111827", fontWeight: 700 }}>Compliance Score</div>
          <div className="mt-2 text-[54px] leading-none" style={{ color: "#111827", fontWeight: 700 }}>{summary ? `${summary.compliance_score}%` : "—"}</div>
          <div className="mt-1 text-[13px]" style={{ color: "#4B5563" }}>{summary?.compliance_label ?? ""}</div>
          {summary && <PeriodDelta pointsDelta={summary.compliance_score_prev_12mo_delta} />}
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: "#D8E2F4" }}>
          <div className="text-[18px]" style={{ color: "#111827", fontWeight: 700 }}>Policy–Hazard Category Coverage</div>
          <div className="mt-2 text-[54px] leading-none" style={{ color: "#111827", fontWeight: 700 }}>{summary ? `${summary.legal_register_coverage_pct}%` : "—"}</div>
          <div className="mt-1 text-[14px]" style={{ color: "#4B5563" }}>
            Policy categories vs. hazard categories — not a full legal/risk register audit
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: "#D8E2F4" }}>
          <div className="text-[18px]" style={{ color: "#111827", fontWeight: 700 }}>Audit Readiness Score</div>
          <div className="mt-2 text-[54px] leading-none" style={{ color: "#111827", fontWeight: 700 }}>{summary ? `${summary.audit_readiness_pct}%` : "—"}</div>
          <div className="mt-1 text-[13px]" style={{ color: "#4B5563" }}>{summary?.audit_readiness_label ?? ""}</div>
          {summary && <PeriodDelta pointsDelta={summary.audit_readiness_prev_12mo_delta} />}
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: "#D8E2F4" }}>
          <div className="text-[18px]" style={{ color: "#111827", fontWeight: 700 }}>Policy Review Status</div>
          <div className="mt-2 text-[54px] leading-none" style={{ color: "#111827", fontWeight: 700 }}>{summary ? `${summary.policy_review_pct}%` : "—"}</div>
          <div className="mt-1 text-[14px]" style={{ color: "#4B5563" }}>Current policies</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl border bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: "#D8E2F4" }}>
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[18px]" style={{ color: "#111827", fontWeight: 700 }}>Compliance Trend</div>
            <span className="rounded-full px-3 py-1 text-[11px]" style={{ background: "#E8EDF8", color: "#4B5563", fontWeight: 700 }}>
              {mom === null ? "Not enough data yet" : `${mom >= 0 ? "Increased" : "Decreased"} ${Math.abs(mom)}% MoM`}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={complianceTrend}>
              <CartesianGrid stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#475569", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#6073B7" strokeWidth={4} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: "#D8E2F4" }}>
          <div className="mb-2 text-[18px]" style={{ color: "#111827", fontWeight: 700 }}>Audit Findings by Severity</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={findingsBySeverity}>
              <CartesianGrid stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#334155", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {findingsBySeverity.map((entry) => (
                  <Bar key={entry.name} dataKey="value" fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: "#D8E2F4" }}>
        <div className="mb-3 text-[18px]" style={{ color: "#111827", fontWeight: 700 }}>Non-Conformance</div>
        <table className="w-full">
          <thead>
            <tr style={{ background: "#F8FAFC" }}>
              {["ID", "Action", "Owner", "Due", "Criticality"].map((h) => (
                <th key={h} className="px-3 py-2 text-left text-[12px] uppercase" style={{ color: "#64748B", fontWeight: 700 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {nonConformanceRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-[13px]" style={{ color: "#9CA3AF" }}>No open non-conformance actions</td>
              </tr>
            ) : nonConformanceRows.map((row) => (
              <tr key={row.id} style={{ borderTop: "1px solid #E2E8F0" }}>
                <td className="px-3 py-2 text-[14px]" style={{ color: "#0F172A", fontWeight: 600 }}>{row.id}</td>
                <td className="px-3 py-2 text-[14px]" style={{ color: "#1F2937" }}>{row.action}</td>
                <td className="px-3 py-2 text-[14px]" style={{ color: "#334155" }}>{row.owner}</td>
                <td className="px-3 py-2 text-[14px]" style={{ color: "#334155" }}>{row.due}</td>
                <td className="px-3 py-2 text-[14px]" style={{ color: row.criticality === "High" ? "#991B1B" : row.criticality === "Medium" ? "#B7791F" : "#1D4ED8", fontWeight: 600 }}>
                  ● {row.criticality}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
