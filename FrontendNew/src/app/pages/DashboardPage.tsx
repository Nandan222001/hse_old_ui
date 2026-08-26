﻿import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useNavigate } from "react-router";
import { AlertTriangle, ArrowDown, ArrowUp, CalendarDays, ChevronRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getDashboardStats,
  getIncidentsByCategory,
  getCapaActions,
  getOverdueCapa,
  getLeadingIndicators,
  getNearMissesRecent,
  type DashboardStats,
  type IncidentByCategory,
  type CapaAction,
  type OverdueCapa as OverdueCapaItem,
  type LeadingIndicators,
  type RecentNearMiss,
} from "../../services/dashboard.service";

// â”€â”€ date helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function toISO(d: Date) {
  return d.toISOString().split("T")[0];
}

function subtractDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return toISO(d);
}

type Preset = "7D" | "30D" | "90D" | "1Y" | "ALL" | "CUSTOM";

const PRESETS: { label: string; key: Preset }[] = [
  { label: "7D",  key: "7D"  },
  { label: "30D", key: "30D" },
  { label: "90D", key: "90D" },
  { label: "1Y",  key: "1Y"  },
  { label: "All", key: "ALL" },
  { label: "Custom", key: "CUSTOM" },
];

function presetDates(preset: Preset): { start?: string; end?: string } {
  const today = toISO(new Date());
  switch (preset) {
    case "7D":  return { start: subtractDays(7),   end: today };
    case "30D": return { start: subtractDays(30),  end: today };
    case "90D": return { start: subtractDays(90),  end: today };
    case "1Y":  return { start: subtractDays(365), end: today };
    case "ALL": return {};
    default:    return {};
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

function formatFilterDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
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
  const [nearMisses, setNearMisses] = useState<RecentNearMiss[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // â”€â”€ date filter state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [preset, setPreset] = useState<Preset>("ALL");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const activeDates = preset === "CUSTOM"
    ? { start: customStart || undefined, end: customEnd || undefined }
    : presetDates(preset);

  function handlePreset(key: Preset) {
    setPreset(key);
    setShowCustom(key === "CUSTOM");
  }

  useEffect(() => {
    const { start, end } = activeDates;
    Promise.all([
        getDashboardStats(start, end),
        getIncidentsByCategory(start, end),
        getCapaActions(5, start, end),
        getOverdueCapa(4),
        getLeadingIndicators(start, end),
        getNearMissesRecent(4),
      ])
      .then(([s, cats, capas, overdue, lead, nm]) => {
        setStats(s as DashboardStats);
        setRiskBars(cats as IncidentByCategory[]);
        setCapaActions(capas as CapaAction[]);
        setOverdueCapa(overdue as OverdueCapaItem[]);
        setLeading(lead as LeadingIndicators);
        setNearMisses(nm as RecentNearMiss[]);
        setLastUpdated(new Date());
      })
      .catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, preset, customStart, customEnd]);

  const leadingKpis = leading ? [
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
      title: "TRIR / LTIFR",
      value: `${leading.trir} / ${leading.ltif}`,
      sub: "Leading Indicator",
      accent: "#FFFFFF",
      border: "#E5E7EB",
      inline: "",
      trendDown: false,
    },
    {
      title: "Near Miss Ratio",
      value: `${leading.near_miss_ratio ?? "0 : 1"}`,
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
  ] : [];

  const limitingKpis = leading ? [
    {
      title: "DART Rate",
      value: `${leading.dart_rate ?? 0}`,
      sub: "Limiting Indicator",
      accent: "#FFFFFF",
      border: "#E5E7EB",
      inline: "",
      trendDown: false,
    },
    {
      title: "LTIF",
      value: `${leading.ltisr ?? 0}`,
      sub: "Limiting Indicator",
      accent: "#FFFFFF",
      border: "#E5E7EB",
      inline: "",
      trendDown: false,
    },
    {
      title: "FAR",
      value: `${leading.far ?? 0}`,
      sub: "Limiting Indicator",
      accent: "#FFFFFF",
      border: "#E5E7EB",
      inline: "",
      trendDown: false,
    },
    {
      title: "Contractor Risk Score",
      value: leading.contractor_has_contractors === false
        ? "No Contractors"
        : `${leading.contractor_risk_label} / ${Number((leading.contractor_risk_score_10 ?? 0).toFixed(1)).toString()}/10`,
      sub: leading.contractor_has_contractors === false
        ? "No contractor workforce recorded"
        : (leading.contractor_risk_score_10 ?? 0) < 1 ? "⚠ Extreme Risk — Violations Present" : "Limiting Indicator",
      accent: leading.contractor_has_contractors !== false && (leading.contractor_risk_score_10 ?? 0) < 3 ? "#FFF1F2" : "#FFFFFF",
      border: leading.contractor_has_contractors !== false && (leading.contractor_risk_score_10 ?? 0) < 3 ? "#FCA5A5" : "#E5E7EB",
      inline: "",
      trendDown: false,
    },
  ] : [];

  const content = (
      <div className="w-full space-y-4">
        <div
          className="rounded-2xl border p-4 md:p-5"
          style={{ borderColor: '#CFDCF5', background: '#F8FBFF' }}
        >
          {/* Leading Indicators Row */}
          <div className="mb-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {leadingKpis.map((item) => (
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
                        {item.trendDown ? <ArrowDown className="inline-block h-3.5 w-3.5 align-middle mr-1" /> : <ArrowUp className="inline-block h-3.5 w-3.5 align-middle mr-1" />}
                        {item.inline}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-[13px]" style={{ color: '#6B7280' }}>{item.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="my-3 border-t" style={{ borderColor: '#DBEAFE' }} />

          {/* Limiting Indicators Row */}
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {limitingKpis.map((item) => (
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
                        {item.trendDown ? <ArrowDown className="inline-block h-3.5 w-3.5 align-middle mr-1" /> : <ArrowUp className="inline-block h-3.5 w-3.5 align-middle mr-1" />}
                        {item.inline}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-[13px]" style={{ color: '#6B7280' }}>{item.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border bg-white p-4 md:p-5" style={{ borderColor: '#D9E4F6', boxShadow: '0 8px 18px rgba(15, 23, 42, 0.08)' }}>
            <h2 className="mb-4 text-[clamp(1.15rem,2.3vw,1.5rem)]" style={{ color: '#111827', fontWeight: 700 }}>Top Incident Categories</h2>
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
                <Bar dataKey="data" name="Incidents" fill="#5E7992" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl border bg-white p-4 md:p-5" style={{ borderColor: '#D9E4F6', boxShadow: '0 8px 18px rgba(15, 23, 42, 0.08)' }}>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[clamp(1.15rem,2.3vw,1.5rem)]" style={{ color: '#111827', fontWeight: 700 }}>Safety Walk Compliance & Corrective Action Closure</h2>
                <p className="mt-1 text-[13px]" style={{ color: '#6B7280' }}>Diagram view of inspection quality, action closure, and target performance.</p>
              </div>
              <div className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest" style={{ background: '#EEF2FF', color: '#4A57B9' }}>
                Flow view
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.1fr_auto_1fr] lg:items-center">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-700">Avg. Safety Walk Compliance</span>
                  <span className="font-bold text-slate-900">{stats ? Math.round(stats.avg_compliance_rating * 20) : 0}%</span>
                </div>
                <div className="mt-3 h-3 rounded-full bg-slate-200">
                  <div className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" style={{ width: `${Math.max(stats ? Math.round(stats.avg_compliance_rating * 20) : 0, 4)}%` }} />
                </div>
                <div className="mt-3 text-[12px] text-slate-500">Inspection quality input</div>
              </div>

              <div className="hidden xl:flex flex-col items-center gap-2 px-2 text-slate-400">
                <div className="h-16 w-px bg-slate-300" />
                <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-widest">→</span>
                <div className="h-16 w-px bg-slate-300" />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-700">Corrective Action Closure</span>
                  <span className="font-bold text-slate-900">{stats ? Math.round(stats.capa_completion_rate) : 0}%</span>
                </div>
                <div className="mt-3 h-3 rounded-full bg-slate-200">
                  <div className="h-3 rounded-full bg-gradient-to-r from-emerald-500 to-blue-600" style={{ width: `${Math.max(stats ? Math.round(stats.capa_completion_rate) : 0, 4)}%` }} />
                </div>
                <div className="mt-3 flex items-center justify-between text-[12px] text-slate-500">
                  <span>Target 90%+</span>
                  <span className="font-semibold text-slate-700">ISO 45001 §10</span>
                </div>
              </div>
            </div>
        </div>
        </div>

        <div
          className="grid w-full min-w-0 max-w-none grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,0.75fr)_minmax(0,1fr)]"
          style={{ width: '100%', maxWidth: 'none' }}
        >
          <div className="flex min-w-0 w-full flex-col rounded-2xl border bg-white p-4 md:p-5" style={{ borderColor: '#D9E4F6', boxShadow: '0 8px 18px rgba(15, 23, 42, 0.08)' }}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-[clamp(1.15rem,2.3vw,1.5rem)]" style={{ color: '#111827', fontWeight: 700 }}>Ranked Action Table</h2>
              <span className="rounded-full bg-[#EEF2FF] px-2.5 py-1 text-[11px] font-bold text-[#4A57B9]">TOP {capaActions.length}</span>
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <table className="w-full table-fixed text-left">
                <colgroup><col className="w-[42%]" /><col className="w-[18%]" /><col className="w-[20%]" /><col className="w-[20%]" /></colgroup>
                <thead>
                  <tr className="border-b" style={{ borderColor: '#E5E7EB' }}>
                    {['Action', 'Priority', 'Due Date', 'Assignee'].map((heading) => <th key={heading} className="px-2 py-2 first:pl-0 text-[12px] uppercase tracking-wide" style={{ color: '#64748B', fontWeight: 700 }}>{heading}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {capaActions.map((row) => {
                    const assignee = row.assignee || 'Unassigned';
                    const initials = assignee.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
                    const incidentRef = row.incident_id ? `INC-${String(row.incident_id).padStart(5, '0')}` : null;
                    // Seed/legacy descriptions embed a made-up "INC00018"-style
                    // reference that has no relation to the real incident_id —
                    // strip it so it can't be mistaken for the incidentRef badge above.
                    const label = (row.description || row.action_type || 'Corrective Action')
                      .replace(/\s*\b(for|addressing)\s+INC-?\d+\b\.?/gi, '')
                      .trim() || row.action_type || 'Corrective Action';
                    return <tr key={row.id} className="border-b last:border-b-0" style={{ borderColor: '#F1F5F9' }}>
                      <td className="max-w-0 break-words px-2 py-3 first:pl-0 text-[13px]" style={{ color: '#111827' }}>
                        {incidentRef && (
                          <button
                            onClick={() => navigate(`/violations/${incidentRef}`)}
                            className="mb-0.5 block text-[11px] font-bold hover:underline"
                            style={{ color: '#4A57B9' }}
                          >
                            {incidentRef}
                          </button>
                        )}
                        <span className="block break-words" title={label}>{label}</span>
                      </td>
                      <td className="px-2 py-3 text-[13px]"><span className="inline-flex rounded-full px-2 py-1 text-[11px] font-bold" style={{ background: row.priority === 'High' ? '#FFF1F2' : '#FFF7ED', color: row.priority === 'High' ? '#BE123C' : '#C2410C' }}>{row.priority}</span></td>
                      <td className="px-2 py-3 text-[13px] whitespace-nowrap" style={{ color: '#374151' }}>{formatDueDate(row.due_date)}</td>
                      <td className="break-words px-2 py-3 text-[13px]" style={{ color: '#374151' }}><span className="flex items-center gap-2"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E9EDFF] text-[10px] font-bold text-[#4A57B9]">{initials}</span><span className="break-words">{assignee}</span></span></td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
            <button onClick={() => navigate('/capa-actions')} className="mt-4 inline-flex w-full items-center justify-center gap-1 rounded-xl border border-[#D8E1F5] px-4 py-2.5 text-[13px] font-semibold text-[#4A57B9] hover:bg-[#F5F7FF]">View All Actions <ChevronRight className="h-4 w-4" /></button>
          </div>

          <div className="flex min-w-0 w-full flex-col rounded-2xl border bg-white p-4 md:p-5" style={{ borderColor: '#D9E4F6', boxShadow: '0 8px 18px rgba(15, 23, 42, 0.08)' }}>
            <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-[clamp(1.15rem,2.3vw,1.5rem)]" style={{ color: '#111827', fontWeight: 700 }}>Overdue CAPA</h2><AlertTriangle className="h-5 w-5 text-[#D97706]" /></div>
            <div className="flex-1 space-y-1">
              {overdueCapa.map((item) => {
                const incidentRef = item.incident_id ? `INC-${String(item.incident_id).padStart(5, '0')}` : null;
                return <div
                  key={item.id}
                  className={`flex gap-3 border-b border-[#F1F5F9] py-3 last:border-b-0 ${incidentRef ? 'cursor-pointer hover:bg-[#FFFBF5]' : ''}`}
                  onClick={incidentRef ? () => navigate(`/violations/${incidentRef}`) : undefined}
                >
                  <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[#64748B]" />
                  <div className="min-w-0 text-[14px] leading-5" style={{ color: '#374151' }}>
                    <div>{incidentRef || `Incident #${item.incident_id}`} <span className="text-[#94A3B8]">•</span> {item.action_type || 'Corrective'}</div>
                    <div className="font-bold text-[#C2410C]">{item.days_overdue} days overdue</div>
                  </div>
                </div>;
              })}
            </div>
            <button onClick={() => navigate('/capa-actions?overdue=1')} className="mt-4 inline-flex w-full items-center justify-center gap-1 rounded-xl border border-[#F4D6B0] bg-[#FFF9F2] px-4 py-2.5 text-[13px] font-semibold text-[#B45309] hover:bg-[#FFF3E1]">View All Overdue CAPA <ChevronRight className="h-4 w-4" /></button>
          </div>

          <div className="flex min-w-0 w-full flex-col rounded-2xl border bg-white p-4 md:p-5" style={{ borderColor: '#D9E4F6', boxShadow: '0 8px 18px rgba(15, 23, 42, 0.08)' }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[clamp(1.15rem,2.3vw,1.5rem)]" style={{ color: '#111827', fontWeight: 700 }}>Near Miss Reporting</h2>
                <p className="mt-1 text-[13px] leading-5" style={{ color: '#6B7280' }}>Reports from the field, newest first — including those raised on the mobile app.</p>
              </div>
              {/* The count the API has always returned and nothing rendered. */}
              <div className="shrink-0 text-right">
                <div className="text-[26px] leading-none tabular-nums" style={{ color: '#4A57B9', fontWeight: 800 }}>
                  {stats?.near_misses_count ?? 0}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">Total</div>
              </div>
            </div>

            {/* Latest reports, straight off /dashboard/near-misses-recent. That
                endpoint and its service function both already existed; no
                component had ever called them, so the panel showed three lines
                of static copy while real reports piled up behind it. */}
            <div className="mt-4 flex-1 rounded-2xl border bg-[#F8FBFF] p-4" style={{ borderColor: '#E3EAF8' }}>
              <div className="text-[11px] font-bold uppercase tracking-widest text-[#4A57B9]">Latest reports</div>
              {nearMisses.length === 0 ? (
                <p className="mt-3 text-[13px]" style={{ color: '#9CA3AF' }}>No near misses reported yet.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {nearMisses.map((nm) => (
                    <button
                      key={nm.id}
                      type="button"
                      onClick={() => navigate('/near-miss/tracking')}
                      className="block w-full text-left"
                    >
                      <div className="flex items-baseline gap-2">
                        <span className="text-[11px] tabular-nums" style={{ color: '#4A57B9', fontWeight: 700 }}>
                          NEA-{nm.id}
                        </span>
                        <span className="truncate text-[13px]" style={{ color: '#374151' }}>
                          {nm.description || 'No description'}
                        </span>
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-x-2 text-[11px]" style={{ color: '#6B7280' }}>
                        <span>{nm.location}</span>
                        <span>· {nm.reporter}</span>
                        {nm.event_date_time && (
                          <span>· {new Date(nm.event_date_time).toLocaleDateString()}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => navigate('/near-miss')} className="mt-4 inline-flex w-full items-center justify-center rounded-xl px-6 py-3 text-[14px] text-white transition-transform duration-150 hover:scale-[1.01]" style={{ background: 'linear-gradient(135deg, #5565C1 0%, #6E7BDB 100%)', boxShadow: '0 8px 18px rgba(81, 96, 186, 0.28)', fontWeight: 600 }}>Open Near Miss Reporting</button>
          </div>
        </div>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border px-5 py-4" style={{ borderColor: '#DCE4F3', background: '#FFFFFF' }}>
        {/* top row — welcome + updated */}
        <div className="flex items-center justify-between">
          <div>
            <h1>Welcome, {firstName}</h1>
            <p className="text-[14px] mt-1" style={{ color: '#64748B' }}>Focus on leading indicators and high-priority actions first.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[13px]" style={{ color: '#94A3B8' }}>
              {lastUpdated
                ? `Updated: ${lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                : 'Loading…'}
            </span>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#5B6DE8' }} />
          </div>
        </div>

        {/* date filter row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-semibold" style={{ color: '#475569' }}>Period:</span>
          {PRESETS.map(({ label, key }) => (
            <button
              key={key}
              onClick={() => handlePreset(key)}
              className="rounded-full px-3 py-1 text-[13px] font-semibold transition-all duration-150"
              style={{
                background: preset === key ? '#5565C1' : '#F1F5F9',
                color: preset === key ? '#FFFFFF' : '#475569',
                border: preset === key ? '1.5px solid #5565C1' : '1.5px solid #E2E8F0',
              }}
            >
              {label}
            </button>
          ))}

          {/* active date range label */}
          {preset !== "CUSTOM" && preset !== "ALL" && activeDates.start && (
            <span className="text-[12px] ml-1" style={{ color: '#94A3B8' }}>
              {formatFilterDate(activeDates.start)} → {activeDates.end ? formatFilterDate(activeDates.end) : ''}
            </span>
          )}
          {preset === "ALL" && (
            <span className="text-[12px] ml-1" style={{ color: '#94A3B8' }}>All time</span>
          )}
        </div>

        {/* custom date pickers */}
        {showCustom && (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="flex items-center gap-2">
              <label className="text-[13px] font-semibold" style={{ color: '#475569' }}>From</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="rounded-lg border px-3 py-1.5 text-[13px] outline-none focus:ring-2"
                style={{ borderColor: '#CBD5E1', color: '#1F2937', background: '#F8FAFC' }}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[13px] font-semibold" style={{ color: '#475569' }}>To</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="rounded-lg border px-3 py-1.5 text-[13px] outline-none focus:ring-2"
                style={{ borderColor: '#CBD5E1', color: '#1F2937', background: '#F8FAFC' }}
              />
            </div>
            {customStart && customEnd && (
              <span className="text-[12px]" style={{ color: '#94A3B8' }}>
                {formatFilterDate(customStart)} → {formatFilterDate(customEnd)}
              </span>
            )}
          </div>
        )}
      </div>

      {content}
    </div>
  );
}
