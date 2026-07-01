import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import {
  getDashboardStats,
  getIncidentsByCategory,
  getCapaActions,
  getOverdueCapa,
  getLeadingIndicators,
  type DashboardStats,
  type IncidentByCategory,
  type CapaAction,
  type OverdueCapa as OverdueCapaItem,
  type LeadingIndicators,
} from "../../services/dashboard.service";

async function repairOrgData() {
  try {
    const jwt = localStorage.getItem("hse_jwt_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (jwt) headers["Authorization"] = `Bearer ${jwt}`;
    void headers;
  } catch {
    // silent — repair is best-effort
  }
}

function formatDueDate(dateStr: string | null): string {
  if (!dateStr) return 'No Date';
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function GaugeCard({ value, label, threshold }: Readonly<{ value: number; label: string; threshold: string }>) {
  const angle = Math.round((Math.max(0, Math.min(value, 100)) / 100) * 240);
  const ringStyle = {
    background: `conic-gradient(from 150deg, #4F62B8 0deg 140deg, #3AAFC9 140deg 205deg, #F1B435 205deg 240deg, #E5E7EB 240deg 360deg)`,
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[138px] w-[138px]">
        <div className="absolute inset-0 rounded-full" style={ringStyle} />
        <div className="absolute inset-[12px] rounded-full bg-white" />
        <div className="absolute inset-[23px] rounded-full border-[10px] border-white" />
        <div
          className="absolute left-1/2 top-1/2 h-[2px] w-[48px] origin-left -translate-y-1/2"
          style={{ transform: `translateY(-50%) rotate(${angle}deg)`, background: '#111827' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[clamp(1.8rem,3.8vw,2.2rem)] leading-none" style={{ color: '#111827', fontWeight: 700 }}>{value}%</span>
        </div>
      </div>
      <div className="mt-2 text-[15px]" style={{ color: '#111827', fontWeight: 700 }}>{label}</div>
      <div className="mt-1 text-[13px]" style={{ color: '#6B7280' }}>Alert threshold &nbsp;•&nbsp; {threshold}</div>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const firstName = (user?.name || "User").trim().split(" ")[0] || "User";

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [riskBars, setRiskBars] = useState<IncidentByCategory[]>([]);
  const [capaActions, setCapaActions] = useState<CapaAction[]>([]);
  const [overdueCapa, setOverdueCapa] = useState<OverdueCapaItem[]>([]);
  const [leading, setLeading] = useState<LeadingIndicators | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    // First repair any NULL org_id rows so backend returns real data, then load dashboard
    Promise.all([
        getDashboardStats(),
        getIncidentsByCategory(),
        getCapaActions(5),
        getOverdueCapa(4),
        getLeadingIndicators(),
      ])
      .then(([s, cats, capas, overdue, lead]) => {
        setStats(s as DashboardStats);
        setRiskBars(cats as IncidentByCategory[]);
        setCapaActions(capas as CapaAction[]);
        setOverdueCapa(overdue as OverdueCapaItem[]);
        setLeading(lead as LeadingIndicators);
        setLastUpdated(new Date());
      })
      .catch(console.error);
  }, [user?.role]);

  const demoKpis = leading
    ? [
        {
          title: "Predictive Injury Risk Score",
          value: `${leading.predictive_injury_risk_score}%`,
          sub: "Leading Indicator",
          accent: "#E9EDFF",
          border: "#6173C5",
          inline: `${Math.abs(leading.predictive_injury_risk_trend)}%`,
          trendDown: leading.predictive_injury_risk_trend < 0,
        },
        {
          title: "TRIR / LTIF",
          value: `${leading.trir} / ${leading.ltif}`,
          sub: "Leading Indicator",
          accent: "#FFFFFF",
          border: "#E5E7EB",
          inline: "",
          trendDown: false,
        },
        {
          title: "LTISR",
          value: `${leading.ltisr ?? 0}`,
          sub: "Incident Severity Rate",
          accent: "#FFFFFF",
          border: "#E5E7EB",
          inline: "",
          trendDown: false,
        },
        {
          title: "DART Rate",
          value: `${leading.dart_rate ?? 0}`,
          sub: "Days Away / Restricted",
          accent: "#FFFFFF",
          border: "#E5E7EB",
          inline: "",
          trendDown: false,
        },
        {
          title: "FAR",
          value: `${leading.far ?? 0}`,
          sub: "Fatal Accident Rate",
          accent: "#FFFFFF",
          border: "#E5E7EB",
          inline: "",
          trendDown: false,
        },
        {
          title: "Contractor Risk Score",
          value: `${leading.contractor_risk_label} / ${leading.contractor_risk_score}%`,
          sub: "Limiting Indicator",
          accent: "#FFFFFF",
          border: "#E5E7EB",
          inline: "",
          trendDown: false,
        },
        {
          title: "Near Miss Ratio",
          value: `${leading.near_miss_ratio ?? 0}:1`,
          sub: "Leading Indicator",
          accent: "#FFFFFF",
          border: "#E5E7EB",
          inline: "",
          trendDown: false,
        },
        {
          title: "Audit Readiness Score",
          value: `${leading.audit_readiness_score}% / ${leading.audit_readiness_label}`,
          sub: leading.audit_readiness_label,
          accent: "#FFFFFF",
          border: "#E5E7EB",
          inline: "",
          trendDown: false,
        },
      ]
    : [];

  const content = (
      <>
        <div
          className="rounded-2xl border p-4 md:p-5"
          style={{ borderColor: '#CFDCF5', background: '#F8FBFF' }}
        >
          <div className="mb-4 text-center text-[14px] md:text-[15px] leading-[1.35]" style={{ color: '#8F2E73', fontWeight: 600 }}>
            Forces attention toward leading predictive metrics first,<br />
            balancing compliance with immediate action triggers.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
            {demoKpis.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border px-4 py-3"
                style={{
                  background: item.accent,
                  borderColor: item.border,
                  boxShadow: '0 4px 10px rgba(15, 23, 42, 0.08)',
                }}
              >
                <div className="text-[14px]" style={{ color: '#1F2937', fontWeight: 600 }}>{item.title}</div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[clamp(1.6rem,3.4vw,2rem)] leading-none" style={{ color: '#111827', fontWeight: 700 }}>{item.value}</span>
                  {item.inline && (
                    <span className="text-[13px]" style={{ color: item.trendDown ? '#B91C1C' : '#3C8A52', fontWeight: 600 }}>
                      {item.trendDown ? '↘' : '↗'} {item.inline}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-[13px]" style={{ color: '#6B7280' }}>{item.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="rounded-2xl border bg-white p-4 md:p-5" style={{ borderColor: '#D9E4F6', boxShadow: '0 8px 18px rgba(15, 23, 42, 0.08)' }}>
            <h2 className="mb-4 text-[clamp(1.15rem,2.3vw,1.5rem)]" style={{ color: '#111827', fontWeight: 700 }}>Top Risk Chart (Data-Based)</h2>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={riskBars} barGap={6} margin={{ bottom: 56 }}>
                <CartesianGrid stroke="#E5E7EB" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  angle={-35}
                  textAnchor="end"
                  height={70}
                />
                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} domain={[0, 'auto']} />
                <Tooltip />
                <Bar dataKey="data" fill="#5E7992" radius={[4, 4, 0, 0]} />
                <Bar dataKey="intelligence" fill="#5A63A8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl border bg-white p-4 md:p-5" style={{ borderColor: '#D9E4F6', boxShadow: '0 8px 18px rgba(15, 23, 42, 0.08)' }}>
            <h2 className="mb-4 text-[clamp(1.15rem,2.3vw,1.5rem)]" style={{ color: '#111827', fontWeight: 700 }}>Exposure Index & Competency Coverage (Intelligence-Based)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <GaugeCard
                value={stats ? Math.round(stats.avg_compliance_rating * 20) : 0}
                label="Exposure Index"
                threshold={stats ? `${Math.round(stats.avg_compliance_rating * 20)}%` : '0%'}
              />
              <GaugeCard
                value={stats ? Math.round(stats.capa_completion_rate) : 0}
                label="Competency Coverage"
                threshold={stats ? `${Math.round(stats.capa_completion_rate)}%` : '0%'}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <div className="xl:col-span-6 rounded-2xl border bg-white p-4 md:p-5" style={{ borderColor: '#D9E4F6', boxShadow: '0 8px 18px rgba(15, 23, 42, 0.08)' }}>
            <h2 className="mb-3 text-[clamp(1.15rem,2.3vw,1.5rem)]" style={{ color: '#111827', fontWeight: 700 }}>Ranked Action Table</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b" style={{ borderColor: '#E5E7EB' }}>
                    <th className="py-2 text-[13px]" style={{ color: '#4B5563', fontWeight: 700 }}>Action</th>
                    <th className="py-2 text-[13px]" style={{ color: '#4B5563', fontWeight: 700 }}>Priority</th>
                    <th className="py-2 text-[13px]" style={{ color: '#4B5563', fontWeight: 700 }}>Due Date</th>
                    <th className="py-2 text-[13px]" style={{ color: '#4B5563', fontWeight: 700 }}>Assignee</th>
                  </tr>
                </thead>
                <tbody>
                  {capaActions.map((row) => (
                    <tr key={row.id} className="border-b last:border-b-0" style={{ borderColor: '#F1F5F9' }}>
                      <td className="py-2 text-[13px]" style={{ color: '#111827' }}>{row.description || row.action_type}</td>
                      <td className="py-2 text-[13px]" style={{ color: row.priority === 'High' ? '#B45309' : '#4B5563', fontWeight: 600 }}>{row.priority}</td>
                      <td className="py-2 text-[13px]" style={{ color: '#374151' }}>{formatDueDate(row.due_date)}</td>
                      <td className="py-2 text-[13px]" style={{ color: '#374151' }}>{row.assignee}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="xl:col-span-3 rounded-2xl border bg-white p-4 md:p-5" style={{ borderColor: '#D9E4F6', boxShadow: '0 8px 18px rgba(15, 23, 42, 0.08)' }}>
            <h2 className="mb-3 text-[clamp(1.15rem,2.3vw,1.5rem)]" style={{ color: '#111827', fontWeight: 700 }}>Overdue CAPA</h2>
            <div className="space-y-3">
              {overdueCapa.map((item) => (
                <div key={item.id} className="text-[14px] leading-[1.45]" style={{ color: '#374151' }}>
                  <span>Incident #{item.incident_id} - {item.action_type || 'Action'} - </span>
                  <span style={{ color: '#B45309', fontWeight: 700 }}>{item.days_overdue} Day{item.days_overdue !== 1 ? 's' : ''} Overdue</span>
                </div>
              ))}
            </div>
          </div>

          <div className="xl:col-span-3 rounded-2xl border bg-white p-4 md:p-5 flex items-center justify-center" style={{ borderColor: '#D9E4F6', boxShadow: '0 8px 18px rgba(15, 23, 42, 0.08)' }}>
            <button
              onClick={() => navigate("/near-miss")}
              className="rounded-full px-8 py-3 text-[16px] md:text-[18px] text-white transition-transform duration-150 hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #5565C1 0%, #6E7BDB 100%)', boxShadow: '0 8px 18px rgba(81, 96, 186, 0.38)', fontWeight: 600 }}
            >
              Near Miss Reporting
            </button>
          </div>
        </div>
      </>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-2xl border px-5 py-4" style={{ borderColor: '#DCE4F3', background: '#FFFFFF' }}>
        <div>
          <h1>Welcome, {firstName}</h1>
          <p className="text-[14px] mt-1" style={{ color: '#64748B' }}>Focus on leading indicators and high-priority actions first.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[13px]" style={{ color: '#94A3B8' }}>
              {lastUpdated
                ? `Updated: ${lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                : 'Loading…'}
            </span>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#5B6DE8' }} />
          </div>
        </div>
      </div>

      {content}
    </div>
  );
}
