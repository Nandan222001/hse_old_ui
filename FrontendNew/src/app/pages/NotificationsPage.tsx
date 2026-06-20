import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import { Eye, Footprints, BriefcaseBusiness, Users, Trophy, Medal, type LucideIcon } from "lucide-react";
import { useNavigate } from "react-router";
import { getEngagementSummary } from "../../services/analytics.service";
import { useAuth } from "../context/AuthContext";

function ScoreRing({
  value,
  icon: Icon,
  accent,
  track,
}: {
  value: number;
  icon: LucideIcon;
  accent: string;
  track: string;
}) {
  return (
    <div className="flex flex-col items-center justify-start">
      <div
        className="relative flex h-[126px] w-[126px] items-center justify-center rounded-full"
        style={{ background: `conic-gradient(${accent} 0deg ${value * 3.6}deg, ${track} ${value * 3.6}deg 360deg)` }}
      >
        <div className="absolute inset-[10px] rounded-full bg-white" />
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <Icon className="h-7 w-7" style={{ color: accent }} />
        </div>
      </div>
      <div className="mt-3 max-w-[140px] text-center text-[15px] leading-[1.2]" style={{ color: '#1F2937', fontWeight: 600 }}>
        {value}%
      </div>
    </div>
  );
}

function StatusPill({ label }: { label: string }) {
  const styles: Record<string, CSSProperties> = {
    "Due Today":    { background: '#F7E6B6', color: '#B7791F' },
    "Due Tomorrow": { background: '#FCE7C5', color: '#C05621' },
    Overdue:        { background: '#FAD7D7', color: '#C53030' },
  };

  const style: CSSProperties = styles[label] ?? { background: '#E5E7EB', color: '#374151' };

  return (
    <span className="rounded-full px-2.5 py-1 text-[11px]" style={{ ...style, fontWeight: 700 }}>
      {label}
    </span>
  );
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [loading, setLoading]                       = useState(true);
  const [reportingRate, setReportingRate]           = useState(0);
  const [reportingRateMom, setReportingRateMom]     = useState(0);
  const [surveyScore, setSurveyScore]               = useState(0);
  const [surveyScorePct, setSurveyScorePct]         = useState(0);
  const [safetyObsPct, setSafetyObsPct]             = useState(0);
  const [safetyWalksPct, setSafetyWalksPct]         = useState(0);
  const [toolboxPct, setToolboxPct]                 = useState(0);
  const [siteParticipationPct, setSiteParticipationPct] = useState(0);
  const [topRecognitions, setTopRecognitions]       = useState<{ name: string }[]>([]);
  const [openActions, setOpenActions]               = useState<{ text: string; status: string }[]>([]);

  useEffect(() => {
    setLoading(true);
    getEngagementSummary().then((d) => {
      setReportingRate(d.reporting_rate);
      setReportingRateMom(d.reporting_rate_mom);
      setSurveyScore(d.survey_score);
      setSurveyScorePct(d.survey_score_pct);
      setSafetyObsPct(d.safety_observations_pct);
      setSafetyWalksPct(d.safety_walks_pct);
      setToolboxPct(d.toolbox_attendance_pct);
      setSiteParticipationPct(d.site_participation_pct);
      setTopRecognitions(d.top_recognitions);
      setOpenActions(d.open_actions);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const ringCards = [
    { title: "Safety Observations", value: safetyObsPct,       icon: Eye,               accent: "#12C0B6", track: "#D8F5F3" },
    { title: "Safety Walks",        value: safetyWalksPct,     icon: Footprints,        accent: "#67AEEA", track: "#DDEEFF" },
    { title: "Toolbox Attendance",  value: toolboxPct,         icon: BriefcaseBusiness, accent: "#12C0B6", track: "#D8F5F3" },
    { title: "Site Participation",  value: siteParticipationPct, icon: Users,           accent: "#67AEEA", track: "#DDEEFF" },
  ];

  const recognitionIcons = [Medal, Trophy, Medal];
  const recognitionColors = ["#12B8A6", "#D4A21E", "#D29A2B"];

  if (loading) {
    return (
      <div className="space-y-6">
        <div><h1>Welcome, {currentUser?.name || currentUser?.email || "User"}</h1></div>
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#12C0B6] border-t-transparent rounded-full animate-spin" />
            <span className="text-[14px]" style={{ color: '#6B7280' }}>Loading engagement data…</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1>Welcome, {currentUser?.name || currentUser?.email || "User"}</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border bg-white p-0 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: '#28C6D6' }}>
          <div className="rounded-t-2xl bg-slate-800 px-4 py-2 text-[14px] text-white" style={{ fontWeight: 600 }}>
            Reporting Rate
          </div>
          <div className="p-5">
            <div className="flex items-end gap-3">
              <div className="text-[54px] leading-none" style={{ color: '#111827', fontWeight: 700 }}>{reportingRate}%</div>
              <div className="pb-2 text-[18px]" style={{ color: '#12B8A6', fontWeight: 700 }}>
                {reportingRateMom >= 0 ? "↑" : "↓"}
              </div>
            </div>
            <div className="mt-2 text-[15px]" style={{ color: '#4B5563' }}>
              {reportingRateMom >= 0 ? "↑" : "↓"} {Math.abs(reportingRateMom)} report{Math.abs(reportingRateMom) !== 1 ? "s" : ""} vs last month
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-0 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: '#E5E7EB' }}>
          <div className="rounded-t-2xl bg-slate-800 px-4 py-2 text-[14px] text-white" style={{ fontWeight: 600 }}>
            Engagement Survey Score
          </div>
          <div className="p-5">
            <div className="flex items-end gap-3">
              <div className="text-[54px] leading-none" style={{ color: '#111827', fontWeight: 700 }}>{surveyScore.toFixed(1)}/5</div>
              <div className="pb-2 text-[18px]" style={{ color: '#12B8A6', fontWeight: 700 }}>↑</div>
              <div className="pb-2 text-[14px]" style={{ color: '#6B7280' }}>avg compliance rating</div>
            </div>
            <div className="mt-4 h-3 w-full rounded-full bg-slate-200">
              <div
                className="h-full rounded-full"
                style={{ width: `${surveyScorePct}%`, background: 'linear-gradient(90deg, #16C6B7 0%, #19B7C3 100%)' }}
              />
            </div>
            <div className="mt-2 text-right text-[13px]" style={{ color: '#111827', fontWeight: 600 }}>{surveyScorePct}%</div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: '#C76AB4' }}>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {ringCards.map((item) => (
            <div key={item.title} className="flex justify-center">
              <ScoreRing value={item.value} icon={item.icon} accent={item.accent} track={item.track} />
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-8 md:grid-cols-4">
          {ringCards.map((item) => (
            <div key={`${item.title}-label`} className="text-center">
              <div className="text-[15px]" style={{ color: '#1F2937', fontWeight: 600 }}>{item.title}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: '#2BC5D4' }}>
          <div className="mb-3 text-[18px]" style={{ color: '#1F2937', fontWeight: 700 }}>Top Recognitions</div>
          <div className="text-[13px]" style={{ color: '#6B7280' }}>Recognizing safety champions for proactive behavior.</div>
          {topRecognitions.length === 0 ? (
            <p className="mt-4 text-[13px]" style={{ color: '#9CA3AF' }}>No recognition data yet</p>
          ) : (
            <div className="mt-6 flex items-end gap-4">
              {topRecognitions.map((person, i) => {
                const Icon = recognitionIcons[i % recognitionIcons.length];
                const color = recognitionColors[i % recognitionColors.length];
                return (
                  <div key={person.name} className="flex flex-1 flex-col items-center">
                    <div className="relative h-20 w-20 rounded-full bg-slate-200">
                      <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                        <Users className="h-10 w-10" />
                      </div>
                      <div className="absolute -right-1 bottom-0 rounded-full p-1.5" style={{ background: color }}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="mt-3 text-center text-[14px]" style={{ color: '#111827', fontWeight: 700 }}>{person.name}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: '#C76AB4' }}>
          <div className="mb-3 text-[18px]" style={{ color: '#1F2937', fontWeight: 700 }}>Open Actions</div>
          {openActions.length === 0 ? (
            <p className="text-[13px]" style={{ color: '#9CA3AF' }}>No open CAPA actions</p>
          ) : (
            <div className="space-y-4">
              {openActions.map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <div className="h-4 w-4 rounded-[3px] border border-slate-400" />
                  <div className="flex-1 text-[14px]" style={{ color: '#1F2937' }}>{item.text}</div>
                  <StatusPill label={item.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => navigate('/near-miss')}
          className="rounded-full px-6 py-3 text-[18px] text-white shadow-[0_8px_18px_rgba(81,96,186,0.34)] transition-transform hover:scale-[1.02]"
          style={{ background: 'linear-gradient(135deg, #606AB9 0%, #7A80D1 100%)', fontWeight: 600 }}
        >
          Near Miss Reporting
        </button>
      </div>
    </div>
  );
}
