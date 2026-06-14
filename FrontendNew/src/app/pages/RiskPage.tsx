import { MoreHorizontal } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const residualTrend = [
  { q: "Q1", risk: 90 },
  { q: "Q2", risk: 64 },
  { q: "Q3", risk: 48 },
  { q: "Q4", risk: 34 },
];

const zoneRisk = [
  { zone: "Site A - Ops", value: 26 },
  { zone: "Site B - Log", value: 14 },
  { zone: "Team C - Dev", value: 6 },
];

const matrixCols = ["Frequent 5", "Probable 4", "Occasional 3", "Remote 2", "Improbable 1"];
const matrixRows = ["Catastrophic 5", "Significant 4", "Moderate 3", "Low 2", "Negligible 1"];

const matrixCells = [
  [
    { score: 25, text: "Catastrophic", tone: "stop" },
    { score: 20, text: "Catastrophic", tone: "stop" },
    { score: 15, text: "Catastrophic", tone: "stop" },
    { score: 12, text: "Catastrophic", tone: "urgent" },
    { score: 5, text: "Catastrophic", tone: "action" },
  ],
  [
    { score: 25, text: "Catastrophic", tone: "stop" },
    { score: 20, text: "Catastrophic", tone: "stop" },
    { score: 15, text: "Urgent Risk", tone: "urgent" },
    { score: 10, text: "Acceptable", tone: "action" },
    { score: 4, text: "Acceptable", tone: "monitor" },
  ],
  [
    { score: 16, text: "Urgent Risk", tone: "stop" },
    { score: 13, text: "Urgent Risk", tone: "urgent" },
    { score: 10, text: "Acceptable", tone: "action" },
    { score: 5, text: "Acceptable", tone: "action" },
    { score: 4, text: "Acceptable", tone: "monitor" },
  ],
  [
    { score: 13, text: "Urgent Risk", tone: "urgent" },
    { score: 10, text: "Acceptable", tone: "action" },
    { score: 5, text: "Acceptable", tone: "action" },
    { score: 3, text: "Acceptable", tone: "monitor" },
    { score: 2, text: "Acceptable", tone: "monitor" },
  ],
  [
    { score: 8, text: "Acceptable", tone: "action" },
    { score: 4, text: "Acceptable", tone: "monitor" },
    { score: 2, text: "Acceptable", tone: "monitor" },
    { score: 1, text: "Acceptable", tone: "monitor" },
    { score: 1, text: "Acceptable", tone: "monitor" },
  ],
];

const taskRows = [
  { id: "T-001", desc: "Mitigate High Risk HVAC Issue", owner: "J. Doe", due: "Jun 25, 2024", status: "In Progress (Amber)" },
  { id: "T-002", desc: "Update Security Protocol", owner: "A. Smith", due: "Jun 30, 2024", status: "Pending (Yellow)" },
  { id: "T-003", desc: "Resolve High Risk Frosted Invert", owner: "J. Doe", due: "Jun 25, 2024", status: "In Progress (Amber)" },
];

const agingBars = [
  { bucket: "0-30 Days", low: 7, medium: 4, high: 2, critical: 1, line: 2 },
  { bucket: "31-60 Days", low: 5, medium: 6, high: 3, critical: 1, line: 5 },
  { bucket: "61-90 Days", low: 3, medium: 4, high: 5, critical: 2, line: 6 },
  { bucket: ">90 Days", low: 2, medium: 5, high: 6, critical: 4, line: 7 },
];

function toneStyle(tone: string) {
  if (tone === "stop") return { bg: "#E15759", text: "#FFFFFF" };
  if (tone === "urgent") return { bg: "#E9A23B", text: "#111827" };
  if (tone === "action") return { bg: "#F1D458", text: "#111827" };
  return { bg: "#7CC17E", text: "#111827" };
}

function KpiCard({ title, value, subtitle, hint, valueColor = "#1F2937" }: Readonly<{ title: string; value: string; subtitle: string; hint: string; valueColor?: string }>) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: '#D8E2F4' }}>
      <div className="mb-1 text-[18px]" style={{ color: '#111827', fontWeight: 700 }}>{title}</div>
      <div className="text-[56px] leading-none" style={{ color: valueColor, fontWeight: 700 }}>{value}</div>
      <div className="mt-1 text-[22px]" style={{ color: '#64748B' }}>{subtitle}</div>
      <div className="mt-1 text-[13px]" style={{ color: '#2F8C77', fontWeight: 600 }}>{hint}</div>
    </div>
  );
}

