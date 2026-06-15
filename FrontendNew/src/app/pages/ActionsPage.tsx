import { useState, useEffect } from "react";
import { AlertTriangle, Clock3, ShieldAlert } from "lucide-react";
import { Bar, BarChart, Radar, RadarChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  getPermitsSummary,
  type PermitViolation,
  type ActiveWorkRow,
  type ExpiryTimelineBar,
} from "../../services/analytics.service";

// Static — no backend model for contractor breakdown or missing controls
const workByContractor = [
  { name: "Contractor A", construction: 40, maintenance: 24, electrical: 14, mechanical: 22 },
  { name: "Contractor B", construction: 25, maintenance: 35, electrical: 20, mechanical: 20 },
];

const missingControls = [
  "Site Induction Not Completed",
  "Toolbox Talk Pending",
  "Permit to Work Not Signed Off",
  "Emergency Response Plan Not Reviewed",
];

function KpiBox({ title, value, subtitle, delta, valueColor = "#0F172A" }: Readonly<{ title: string; value: string; subtitle: string; delta: string; valueColor?: string }>) {
  const deltaColor = delta.includes("↓") ? "#B45309" : "#0F766E";
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: '#D8E2F4' }}>
      <div className="text-[28px]" style={{ color: '#111827', fontWeight: 700 }}>{title}</div>
      <div className="mt-3 flex items-end gap-3">
        <div className="text-[52px] leading-none" style={{ color: valueColor, fontWeight: 700 }}>{value}</div>
        <div className="pb-2 text-[14px]" style={{ color: deltaColor, fontWeight: 600 }}>{delta}</div>
      </div>
      <div className="mt-3 text-[13px]" style={{ color: '#4B5563' }}>{subtitle}</div>
    </div>
  );
}

