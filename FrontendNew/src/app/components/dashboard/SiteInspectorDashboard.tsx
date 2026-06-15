import { useState, useEffect } from "react";
import { KpiCard } from "../shared/KpiCard";
import { SeverityBadge, StatusBadge } from "../shared/StatusBadge";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { MapPin, ArrowRight, Bot, Camera, Calendar, CheckSquare, Search, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router";
import {
  getDashboardStats,
  getComplianceTrend,
  getSafetyWalksRecent,
  getNearMissesRecent,
  type DashboardStats,
  type ComplianceTrend,
  type RecentSafetyWalk,
  type RecentNearMiss,
} from "../../../services/dashboard.service";

function formatRelativeTime(isoString: string | null): string {
  if (!isoString) return 'Unknown';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs} hr${diffHrs !== 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
}

function formatInspectionDate(isoString: string | null): string {
  if (!isoString) return 'N/A';
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ', ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export function SiteInspectorDashboard() {
    const navigate = useNavigate();

    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [complianceData, setComplianceData] = useState<ComplianceTrend[]>([]);
    const [safetyWalks, setSafetyWalks] = useState<RecentSafetyWalk[]>([]);
    const [nearMisses, setNearMisses] = useState<RecentNearMiss[]>([]);

    useEffect(() => {
        Promise.all([
            getDashboardStats(),
            getComplianceTrend(30),
            getSafetyWalksRecent(5),
            getNearMissesRecent(5),
        ])
            .then(([s, trend, walks, misses]) => {
                setStats(s);
                setComplianceData(trend);
                setSafetyWalks(walks);
                setNearMisses(misses);
            })
            .catch(console.error);
    }, []);

    const upcomingAudits = safetyWalks.map((sw) => ({
        id: `SW-${sw.id}`,
        name: sw.inspection_type || 'Safety Walk',
        date: formatInspectionDate(sw.inspection_date_time),
        zone: sw.location,
        priority: sw.priority,
    }));

    const recentObservations = nearMisses.map((nm) => ({
        id: `NM-${nm.id}`,
        reporter: nm.reporter || 'Unknown',
        desc: nm.description || 'Near miss event',
        time: formatRelativeTime(nm.event_date_time),
        severity: nm.severity,
    }));

    return (
        <div className="space-y-6">
            {/* Action Header for Inspector */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-xl border" style={{ borderColor: '#E8EFE8', boxShadow: '0px 2px 12px rgba(27, 94, 32, 0.08)' }}>
                <button className="flex-1 flex flex-col items-center justify-center p-4 rounded-lg transition-colors hover:bg-gray-50 border border-transparent hover:border-gray-200">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2" style={{ background: '#E8F5E9', color: '#2E7D32' }}>
                        <AlertCircle className="w-5 h-5" />
                    </div>
                    <span className="text-[13px] font-semibold text-gray-800">Log Hazard</span>
                </button>
                <div className="w-px h-12 bg-gray-200" />
                <button className="flex-1 flex flex-col items-center justify-center p-4 rounded-lg transition-colors hover:bg-gray-50 border border-transparent hover:border-gray-200">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2" style={{ background: '#E8F5E9', color: '#2E7D32' }}>
                        <CheckSquare className="w-5 h-5" />
                    </div>
                    <span className="text-[13px] font-semibold text-gray-800">Start Audit</span>
                </button>
                <div className="w-px h-12 bg-gray-200" />
                <button className="flex-1 flex flex-col items-center justify-center p-4 rounded-lg transition-colors hover:bg-gray-50 border border-transparent hover:border-gray-200">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2" style={{ background: '#E8F5E9', color: '#2E7D32' }}>
                        <Search className="w-5 h-5" />
                    </div>
                    <span className="text-[13px] font-semibold text-gray-800">Verify CAPA</span>
                </button>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-4 gap-4">
                <KpiCard
                    label="Total Safety Walks"
                    value={stats ? String(stats.safety_walks_count) : "—"}
                    trend={{ value: 0, positive: true }}
                    trendLabel="total recorded"
                />
                <KpiCard
                    label="Hazards Logged"
                    value={stats ? String(stats.near_misses_count) : "—"}
                    trend={{ value: 0, positive: false }}
                    trendLabel="near misses"
                />
                <KpiCard
                    label="Current Compliance Score"
                    value={stats ? `${Math.round(stats.avg_compliance_rating * 20)}%` : "—"}
                    trend={{ value: 0, positive: true }}
                    trendLabel="avg rating"
                />
                <KpiCard
                    label="Overdue Actions (CAPA)"
                    value={stats ? String(stats.overdue_capa) : "—"}
                    trend={{ value: 0, positive: false }}
                    trendLabel="overdue items"
                />
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-5 gap-6">
                {/* Compliance Trend Chart */}
                <div className="col-span-3 bg-white rounded-xl border p-6 flex flex-col" style={{ borderColor: '#E8EFE8', boxShadow: '0px 2px 12px rgba(27, 94, 32, 0.08)' }}>
                    <div className="flex items-center justify-between mb-6">
                        <h2>Site Compliance Trend</h2>
                        <div className="text-[12px] text-gray-500">Based on recent audits and open violations</div>
                    </div>
                    <div className="flex-1 min-h-[240px]">
                        <ResponsiveContainer width="100%" height={240}>
                            <AreaChart data={complianceData}>
                                <defs>
                                    <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#2E7D32" stopOpacity={0.2} />
                                        <stop offset="100%" stopColor="#2E7D32" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#EEF2EE" />
                                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ background: '#fff', border: '1px solid #E2E8E2', borderRadius: 8, fontSize: 13, boxShadow: '0px 2px 12px rgba(27,94,32,0.08)' }}
                                />
                                <Area type="monotone" dataKey="score" stroke="#1B5E20" strokeWidth={2} fill="url(#compGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Intelligence Assistant Box */}
                <div className="col-span-2 bg-gradient-to-br from-[#1B5E20] to-[#2E7D32] rounded-xl border border-[#1B5E20] p-6 text-white relative overflow-hidden shadow-lg">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-white text-[16px]">AI Priority Insights</h2>
                            <p className="text-white/70 text-[12px]">Updated just now based on site data</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-white/10 rounded-lg p-4 border border-white/20 backdrop-blur-sm">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-4 h-4 text-orange-300 mt-0.5" />
                                <p className="text-[13px] leading-relaxed">
                                    <strong className="text-white">Crane #4 Notification:</strong> Two near-misses reported yesterday in Zone B involving heavy lifting. I recommend prioritizing a safety inspection for this zone today.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white/10 rounded-lg p-4 border border-white/20 backdrop-blur-sm">
                            <div className="flex items-start gap-3">
                                <MapPin className="w-4 h-4 text-blue-300 mt-0.5" />
                                <p className="text-[13px] leading-relaxed">
                                    <strong className="text-white">Weather Alert:</strong> High winds (35mph) expected at 14:00. Advise checking all scaffolding in Zones C & D beforehand.
                                </p>
                            </div>
                        </div>
                    </div>

                    <button className="mt-6 w-full py-2.5 rounded-lg bg-white text-[#1B5E20] text-[13px] font-bold hover:bg-gray-50 transition-colors shadow-sm">
                        Generate Daily Audit Plan
                    </button>
                </div>
            </div>

            {/* Third Row */}
            <div className="grid grid-cols-5 gap-6">
                {/* Pending & Overdue Inspections */}
                <div className="col-span-3 bg-white rounded-xl border p-6" style={{ borderColor: '#E8EFE8', boxShadow: '0px 2px 12px rgba(27, 94, 32, 0.08)' }}>
                    <div className="flex items-center justify-between mb-4">
                        <h2>Upcoming & Overdue Audits</h2>
                        <button
                            onClick={() => navigate("/compliance?tab=audit")}
                            className="flex items-center gap-1 text-[13px]"
                            style={{ color: '#2E7D32', fontWeight: 500 }}
                        >
                            View Schedule <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b" style={{ borderColor: '#EEF2EE' }}>
                                    <th className="py-3 text-[12px] uppercase tracking-wider" style={{ color: '#9CA3AF', fontWeight: 600 }}>Audit Name</th>
                                    <th className="py-3 text-[12px] uppercase tracking-wider" style={{ color: '#9CA3AF', fontWeight: 600 }}>Zone</th>
                                    <th className="py-3 text-[12px] uppercase tracking-wider" style={{ color: '#9CA3AF', fontWeight: 600 }}>Priority/Severity</th>
                                    <th className="py-3 text-[12px] uppercase tracking-wider" style={{ color: '#9CA3AF', fontWeight: 600 }}>Scheduled For</th>
                                    <th className="py-3 text-[12px] uppercase tracking-wider text-right" style={{ color: '#9CA3AF', fontWeight: 600 }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {upcomingAudits.map((audit) => (
                                    <tr key={audit.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors" style={{ borderColor: '#EEF2EE' }}>
                                        <td className="py-3">
                                            <div className="text-[13px] font-medium text-gray-900">{audit.name}</div>
                                            <div className="text-[11px] text-gray-500">{audit.id}</div>
                                        </td>
                                        <td className="py-3">
                                            <span className="text-[12px] text-gray-700">{audit.zone}</span>
                                        </td>
                                        <td className="py-3">
                                            <SeverityBadge severity={audit.priority as any} />
                                        </td>
                                        <td className="py-3">
                                            <div className="flex items-center gap-1.5 text-[12px] text-gray-600">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {audit.date}
                                            </div>
                                        </td>
                                        <td className="py-3 text-right">
                                            <button className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors" style={{ background: '#E8F5E9', color: '#2E7D32' }}>
                                                Start
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Observations Feed */}
                <div className="col-span-2 bg-white rounded-xl border p-6" style={{ borderColor: '#E8EFE8', boxShadow: '0px 2px 12px rgba(27, 94, 32, 0.08)' }}>
                    <div className="flex items-center justify-between mb-4">
                        <h2>Recent Worker Observations</h2>
                    </div>
                    <div className="space-y-4">
                        {recentObservations.map((obs) => (
                            <div key={obs.id} className="p-3 rounded-lg border border-gray-100 bg-gray-50 relative pl-4">
                                <div
                                    className="absolute left-0 top-0 bottom-0 w-[4px] rounded-l-lg"
                                    style={{ background: obs.severity === 'Critical' ? '#DC2626' : obs.severity === 'High' ? '#EA580C' : '#F59E0B' }}
                                />
                                <div className="flex justify-between items-start mb-1.5 ml-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[13px] font-bold text-gray-900">{obs.reporter}</span>
                                        <span className="text-[11px] text-gray-500">{obs.time}</span>
                                    </div>
                                    <SeverityBadge severity={obs.severity as any} />
                                </div>
                                <p className="text-[12px] text-gray-700 ml-1 leading-relaxed">
                                    {obs.desc}
                                </p>
                                <div className="mt-2 ml-1 flex gap-2">
                                    <button className="text-[11px] font-semibold text-[#2E7D32] hover:underline">Verify</button>
                                    <button className="text-[11px] font-semibold text-gray-500 hover:text-gray-800">Assign Action</button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="mt-4 w-full py-2 text-[12px] font-semibold text-gray-600 hover:text-gray-900 text-center transition-colors">
                        View All Observations
                    </button>
                </div>
            </div>
        </div>
    );
}