export function RiskPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1>Welcome , User</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <KpiCard title="Control Effectiveness Score" value="92%" subtitle="Effective" hint="▲ 80%" />
        <KpiCard title="Unverified Controls" value="14" subtitle="Pending Review" hint="" />
        <KpiCard title="Risk Escalations ⚠" value="5" subtitle="Requires Immediate Action" hint="" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.65fr_0.9fr]">
        <div className="rounded-2xl border bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: '#D8E2F4' }}>
          <div className="mb-2 text-[18px]" style={{ color: '#111827', fontWeight: 700 }}>Residual Risk Trend</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={residualTrend}>
              <CartesianGrid stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="q" tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip />
              <Area type="monotone" dataKey="risk" stroke="#5E6FA6" fill="#7E8DBA" fillOpacity={0.55} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: '#6BD0D7' }}>
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[18px]" style={{ color: '#111827', fontWeight: 700 }}>Risk Matrix</div>
            <MoreHorizontal className="h-4 w-4" style={{ color: '#64748B' }} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="px-2 py-2 text-[12px]" style={{ color: '#475569', fontWeight: 700 }}>Impact ↓ / Likelihood →</th>
                  {matrixCols.map((col) => (
                    <th key={col} className="px-2 py-2 text-[12px]" style={{ color: '#475569', fontWeight: 700 }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrixRows.map((row, rowIdx) => (
                  <tr key={row}>
                    <td className="px-2 py-2 text-[12px]" style={{ color: '#334155', fontWeight: 700 }}>{row}</td>
                    {matrixCells[rowIdx].map((cell, colIdx) => {
                      const tone = toneStyle(cell.tone);
                      return (
                        <td key={`${row}-${colIdx}`} className="px-1 py-1">
                          <div className="rounded-md px-2 py-1 text-center" style={{ background: tone.bg, color: tone.text }}>
                            <div className="text-[14px] leading-none" style={{ fontWeight: 800 }}>{cell.score}</div>
                            <div className="text-[11px]" style={{ fontWeight: 600 }}>{cell.text}</div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-[12px]" style={{ color: '#475569' }}>
            <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded" style={{ background: '#E15759' }} />Stop</span>
            <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded" style={{ background: '#E9A23B' }} />Urgent Action</span>
            <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded" style={{ background: '#F1D458' }} />Action</span>
            <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded" style={{ background: '#7CC17E' }} />Monitor/No Action</span>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: '#D8E2F4' }}>
          <div className="mb-2 text-[18px]" style={{ color: '#111827', fontWeight: 700 }}>Risk by Zone/Site/Team</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={zoneRisk} layout="vertical" barSize={24}>
              <CartesianGrid stroke="#E2E8F0" vertical={false} />
              <XAxis type="number" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 30]} />
              <YAxis type="category" dataKey="zone" tick={{ fill: '#334155', fontSize: 12 }} axisLine={false} tickLine={false} width={88} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 4, 4]} fill="#E9B13D" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 h-2 rounded-full" style={{ background: '#F3F4F6' }}>
            <div className="h-full rounded-full" style={{ width: '84%', background: '#E9B13D' }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.25fr_1fr]">
        <div className="rounded-2xl border bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: '#D8E2F4' }}>
          <div className="mb-3 text-[18px]" style={{ color: '#111827', fontWeight: 700 }}>Action/High Risk Active Tasks Table</div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  {["Task ID", "Description", "Owner", "Due Date", "Status"].map((h) => (
                    <th key={h} className="px-2 py-2 text-left text-[12px] uppercase" style={{ color: '#64748B', fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {taskRows.map((row) => (
                  <tr key={row.id} style={{ borderTop: '1px solid #E2E8F0' }}>
                    <td className="px-2 py-2 text-[13px]" style={{ color: '#1F2937', fontWeight: 700 }}>{row.id}</td>
                    <td className="px-2 py-2 text-[13px]" style={{ color: '#334155' }}>{row.desc}</td>
                    <td className="px-2 py-2 text-[13px]" style={{ color: '#334155' }}>{row.owner}</td>
                    <td className="px-2 py-2 text-[13px]" style={{ color: '#334155' }}>{row.due}</td>
                    <td className="px-2 py-2 text-[13px]" style={{ color: '#A16207', fontWeight: 600 }}>{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: '#D8E2F4' }}>
          <div className="mb-3 text-[18px]" style={{ color: '#111827', fontWeight: 700 }}>Risk Aging</div>
          <div className="flex gap-2 text-[12px]">
            {['0-30 Days', '31-60 Days', '61-90 Days', '>90 Days'].map((label) => (
              <span key={label} className="rounded-full px-3 py-1" style={{ background: '#EEF2FF', color: '#334155', fontWeight: 700 }}>{label}</span>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={agingBars} margin={{ top: 18 }}>
              <CartesianGrid stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="bucket" tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip />
              <Bar dataKey="low" stackId="a" fill="#7CC17E" />
              <Bar dataKey="medium" stackId="a" fill="#F1D458" />
              <Bar dataKey="high" stackId="a" fill="#E9A23B" />
              <Bar dataKey="critical" stackId="a" fill="#E15759" />
              <Line type="monotone" dataKey="line" stroke="#6276B6" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
