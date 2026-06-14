import { AlertTriangle, CheckCircle2, Clock3, MoreHorizontal } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const failureTrend = [
  { month: "Jan", value: 403 },
  { month: "Feb", value: 374 },
  { month: "Mar", value: 246 },
  { month: "Apr", value: 234 },
  { month: "May", value: 225 },
  { month: "Jun", value: 173 },
  { month: "Jul", value: 123 },
  { month: "Aug", value: 103 },
];

const incidentTrend = [
  { month: "Jan", value: 42 },
  { month: "Feb", value: 36 },
  { month: "Mar", value: 45 },
  { month: "Apr", value: 24 },
  { month: "May", value: 40 },
  { month: "Jun", value: 32 },
  { month: "Jul", value: 34 },
  { month: "Aug", value: 40 },
];

const heatRows = ["Pump A12", "Valve 903", "Valve 003", "Valve 804", "Compressor C05", "Valve 805", "Pump A12"];
const heatCols = ["Pump A12", "Valve 803", "Compressor C05", "Compressor ess", "Valve 806", "Valve 805"];
const heatVals = [
  [0.32, 0.54, 0.72, 0.76, 0.88, 0.94],
  [0.26, 0.52, 0.69, 0.73, 0.84, 0.9],
  [0.2, 0.34, 0.56, 0.66, 0.74, 0.82],
  [0.46, 0.3, 0.48, 0.58, 0.68, 0.76],
  [0.24, 0.28, 0.4, 0.5, 0.6, 0.7],
  [0.22, 0.5, 0.34, 0.3, 0.42, 0.56],
  [0.18, 0.22, 0.28, 0.32, 0.38, 0.44],
];

const riskRows = [
  { id: "AST-456", type: "Pump", risk: "High", status: "Critical (Red)" },
  { id: "AST-789", type: "Valve", risk: "Medium", status: "Warning (Amber)" },
  { id: "AST-454", type: "Pump", risk: "High", status: "Critical (Red)" },
  { id: "AST-787", type: "Valve", risk: "High", status: "Warning (Amber)" },
];

const overdueInspections = [
  { name: "Pump A12 Inspection", due: "Due Yesterday", tone: "warn" },
  { name: "Valve B03 Maintenance", due: "Due Today", tone: "critical" },
  { name: "Compressor C05 Check", due: "Due 2 Days Ago", tone: "critical" },
];

const barrierChecklist = [
  { text: "Verify Pressure Seals", progress: 82 },
  { text: "Check Emergency Shut-off", progress: 54 },
  { text: "Test Relief Valves", progress: 75 },
  { text: "Inspect Containment", progress: 18 },
];

function heatColor(v: number) {
  if (v < 0.25) return "#43AA6A";
  if (v < 0.45) return "#86C779";
  if (v < 0.65) return "#F2D45F";
  if (v < 0.8) return "#F2A444";
  if (v < 0.9) return "#E97738";
  return "#D64745";
}