export function ActionsPage() {
  const [activePermits, setActivePermits] = useState<number | null>(null);
  const [riskWorkData, setRiskWorkData] = useState<{ subject: string; A: number }[]>([]);
  const [permitViolations, setPermitViolations] = useState<PermitViolation[]>([]);
  const [activeWorkRows, setActiveWorkRows] = useState<ActiveWorkRow[]>([]);
  const [expiryTimeline, setExpiryTimeline] = useState<ExpiryTimelineBar[]>([]);

  useEffect(() => {
    getPermitsSummary().then((data) => {
      setActivePermits(data.active_permits);
      setRiskWorkData(data.risk_work_data);
      setPermitViolations(data.permit_violations);
      setActiveWorkRows(data.active_work_rows);
      setExpiryTimeline(data.expiry_timeline);
    }).catch(console.error);
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1>Welcome , User</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <KpiBox
          title="Active Permits"
          value={activePermits !== null ? String(activePermits) : "—"}
          delta="↑ 8 since yesterday"
          subtitle="Permits Currently in Progress"
          valueColor="#0F766E"
        />
        <KpiBox
          title="Work Exposure Hours"
          value="1,450"
          delta="↓ 2% from last week"
          subtitle="Total Hours Spent on Site"
          valueColor="#A16207"
        />
        <KpiBox
          title="Permit Compliance %"
          value="96.5%"
          delta="↑ 1.2% MoM"
          subtitle="Overall Compliance Rate"
          valueColor="#39498F"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_1fr]">
        <div className="rounded-2xl border bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: '#D8E2F4' }}>
          <div className="mb-2 text-[24px]" style={{ color: '#111827', fontWeight: 700 }}>High Risk Work</div>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={riskWorkData}>
              <PolarGrid stroke="#D1D5DB" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#111827', fontSize: 13 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Risk" dataKey="A" fill="#6B7FC9" fillOpacity={0.45} stroke="#5C6FB6" strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: '#D8E2F4' }}>
            <div className="mb-2 text-[24px]" style={{ color: '#111827', fontWeight: 700 }}>Work by Contractor</div>
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={workByContractor} layout="vertical" barSize={22}>
                <XAxis type="number" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#111827', fontSize: 12 }} axisLine={false} tickLine={false} width={88} />
                <Tooltip />
                <Bar dataKey="construction" stackId="a" fill="#415A98" />
                <Bar dataKey="maintenance" stackId="a" fill="#5D74B7" />
                <Bar dataKey="electrical" stackId="a" fill="#63B5D1" />
                <Bar dataKey="mechanical" stackId="a" fill="#9FD5E7" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: '#E7A7A7', background: '#FFF5F5' }}>
              <div className="mb-2 flex items-center gap-2 text-[24px]" style={{ color: '#111827', fontWeight: 700 }}>
                Permit Violations <AlertTriangle className="h-5 w-5" style={{ color: '#B91C1C' }} />
              </div>
              <div className="space-y-2">
                {permitViolations.map((item) => (
                  <div key={item.text} className="flex items-center justify-between text-[13px]" style={{ color: '#7F1D1D' }}>
                    <span>{item.text}</span>
                    <span style={{ fontWeight: 700 }}>{item.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: '#D8E2F4', background: '#FFFDF8' }}>
              <div className="mb-2 flex items-center gap-2 text-[24px]" style={{ color: '#111827', fontWeight: 700 }}>
                Missing Work Controls
              </div>
              <div className="space-y-2 text-[13px]" style={{ color: '#78350F' }}>
                {missingControls.map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-2xl border bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: '#D8E2F4' }}>
          <div className="mb-3 text-[24px]" style={{ color: '#111827', fontWeight: 700 }}>Active Work Table</div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  {["Permit ID", "Work Type", "Contractor", "Location", "Status", "Expiry"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-[12px] uppercase" style={{ color: '#64748B', fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeWorkRows.map((row) => (
                  <tr key={row.id + row.type} style={{ borderTop: '1px solid #E2E8F0' }}>
                    <td className="px-3 py-2 text-[13px]" style={{ color: '#0F172A', fontWeight: 600 }}>{row.id}</td>
                    <td className="px-3 py-2 text-[13px]" style={{ color: '#334155' }}>{row.type}</td>
                    <td className="px-3 py-2 text-[13px]" style={{ color: '#334155' }}>{row.contractor}</td>
                    <td className="px-3 py-2 text-[13px]" style={{ color: '#334155' }}>{row.location}</td>
                    <td className="px-3 py-2 text-[12px]"><span className="rounded-full px-2 py-0.5" style={{ background: '#DCFCE7', color: '#166534', fontWeight: 700 }}>{row.status}</span></td>
                    <td className="px-3 py-2 text-[13px]" style={{ color: '#334155' }}>{row.expiry}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: '#D8E2F4' }}>
          <div className="mb-1 text-[24px]" style={{ color: '#111827', fontWeight: 700 }}>Permit Expiry Timeline</div>
          <div className="mb-3 flex items-center gap-4 text-[11px]" style={{ color: '#475569' }}>
            <span>Now</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded" style={{ background: '#D64545' }} />1h</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded" style={{ background: '#E8B441' }} />Warning 4h</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded" style={{ background: '#42A5C6' }} />Safe 4h</span>
            <span>Next 8 Hours</span>
          </div>
          <div className="space-y-3">
            {expiryTimeline.map((bar) => (
              <div key={bar.label}>
                <div className="mb-1 text-[11px]" style={{ color: '#64748B' }}>{bar.label}</div>
                <div className="relative h-5 rounded" style={{ background: '#F1F5F9' }}>
                  <div
                    className="absolute top-0 h-5 rounded px-2 text-[10px] leading-5 text-white"
                    style={{ left: `${bar.left}%`, width: `${bar.width}%`, background: bar.color, fontWeight: 700 }}
                  >
                    {bar.rightText}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-end">
            <button className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-[14px] text-white" style={{ background: 'linear-gradient(135deg, #606AB9 0%, #7A80D1 100%)', fontWeight: 600 }}>
              <Clock3 className="h-4 w-4" />
              Near Miss Reporting
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
