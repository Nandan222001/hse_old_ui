import { useState, useEffect } from "react";
import { MoreHorizontal } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getRiskSummary, getResidualRiskTrend, getRiskMatrix, type TaskRow, type AgingBar } from "../../services/analytics.service";
import { useAuth } from "../context/AuthContext";

const matrixCols = ["Frequent 5", "Probable 4", "Occasional 3", "Remote 2", "Improbable 1"];
const matrixRows = ["Catastrophic 5", "Significant 4", "Moderate 3", "Low 2", "Negligible 1"];

const matrixCells = [
  // Catastrophic row — all red
  [
    { score: 25, text: "Catastrophic", tone: "stop" },
    { score: 20, text: "Catastrophic", tone: "stop" },
    { score: 15, text: "Catastrophic", tone: "stop" },
    { score: 12, text: "Catastrophic", tone: "stop" },
    { score: 5,  text: "Catastrophic", tone: "stop" },
  ],
  // Significant row
  [
    { score: 25, text: "Catastrophic", tone: "stop" },
    { score: 20, text: "Catastrophic", tone: "stop" },
    { score: 15, text: "Urgent",       tone: "urgent" },
    { score: 10, text: "Urgent",       tone: "urgent" },
    { score: 4,  text: "Borderline",   tone: "action" },
  ],
  // Moderate row
  [
    { score: 16, text: "Urgent",     tone: "urgent" },
    { score: 13, text: "Urgent",     tone: "urgent" },
    { score: 10, text: "Borderline", tone: "action" },
    { score: 5,  text: "Borderline", tone: "action" },
    { score: 4,  text: "Acceptable", tone: "monitor" },
  ],
  // Low row
  [
    { score: 13, text: "Urgent",     tone: "urgent" },
    { score: 10, text: "Borderline", tone: "action" },
    { score: 5,  text: "Borderline", tone: "action" },
    { score: 3,  text: "Acceptable", tone: "monitor" },
    { score: 2,  text: "Acceptable", tone: "monitor" },
  ],
  // Negligible row — all green
  [
    { score: 8, text: "Acceptable", tone: "monitor" },
    { score: 4, text: "Acceptable", tone: "monitor" },
    { score: 2, text: "Acceptable", tone: "monitor" },
    { score: 1, text: "Acceptable", tone: "monitor" },
    { score: 1, text: "Acceptable", tone: "monitor" },
  ],
];

function toneStyle(tone: string) {
  if (tone === "stop")   return { bg: "#DC2626", text: "#FFFFFF" }; // Red = Catastrophic
  if (tone === "urgent") return { bg: "#EA580C", text: "#FFFFFF" }; // Orange = Urgent
  if (tone === "action") return { bg: "#EAB308", text: "#111827" }; // Yellow = Borderline
  return                        { bg: "#16A34A", text: "#FFFFFF" }; // Green = Acceptable
}

function KpiCard({ title, value, subtitle, hint, valueColor = "#1F2937" }: Readonly<{ title: string; value: string; subtitle: string; hint: string; valueColor?: string }>) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: '#D8E2F4' }}>
      <div className="mb-1 text-[14px]" style={{ color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</div>
      <div className="text-[48px] leading-none mt-2" style={{ color: valueColor, fontWeight: 700 }}>{value}</div>
      <div className="mt-2 text-[13px]" style={{ color: '#64748B' }}>{subtitle}</div>
      {hint && <div className="mt-1 text-[12px]" style={{ color: '#2F8C77', fontWeight: 600 }}>{hint}</div>}
    </div>
  );
}

