import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { Activity, AlertTriangle, Clock3, HeartPulse, PieChart as PieChartIcon, ShieldAlert, Users, type LucideIcon } from "lucide-react";
import { BarChart, Bar, Cell, CartesianGrid, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getViolationsSummary, type ViolationItem, type RcaItem, type SeverityMixItem } from "../../services/analytics.service";

// Static panels — no backend model for these
const injuryCategoryData = [
  { label: "Hand/Finger", value: 5 },
  { label: "Multiple", value: 3 },
  { label: "Shoulder", value: 2 },
  { label: "Face", value: 2 },
  { label: "Elbow", value: 2 },
  { label: "Back", value: 2 },
  { label: "Foot", value: 2 },
];

const personInvolvedData = [
  { label: "Green Hand(s)", value: 6 },
  { label: "Contractor(s)", value: 2 },
  { label: "Agency Worker(s)", value: 1 },
  { label: "Own Worker(s)", value: 1 },
];

const injuryTypeData = [
  { label: "Cut Wound", value: 3 },
  { label: "Bruises", value: 3 },
  { label: "Open Eye Injury", value: 3 },
  { label: "Sprain and Strain", value: 1 },
  { label: "Stap Wound", value: 1 },
  { label: "Open Crack Wound", value: 1 },
  { label: "Dislocation", value: 1 },
];

const learnings = [
  "Matteven a princralitate key learnings",
  "Dicsusmte mthabs about key learnings",
  "Inevine suppriatts to kelp learnings",
  "Anale in slue meet eilment key learnings.",
];

function CardHeader({ icon: Icon, title }: Readonly<{ icon: LucideIcon; title: string }>) {
  return (
    <div className="mb-2 flex items-center gap-2" style={{ color: '#1F2937' }}>
      <Icon className="h-4 w-4" style={{ color: '#4A57B9' }} />
      <span className="text-[12px] tracking-[0.6px] uppercase" style={{ fontWeight: 700 }}>{title}</span>
    </div>
  );
}

