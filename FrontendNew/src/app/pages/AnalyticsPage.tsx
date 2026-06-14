import { useState } from "react";
import { Download, Calendar, BarChart3, Plus, Play, Clock, Edit, Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { StatusBadge } from "../components/shared/StatusBadge";

const ppeData = [
  { name: "Hard Hat", compliance: 96 },
  { name: "Safety Vest", compliance: 92 },
  { name: "Safety Shoes", compliance: 89 },
  { name: "Gloves", compliance: 85 },
  { name: "Goggles", compliance: 78 },
];

const zoneRiskData = [
  { name: "Zone A", risk: 32, violations: 12 },
  { name: "Zone B", risk: 67, violations: 28 },
  { name: "Zone C", risk: 89, violations: 45 },
  { name: "Zone D", risk: 25, violations: 8 },
  { name: "Zone E", risk: 71, violations: 32 },
  { name: "Zone F", risk: 8, violations: 2 },
];

const trendData = Array.from({ length: 12 }, (_, i) => ({
  month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i],
  violations: Math.floor(Math.random() * 100) + 50,
  resolved: Math.floor(Math.random() * 80) + 40,
}));

const pieData = [
  { name: "Helmet", value: 35, color: "#1B5E20" },
  { name: "Vest", value: 25, color: "#2E7D32" },
  { name: "Shoes", value: 20, color: "#43A047" },
  { name: "Gloves", value: 12, color: "#A5D6A7" },
  { name: "Goggles", value: 8, color: "#F59E0B" },
];

const scheduledReports = [
  { name: "Weekly Compliance Summary", type: "Compliance", freq: "Weekly", recipients: "safety-team@co.com", lastSent: "Feb 14, 2026", nextSend: "Feb 21, 2026", status: "Active" },
  { name: "Monthly Incident Report", type: "Incident", freq: "Monthly", recipients: "management@co.com", lastSent: "Jan 31, 2026", nextSend: "Feb 28, 2026", status: "Active" },
  { name: "Daily Violation Alert", type: "Violations", freq: "Daily", recipients: "supervisors@co.com", lastSent: "Feb 18, 2026", nextSend: "Feb 19, 2026", status: "Active" },
];

