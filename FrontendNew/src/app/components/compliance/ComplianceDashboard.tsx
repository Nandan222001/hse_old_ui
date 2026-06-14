import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, BarChart, Bar } from "recharts";

const complianceTrend = [
  { month: "Jan", value: 42 },
  { month: "Feb", value: 55 },
  { month: "Mar", value: 58 },
  { month: "Apr", value: 56 },
  { month: "May", value: 68 },
  { month: "Jun", value: 81 },
  { month: "Jul", value: 78 },
  { month: "Aug", value: 77 },
  { month: "Sep", value: 83 },
  { month: "Oct", value: 95 },
];

const findingsBySeverity = [
  { name: "Critical", value: 12, color: "#5A7895" },
  { name: "Major", value: 8, color: "#5E67A9" },
  { name: "Minor", value: 5, color: "#E6AF37" },
  { name: "Observation", value: 11, color: "#5E7399" },
];

const nonConformanceRows = [
  { id: "NC-001", action: "Update Safety Protocol", owner: "J. Smith", due: "Oct 15, 2024", criticality: "High" },
  { id: "NC-002", action: "Review Data Privacy Policy", owner: "A. Lee", due: "Oct 22, 2024", criticality: "Medium" },
  { id: "NC-003", action: "Implement Training Module", owner: "D. Patel", due: "Nov 05, 2024", criticality: "Low" },
];

function SemiGauge({ value, label, color }: Readonly<{ value: number; label: string; color: string }>) {
  const degree = Math.round((Math.max(0, Math.min(value, 100)) / 100) * 180);
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: "#D8E2F4" }}>
      <div className="mb-2 text-[18px]" style={{ color: "#111827", fontWeight: 700 }}>{label}</div>
      <div className="relative mx-auto h-[110px] w-[160px] overflow-hidden">
        <div
          className="absolute left-1/2 top-[110px] h-[160px] w-[160px] -translate-x-1/2 rounded-full"
          style={{
            background: `conic-gradient(from 180deg, ${color} 0deg ${degree}deg, #E5E7EB ${degree}deg 180deg, transparent 180deg 360deg)`,
          }}
        />
        <div className="absolute left-1/2 top-[110px] h-[126px] w-[126px] -translate-x-1/2 rounded-full bg-white" />
        <div className="absolute inset-x-0 bottom-0 text-center">
          <div className="text-[44px] leading-none" style={{ color: "#111827", fontWeight: 700 }}>{value}%</div>
          <div className="mt-1 text-[13px]" style={{ color: "#4B5563" }}>{label.includes("Permit") ? "Active" : "Reviewed"}</div>
        </div>
      </div>
    </div>
  );
}

export function ComplianceDashboard() {
  return (
    <div className="space-y-4">
      <div>
        <h1>Welcome , User</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: "#D8E2F4" }}>
          <div className="text-[18px]" style={{ color: "#111827", fontWeight: 700 }}>Compliance Score</div>
          <div className="mt-2 text-[54px] leading-none" style={{ color: "#111827", fontWeight: 700 }}>91%</div>
          <div className="mt-1 text-[26px]" style={{ color: "#4B5563" }}>Excellent</div>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: "#D8E2F4" }}>
          <div className="text-[18px]" style={{ color: "#111827", fontWeight: 700 }}>Legal Register Coverage</div>
          <div className="mt-2 text-[54px] leading-none" style={{ color: "#111827", fontWeight: 700 }}>98%</div>
          <div className="mt-1 text-[26px]" style={{ color: "#4B5563" }}>High</div>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: "#D8E2F4" }}>
          <div className="text-[18px]" style={{ color: "#111827", fontWeight: 700 }}>Audit Readiness Score</div>
          <div className="mt-2 text-[54px] leading-none" style={{ color: "#111827", fontWeight: 700 }}>95%</div>
          <div className="mt-1 text-[26px]" style={{ color: "#4B5563" }}>Ready</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.5fr_0.85fr_0.65fr]">
        <div className="rounded-2xl border bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: "#D8E2F4" }}>
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[18px]" style={{ color: "#111827", fontWeight: 700 }}>Compliance Trend</div>
            <span className="rounded-full px-3 py-1 text-[11px]" style={{ background: "#E8EDF8", color: "#4B5563", fontWeight: 700 }}>
              Increased 5% MoM
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

        <div className="space-y-4">
          <SemiGauge value={93} label="Permit Compliance" color="#49A05A" />
          <SemiGauge value={88} label="Policy Review Status" color="#2E86DE" />
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
            {nonConformanceRows.map((row) => (
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
