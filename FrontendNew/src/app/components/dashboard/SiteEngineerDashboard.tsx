import { useState } from "react";
import { KpiCard } from "../shared/KpiCard";
import { SeverityBadge, StatusBadge } from "../shared/StatusBadge";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell } from "recharts";
import { MapPin, ArrowRight, Bot, Wrench, AlertTriangle, FileCheck, Wrench as WrenchIcon } from "lucide-react";
import { useNavigate } from "react-router";

// Mock Data
const maintenanceTrend = Array.from({ length: 14 }, (_, i) => ({
    date: `Feb ${i + 1}`,
    hours: Math.floor(Math.random() * 8) + 2,
}));

const equipmentStatus = [
    { name: "Operational", value: 85, fill: "#2E7D32" },
    { name: "In Maintenance", value: 10, fill: "#F59E0B" },
    { name: "Out of Service", value: 5, fill: "#DC2626" },
];

const pendingActions = [
    { id: "CAPA-102", desc: "Repair Scaffolding Guardrails", zone: "Zone A", severity: "High", due: "Today", assignedBy: "Tom Harris" },
    { id: "CAPA-105", desc: "Replace Filter on Generator #1", zone: "Zone D", severity: "Medium", due: "Tomorrow", assignedBy: "Auto-System" },
    { id: "CAPA-108", desc: "Clear blocked drainage", zone: "Zone C", severity: "Medium", due: "Feb 10", assignedBy: "Sarah Connor" },
];

const activePermits = [
    { id: "PTW-4012", type: "Hot Work", zone: "Boiler Room", worker: "Mike Vance", expiry: "2h 15m left" },
    { id: "PTW-4015", type: "Confined Space", zone: "Tank 4", worker: "John Doe", expiry: "4h 30m left" },
];

