import { useState } from "react";
import type { CSSProperties } from "react";
import { Eye, Footprints, BriefcaseBusiness, Users, Trophy, Medal, type LucideIcon } from "lucide-react";
import { useNavigate } from "react-router";

const recognitionData = [
  { name: "Alex R.", icon: Medal, color: "#12B8A6" },
  { name: "Maria S.", icon: Trophy, color: "#D4A21E" },
  { name: "David K.", icon: Medal, color: "#D29A2B" },
];

const actionItems = [
  { text: "Complete monthly safety training", status: "Due Today" },
  { text: "Review updated site protocol", status: "Due Tomorrow" },
  { text: "Submit toolbox talk feedback", status: "Overdue" },
];

const ringCards = [
  { title: "Safety Observations", value: 85, icon: Eye, accent: "#12C0B6", track: "#D8F5F3" },
  { title: "Safety Walks", value: 60, icon: Footprints, accent: "#67AEEA", track: "#DDEEFF" },
  { title: "Toolbox Attendance", value: 95, icon: BriefcaseBusiness, accent: "#12C0B6", track: "#D8F5F3" },
  { title: "Site Participation", value: 70, icon: Users, accent: "#67AEEA", track: "#DDEEFF" },
];

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
    "Due Today": { background: '#F7E6B6', color: '#B7791F' },
    "Due Tomorrow": { background: '#FCE7C5', color: '#C05621' },
    Overdue: { background: '#FAD7D7', color: '#C53030' },
  };

  return (
    <span className="rounded-full px-2.5 py-1 text-[11px]" style={{ ...styles[label], fontWeight: 700 }}>
      {label}
    </span>
  );
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const [reportingRate] = useState(92);
  const [surveyScore] = useState(4.8);

  return (
    <div className="space-y-6">
      <div>
        <h1>Welcome , User</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border bg-white p-0 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: '#28C6D6' }}>
          <div className="rounded-t-2xl bg-slate-800 px-4 py-2 text-[14px] text-white" style={{ fontWeight: 600 }}>
            Reporting Rate
          </div>
          <div className="p-5">
            <div className="flex items-end gap-3">
              <div className="text-[54px] leading-none" style={{ color: '#111827', fontWeight: 700 }}>{reportingRate}%</div>
              <div className="pb-2 text-[18px]" style={{ color: '#12B8A6', fontWeight: 700 }}>↑</div>
            </div>
            <div className="mt-2 text-[15px]" style={{ color: '#4B5563' }}>↑ 5% since last month</div>
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
              <div className="pb-2 text-[14px]" style={{ color: '#6B7280' }}>0.3 points YoM</div>
            </div>
            <div className="mt-4 h-3 w-full rounded-full bg-slate-200">
              <div className="h-full rounded-full" style={{ width: '96%', background: 'linear-gradient(90deg, #16C6B7 0%, #19B7C3 100%)' }} />
            </div>
            <div className="mt-2 text-right text-[13px]" style={{ color: '#111827', fontWeight: 600 }}>96%</div>
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
          <div className="mt-6 flex items-end gap-4">
            {recognitionData.map((person) => {
              const Icon = person.icon;
              return (
                <div key={person.name} className="flex flex-1 flex-col items-center">
                  <div className="relative h-20 w-20 rounded-full bg-slate-200">
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                      <Users className="h-10 w-10" />
                    </div>
                    <div className="absolute -right-1 bottom-0 rounded-full p-1.5" style={{ background: person.color }}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="mt-3 text-[14px]" style={{ color: '#111827', fontWeight: 700 }}>{person.name}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-[0_6px_16px_rgba(15,23,42,0.08)]" style={{ borderColor: '#C76AB4' }}>
          <div className="mb-3 text-[18px]" style={{ color: '#1F2937', fontWeight: 700 }}>Open Actions</div>
          <div className="space-y-4">
            {actionItems.map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-[3px] border border-slate-400" />
                <div className="flex-1 text-[14px]" style={{ color: '#1F2937' }}>{item.text}</div>
                <StatusPill label={item.status} />
              </div>
            ))}
          </div>
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