function HorizontalBars({ data }: Readonly<{ data: { label: string; value: number }[] }>) {
  const max = Math.max(...data.map((item) => item.value));
  return (
    <div className="space-y-2">
      {data.map((item) => (
        <div key={item.label} className="grid grid-cols-[1fr_auto] items-center gap-2">
          <div className="h-4 rounded-full bg-slate-100">
            <div
              className="h-4 rounded-full bg-gradient-to-r from-[#4A57B9] to-[#6F80E8]"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
          <span className="text-[12px]" style={{ minWidth: 20, textAlign: 'right', color: '#475569' }}>{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function DarkPanel({ title, icon, children, className = "" }: Readonly<{ title: string; icon: LucideIcon; children: ReactNode; className?: string }>) {
  return (
    <div
      className={`rounded-md border bg-white p-3 shadow-[0_6px_14px_rgba(15,23,42,0.08)] ${className}`}
      style={{ borderColor: '#DDE5F4' }}
    >
      <CardHeader icon={icon} title={title} />
      {children}
    </div>
  );
}

export function ViolationsPage() {
  const navigate = useNavigate();

  const [incidentTypeData, setIncidentTypeData] = useState<ViolationItem[]>([]);
  const [causeData, setCauseData] = useState<RcaItem[]>([]);
  const [locationData, setLocationData] = useState<ViolationItem[]>([]);
  const [incidentTrend, setIncidentTrend] = useState<{ month: string; value: number }[]>([]);
  const [downtimeData, setDowntimeData] = useState<ViolationItem[]>([]);
  const [monthlyNearMiss, setMonthlyNearMiss] = useState<{ month: string; value: number }[]>([]);
  const [severityMix, setSeverityMix] = useState<SeverityMixItem[]>([]);
  const [rcaData, setRcaData] = useState<RcaItem[]>([]);
  const [actionItems, setActionItems] = useState<string[]>([]);

  useEffect(() => {
    getViolationsSummary(10).then((data) => {
      setIncidentTypeData(data.by_type);
      setCauseData(data.cause_data);
      setLocationData(data.by_location);
      setIncidentTrend(data.monthly_trend);
      setDowntimeData(data.downtime_by_type);
      setMonthlyNearMiss(data.near_miss_monthly);
      setSeverityMix(data.severity_mix);
      setRcaData(data.by_root_cause);
      setActionItems(data.open_capa_items);
    }).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1>Welcome , User</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_240px]">
        <div className="rounded-2xl border bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: '#E5E7EB' }}>
          <div className="mb-3 text-[clamp(1rem,1.6vw,1.125rem)]" style={{ color: '#111827', fontWeight: 700 }}>Incidents</div>

          <div className="grid grid-cols-1 gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <DarkPanel title="Incident Types" icon={AlertTriangle}>
                <HorizontalBars data={incidentTypeData} />
              </DarkPanel>
              <DarkPanel title="Injury Category" icon={Users}>
                <HorizontalBars data={injuryCategoryData} />
              </DarkPanel>
              <DarkPanel title="Incident Cause Category" icon={PieChartIcon}>
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={132}>
                    <PieChart>
                      <Pie data={causeData} dataKey="value" nameKey="name" innerRadius={35} outerRadius={52} paddingAngle={2}>
                        {causeData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </DarkPanel>
              <DarkPanel title="Person Involved" icon={Users}>
                <HorizontalBars data={personInvolvedData} />
              </DarkPanel>
              <DarkPanel title="Incident Location" icon={ShieldAlert}>
                <HorizontalBars data={locationData} />
              </DarkPanel>
              <DarkPanel title="Type of Injury" icon={HeartPulse}>
                <HorizontalBars data={injuryTypeData} />
              </DarkPanel>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="rounded-md bg-white p-3 shadow-[0_6px_14px_rgba(15,23,42,0.08)]" style={{ border: '1px solid #DDE5F4' }}>
              <CardHeader icon={Activity} title="Incident Trend" />
              <ResponsiveContainer width="100%" height={145}>
                <LineChart data={incidentTrend}>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#4A57B9" strokeWidth={2.5} dot={{ r: 2.5, fill: '#6F80E8' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-md bg-white p-3 shadow-[0_6px_14px_rgba(15,23,42,0.08)]" style={{ border: '1px solid #DDE5F4' }}>
              <CardHeader icon={Clock3} title="Downtime" />
              <ResponsiveContainer width="100%" height={145}>
                <BarChart data={downtimeData}>
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} interval={0} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {downtimeData.map((entry, index) => (
                      <Cell key={entry.label || index} fill={index % 2 === 0 ? '#4A57B9' : '#6F80E8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: '#DDE5F4' }}>
            <div className="mb-2 text-[clamp(1rem,1.6vw,1.125rem)]" style={{ color: '#111827', fontWeight: 700 }}>Near Miss Trend</div>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={monthlyNearMiss}>
                <CartesianGrid stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#4A57B9" strokeWidth={3} dot={{ r: 3, fill: '#6F80E8' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: '#DDE5F4' }}>
            <div className="mb-2 text-[clamp(1rem,1.6vw,1.125rem)]" style={{ color: '#111827', fontWeight: 700 }}>Incident Severity Mix</div>
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={severityMix}>
                <CartesianGrid stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="low" stackId="a" fill="#6F80E8" />
                <Bar dataKey="medium" stackId="a" fill="#4A57B9" />
                <Bar dataKey="high" stackId="a" fill="#38BDF8" />
                <Bar dataKey="critical" stackId="a" fill="#0F766E" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: '#DDE5F4' }}>
            <div className="mb-2 text-[clamp(1rem,1.6vw,1.125rem)]" style={{ color: '#111827', fontWeight: 700 }}>RCA Breakdown</div>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="56%" height={150}>
                <PieChart>
                  <Pie data={rcaData} dataKey="value" nameKey="name" outerRadius={56} innerRadius={0}>
                    {rcaData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 text-[13px]" style={{ color: '#374151' }}>
                {rcaData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: entry.color }} />
                    <span>{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.9fr]">
        <div className="rounded-2xl bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ border: '1px solid #DDE5F4' }}>
          <div className="mb-3 text-[clamp(1rem,1.6vw,1.125rem)]" style={{ color: '#111827', fontWeight: 700 }}>Key Learnings</div>
          <ul className="space-y-2 text-[14px]" style={{ color: '#4B5563' }}>
            {learnings.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ border: '1px solid #DDE5F4' }}>
          <div className="mb-3 text-[clamp(1rem,1.6vw,1.125rem)]" style={{ color: '#111827', fontWeight: 700 }}>Open Actions</div>
          <div className="space-y-2 text-[14px]" style={{ color: '#374151' }}>
            {actionItems.map((item, index) => (
              <label key={item} className="flex items-center gap-2">
                <input type="checkbox" defaultChecked={index === 0} className="h-4 w-4 rounded accent-[#4A57B9]" />
                <span className="flex-1">{item}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => navigate('/near-miss')}
          className="rounded-full px-6 py-3 text-[16px] md:text-[17px] text-white shadow-[0_8px_18px_rgba(81,96,186,0.34)] transition-transform hover:scale-[1.02]"
          style={{ background: 'linear-gradient(135deg, rgb(74, 87, 185) 0%, rgb(111, 128, 232) 100%)', fontWeight: 600 }}
        >
          Near Miss Reporting
        </button>
      </div>
    </div>
  );
}