export function RiskPage() {
  const { user } = useAuth();
  const [zoneRisk, setZoneRisk] = useState<{ zone: string; value: number }[]>([]);
  const [taskRows, setTaskRows] = useState<TaskRow[]>([]);
  const [agingBars, setAgingBars] = useState<AgingBar[]>([]);
  const [kpis, setKpis] = useState<{ control_effectiveness: string; unverified_controls: number; risk_escalations: number } | null>(null);
  const [residualTrend, setResidualTrend] = useState<{ q: string; risk: number }[]>([]);
  const [matrixCounts, setMatrixCounts] = useState<number[][]>(Array.from({ length: 5 }, () => Array(5).fill(0)));
  const [matrixMeta, setMatrixMeta] = useState<{ active: number; resolved: number; total: number } | null>(null);
  const [recentlyClosed, setRecentlyClosed] = useState<number>(0);

  useEffect(() => {
    getRiskSummary().then((data) => {
      setZoneRisk(data.zone_risk);
      setTaskRows(data.task_rows);
      setAgingBars(data.aging_bars);
      setKpis(data.kpis);
      setRecentlyClosed((data as any).recently_closed_count ?? 0);
    }).catch(console.error);
    getResidualRiskTrend().then(setResidualTrend).catch(console.error);
    getRiskMatrix().then((d) => {
      setMatrixCounts(d.counts);
      setMatrixMeta({
        active: (d as any).active_hazard_count ?? 0,
        resolved: (d as any).resolved_hazard_count ?? 0,
        total: (d as any).total_hazard_count ?? 0,
      });
    }).catch(console.error);
  }, []);

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div>
        <h1 className="text-[22px]" style={{ color: '#0A0A0A', fontWeight: 700 }}>
          Welcome, {user?.name ?? "User"}
        </h1>
        <p className="mt-0.5 text-[13px]" style={{ color: '#6B7280' }}>Root Cause Analysis &amp; Risk Overview</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <KpiCard title="Corrective Action Closure Rate" value={kpis ? kpis.control_effectiveness : "—"} subtitle="CAPA actions completed" hint="Client KPI — same metric as Compliance page" />
        <KpiCard title="Open CAPA Actions"               value={kpis ? String(kpis.unverified_controls) : "—"} subtitle="Pending closure" hint="Not a control-verification record" />
        <KpiCard title="Overdue CAPA Actions ⚠"          value={kpis ? String(kpis.risk_escalations) : "—"} subtitle="Requires Immediate Action" hint="" />
      </div>

      {/* Row 2: Residual Trend | Risk Matrix | Zone Risk */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_1.65fr_0.65fr]"
        style={{ gridAutoRows: 'minmax(400px, auto)' }}>

        {/* Residual Risk Trend */}
        <div className="rounded-2xl border bg-white p-5 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: '#D8E2F4' }}>
          <div className="mb-1 text-[16px]" style={{ color: '#111827', fontWeight: 700 }}>Residual Risk Trend</div>
          <div className="mb-3 text-[11px]" style={{ color: '#9CA3AF' }}>
            Estimated from incident severity mix — not a numeric Likelihood × Consequence score (that data isn't captured yet).
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={residualTrend} margin={{ top: 10, right: 16, bottom: 10, left: 0 }}>
              <CartesianGrid stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="q" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} width={30} />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 12 }}
                labelStyle={{ fontWeight: 600, color: '#111827' }}
              />
              <Area type="monotone" dataKey="risk" stroke="#5E6FA6" fill="#7E8DBA" fillOpacity={0.55} strokeWidth={2} dot={{ r: 4, fill: '#5E6FA6', strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Matrix */}
        <div className="rounded-2xl border bg-white p-5 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: '#6BD0D7' }}>
          <div className="mb-1 flex items-center justify-between">
            <div className="text-[16px]" style={{ color: '#111827', fontWeight: 700 }}>Risk Matrix</div>
            <MoreHorizontal className="h-4 w-4" style={{ color: '#64748B' }} />
          </div>
          <div className="mb-3 text-[11px]" style={{ color: '#9CA3AF' }}>
            Qualitative estimate from hazard severity/probability text — not a numeric risk-assessment score.
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-center">
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  <th className="px-2 py-2 text-left text-[11px]" style={{ color: '#475569', fontWeight: 700 }}>
                    Impact ↓ / Likelihood →
                  </th>
                  {matrixCols.map((col) => (
                    <th key={col} className="px-2 py-2 text-[11px]" style={{ color: '#475569', fontWeight: 700 }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrixRows.map((row, rowIdx) => (
                  <tr key={row}>
                    <td className="px-2 py-1.5 text-left text-[11px]" style={{ color: '#334155', fontWeight: 700 }}>{row}</td>
                    {matrixCells[rowIdx].map((cell, colIdx) => {
                      const tone = toneStyle(cell.tone);
                      const count = matrixCounts[rowIdx]?.[colIdx] ?? 0;
                      return (
                        <td key={`${row}-${colIdx}`} className="px-1 py-1">
                          <div className="rounded-md px-1.5 py-1 text-center" style={{ background: tone.bg, color: tone.text }}>
                            <div className="text-[13px] leading-none" style={{ fontWeight: 800 }}>
                              {count > 0 ? count : "—"}
                            </div>
                            <div className="text-[10px] mt-0.5" style={{ fontWeight: 600 }}>{cell.text}</div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Matrix legend */}
          <div className="mt-4 pt-3 flex flex-wrap items-center gap-4 text-[11px]" style={{ color: '#475569', borderTop: '1px solid #F1F5F9' }}>
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded" style={{ background: '#DC2626' }} />Catastrophic</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded" style={{ background: '#EA580C' }} />Urgent</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded" style={{ background: '#EAB308' }} />Borderline</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded" style={{ background: '#16A34A' }} />Acceptable</span>
            <span className="ml-auto text-[11px]" style={{ color: '#94A3B8' }}>
              Total risks: {matrixCounts.flat().reduce((a, b) => a + b, 0)}
            </span>
          </div>
          {/* Resolved / closed summary */}
          {matrixMeta && (
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px]">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: '#DCFCE7', color: '#15803D', fontWeight: 700 }}>
                ✅ {matrixMeta.resolved} resolved — auto-removed
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: '#FEF3C7', color: '#B45309', fontWeight: 700 }}>
                ⚠️ {matrixMeta.active} active
              </span>
              {recentlyClosed > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: '#EFF6FF', color: '#1D4ED8', fontWeight: 700 }}>
                  🔒 {recentlyClosed} closed this week
                </span>
              )}
            </div>
          )}
        </div>

        {/* Risk by Zone / Site / Team */}
        <div className="rounded-2xl border bg-white p-5 shadow-[0_6px_16px_rgba(15,23,42,0.08)] flex flex-col" style={{ borderColor: '#D8E2F4' }}>
          <div className="mb-1 text-[16px]" style={{ color: '#111827', fontWeight: 700 }}>Risk by Zone / Site / Team</div>
          <div className="mb-3 text-[12px]" style={{ color: '#6B7280' }}>
            {zoneRisk.length} zone{zoneRisk.length !== 1 ? 's' : ''} tracked
          </div>

          {/* Inline legend */}
          <div className="mb-4 flex flex-wrap gap-3 text-[10px]" style={{ color: '#6B7280', fontWeight: 600 }}>
            {([['#E15759', 'Critical'], ['#E9A23B', 'High'], ['#F1C40F', 'Medium'], ['#22C55E', 'Low']] as const).map(([clr, lbl]) => (
              <span key={lbl} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: clr }} />
                {lbl}
              </span>
            ))}
          </div>

          {zoneRisk.length === 0 ? (
            <div className="flex items-center justify-center py-14 text-[13px]" style={{ color: '#9CA3AF' }}>
              No zone risk data available
            </div>
          ) : (() => {
            const maxVal = Math.max(...zoneRisk.map(z => z.value), 1);
            const sorted = [...zoneRisk].sort((a, b) => b.value - a.value);

            function riskConfig(value: number, max: number) {
              const pct = (value / max) * 100;
              if (pct >= 75) return { color: '#E15759', bg: '#FEE2E2', label: 'Critical', bar: 'linear-gradient(90deg,#E15759,#FF7171)' };
              if (pct >= 50) return { color: '#D97706', bg: '#FEF3C7', label: 'High',     bar: 'linear-gradient(90deg,#E9A23B,#FBBF24)' };
              if (pct >= 25) return { color: '#B45309', bg: '#FEF9C3', label: 'Medium',   bar: 'linear-gradient(90deg,#F1C40F,#FDE68A)' };
              return               { color: '#15803D', bg: '#DCFCE7', label: 'Low',      bar: 'linear-gradient(90deg,#22C55E,#86EFAC)' };
            }

            return (
              <div className="space-y-3">
                {sorted.map((item, i) => {
                  const widthPct = (item.value / maxVal) * 100;
                  const cfg = riskConfig(item.value, maxVal);
                  return (
                    <div key={item.zone}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[11px] w-5 text-center flex-shrink-0" style={{ color: '#9CA3AF', fontWeight: 700 }}>
                          {i + 1}
                        </span>
                        <span className="flex-1 text-[12px] truncate" style={{ color: '#1F2937', fontWeight: 500 }}>
                          {item.zone}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: cfg.bg, color: cfg.color, fontWeight: 700 }}>
                          {cfg.label}
                        </span>
                        <span className="text-[13px] w-7 text-right flex-shrink-0"
                          style={{ color: '#111827', fontWeight: 700 }}>
                          {item.value}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 pl-7">
                        <div className="flex-1 h-[6px] rounded-full" style={{ background: '#F1F5F9' }}>
                          <div className="h-[6px] rounded-full"
                            style={{ width: `${widthPct}%`, background: cfg.bar, transition: 'width 0.4s ease' }} />
                        </div>
                        <span className="text-[10px] w-8 text-right flex-shrink-0" style={{ color: '#9CA3AF', fontWeight: 500 }}>
                          {Math.round(widthPct)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Row 3: Tasks table | Risk Aging */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.25fr_1fr]">

        {/* Active Tasks Table */}
        <div className="rounded-2xl border bg-white p-5 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: '#D8E2F4' }}>
          <div className="mb-3 text-[16px]" style={{ color: '#111827', fontWeight: 700 }}>
            Action / High Risk Active Tasks
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse">
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  {["Task ID", "Description", "Owner", "Due Date", "Status"].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left text-[11px] uppercase tracking-wide"
                      style={{ color: '#64748B', fontWeight: 700 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {taskRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-[13px]" style={{ color: '#9CA3AF' }}>
                      No active tasks
                    </td>
                  </tr>
                ) : taskRows.map((row, idx) => (
                  <tr key={row.id}
                    style={{ borderBottom: idx < taskRows.length - 1 ? '1px solid #F1F5F9' : 'none' }}
                    className="transition-colors hover:bg-[#F8FAFC]">
                    <td className="px-3 py-2.5 text-[12px]" style={{ color: '#1F2937', fontWeight: 700 }}>{row.id}</td>
                    <td className="px-3 py-2.5 text-[12px]" style={{ color: '#334155' }}>{row.desc}</td>
                    <td className="px-3 py-2.5 text-[12px]" style={{ color: '#334155' }}>{row.owner}</td>
                    <td className="px-3 py-2.5 text-[12px] whitespace-nowrap" style={{ color: '#334155' }}>{row.due}</td>
                    <td className="px-3 py-2.5">
                      <span className="text-[11px] px-2 py-0.5 rounded-full"
                        style={{ background: '#FEF3C7', color: '#A16207', fontWeight: 700 }}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Risk Aging */}
        <div className="rounded-2xl border bg-white p-5 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: '#D8E2F4' }}>
          <div className="mb-3 text-[16px]" style={{ color: '#111827', fontWeight: 700 }}>Risk Aging</div>
          {agingBars.length > 0 && agingBars[3]?.critical > 0 && agingBars.slice(0,3).every(b => b.line === 0) && (
            <div className="mb-3 px-3 py-2 rounded-lg text-[12px] font-semibold" style={{ background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' }}>
              ⚠ All {agingBars[3].critical} open CAPAs are critically overdue (&gt;90 days). Immediate action required.
            </div>
          )}

          {/* Age bucket pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            {['0–30 Days', '31–60 Days', '61–90 Days', '>90 Days'].map((label, i) => {
              const bucketCount = agingBars[i]?.line ?? 0;
              return (
                <span key={label} className="rounded-full px-3 py-1 text-[11px]"
                  style={{
                    background: bucketCount > 0 ? (i === 3 ? '#FEE2E2' : '#EEF2FF') : '#F1F5F9',
                    color: bucketCount > 0 ? (i === 3 ? '#991B1B' : '#334155') : '#9CA3AF',
                    fontWeight: bucketCount > 0 ? 700 : 500,
                    border: bucketCount > 0 && i === 3 ? '1px solid #FECACA' : '1px solid transparent',
                  }}>
                  {label} {bucketCount > 0 ? `(${bucketCount})` : '(0)'}
                </span>
              );
            })}
            {recentlyClosed > 0 && (
              <span className="rounded-full px-3 py-1 text-[11px]"
                style={{ background: '#DCFCE7', color: '#15803D', fontWeight: 700 }}>
                ✅ {recentlyClosed} closed this week
              </span>
            )}
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={agingBars} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
              <CartesianGrid stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="bucket" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 12 }}
                labelStyle={{ fontWeight: 600, color: '#111827' }}
              />
              <Bar dataKey="low"      stackId="a" fill="#7CC17E" />
              <Bar dataKey="medium"   stackId="a" fill="#F1D458" />
              <Bar dataKey="high"     stackId="a" fill="#E9A23B" />
              <Bar dataKey="critical" stackId="a" fill="#E15759" />
              <Line type="monotone" dataKey="line" stroke="#6276B6" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