export function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "ppe", label: "PPE Compliance" },
    { id: "contractor", label: "Contractor Performance" },
    { id: "zone", label: "Zone Risk" },
    { id: "trend", label: "Trend Reports" },
    { id: "custom", label: "Custom Reports" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1>Analytics & Reports</h1>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border text-[13px]" style={{ borderColor: '#E2E8E2', color: '#4A5568' }}>
            <Calendar className="w-3.5 h-3.5" /> Last 30 Days
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border text-[13px]" style={{ borderColor: '#E2E8E2', color: '#4A5568', fontWeight: 500 }}>
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b" style={{ borderColor: '#E2E8E2' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-4 py-2.5 text-[13px] transition-colors relative"
            style={{ color: activeTab === tab.id ? '#1B5E20' : '#4A5568', fontWeight: activeTab === tab.id ? 600 : 400 }}
          >
            {tab.label}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)' }} />}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* Violation Breakdown */}
          <div className="bg-white rounded-xl border p-6" style={{ borderColor: '#E8EFE8', boxShadow: '0px 2px 12px rgba(27, 94, 32, 0.08)' }}>
            <h2 className="mb-6">Violation Type Breakdown</h2>
            <div className="flex items-center gap-8">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ background: d.color }} />
                    <span className="text-[13px]" style={{ color: '#4A5568' }}>{d.name}</span>
                    <span className="text-[13px]" style={{ color: '#0A0A0A', fontWeight: 600 }}>{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Zone Risk */}
          <div className="bg-white rounded-xl border p-6" style={{ borderColor: '#E8EFE8', boxShadow: '0px 2px 12px rgba(27, 94, 32, 0.08)' }}>
            <h2 className="mb-6">Zone Risk Distribution</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={zoneRiskData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF2EE" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E2E8E2', borderRadius: 8 }} />
                <Bar dataKey="risk" radius={[4, 4, 0, 0]} barSize={32}>
                  {zoneRiskData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.risk > 70 ? '#DC2626' : entry.risk > 40 ? '#F59E0B' : '#2E7D32'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Trend */}
          <div className="bg-white rounded-xl border p-6 xl:col-span-2" style={{ borderColor: '#E8EFE8', boxShadow: '0px 2px 12px rgba(27, 94, 32, 0.08)' }}>
            <h2 className="mb-6">Monthly Violations vs Resolved</h2>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF2EE" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E2E8E2', borderRadius: 8 }} />
                <Line type="monotone" dataKey="violations" stroke="#1B5E20" strokeWidth={2} dot={{ fill: '#1B5E20', r: 3 }} />
                <Line type="monotone" dataKey="resolved" stroke="#43A047" strokeWidth={2} dot={{ fill: '#43A047', r: 3 }} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5" style={{ background: '#1B5E20' }} />
                <span className="text-[12px]" style={{ color: '#4A5568' }}>Violations</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 border-t-2 border-dashed" style={{ borderColor: '#43A047' }} />
                <span className="text-[12px]" style={{ color: '#4A5568' }}>Resolved</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "ppe" && (
        <div className="bg-white rounded-xl border p-6" style={{ borderColor: '#E8EFE8', boxShadow: '0px 2px 12px rgba(27, 94, 32, 0.08)' }}>
          <h2 className="mb-6">PPE Compliance by Type</h2>
          <div className="space-y-5">
            {ppeData.map(p => (
              <div key={p.name}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[14px]" style={{ color: '#0A0A0A', fontWeight: 500 }}>{p.name}</span>
                  <span className="text-[14px]" style={{ color: p.compliance >= 90 ? '#2E7D32' : p.compliance >= 80 ? '#F59E0B' : '#DC2626', fontWeight: 600 }}>{p.compliance}%</span>
                </div>
                <div className="h-3 rounded-full" style={{ background: '#F4F7F4' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${p.compliance}%`,
                      background: p.compliance >= 90 ? 'linear-gradient(135deg, #1B5E20, #43A047)' : p.compliance >= 80 ? '#F59E0B' : '#DC2626',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "custom" && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Left - Parameters */}
          <div className="bg-white rounded-xl border p-6" style={{ borderColor: '#E8EFE8', boxShadow: '0px 2px 12px rgba(27, 94, 32, 0.08)' }}>
            <h2 className="mb-6">Report Builder</h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-1.5">Report Type</label>
                <select className="w-full h-10 px-3 rounded-lg border text-[13px] bg-white" style={{ borderColor: '#E2E8E2' }}>
                  <option>Violation Summary</option>
                  <option>Compliance Report</option>
                  <option>Contractor Performance</option>
                  <option>Zone Risk Assessment</option>
                </select>
              </div>
              <div>
                <label className="block mb-1.5">Date Range</label>
                <div className="flex gap-2">
                  <input type="date" className="flex-1 h-10 px-3 rounded-lg border text-[13px]" style={{ borderColor: '#E2E8E2' }} />
                  <input type="date" className="flex-1 h-10 px-3 rounded-lg border text-[13px]" style={{ borderColor: '#E2E8E2' }} />
                </div>
              </div>
              <div>
                <label className="block mb-1.5">Sites</label>
                <div className="space-y-1.5">
                  {["Plant Alpha", "Plant Beta", "Plant Gamma"].map(s => (
                    <label key={s} className="flex items-center gap-2 cursor-pointer" style={{ textTransform: 'none', color: '#0A0A0A', fontWeight: 400, fontSize: '13px' }}>
                      <input type="checkbox" className="w-4 h-4 accent-[#2E7D32]" /> {s}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block mb-1.5">Severity</label>
                <div className="flex gap-2 flex-wrap">
                  {["Critical", "High", "Medium", "Low"].map(s => (
                    <label key={s} className="flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-lg border" style={{ borderColor: '#E2E8E2', textTransform: 'none', color: '#4A5568', fontWeight: 400, fontSize: '13px' }}>
                      <input type="checkbox" className="w-3.5 h-3.5 accent-[#2E7D32]" /> {s}
                    </label>
                  ))}
                </div>
              </div>
              <button className="w-full py-2.5 rounded-lg text-white text-[13px] mt-4" style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)', fontWeight: 600 }}>
                Generate Report
              </button>
            </div>
          </div>

          {/* Right - Preview */}
          <div className="bg-white rounded-xl border p-6 xl:col-span-2" style={{ borderColor: '#E8EFE8', boxShadow: '0px 2px 12px rgba(27, 94, 32, 0.08)' }}>
            <div className="flex items-center justify-between mb-6">
              <h2>Report Preview</h2>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg border text-[13px]" style={{ borderColor: '#E2E8E2', color: '#4A5568', fontWeight: 500 }}>
                <Download className="w-4 h-4" /> Download
              </button>
            </div>
            <div className="flex flex-col items-center justify-center py-16" style={{ background: '#F4F7F4', borderRadius: 12 }}>
              <BarChart3 className="w-12 h-12 mb-4" style={{ color: '#9CA3AF' }} />
              <p className="text-[15px] mb-1" style={{ color: '#0A0A0A', fontWeight: 500 }}>No report generated yet</p>
              <p className="text-[13px]" style={{ color: '#9CA3AF' }}>Configure parameters and click "Generate Report"</p>
            </div>
          </div>
        </div>
      )}

      {/* Scheduled Reports */}
      {(activeTab === "overview" || activeTab === "custom") && (
        <div className="bg-white rounded-xl border p-6" style={{ borderColor: '#E8EFE8', boxShadow: '0px 2px 12px rgba(27, 94, 32, 0.08)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2>Scheduled Reports</h2>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[12px]" style={{ borderColor: '#2E7D32', color: '#2E7D32', fontWeight: 500 }}>
              <Plus className="w-3.5 h-3.5" /> Add Schedule
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
            <thead>
              <tr style={{ background: '#F4F7F4' }}>
                {["Report Name", "Type", "Frequency", "Recipients", "Last Sent", "Next Send", "Status", "Actions"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left">
                    <span className="text-[11px] uppercase tracking-[0.5px]" style={{ color: '#9CA3AF', fontWeight: 600 }}>{h}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scheduledReports.map(r => (
                <tr key={r.name} className="group hover:bg-[#F9FBF9]" style={{ borderBottom: '1px solid #EEF2EE' }}>
                  <td className="px-4 py-3 text-[13px]" style={{ color: '#0A0A0A', fontWeight: 500 }}>{r.name}</td>
                  <td className="px-4 py-3 text-[13px]" style={{ color: '#4A5568' }}>{r.type}</td>
                  <td className="px-4 py-3 text-[13px]" style={{ color: '#4A5568' }}>{r.freq}</td>
                  <td className="px-4 py-3 text-[13px]" style={{ color: '#9CA3AF' }}>{r.recipients}</td>
                  <td className="px-4 py-3 text-[13px]" style={{ color: '#9CA3AF' }}>{r.lastSent}</td>
                  <td className="px-4 py-3 text-[13px]" style={{ color: '#4A5568' }}>{r.nextSend}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} size="sm" /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#E8F5E9]">
                        <Edit className="w-3.5 h-3.5" style={{ color: '#4A5568' }} />
                      </button>
                      <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50">
                        <Trash2 className="w-3.5 h-3.5" style={{ color: '#DC2626' }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}