export function SiteEngineerDashboard() {
    const navigate = useNavigate();
    const [loading] = useState(false);

    return (
        <div className="space-y-6">
            {/* Action Header for Engineer */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-xl border" style={{ borderColor: '#E8EFE8', boxShadow: '0px 2px 12px rgba(27, 94, 32, 0.08)' }}>
                <button className="flex-1 flex flex-col items-center justify-center p-4 rounded-lg transition-colors hover:bg-gray-50 border border-transparent hover:border-gray-200">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2" style={{ background: '#E8F5E9', color: '#2E7D32' }}>
                        <FileCheck className="w-5 h-5" />
                    </div>
                    <span className="text-[13px] font-semibold text-gray-800">Approve Permits</span>
                </button>
                <div className="w-px h-12 bg-gray-200" />
                <button className="flex-1 flex flex-col items-center justify-center p-4 rounded-lg transition-colors hover:bg-gray-50 border border-transparent hover:border-gray-200">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2" style={{ background: '#E8F5E9', color: '#2E7D32' }}>
                        <Wrench className="w-5 h-5" />
                    </div>
                    <span className="text-[13px] font-semibold text-gray-800">Log Maintenance</span>
                </button>
                <div className="w-px h-12 bg-gray-200" />
                <button className="flex-1 flex flex-col items-center justify-center p-4 rounded-lg transition-colors hover:bg-gray-50 border border-transparent hover:border-gray-200">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2" style={{ background: '#E8F5E9', color: '#2E7D32' }}>
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <span className="text-[13px] font-semibold text-gray-800">Join RCA</span>
                </button>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-4 gap-4">
                <KpiCard
                    label="Open Corrective Actions"
                    value="7"
                    trend={{ value: 12, positive: false }}
                    trendLabel="vs last week"
                />
                <KpiCard
                    label="Active Permits"
                    value="12"
                    trend={{ value: 2, positive: true }}
                    trendLabel="today"
                />
                <KpiCard
                    label="Equipment Uptime"
                    value="94%"
                    trend={{ value: 1.5, positive: true }}
                    trendLabel="improvement"
                />
                <KpiCard
                    label="Pending Certs Review"
                    value="4"
                    trend={{ value: 0, positive: true }}
                    trendLabel="this week"
                />
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-5 gap-6">
                {/* Actions & Tasks */}
                <div className="col-span-3 bg-white rounded-xl border p-6 flex flex-col" style={{ borderColor: '#E8EFE8', boxShadow: '0px 2px 12px rgba(27, 94, 32, 0.08)' }}>
                    <div className="flex items-center justify-between mb-4">
                        <h2>Assigned Corrective Actions (CAPA)</h2>
                        <button
                            onClick={() => navigate("/actions")}
                            className="flex items-center gap-1 text-[13px]"
                            style={{ color: '#2E7D32', fontWeight: 500 }}
                        >
                            View Board <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <div className="space-y-3">
                        {pendingActions.map((action) => (
                            <div key={action.id} className="p-3 rounded-lg border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer">
                                <div className="flex items-start gap-3">
                                    <div className="mt-1">
                                        <SeverityBadge severity={action.severity as any} />
                                    </div>
                                    <div>
                                        <h4 className="text-[13px] font-bold text-gray-900">{action.desc}</h4>
                                        <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-500">
                                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {action.zone}</span>
                                            <span>By: {action.assignedBy}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[12px] font-bold text-gray-900 mb-1">Due: {action.due}</div>
                                    <button className="text-[11px] font-semibold text-[#2E7D32] hover:underline">Mark Resolved</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Equipment Status Chart */}
                <div className="col-span-2 bg-white rounded-xl border p-6" style={{ borderColor: '#E8EFE8', boxShadow: '0px 2px 12px rgba(27, 94, 32, 0.08)' }}>
                    <h2 className="mb-4">Equipment Status Overview</h2>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={equipmentStatus} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#EEF2EE" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                            <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#0A0A0A' }} axisLine={false} tickLine={false} width={120} />
                            <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E2E8E2', borderRadius: 8, fontSize: 13 }} />
                            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24}>
                                {equipmentStatus.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={() => navigate("/equipment-certification")}
                            className="text-[12px] font-semibold text-[#2E7D32] hover:underline"
                        >
                            Manage Fleet & Certifications
                        </button>
                    </div>
                </div>
            </div>

            {/* Third Row */}
            <div className="grid grid-cols-2 gap-6">
                {/* Active Permits Tracking */}
                <div className="bg-white rounded-xl border p-6" style={{ borderColor: '#E8EFE8', boxShadow: '0px 2px 12px rgba(27, 94, 32, 0.08)' }}>
                    <div className="flex items-center justify-between mb-4">
                        <h2>Active Permits to Work (PTW)</h2>
                        <StatusBadge status="Active" />
                    </div>
                    <div className="space-y-3">
                        {activePermits.map((permit) => (
                            <div key={permit.id} className="p-3 rounded-lg border border-[#E8EFE8] flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[13px] font-bold text-gray-900">{permit.id} - {permit.type}</span>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 font-bold">{permit.expiry}</span>
                                    </div>
                                    <div className="text-[12px] text-gray-500">Worker: {permit.worker} • Zone: {permit.zone}</div>
                                </div>
                                <button className="px-3 py-1.5 rounded-lg border border-gray-200 text-[11px] font-semibold hover:bg-gray-50 transition-colors">
                                    Revoke
                                </button>
                            </div>
                        ))}
                    </div>
                    <button className="mt-4 w-full py-2 border border-dashed border-[#2E7D32] text-[#2E7D32] rounded-lg text-[12px] font-bold hover:bg-[#F4F7F4] transition-colors">
                        Issue New Permit
                    </button>
                </div>

                {/* AI Resource Allocation */}
                <div className="bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] rounded-xl border border-gray-800 p-6 text-white relative overflow-hidden shadow-lg">
                    <div className="absolute -right-20 -top-20 w-60 h-60 bg-blue-500/20 rounded-full blur-3xl" />
                    <div className="flex items-center gap-3 mb-6 relative z-10">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
                            <Bot className="w-5 h-5 text-blue-300" />
                        </div>
                        <div>
                            <h2 className="text-white text-[16px]">AI Resource Allocation</h2>
                            <p className="text-white/60 text-[12px]">Optimizing task assignments based on skills & location</p>
                        </div>
                    </div>

                    <div className="space-y-4 relative z-10">
                        <div className="bg-white/5 rounded-lg p-4 border border-white/10 backdrop-blur-sm">
                            <div className="flex items-start gap-3">
                                <WrenchIcon className="w-4 h-4 text-orange-300 mt-0.5" />
                                <p className="text-[13px] leading-relaxed text-gray-200">
                                    <strong className="text-white">Task: Repair Scaffolding Guardrails (High Priority)</strong>
                                    <br />
                                    <span className="text-blue-300 mt-1 inline-block">Suggestion:</span> Assign to <strong>David Reynolds</strong>. He is currently 5 mins away in Zone B, has active Scaffolding Certification, and is marked explicitly available today.
                                </p>
                            </div>
                            <div className="mt-3 flex justify-end">
                                <button className="bg-blue-600/80 hover:bg-blue-600 transition-colors px-4 py-1.5 rounded text-[11px] font-bold text-white">1-Click Assign</button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
