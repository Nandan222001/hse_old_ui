import { useEffect, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, BarChart, Bar } from "recharts";
import { getComplianceSummary, type ComplianceSummary } from "../../../services/analytics.service";
import { useAuth } from "../../context/AuthContext";
import { InfoTooltip } from "../shared/InfoTooltip";

// Shared formula/definition Info tooltip content for the Compliance page's
// KPI cards — same pattern as the Dashboard, Equipment and Vendors pages'
// Info tooltips: shows the live current value alongside the definition/
// formula so it can never disagree with the number on the card itself.
function MetricFormulaInfo({
  title,
  currentValue,
  definition,
  formula,
  note,
}: {
  title: string;
  currentValue: string;
  definition: string;
  formula?: string;
  note?: string;
}) {
  return (
    <div className="space-y-2.5 text-[12px] leading-snug" style={{ color: '#374151' }}>
      <div className="text-[13px] font-semibold" style={{ color: '#111827' }}>{title}</div>

      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>Current Value</div>
        <div className="text-[15px] font-bold" style={{ color: '#111827' }}>{currentValue}</div>
      </div>

      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>Definition</div>
        <div>{definition}</div>
      </div>

      {formula && (
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>Formula</div>
          <div className="mt-1 rounded-md p-1.5 font-mono text-[11px]" style={{ background: '#F8FAFC', color: '#111827' }}>{formula}</div>
        </div>
      )}

      {note && (
        <div className="text-[11px]" style={{ color: '#6B7280' }}>{note}</div>
      )}
    </div>
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
          <div className="flex items-center gap-1.5 text-[18px]" style={{ color: "#111827", fontWeight: 700 }}>
            Permit Compliance
            <InfoTooltip label="Permit Compliance — how this is calculated">
              <MetricFormulaInfo
                title="Permit Compliance"
                currentValue={summary ? `${summary.permit_compliance_pct}%` : "—"}
                definition="The share of Permits to Work (PTW) that have been formally Closed out, of every permit ever issued."
                formula="(Closed Permits ÷ Total Permits) × 100"
                note="Also called PTW Compliance Rate."
              />
            </InfoTooltip>
          </div>
          <div className="mt-2 text-[54px] leading-none" style={{ color: "#111827", fontWeight: 700 }}>{summary ? `${summary.permit_compliance_pct}%` : "—"}</div>
          <div className="mt-1 text-[14px]" style={{ color: "#4B5563" }}>PTW Compliance Rate</div>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: "#D8E2F4" }}>
          <div className="flex items-center gap-1.5 text-[18px]" style={{ color: "#111827", fontWeight: 700 }}>
            LOTO Compliance
            <InfoTooltip label="LOTO Compliance — how this is calculated">
              <MetricFormulaInfo
                title="LOTO Compliance"
                currentValue={summary?.loto_compliance_pct != null ? `${summary.loto_compliance_pct}%` : "N/A"}
                definition="Of Equipment Isolation/Lockout permits issued, the share with no deviation reported. A proxy for field-audited lockout compliance, not a true audit result."
                formula="(Lockout/Isolation Permits with No Deviation ÷ Lockout/Isolation Permits Issued) × 100"
              />
            </InfoTooltip>
          </div>
          <div className="mt-2 text-[54px] leading-none" style={{ color: "#111827", fontWeight: 700 }}>
            {summary?.loto_compliance_pct != null ? `${summary.loto_compliance_pct}%` : "N/A"}
          </div>
          <div className="mt-1 text-[14px]" style={{ color: "#4B5563" }}>
            {summary?.loto_compliance_pct != null ? "Lockout/Isolation permits, no deviation" : "No lockout permits recorded"}
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: "#D8E2F4" }}>
          <div className="flex items-center gap-1.5 text-[18px]" style={{ color: "#111827", fontWeight: 700 }}>
            Corrective Action Closure Rate
            <InfoTooltip label="Corrective Action Closure Rate — how this is calculated">
              <MetricFormulaInfo
                title="Corrective Action Closure Rate"
                currentValue={summary ? `${summary.corrective_action_closure_rate}%` : "—"}
                definition="The share of CAPA (Corrective and Preventive Action) actions marked Completed, Closed, Verified, or Done, out of every CAPA action raised."
                formula="(CAPA Actions Completed ÷ Total CAPA Actions) × 100"
              />
            </InfoTooltip>
          </div>
          <div className="mt-2 text-[54px] leading-none" style={{ color: "#111827", fontWeight: 700 }}>{summary ? `${summary.corrective_action_closure_rate}%` : "—"}</div>
          <div className="mt-1 text-[14px]" style={{ color: "#4B5563" }}>CAPA actions closed</div>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: "#D8E2F4" }}>
          <div className="flex items-center gap-1.5 text-[18px]" style={{ color: "#111827", fontWeight: 700 }}>
            Compliance Score
            <InfoTooltip label="Compliance Score — how this is calculated">
              <MetricFormulaInfo
                title="Compliance Score"
                currentValue={summary ? `${summary.compliance_score}%` : "—"}
                definition="An overall compliance figure blending three independent measures: permit closure, policy/hazard category coverage, and audit readiness — each weighted equally."
                formula="Average of: Permit Compliance %, Policy–Hazard Coverage %, Audit Readiness %"
                note={summary?.compliance_label}
              />
            </InfoTooltip>
          </div>
          <div className="mt-2 text-[54px] leading-none" style={{ color: "#111827", fontWeight: 700 }}>{summary ? `${summary.compliance_score}%` : "—"}</div>
          <div className="mt-1 text-[13px]" style={{ color: "#4B5563" }}>{summary?.compliance_label ?? ""}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: "#D8E2F4" }}>
          <div className="flex items-center gap-1.5 text-[18px]" style={{ color: "#111827", fontWeight: 700 }}>
            Policy–Hazard Category Coverage
            <InfoTooltip label="Policy–Hazard Category Coverage — how this is calculated">
              <MetricFormulaInfo
                title="Policy–Hazard Category Coverage"
                currentValue={summary ? `${summary.legal_register_coverage_pct}%` : "—"}
                definition="How many distinct hazard categories in the organisation's hazard register have at least a matching policy category on file — a rough proxy for legal/risk register coverage, not a full audit."
                formula="(Distinct Policy Categories ÷ Distinct Hazard Categories) × 100, capped at 100%"
              />
            </InfoTooltip>
          </div>
          <div className="mt-2 text-[54px] leading-none" style={{ color: "#111827", fontWeight: 700 }}>{summary ? `${summary.legal_register_coverage_pct}%` : "—"}</div>
          <div className="mt-1 text-[14px]" style={{ color: "#4B5563" }}>
            Policy categories vs. hazard categories — not a full legal/risk register audit
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: "#D8E2F4" }}>
          <div className="flex items-center gap-1.5 text-[18px]" style={{ color: "#111827", fontWeight: 700 }}>
            Audit Readiness Score
            <InfoTooltip label="Audit Readiness Score — how this is calculated">
              <MetricFormulaInfo
                title="Audit Readiness Score"
                currentValue={summary ? `${summary.audit_readiness_pct}%` : "—"}
                definition="A blended, all-time score of the organisation's audit/inspection posture, combining Safety Walk compliance ratings and Auditor-app Audit compliance scores onto a common 0-100 scale. Same score shown on the Dashboard's leading-indicators panel."
                formula="Average of: (Safety Walk rating ÷ 5 × 100) and (Audit compliance score)"
                note={summary?.audit_readiness_label}
              />
            </InfoTooltip>
          </div>
          <div className="mt-2 text-[54px] leading-none" style={{ color: "#111827", fontWeight: 700 }}>{summary ? `${summary.audit_readiness_pct}%` : "—"}</div>
          <div className="mt-1 text-[13px]" style={{ color: "#4B5563" }}>{summary?.audit_readiness_label ?? ""}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: "#D8E2F4" }}>
          <div className="flex items-center gap-1.5 text-[18px]" style={{ color: "#111827", fontWeight: 700 }}>
            Policy Review Status
            <InfoTooltip label="Policy Review Status — how this is calculated">
              <MetricFormulaInfo
                title="Policy Review Status"
                currentValue={summary ? `${summary.policy_review_pct}%` : "—"}
                definition="The share of policies whose status is marked Current (i.e. not overdue for review), out of every policy on file."
                formula="(Current Policies ÷ Total Policies) × 100"
              />
            </InfoTooltip>
          </div>
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
          {findingsBySeverity.every((f) => f.value === 0) ? (
            <div className="flex items-center justify-center text-[13px]" style={{ height: 250, color: "#9CA3AF" }}>
              No audit findings recorded yet.
            </div>
          ) : (
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
          )}
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