export function AssetsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1>Welcome , User</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: '#D8E2F4' }}>
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[18px]" style={{ color: '#111827', fontWeight: 700 }}>Asset Control Effectiveness</div>
            <MoreHorizontal className="h-4 w-4" style={{ color: '#64748B' }} />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[54px] leading-none" style={{ color: '#0F172A', fontWeight: 700 }}>91%</div>
              <div className="mt-1 text-[24px]" style={{ color: '#2F8C77', fontWeight: 600 }}>▲ 90%</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-20 w-40 overflow-hidden">
                <div
                  className="h-40 w-40 rounded-full border-[12px]"
                  style={{ borderColor: '#E2E8F0', borderTopColor: '#6073B7', borderRightColor: '#6073B7', transform: 'translateX(20px) rotate(15deg)' }}
                />
              </div>
              <span className="-mt-2 text-[16px]" style={{ color: '#1F2937', fontWeight: 600 }}>Excellent</span>
            </div>
          </div>
          <div className="mt-3 h-3 rounded-full" style={{ background: '#E5E7EB' }}>
            <div className="h-full rounded-full" style={{ width: '91%', background: 'linear-gradient(90deg, #6073B7 0%, #5566AA 100%)' }} />
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: '#D8E2F4' }}>
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[18px]" style={{ color: '#111827', fontWeight: 700 }}>Safety Maintenance Status</div>
            <MoreHorizontal className="h-4 w-4" style={{ color: '#64748B' }} />
          </div>
          <div className="text-[54px] leading-none" style={{ color: '#0F172A', fontWeight: 700 }}>18%</div>
          <div className="mt-1 text-[24px]" style={{ color: '#B7791F', fontWeight: 600 }}>⚠ Medium Risk</div>
          <div className="mt-4 h-3 rounded-full" style={{ background: '#E5E7EB' }}>
            <div className="relative h-full rounded-full" style={{ width: '72%', background: 'linear-gradient(90deg, #334155 0%, #0F172A 35%, #1F8F7C 100%)' }}>
              <span className="absolute left-[20%] -top-6 text-[12px]" style={{ color: '#B91C1C' }}>▲</span>
              <span className="absolute left-[48%] -top-6 text-[12px]" style={{ color: '#B7791F' }}>●</span>
              <span className="absolute left-[76%] -top-6 text-[12px]" style={{ color: '#0F766E' }}>●</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1.35fr_1fr]">
        <div className="rounded-2xl border bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: '#D8E2F4' }}>
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[18px]" style={{ color: '#111827', fontWeight: 700 }}>Critical Asset Failure Trends</div>
            <span className="rounded-full px-3 py-1 text-[11px]" style={{ background: '#E8EDF8', color: '#4B5563', fontWeight: 700 }}>Decreased 15% MoM</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={failureTrend}>
              <CartesianGrid stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#6477B6" strokeWidth={3} dot={{ fill: '#FFFFFF', stroke: '#6477B6', strokeWidth: 2, r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: '#D8E2F4' }}>
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[18px]" style={{ color: '#111827', fontWeight: 700 }}>Asset Heat Map (High Risk Equipment)</div>
            <MoreHorizontal className="h-4 w-4" style={{ color: '#64748B' }} />
          </div>
          <div className="grid" style={{ gridTemplateColumns: `120px repeat(${heatCols.length}, 1fr)`, gap: 2 }}>
            <div />
            {heatCols.map((col) => (
              <div key={col} className="text-[10px] text-center" style={{ color: '#475569' }}>{col}</div>
            ))}
            {heatRows.map((row, rIdx) => (
              <>
                <div key={`${row}-${rIdx}-label`} className="text-[10px] py-1" style={{ color: '#475569' }}>{row}</div>
                {heatVals[rIdx].map((v, cIdx) => (
                  <div key={`${row}-${cIdx}`} className="h-10 rounded-sm" style={{ background: heatColor(v) }} />
                ))}
              </>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-4 text-[11px]" style={{ color: '#475569' }}>
            <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-sm" style={{ background: '#43AA6A' }} />Low risk</span>
            <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-sm" style={{ background: '#F2D45F' }} />Medium</span>
            <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-sm" style={{ background: '#F2A444' }} />High risk</span>
            <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-sm" style={{ background: '#D64745' }} />High</span>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: '#D8E2F4' }}>
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[18px]" style={{ color: '#111827', fontWeight: 700 }}>Asset Incident Trend</div>
            <span className="rounded-full px-3 py-1 text-[11px]" style={{ background: '#E8EDF8', color: '#4B5563', fontWeight: 700 }}>Stable Trend</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={incidentTrend}>
              <CartesianGrid stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip />
              <Bar dataKey="value" fill="#5E6B8E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.55fr_0.8fr]">
        <div className="rounded-2xl border bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: '#D8E2F4' }}>
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[18px]" style={{ color: '#111827', fontWeight: 700 }}>Asset Risk Table</div>
            <MoreHorizontal className="h-4 w-4" style={{ color: '#64748B' }} />
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                {['Asset ID', 'Type', 'Risk Score', 'Status'].map((h) => (
                  <th key={h} className="px-2 py-2 text-left text-[12px] uppercase" style={{ color: '#64748B', fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {riskRows.map((row) => (
                <tr key={row.id} style={{ borderTop: '1px solid #E2E8F0' }}>
                  <td className="px-2 py-2 text-[14px]" style={{ color: '#1F2937', fontWeight: 600 }}>{row.id}</td>
                  <td className="px-2 py-2 text-[14px]" style={{ color: '#334155' }}>{row.type}</td>
                  <td className="px-2 py-2 text-[14px]" style={{ color: row.risk === 'High' ? '#B45309' : '#B7791F', fontWeight: 600 }}>{row.risk}</td>
                  <td className="px-2 py-2 text-[14px]" style={{ color: row.status.includes('Critical') ? '#991B1B' : '#92400E', fontWeight: 600 }}>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: '#D8E2F4' }}>
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[18px]" style={{ color: '#111827', fontWeight: 700 }}>Overdue Inspections</div>
            <MoreHorizontal className="h-4 w-4" style={{ color: '#64748B' }} />
          </div>
          <div className="space-y-2">
            {overdueInspections.map((item) => (
              <div key={item.name} className="rounded-lg px-3 py-2" style={{ background: '#F8FAFC' }}>
                <div className="flex items-start gap-2">
                  <Clock3 className="mt-0.5 h-4 w-4" style={{ color: '#475569' }} />
                  <div className="flex-1">
                    <div className="text-[14px]" style={{ color: '#0F172A', fontWeight: 600 }}>{item.name}</div>
                    <div className="text-[12px]" style={{ color: '#64748B' }}>({item.due})</div>
                  </div>
                  {item.tone === 'critical' ? (
                    <AlertTriangle className="h-4 w-4" style={{ color: '#B91C1C' }} />
                  ) : (
                    <AlertTriangle className="h-4 w-4" style={{ color: '#B7791F' }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: '#D8E2F4' }}>
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[18px]" style={{ color: '#111827', fontWeight: 700 }}>Critical Barrier Checklist</div>
            <MoreHorizontal className="h-4 w-4" style={{ color: '#64748B' }} />
          </div>
          <div className="space-y-3">
            {barrierChecklist.map((item) => (
              <div key={item.text}>
                <div className="mb-1 flex items-center gap-2 text-[14px]" style={{ color: '#1F2937' }}>
                  <input type="checkbox" className="h-4 w-4 rounded accent-[#5B6CB4]" />
                  <span>{item.text}</span>
                </div>
                <div className="h-2 rounded-full" style={{ background: '#E5E7EB' }}>
                  <div className="h-full rounded-full" style={{ width: `${item.progress}%`, background: '#6477B6' }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center text-[12px]" style={{ color: '#64748B' }}>
            <CheckCircle2 className="mr-1 inline h-4 w-4" />
            Ensure controls are complete with safety protocols.
          </div>
        </div>
      </div>
    </div>
  );
}
