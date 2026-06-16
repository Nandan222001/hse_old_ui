import { useState, useEffect } from "react";
import { RoleBadge } from "../components/shared/StatusBadge";
import {
  Plus, Search, X, Edit, KeyRound, Ban, Clock, Mail, Phone, Bell,
  ShieldCheck, ChevronDown, CheckCircle2, XCircle, Users as UsersIcon, Trash2, Database, ArrowUpRight, AlertTriangle,
} from "lucide-react";
import { collection, getDocs, doc, updateDoc, query, orderBy, addDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../context/AuthContext";
import { useSearchParams } from "react-router";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getUsers, getPeopleOverview, getEmployeeDirectory, type User as ApiUser, type PeopleOverview, type EmployeeDirectoryRow } from "../../services/personnel.service";
import { fetchRequestStatusByEmail, savePostApprovalSetup, deletePostApprovalFile, type RequestStatusResponse } from "../../services/onboarding.service";
import { fetchOrgAccessRequests, reviewOrgAccessRequest, type OrgAccessRequestItem } from "../../services/auth.service";

interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole | null;
  approved: boolean;
  createdAt?: { toDate?: () => Date };
}

const ROLES: UserRole[] = [
  "Admin", "HSE Manager", "Safety Manager", "Supervisor", "Auditor",
  "Site Inspector", "Site Engineer", "Worker", "Contractor",
];

const ONBOARDING_USER_ROLE_OPTIONS = ["Admin", "Site Engineer", "Site Inspector", "Worker/Contractor"] as const;

// Per-user activity log has no real backing data (no link between Firebase
// admin accounts and the employees table), so it intentionally stays empty.
const activityLog: { action: string; time: string }[] = [];

function toneChipStyles(tone: "green" | "amber" | "red" | "blue") {
  if (tone === "green") {
    return { background: "#E8F5E9", color: "#1B5E20", border: "#C8E6C9" };
  }
  if (tone === "amber") {
    return { background: "#FFF3D9", color: "#9A6700", border: "#F7D77B" };
  }
  if (tone === "red") {
    return { background: "#FEECEC", color: "#B42318", border: "#FECACA" };
  }
  return { background: "#EEF4FF", color: "#3957C5", border: "#C7D7FE" };
}

function ToneChip({ tone, children }: { tone: "green" | "amber" | "red" | "blue"; children: string }) {
  const styles = toneChipStyles(tone);
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ background: styles.background, color: styles.color, border: `1px solid ${styles.border}` }}
    >
      {children}
    </span>
  );
}

function MiniSparkline({ data, stroke }: { data: readonly number[]; stroke: string }) {
  const chartData = data.map((value, index) => ({ index, value }));

  return (
    <ResponsiveContainer width="100%" height={64}>
      <LineChart data={chartData}>
        <Line type="monotone" dataKey="value" stroke={stroke} strokeWidth={3} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function GaugeDial({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(value, 100));
  const needleRotation = -85 + (clamped / 100) * 170;

  return (
    <div className="relative h-[86px] w-[132px] overflow-hidden">
      <div
        className="absolute left-1/2 top-0 h-[132px] w-[132px] -translate-x-1/2 rounded-full"
        style={{ background: "conic-gradient(from 180deg, #D9534F 0deg 34deg, #F3C34C 34deg 92deg, #67BC6B 92deg 180deg, #E5E7EB 180deg 360deg)" }}
      />
      <div className="absolute left-1/2 top-[15px] h-[101px] w-[101px] -translate-x-1/2 rounded-full bg-white" />
      {/* <div
        className="absolute left-1/2 top-[47px] h-[2px] w-[36px] origin-left -translate-x-1/2 rounded-full"
        style={{ transform: `translateX(-50%) rotate(${needleRotation}deg)`, background: "#1F2937" }}
      /> */}
      <div className="absolute left-1/2 top-[42px] -translate-x-1/2 text-[18px] font-semibold" style={{ color: "#111827" }}>
        {clamped}%
      </div>
    </div>
  );
}

function RingStat({ value, color }: { value: number; color: string }) {
  const clamped = Math.max(0, Math.min(value, 100));

  return (
    <div className="relative h-[74px] w-[74px]">
      <div
        className="absolute inset-0 rounded-full"
        style={{ background: `conic-gradient(${color} 0deg ${clamped * 3.6}deg, #E5E7EB ${clamped * 3.6}deg 360deg)` }}
      />
      <div className="absolute inset-[9px] rounded-full bg-white" />
      <div className="absolute inset-0 flex items-center justify-center text-[18px] font-semibold" style={{ color: "#111827" }}>
        {clamped}%
      </div>
    </div>
  );
}

function PeopleDashboardSection({ currentUserName, overview }: { currentUserName?: string; overview: PeopleOverview | null }) {
  const peopleKpis = overview
    ? ([
        {
          title: "Competency Coverage %",
          value: `${overview.competency_coverage.value}%`,
          subtitle: overview.competency_coverage.subtitle,
          change: overview.competency_coverage.change,
          tone: overview.competency_coverage.tone,
          visual: "spark",
          sparkline: overview.competency_coverage.sparkline ?? [],
        },
        {
          title: "Worker Exposure Index",
          value: `${overview.worker_exposure_index.value}%`,
          subtitle: overview.worker_exposure_index.subtitle,
          change: overview.worker_exposure_index.change,
          tone: overview.worker_exposure_index.tone,
          visual: "gauge",
        },
        {
          title: "Supervisor Safety Score",
          value: `${overview.supervisor_safety_score.value}%`,
          subtitle: overview.supervisor_safety_score.subtitle,
          change: overview.supervisor_safety_score.change,
          tone: overview.supervisor_safety_score.tone,
          visual: "ring",
        },
      ] as const)
    : ([] as const);
  const fatigueTrend = overview?.fatigue_trend ?? [];
  const toolboxTrend = overview?.toolbox_trend ?? [];
  const highRiskRoles = overview?.high_risk_roles ?? [];
  const trainingExpiry = overview?.training_expiry ?? [];
  const behaviourBreakdown = overview?.behaviour_breakdown ?? [];
  const coachingActions = overview?.coaching_actions ?? [];
  const openActions = overview?.open_actions ?? [];
  const expiringSoonCount = overview?.expiring_soon_count ?? 0;
  const toolboxMoM = toolboxTrend.length >= 2
    ? Math.round(((toolboxTrend[toolboxTrend.length - 1].meetings - toolboxTrend[toolboxTrend.length - 2].meetings) / (toolboxTrend[toolboxTrend.length - 2].meetings || 1)) * 100)
    : null;

  return (
    <div
      className="rounded-3xl border p-4 md:p-6 overflow-hidden"
      style={{
        borderColor: "#D8E3F6",
        backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(244,247,251,0.98)), radial-gradient(#D9DDE7 1px, transparent 1px)",
        backgroundSize: "auto, 18px 18px",
        boxShadow: "0px 16px 32px rgba(15, 23, 42, 0.08)",
      }}
    >
      <div className="grid gap-4 xl:grid-cols-1 xl:items-start">
        <div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-[26px] md:text-[34px] leading-[1.1]" style={{ color: "#111827", fontWeight: 800 }}>
                Welcome, {currentUserName || "Feroze"}
              </h2>
              <p className="mt-2 max-w-3xl text-[13px] md:text-[14px] leading-[1.6]" style={{ color: "#4B5563" }}>
                Contextual UX automatically filters data to direct reports, prioritizing fatigue tracking, specific training gaps, and role-based risk signals.
              </p>
            </div>
            <div className="rounded-full px-3 py-1.5 text-[12px] font-semibold" style={{ background: "#EEF4FF", color: "#3957C5" }}>
              Live data
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 xl:grid-cols-3">
            {peopleKpis.map((metric) => (
              <div key={metric.title} className="rounded-2xl border bg-white p-4 shadow-[0_6px_20px_rgba(15,23,42,0.05)]" style={{ borderColor: "#DCE7F7" }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[15px] font-semibold" style={{ color: "#111827" }}>{metric.title}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[34px] leading-none" style={{ color: "#111827", fontWeight: 800 }}>{metric.value}</span>
                      <ToneChip tone={metric.tone}>{metric.change}</ToneChip>
                    </div>
                    <div className="mt-1 text-[13px]" style={{ color: "#4B5563" }}>{metric.subtitle}</div>
                  </div>

                  <div className="shrink-0">
                    {metric.visual === "spark" && metric.sparkline ? (
                      <div className="w-[120px]">
                        <MiniSparkline data={metric.sparkline} stroke="#5B6FCE" />
                      </div>
                    ) : metric.visual === "gauge" ? (
                      <div className="pt-1">
                        <GaugeDial value={overview?.worker_exposure_index.value ?? 0} />
                      </div>
                    ) : (
                      <RingStat value={overview?.supervisor_safety_score.value ?? 0} color="#2F73B8" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="xl:col-span-5 rounded-2xl border bg-white p-4" style={{ borderColor: "#DCE7F7", boxShadow: "0px 10px 24px rgba(15, 23, 42, 0.06)" }}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-[18px] font-semibold" style={{ color: "#111827" }}>Fatigue Risk (overtime vs. normal hours)</h3>
                  <div className="mt-1 flex items-center gap-3 text-[12px]" style={{ color: "#6B7280" }}>
                    <span className="inline-flex items-center gap-1"><span className="h-0.5 w-4 rounded-full" style={{ background: "#66708E" }} /> Normal Hours</span>
                    <span className="inline-flex items-center gap-1"><span className="h-0.5 w-4 rounded-full" style={{ background: "#C9A246" }} /> Overtime</span>
                  </div>
                </div>
                <div className="rounded-full px-3 py-1 text-[12px]" style={{ background: "#EEF4FF", color: "#3957C5", fontWeight: 600 }}>
                  Weekly trend
                </div>
              </div>

              <div className="mt-4 h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={fatigueTrend}>
                    <CartesianGrid stroke="#EEF2F7" vertical={false} />
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} label={{ value: "Weeks", position: "insideBottom", offset: -2, style: { fill: "#6B7280", fontSize: 11, fontWeight: 600 } }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} label={{ value: "Fatigue level", angle: -90, position: "insideLeft", style: { fill: "#6B7280", fontSize: 11, fontWeight: 600 } }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} label={{ value: "Hours", angle: -90, position: "insideRight", style: { fill: "#6B7280", fontSize: 11, fontWeight: 600 } }} />
                    <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, fontSize: 12, boxShadow: "0px 8px 20px rgba(15, 23, 42, 0.08)" }} />
                    <Line yAxisId="left" type="monotone" dataKey="normal" stroke="#66708E" strokeWidth={3} dot={{ r: 2.5, fill: "#66708E" }} activeDot={{ r: 4 }} />
                    <Line yAxisId="right" type="monotone" dataKey="overtime" stroke="#C9A246" strokeWidth={3} dot={{ r: 2.5, fill: "#C9A246" }} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="xl:col-span-4 rounded-2xl border bg-white p-4" style={{ borderColor: "#DCE7F7", boxShadow: "0px 10px 24px rgba(15, 23, 42, 0.06)" }}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-[18px] font-semibold" style={{ color: "#111827" }}>Safety Toolbox Meetings Trend</h3>
                  <div className="mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px]" style={{ background: "#EEF4FF", color: "#3957C5", fontWeight: 600 }}>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    {toolboxMoM === null ? "Not enough data yet" : `${toolboxMoM >= 0 ? "Increased" : "Decreased"} ${Math.abs(toolboxMoM)}% MoM`}
                  </div>
                </div>
              </div>

              <div className="mt-4 h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={toolboxTrend}>
                    <defs>
                      <linearGradient id="toolboxFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#66708E" stopOpacity={0.7} />
                        <stop offset="100%" stopColor="#66708E" stopOpacity={0.08} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} label={{ value: "Number of Meetings", angle: -90, position: "insideLeft", style: { fill: "#111827", fontSize: 11, fontWeight: 600 } }} />
                    <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, fontSize: 12, boxShadow: "0px 8px 20px rgba(15, 23, 42, 0.08)" }} />
                    <Area type="monotone" dataKey="meetings" stroke="#66708E" strokeWidth={3} fill="url(#toolboxFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="xl:col-span-3 rounded-2xl border bg-white p-4" style={{ borderColor: "#DCE7F7", boxShadow: "0px 10px 24px rgba(15, 23, 42, 0.06)" }}>
              <h3 className="text-[18px] font-semibold" style={{ color: "#111827" }}>High Risk Roles</h3>
              <div className="mt-3 overflow-hidden rounded-xl border" style={{ borderColor: "#E5EAF3" }}>
                <div className="grid grid-cols-[minmax(0,1fr)_88px] bg-[#F8FAFC] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.5px]" style={{ color: "#6B7280" }}>
                  <div>Roles</div>
                  <div className="text-center">Status</div>
                </div>
                <div className="divide-y" style={{ borderColor: "#EEF2F7" }}>
                  {highRiskRoles.map((item) => (
                    <div key={item.role} className="grid grid-cols-[minmax(0,1fr)_88px] items-center px-3 py-2.5 text-[12px]">
                      <div className="min-w-0 truncate font-medium" style={{ color: "#111827" }}>{item.role}</div>
                      <div className="flex justify-center"><ToneChip tone={item.tone}>{item.status}</ToneChip></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-4">
            <div className="rounded-2xl border bg-white p-4" style={{ borderColor: "#DCE7F7", boxShadow: "0px 10px 24px rgba(15, 23, 42, 0.06)" }}>
              <h3 className="text-[18px] font-semibold" style={{ color: "#111827" }}>Training Expiry Status</h3>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full" style={{ background: "#FFF4D6", color: "#C78800" }}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[30px] leading-none font-bold" style={{ color: "#111827" }}>{expiringSoonCount}</div>
                  <div className="mt-1 text-[13px]" style={{ color: "#374151" }}>Expiring Soon</div>
                </div>
              </div>
              <div className="mt-4 h-[154px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trainingExpiry}>
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} interval={0} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, fontSize: 12, boxShadow: "0px 8px 20px rgba(15, 23, 42, 0.08)" }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {trainingExpiry.map((entry, index) => (
                        <Cell key={entry.label} fill={index === 0 ? "#F4A62A" : index === 1 ? "#F7CF4A" : "#E5A11D"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-4" style={{ borderColor: "#DCE7F7", boxShadow: "0px 10px 24px rgba(15, 23, 42, 0.06)" }}>
              <h3 className="text-[18px] font-semibold" style={{ color: "#111827" }}>Behaviour Observations</h3>
              <div className="mt-3 flex items-center justify-between gap-4">
                <div className="flex-1 space-y-2 text-[13px]" style={{ color: "#374151" }}>
                  {behaviourBreakdown.map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-3">
                      <span>{item.label}</span>
                      <span className="font-semibold" style={{ color: item.color }}>{item.value}%</span>
                    </div>
                  ))}
                </div>
                <div className="w-[124px]">
                  <ResponsiveContainer width="100%" height={124}>
                    <PieChart>
                      <Pie data={behaviourBreakdown} dataKey="value" nameKey="label" innerRadius={38} outerRadius={58} paddingAngle={2}>
                        {behaviourBreakdown.map((entry) => (
                          <Cell key={entry.label} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-4" style={{ borderColor: "#DCE7F7", boxShadow: "0px 10px 24px rgba(15, 23, 42, 0.06)" }}>
              <h3 className="text-[18px] font-semibold" style={{ color: "#111827" }}>Coaching Actions</h3>
              <div className="mt-3 space-y-3">
                {coachingActions.map((item) => (
                  <div key={item.title} className="rounded-xl border px-3 py-2.5" style={{ borderColor: "#EEF2F7", background: "#FBFCFE" }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-semibold" style={{ color: "#111827" }}>{item.title}</div>
                        <div className="mt-0.5 text-[12px]" style={{ color: "#6B7280" }}>{item.detail}</div>
                      </div>
                      <ToneChip tone={item.tone}>{item.detail === "Overdue" ? "Overdue" : "Status"}</ToneChip>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-4" style={{ borderColor: "#DCE7F7", boxShadow: "0px 10px 24px rgba(15, 23, 42, 0.06)" }}>
              <h3 className="text-[18px] font-semibold" style={{ color: "#111827" }}>Open Actions</h3>
              <div className="mt-3 space-y-3">
                {openActions.map((item) => (
                  <div key={item.title} className="rounded-xl border px-3 py-2.5" style={{ borderColor: "#EEF2F7", background: "#FBFCFE" }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-semibold" style={{ color: "#111827" }}>{item.title}</div>
                        <div className="mt-0.5 text-[12px]" style={{ color: "#6B7280" }}>{item.detail}</div>
                      </div>
                      <ToneChip tone={item.tone}>{item.priority ?? ""}</ToneChip>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* <div className="relative xl:self-stretch">
          <div className="absolute left-0 top-6 h-px w-7 rounded-full bg-[#2FAEAA]" />
          <div className="absolute left-5 top-6 h-3.5 w-3.5 rounded-full border-[4px] border-[#2FAEAA] bg-white" />
          <div className="rounded-2xl border bg-white/85 p-4 pl-6 pt-7 shadow-[0_8px_20px_rgba(15,23,42,0.05)]" style={{ borderColor: "#D8E3F6" }}>
            <div className="text-[17px] font-semibold leading-[1.25]" style={{ color: "#111827" }}>
              Contextual UX automatically filters data to Feroze&apos;s direct reports, prioritizing human factors like fatigue tracking and specific training gaps.
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
}

export function UsersPage() {
  const { user: currentUser, markOnboardingSetupCompleted } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = (searchParams.get("tab") || "").trim().toLowerCase();
  const setupRequired = Boolean(currentUser?.onboardingSetupRequired && !currentUser?.onboardingSetupCompleted);
  const activeTab = tabParam === "knowledge-base"
    ? "knowledge-base"
    : tabParam === "user-requests"
      ? "user-requests"
    : tabParam === "user"
      ? "user"
    : tabParam === "onboarding-setup"
      ? "onboarding-setup"
      : tabParam === "users" || tabParam === "handle-users"
        ? "user-handle"
        : "user-handle";
  const isAdmin = currentUser?.role === "Admin";
  const isOnboardingOrgAdmin = Boolean(isAdmin && currentUser?.onboardingScoped && currentUser?.email);

  type UploadedFileMeta = {
    original_name: string;
    stored_name: string;
    stored_path: string;
    content_type: string;
    size_bytes: number;
  };

  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  const [employeeDirectory, setEmployeeDirectory] = useState<EmployeeDirectoryRow[]>([]);
  const [peopleOverview, setPeopleOverview] = useState<PeopleOverview | null>(null);
  const [loadingUid, setLoadingUid] = useState<string | null>(null);
  const [roleMenuUid, setRoleMenuUid] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [detailTab, setDetailTab] = useState("profile");
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("All Roles");
  const [filterStatus, setFilterStatus] = useState("All Statuses");

  const [onboardingStatus, setOnboardingStatus] = useState<RequestStatusResponse | null>(null);
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupSaving, setSetupSaving] = useState(false);
  const [setupError, setSetupError] = useState("");
  const [setupMessage, setSetupMessage] = useState("");
  const [orgDataSummary, setOrgDataSummary] = useState("");
  const [orgFiles, setOrgFiles] = useState<File[]>([]);
  const [workerFiles, setWorkerFiles] = useState<File[]>([]);
  const [onboardingWorkers, setOnboardingWorkers] = useState<Array<{
    name: string;
    email: string;
    phone: string;
    role: typeof ONBOARDING_USER_ROLE_OPTIONS[number];
    employee_id: string;
    certification: string;
  }>>([
    { name: "", email: "", phone: "", role: "Worker/Contractor", employee_id: "", certification: "" },
  ]);
  const maxAllowedUsers = Number(onboardingStatus?.active_workers || 0);
  const [orgAccessRequests, setOrgAccessRequests] = useState<OrgAccessRequestItem[]>([]);
  const [orgDirectoryUsers, setOrgDirectoryUsers] = useState<ApiUser[]>([]);
  const [orgRequestRoles, setOrgRequestRoles] = useState<Record<number, typeof ONBOARDING_USER_ROLE_OPTIONS[number]>>({});
  const [orgRequestActionId, setOrgRequestActionId] = useState<number | null>(null);
  const reachedUserLimit = maxAllowedUsers > 0 && onboardingWorkers.length >= maxAllowedUsers;
  const hasCompletedSetupFromStatus = Boolean(
    onboardingStatus?.post_approval_setup?.saved_at
    || onboardingStatus?.post_approval_setup?.org_data_summary
    || (onboardingStatus?.post_approval_setup?.workers?.length ?? 0) > 0
    || (onboardingStatus?.post_approval_setup?.uploaded_files?.length ?? 0) > 0
    || (onboardingStatus?.post_approval_setup?.worker_uploaded_files?.length ?? 0) > 0,
  );
  const showOnboardingSetupTab = Boolean(setupRequired && !hasCompletedSetupFromStatus);

  const loadAppUsers = async () => {
    try {
      const snap = await getDocs(query(collection(db, "app_users"), orderBy("createdAt", "desc")));
      setAppUsers(snap.docs.map((d) => ({ uid: d.id, ...d.data() } as AppUser)));
    } catch (err) {
      console.error("Failed to load app_users:", err);
    }
  };

  const refreshOnboardingStatus = async () => {
    if (!isOnboardingOrgAdmin || !currentUser?.email) return;
    setSetupLoading(true);
    setSetupError("");
    try {
      const status = await fetchRequestStatusByEmail(currentUser.email);
      setOnboardingStatus(status);
      const completedSetup = Boolean(
        status?.post_approval_setup?.saved_at
        || status?.post_approval_setup?.org_data_summary
        || (status?.post_approval_setup?.workers?.length ?? 0) > 0
        || (status?.post_approval_setup?.uploaded_files?.length ?? 0) > 0
        || (status?.post_approval_setup?.worker_uploaded_files?.length ?? 0) > 0,
      );
      if (completedSetup) {
        markOnboardingSetupCompleted();
      }
      const existingSetup = status.post_approval_setup;
      if (existingSetup?.org_data_summary) {
        setOrgDataSummary(existingSetup.org_data_summary);
      }
      if (Array.isArray(existingSetup?.workers) && existingSetup.workers.length > 0) {
        setOnboardingWorkers(
          existingSetup.workers.map((w) => ({
            name: w.name || "",
            email: w.email || "",
            phone: w.phone || "",
            role: (ONBOARDING_USER_ROLE_OPTIONS.includes((w as any).role)
              ? (w as any).role
              : "Worker/Contractor") as typeof ONBOARDING_USER_ROLE_OPTIONS[number],
            employee_id: (w as any).employee_id || "",
            certification: (w as any).certification || "",
          })),
        );
      }
    } catch (err) {
      setSetupError(err instanceof Error ? err.message : "Failed to load onboarding setup details.");
    } finally {
      setSetupLoading(false);
    }
  };

  const refreshOrgAccessRequests = async () => {
    if (!isOnboardingOrgAdmin) {
      setOrgAccessRequests([]);
      setOrgRequestRoles({});
      return;
    }
    try {
      const result = await fetchOrgAccessRequests(currentUser?.orgCode || undefined);
      setOrgAccessRequests(result.requests || []);
      setOrgRequestRoles((prev) => {
        const next = { ...prev };
        (result.requests || []).forEach((req) => {
          if (!next[req.request_id]) {
            const defaultRole = ONBOARDING_USER_ROLE_OPTIONS.includes(req.role as typeof ONBOARDING_USER_ROLE_OPTIONS[number])
              ? (req.role as typeof ONBOARDING_USER_ROLE_OPTIONS[number])
              : "Worker/Contractor";
            next[req.request_id] = defaultRole;
          }
        });
        return next;
      });
    } catch (err) {
      console.error("Failed to fetch org access requests:", err);
    }
  };

  const refreshOrgDirectoryUsers = async () => {
    if (!isOnboardingOrgAdmin) {
      setOrgDirectoryUsers([]);
      return;
    }
    try {
      const users = await getUsers();
      setOrgDirectoryUsers(Array.isArray(users) ? users : []);
    } catch (err) {
      console.error("Failed to fetch org user directory:", err);
      setOrgDirectoryUsers([]);
    }
  };

  useEffect(() => {
    loadAppUsers();
  }, []);

  useEffect(() => {
    getPeopleOverview().then(setPeopleOverview).catch(console.error);
  }, []);

  useEffect(() => {
    getEmployeeDirectory().then(setEmployeeDirectory).catch(console.error);
  }, []);

  useEffect(() => {
    refreshOnboardingStatus();
  }, [isOnboardingOrgAdmin, currentUser?.email]);

  useEffect(() => {
    refreshOrgAccessRequests();
  }, [isOnboardingOrgAdmin, currentUser?.email, currentUser?.orgCode]);

  useEffect(() => {
    refreshOrgDirectoryUsers();
  }, [isOnboardingOrgAdmin, currentUser?.email, currentUser?.orgCode]);

  useEffect(() => {
    if (!showOnboardingSetupTab && activeTab === "onboarding-setup") {
      setSearchParams({ tab: 'user-handle' });
    }
  }, [showOnboardingSetupTab, activeTab, setSearchParams]);

  const addOnboardingWorker = () => {
    if (reachedUserLimit) {
      setSetupError(`You can add up to ${maxAllowedUsers} users as defined in onboarding.`);
      return;
    }
    setOnboardingWorkers((prev) => [
      ...prev,
      { name: "", email: "", phone: "", role: "Worker/Contractor", employee_id: "", certification: "" },
    ]);
  };

  const removeOnboardingWorker = (index: number) => {
    setOnboardingWorkers((prev) => prev.filter((_, i) => i !== index));
  };

  const updateOnboardingWorker = (
    index: number,
    key: "name" | "email" | "phone" | "role" | "employee_id" | "certification",
    value: string,
  ) => {
    setOnboardingWorkers((prev) => prev.map((worker, i) => (i === index ? { ...worker, [key]: value } : worker)));
  };

  const saveOnboardingSetup = async () => {
    if (!onboardingStatus?.onboarding_uuid) {
      setSetupError("Onboarding request ID not found for this account.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+[1-9]\d{6,14}$/;
    const workersToSave = onboardingWorkers
      .map((w) => ({
        name: w.name.trim(),
        email: w.email.trim().toLowerCase(),
        phone: w.phone.trim(),
        role: w.role,
        employee_id: w.employee_id.trim(),
        certification: w.certification.trim(),
      }))
      .filter((w) => w.name || w.email || w.phone || w.employee_id || w.certification);

    const invalid = workersToSave.find((w) => {
      if (!w.name || !emailRegex.test(w.email) || !phoneRegex.test(w.phone)) {
        return true;
      }
      if (!w.employee_id) {
        return true;
      }
      return false;
    });
    if (invalid) {
      setSetupError("Each user must have name, valid email, valid phone (+country code), and employee ID. Certification is optional.");
      return;
    }

    if (maxAllowedUsers > 0 && workersToSave.length > maxAllowedUsers) {
      setSetupError(`You can save up to ${maxAllowedUsers} users based on onboarding limits.`);
      return;
    }

    setSetupSaving(true);
    setSetupError("");
    setSetupMessage("");
    try {
      const result = await savePostApprovalSetup(onboardingStatus.onboarding_uuid, {
        org_data_summary: orgDataSummary,
        workers: workersToSave,
        org_files: orgFiles,
        worker_files: workerFiles,
      });
      markOnboardingSetupCompleted();
      setSetupMessage(
        `Onboarding setup saved. Your environment will be ready soon and you will receive an acknowledgement email. `
        + `Uploaded org files: ${result.uploaded_files_count ?? 0}, worker files: ${result.worker_files_count ?? 0}.`,
      );
      setOrgFiles([]);
      setWorkerFiles([]);
      await refreshOnboardingStatus();
    } catch (err) {
      setSetupError(err instanceof Error ? err.message : "Failed to save onboarding setup.");
    } finally {
      setSetupSaving(false);
    }
  };

  const handleAddUser = async () => {
    if (!isAdmin) return;
    const email = (window.prompt("Enter new user email") || "").trim().toLowerCase();
    if (!email) return;
    const displayName = (window.prompt("Enter user name") || email.split("@")[0] || "User").trim();
    const roleInput = (window.prompt(`Assign role (${ROLES.join(", ")})`, "Worker") || "Worker").trim() as UserRole;
    const role: UserRole = ROLES.includes(roleInput) ? roleInput : "Worker";

    try {
      await addDoc(collection(db, "app_users"), {
        email,
        displayName,
        role,
        approved: true,
        createdAt: serverTimestamp(),
      });
      await loadAppUsers();
    } catch (err) {
      console.error("Failed to add user:", err);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (!isAdmin) return;
    if (!window.confirm("Delete this user? This removes the user record from app_users.")) return;
    setLoadingUid(uid);
    try {
      await deleteDoc(doc(db, "app_users", uid));
      setShowDetail(false);
      if (selectedUser?.uid === uid) setSelectedUser(null);
      await loadAppUsers();
    } catch (err) {
      console.error("Failed to delete user:", err);
    } finally {
      setLoadingUid(null);
    }
  };

  const handleDeleteUploadedFile = async (storedName: string, fileGroup: 'org' | 'worker') => {
    if (!onboardingStatus?.onboarding_uuid) return;
    if (!window.confirm("Delete this file from Knowledge Base uploads?")) return;
    setSetupError("");
    setSetupMessage("");
    try {
      await deletePostApprovalFile(onboardingStatus.onboarding_uuid, storedName, fileGroup);
      setSetupMessage("File deleted successfully.");
      await refreshOnboardingStatus();
    } catch (err) {
      setSetupError(err instanceof Error ? err.message : "Failed to delete uploaded file.");
    }
  };

  const handleApprove = async (uid: string, role: UserRole = "Worker") => {
    setLoadingUid(uid);
    try {
      await updateDoc(doc(db, "app_users", uid), { approved: true, role });
      setAppUsers(prev => prev.map(u => u.uid === uid ? { ...u, approved: true, role } : u));
    } catch (err) { console.error(err); }
    setLoadingUid(null);
  };

  const handleRevoke = async (uid: string) => {
    setLoadingUid(uid);
    try {
      await updateDoc(doc(db, "app_users", uid), { approved: false });
      setAppUsers(prev => prev.map(u => u.uid === uid ? { ...u, approved: false } : u));
    } catch (err) { console.error(err); }
    setLoadingUid(null);
  };

  const handleRoleChange = async (uid: string, role: UserRole) => {
    setRoleMenuUid(null);
    setLoadingUid(uid);
    try {
      await updateDoc(doc(db, "app_users", uid), { role });
      setAppUsers(prev => prev.map(u => u.uid === uid ? { ...u, role } : u));
      if (selectedUser?.uid === uid) setSelectedUser(prev => prev ? { ...prev, role } : prev);
    } catch (err) { console.error(err); }
    setLoadingUid(null);
  };

  const handleOrgRequestReview = async (requestId: number, action: "approve" | "reject") => {
    const selectedRole = orgRequestRoles[requestId] || "Worker/Contractor";
    setOrgRequestActionId(requestId);
    try {
      await reviewOrgAccessRequest(requestId, action, selectedRole);
      await refreshOrgAccessRequests();
      await refreshOrgDirectoryUsers();
      await loadAppUsers();
    } catch (err) {
      console.error("Failed to review org access request:", err);
      alert(err instanceof Error ? err.message : "Failed to review access request.");
    } finally {
      setOrgRequestActionId(null);
    }
  };

  const pendingUsers = appUsers.filter(u => !u.approved);
  const totalPendingRequests = pendingUsers.length + orgAccessRequests.length;
  const employeeRoleOptions = Array.from(
    new Set(employeeDirectory.map(e => e.role_name).filter((r): r is string => Boolean(r)))
  ).sort();
  const filteredEmployees = employeeDirectory
    .filter(e => !search || e.full_name.toLowerCase().includes(search.toLowerCase()))
    .filter(e => filterRole === "All Roles" || e.role_name === filterRole)
    .filter(e => filterStatus === "All Statuses" || e.active_status === filterStatus);

  const initials = (u: AppUser) =>
    (u.displayName || u.email || "?").split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();

  const employeeInitials = (e: EmployeeDirectoryRow) =>
    e.full_name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();

  const orgUploadedFiles: UploadedFileMeta[] = onboardingStatus?.post_approval_setup?.uploaded_files ?? [];
  const workerUploadedFiles: UploadedFileMeta[] = onboardingStatus?.post_approval_setup?.worker_uploaded_files ?? [];
  const onboardingUserDirectory = (orgDirectoryUsers.length > 0
    ? orgDirectoryUsers
        .filter((u) => {
          const status = String(u.Status || '').toLowerCase();
          return status !== 'requested' && status !== 'rejected';
        })
        .map((u) => ({
          name: u.Full_Name || '',
          phone: u.Phone || '',
          employee_id: '',
          certification: '',
          role: u.Role || '-',
          email: u.Email || '',
        }))
    : (onboardingStatus?.post_approval_setup?.workers ?? []).filter(
        (w): w is NonNullable<typeof onboardingStatus>['post_approval_setup']['workers'][number] =>
          Boolean(w && typeof w === 'object'),
      )) as Array<{
    name: string;
    phone: string;
    employee_id?: string;
    certification?: string;
    role: string;
    email: string;
  }>;

  if (activeTab === "knowledge-base") {
    return (
      <div className="space-y-6">
        <div className="inline-flex rounded-xl border p-1" style={{ borderColor: '#E2E8E2', background: '#ffffff' }}>
          {showOnboardingSetupTab && (
            <button
              type="button"
              onClick={() => setSearchParams({ tab: 'onboarding-setup' })}
              className="rounded-lg px-3 py-1.5 text-[13px]"
              style={{ background: 'transparent', color: '#4A5568', fontWeight: 600 }}
            >
              Onboarding Setup
            </button>
          )}
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'user' })}
            className="rounded-lg px-3 py-1.5 text-[13px]"
            style={{ background: 'transparent', color: '#4A5568', fontWeight: 600 }}
          >
            User
          </button>
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'user-handle' })}
            className="rounded-lg px-3 py-1.5 text-[13px]"
            style={{ background: 'transparent', color: '#4A5568', fontWeight: 600 }}
          >
            User Handle
          </button>
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'user-requests' })}
            className="rounded-lg px-3 py-1.5 text-[13px]"
            style={{ background: 'transparent', color: '#4A5568', fontWeight: 600 }}
          >
            User Requests {isAdmin && totalPendingRequests > 0 ? `(${totalPendingRequests})` : ''}
          </button>
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'knowledge-base' })}
            className="rounded-lg px-3 py-1.5 text-[13px]"
            style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)', color: '#fff', fontWeight: 600 }}
          >
            Knowledge Base
          </button>
        </div>

        <div className="bg-white rounded-xl border p-4" style={{ borderColor: '#E8EFE8', boxShadow: '0px 2px 12px rgba(27, 94, 32, 0.08)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-5 h-5" style={{ color: '#1B5E20' }} />
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0A0A0A' }}>Knowledge Base</h3>
          </div>
          <p style={{ margin: '0 0 12px 0', fontSize: 13, color: '#4A5568' }}>
            View uploaded data, upload new documents, and delete previous files.
          </p>

          {!isOnboardingOrgAdmin && (
            <div className="px-3 py-2 rounded-lg text-[12px]" style={{ background: '#FFF8E1', color: '#8A6D3B', border: '1px solid #FFE0B2' }}>
              Knowledge Base management is available for onboarding organization admins.
            </div>
          )}

          {isOnboardingOrgAdmin && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1.5 text-[12px]" style={{ color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 600 }}>Upload Org Files</label>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setOrgFiles(Array.from(e.target.files || []))}
                    className="w-full h-10 px-3 rounded-lg border text-[13px]"
                    style={{ borderColor: '#E2E8E2' }}
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-[12px]" style={{ color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 600 }}>Upload Worker Files</label>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setWorkerFiles(Array.from(e.target.files || []))}
                    className="w-full h-10 px-3 rounded-lg border text-[13px]"
                    style={{ borderColor: '#E2E8E2' }}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={saveOnboardingSetup}
                  disabled={setupSaving}
                  className="px-4 py-2 rounded-lg text-white text-[13px] disabled:opacity-70"
                  style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)', fontWeight: 600 }}
                >
                  {setupSaving ? 'Uploading...' : 'Upload to Knowledge Base'}
                </button>
              </div>

              {setupError && <div className="px-3 py-2 rounded-lg text-[12px]" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>{setupError}</div>}
              {setupMessage && <div className="px-3 py-2 rounded-lg text-[12px]" style={{ background: '#E8F5E9', color: '#1B5E20', border: '1px solid #C8E6C9' }}>{setupMessage}</div>}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-lg border" style={{ borderColor: '#E2E8E2' }}>
                  <div className="px-3 py-2 border-b text-[12px]" style={{ borderColor: '#E2E8E2', fontWeight: 700, color: '#1B5E20' }}>Org Uploaded Files ({orgUploadedFiles.length})</div>
                  <div className="p-2 space-y-2 max-h-[260px] overflow-auto">
                    {orgUploadedFiles.length === 0 ? <p className="text-[12px]" style={{ color: '#9CA3AF' }}>No org files uploaded yet.</p> : orgUploadedFiles.map((f) => (
                      <div key={f.stored_name} className="flex items-center justify-between gap-2 rounded-md border px-2 py-1.5" style={{ borderColor: '#EEF2EE' }}>
                        <div className="min-w-0">
                          <div className="truncate text-[12px]" style={{ color: '#0A0A0A', fontWeight: 600 }}>{f.original_name}</div>
                          <div className="text-[11px]" style={{ color: '#9CA3AF' }}>{Math.round((f.size_bytes || 0) / 1024)} KB</div>
                        </div>
                        <button type="button" onClick={() => handleDeleteUploadedFile(f.stored_name, 'org')} className="p-1.5 rounded hover:bg-red-50" title="Delete file">
                          <Trash2 className="w-4 h-4" style={{ color: '#DC2626' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border" style={{ borderColor: '#E2E8E2' }}>
                  <div className="px-3 py-2 border-b text-[12px]" style={{ borderColor: '#E2E8E2', fontWeight: 700, color: '#1B5E20' }}>Worker Uploaded Files ({workerUploadedFiles.length})</div>
                  <div className="p-2 space-y-2 max-h-[260px] overflow-auto">
                    {workerUploadedFiles.length === 0 ? <p className="text-[12px]" style={{ color: '#9CA3AF' }}>No worker files uploaded yet.</p> : workerUploadedFiles.map((f) => (
                      <div key={f.stored_name} className="flex items-center justify-between gap-2 rounded-md border px-2 py-1.5" style={{ borderColor: '#EEF2EE' }}>
                        <div className="min-w-0">
                          <div className="truncate text-[12px]" style={{ color: '#0A0A0A', fontWeight: 600 }}>{f.original_name}</div>
                          <div className="text-[11px]" style={{ color: '#9CA3AF' }}>{Math.round((f.size_bytes || 0) / 1024)} KB</div>
                        </div>
                        <button type="button" onClick={() => handleDeleteUploadedFile(f.stored_name, 'worker')} className="p-1.5 rounded hover:bg-red-50" title="Delete file">
                          <Trash2 className="w-4 h-4" style={{ color: '#DC2626' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeTab === "onboarding-setup") {
    return (
      <div className="space-y-6 relative" onClick={() => roleMenuUid && setRoleMenuUid(null)}>
        {/* <div className="inline-flex rounded-xl border p-1" style={{ borderColor: '#E2E8E2', background: '#ffffff' }}>
          {showOnboardingSetupTab && (
            <button
              type="button"
              onClick={() => setSearchParams({ tab: 'onboarding-setup' })}
              className="rounded-lg px-3 py-1.5 text-[13px]"
              style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)', color: '#fff', fontWeight: 600 }}
            >
              Onboarding Setup
            </button>
          )}
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'user' })}
            className="rounded-lg px-3 py-1.5 text-[13px]"
            style={{ background: 'transparent', color: '#4A5568', fontWeight: 600 }}
          >
            User
          </button>
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'user-handle' })}
            className="rounded-lg px-3 py-1.5 text-[13px]"
            style={{ background: 'transparent', color: '#4A5568', fontWeight: 600 }}
          >
            User Handle
          </button>
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'user-requests' })}
            className="rounded-lg px-3 py-1.5 text-[13px]"
            style={{ background: 'transparent', color: '#4A5568', fontWeight: 600 }}
          >
            User Requests {isAdmin && totalPendingRequests > 0 ? `(${totalPendingRequests})` : ''}
          </button>
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'knowledge-base' })}
            className="rounded-lg px-3 py-1.5 text-[13px]"
            style={{ background: 'transparent', color: '#4A5568', fontWeight: 600 }}
          >
            Knowledge Base
          </button>
        </div> */}

        {!isOnboardingOrgAdmin && (
          <div className="px-3 py-2 rounded-lg text-[12px]" style={{ background: '#FFF8E1', color: '#8A6D3B', border: '1px solid #FFE0B2' }}>
            Onboarding setup is available for onboarding organization admins.
          </div>
        )}

        {isOnboardingOrgAdmin && (
          <div className="bg-white rounded-xl border p-4" style={{ borderColor: '#E8EFE8', boxShadow: '0px 2px 12px rgba(27, 94, 32, 0.08)' }}>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0A0A0A' }}>Organization Setup (Post-Approval)</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#4A5568' }}>
                  Complete org data upload and user provisioning inside HSE app.
                </p>
              </div>
              {onboardingStatus?.status && (
                <span className={`ob-badge ob-badge-${onboardingStatus.status.toLowerCase()}`}>
                  {onboardingStatus.status}
                </span>
              )}
            </div>

            {setupLoading && <p style={{ fontSize: 13, color: '#4A5568' }}>Loading setup details...</p>}

            {!setupLoading && onboardingStatus?.found && onboardingStatus.status === 'approved' && (
              <div className="space-y-4">
                <div className="px-3 py-2 rounded-lg text-[12px]" style={{ background: '#EEF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                  Complete this setup before using other modules. Please upload feeding data, then create users as per onboarding limits.
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div style={{ fontSize: 13, color: '#374151' }}><b>Org:</b> {onboardingStatus.company_name}</div>
                  <div style={{ fontSize: 13, color: '#374151' }}><b>Org Code:</b> {onboardingStatus.org_code}</div>
                  <div style={{ fontSize: 13, color: '#374151' }}><b>Request ID:</b> {onboardingStatus.onboarding_uuid}</div>
                  <div style={{ fontSize: 13, color: '#374151' }}><b>Admin:</b> {onboardingStatus.admin_email}</div>
                  <div style={{ fontSize: 13, color: '#374151' }}><b>User Limit:</b> {maxAllowedUsers > 0 ? maxAllowedUsers : 'Not defined'}</div>
                  <div style={{ fontSize: 13, color: '#374151' }}><b>Current Users in Form:</b> {onboardingWorkers.length}</div>
                </div>

                {onboardingStatus.onboarding_requirements?.kpi_sla && (
                  <div className="px-3 py-2 rounded-lg text-[12px]" style={{ background: '#F8FAFC', color: '#334155', border: '1px solid #E2E8F0' }}>
                    <b>Configured KPI/SLA from onboarding:</b> {JSON.stringify(onboardingStatus.onboarding_requirements.kpi_sla)}
                  </div>
                )}

                <div>
                  <label className="block mb-1.5 text-[12px]" style={{ color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 600 }}>Organization Data Summary</label>
                  <textarea
                    value={orgDataSummary}
                    onChange={(e) => setOrgDataSummary(e.target.value)}
                    placeholder="Describe organization data and rollout notes"
                    className="w-full min-h-[90px] px-3 py-2 rounded-lg border text-[13px]"
                    style={{ borderColor: '#E2E8E2' }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1.5 text-[12px]" style={{ color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 600 }}>Upload Org Files</label>
                    <input
                      type="file"
                      multiple
                      onChange={(e) => setOrgFiles(Array.from(e.target.files || []))}
                      className="w-full h-10 px-3 rounded-lg border text-[13px]"
                      style={{ borderColor: '#E2E8E2' }}
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-[12px]" style={{ color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 600 }}>Upload Worker Files</label>
                    <input
                      type="file"
                      multiple
                      onChange={(e) => setWorkerFiles(Array.from(e.target.files || []))}
                      className="w-full h-10 px-3 rounded-lg border text-[13px]"
                      style={{ borderColor: '#E2E8E2' }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[12px]" style={{ color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 600 }}>User Provisioning</label>
                    <button
                      type="button"
                      onClick={addOnboardingWorker}
                      disabled={reachedUserLimit}
                      className="px-3 py-1.5 rounded-lg text-[12px] border"
                      style={{ borderColor: '#C8E6C9', color: '#1B5E20', background: '#F6FBF6', fontWeight: 600 }}
                    >
                      {reachedUserLimit ? `Limit reached (${maxAllowedUsers})` : '+ Add User'}
                    </button>
                  </div>
                  {onboardingWorkers.map((worker, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-7 gap-2 items-end">
                      <input
                        value={worker.name}
                        onChange={(e) => updateOnboardingWorker(idx, 'name', e.target.value)}
                        placeholder="Name"
                        className="h-10 px-3 rounded-lg border text-[13px]"
                        style={{ borderColor: '#E2E8E2' }}
                      />
                      <input
                        value={worker.email}
                        onChange={(e) => updateOnboardingWorker(idx, 'email', e.target.value)}
                        placeholder="Email"
                        className="h-10 px-3 rounded-lg border text-[13px]"
                        style={{ borderColor: '#E2E8E2' }}
                      />
                      <input
                        value={worker.phone}
                        onChange={(e) => updateOnboardingWorker(idx, 'phone', e.target.value)}
                        placeholder="Phone (+countrycode)"
                        className="h-10 px-3 rounded-lg border text-[13px]"
                        style={{ borderColor: '#E2E8E2' }}
                      />
                      <input
                        value={worker.employee_id}
                        onChange={(e) => updateOnboardingWorker(idx, 'employee_id', e.target.value)}
                        placeholder="Employee ID"
                        className="h-10 px-3 rounded-lg border text-[13px]"
                        style={{ borderColor: '#E2E8E2' }}
                      />
                      <input
                        value={worker.certification}
                        onChange={(e) => updateOnboardingWorker(idx, 'certification', e.target.value)}
                        placeholder="Certification"
                        className="h-10 px-3 rounded-lg border text-[13px]"
                        style={{ borderColor: '#E2E8E2' }}
                      />
                      <select
                        value={worker.role}
                        onChange={(e) => updateOnboardingWorker(idx, 'role', e.target.value)}
                        className="h-10 px-3 rounded-lg border text-[13px] bg-white"
                        style={{ borderColor: '#E2E8E2' }}
                      >
                        {ONBOARDING_USER_ROLE_OPTIONS.map((role) => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => removeOnboardingWorker(idx)}
                        disabled={onboardingWorkers.length === 1}
                        className="h-10 px-3 rounded-lg border text-[12px] disabled:opacity-50"
                        style={{ borderColor: '#FECACA', color: '#DC2626', background: '#FFF5F5', fontWeight: 600 }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                {setupError && (
                  <div className="px-3 py-2 rounded-lg text-[12px]" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
                    {setupError}
                  </div>
                )}
                {setupMessage && (
                  <div className="px-3 py-2 rounded-lg text-[12px]" style={{ background: '#E8F5E9', color: '#1B5E20', border: '1px solid #C8E6C9' }}>
                    {setupMessage}
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={saveOnboardingSetup}
                    disabled={setupSaving}
                    className="px-4 py-2 rounded-lg text-white text-[13px] disabled:opacity-70"
                    style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)', fontWeight: 600 }}
                  >
                    {setupSaving ? 'Saving...' : 'Save Organization Setup'}
                  </button>
                </div>
              </div>
            )}

            {!setupLoading && onboardingStatus?.found && onboardingStatus.status !== 'approved' && (
              <div className="px-3 py-2 rounded-lg text-[12px]" style={{ background: '#FFF8E1', color: '#8A6D3B', border: '1px solid #FFE0B2' }}>
                Setup will be enabled after onboarding status becomes <b>approved</b>.
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (activeTab === "user") {
    return (
      <div className="space-y-6">
        {/* <div className="inline-flex rounded-xl border p-1" style={{ borderColor: '#E2E8E2', background: '#ffffff' }}>
          {showOnboardingSetupTab && (
            <button
              type="button"
              onClick={() => setSearchParams({ tab: 'onboarding-setup' })}
              className="rounded-lg px-3 py-1.5 text-[13px]"
              style={{ background: 'transparent', color: '#4A5568', fontWeight: 600 }}
            >
              Onboarding Setup
            </button>
          )}
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'user' })}
            className="rounded-lg px-3 py-1.5 text-[13px]"
            style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)', color: '#fff', fontWeight: 600 }}
          >
            User
          </button>
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'user-handle' })}
            className="rounded-lg px-3 py-1.5 text-[13px]"
            style={{ background: 'transparent', color: '#4A5568', fontWeight: 600 }}
          >
            User Handle
          </button>
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'user-requests' })}
            className="rounded-lg px-3 py-1.5 text-[13px]"
            style={{ background: 'transparent', color: '#4A5568', fontWeight: 600 }}
          >
            User Requests {isAdmin && totalPendingRequests > 0 ? `(${totalPendingRequests})` : ''}
          </button>
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'knowledge-base' })}
            className="rounded-lg px-3 py-1.5 text-[13px]"
            style={{ background: 'transparent', color: '#4A5568', fontWeight: 600 }}
          >
            Knowledge Base
          </button>
        </div> */}

        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#E8EFE8', boxShadow: '0px 2px 12px rgba(27, 94, 32, 0.08)' }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: '#EEF2EE', background: '#F4F7F4' }}>
            <span className="text-[12px] uppercase tracking-[0.5px]" style={{ color: '#2E7D32', fontWeight: 700 }}>
              User Directory — {onboardingUserDirectory.length}
            </span>
          </div>
          {onboardingUserDirectory.length === 0 ? (
            <div className="p-6 text-[13px]" style={{ color: '#6B7280' }}>
              No onboarding users saved yet. Add users from <b>Onboarding Setup</b>.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ background: '#F9FBF9' }}>
                  {['Name', 'Number', 'Employee', 'Certification', 'Role', 'Email'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] uppercase" style={{ color: '#9CA3AF', fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {onboardingUserDirectory.map((u, idx) => (
                  <tr key={`${u.email}-${idx}`} style={{ borderTop: '1px solid #EEF2EE' }}>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#0A0A0A', fontWeight: 600 }}>{u.name || '-'}</td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#374151' }}>{u.phone || '-'}</td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#374151' }}>{u.employee_id || '-'}</td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#374151' }}>{u.certification || '-'}</td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#374151' }}>{u.role || '-'}</td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#374151' }}>{u.email || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  if (activeTab === "user-requests") {
    return (
      <div className="space-y-6 relative" onClick={() => roleMenuUid && setRoleMenuUid(null)}>
        {/* <div className="inline-flex rounded-xl border p-1" style={{ borderColor: '#E2E8E2', background: '#ffffff' }}>
          {showOnboardingSetupTab && (
            <button
              type="button"
              onClick={() => setSearchParams({ tab: 'onboarding-setup' })}
              className="rounded-lg px-3 py-1.5 text-[13px]"
              style={{ background: 'transparent', color: '#4A5568', fontWeight: 600 }}
            >
              Onboarding Setup
            </button>
          )}
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'user' })}
            className="rounded-lg px-3 py-1.5 text-[13px]"
            style={{ background: 'transparent', color: '#4A5568', fontWeight: 600 }}
          >
            User
          </button>
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'user-handle' })}
            className="rounded-lg px-3 py-1.5 text-[13px]"
            style={{ background: 'transparent', color: '#4A5568', fontWeight: 600 }}
          >
            User Handle
          </button>
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'user-requests' })}
            className="rounded-lg px-3 py-1.5 text-[13px]"
            style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)', color: '#fff', fontWeight: 600 }}
          >
            User Requests {isAdmin && totalPendingRequests > 0 ? `(${totalPendingRequests})` : ''}
          </button>
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'knowledge-base' })}
            className="rounded-lg px-3 py-1.5 text-[13px]"
            style={{ background: 'transparent', color: '#4A5568', fontWeight: 600 }}
          >
            Knowledge Base
          </button>
        </div> */}

        {!isAdmin ? (
          <div className="px-3 py-2 rounded-lg text-[12px]" style={{ background: '#FFF8E1', color: '#8A6D3B', border: '1px solid #FFE0B2' }}>
            User requests are visible for admins only.
          </div>
        ) : (orgAccessRequests.length === 0 && pendingUsers.length === 0) ? (
          <div className="bg-white rounded-xl border p-6" style={{ borderColor: '#E8EFE8' }}>
            <p className="text-[13px]" style={{ color: '#4A5568' }}>No pending user requests.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {isOnboardingOrgAdmin && (
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#B7E4C7', background: '#F6FFF9' }}>
                <div className="px-4 py-3 flex items-center gap-2 border-b" style={{ borderColor: '#B7E4C7', background: '#E8F5E9' }}>
                  <Clock className="w-4 h-4" style={{ color: '#1B5E20' }} />
                  <span className="text-[12px] font-bold uppercase tracking-wider" style={{ color: '#1B5E20' }}>
                    Org Access Requests — {orgAccessRequests.length}
                  </span>
                </div>
                {orgAccessRequests.length === 0 ? (
                  <div className="px-4 py-4 text-[13px]" style={{ color: '#4A5568' }}>
                    No pending org access requests.
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: '#CFEFD9' }}>
                    {orgAccessRequests.map((req) => (
                      <div key={req.request_id} className="px-4 py-3 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-[12px] font-bold" style={{ background: '#D1FAE5', color: '#065F46' }}>
                          {(req.name || req.email || "U").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold truncate" style={{ color: '#0A0A0A' }}>{req.name || "Requested User"}</p>
                          <p className="text-[12px] truncate" style={{ color: '#6B7280' }}>{req.email}</p>
                          <p className="text-[11px]" style={{ color: '#9CA3AF' }}>Org: {req.org_code}</p>
                        </div>
                        <select
                          value={orgRequestRoles[req.request_id] || "Worker/Contractor"}
                          onChange={(e) => setOrgRequestRoles((prev) => ({
                            ...prev,
                            [req.request_id]: e.target.value as typeof ONBOARDING_USER_ROLE_OPTIONS[number],
                          }))}
                          className="h-9 px-2.5 rounded-lg border text-[12px] bg-white"
                          style={{ borderColor: '#C8E6C9', color: '#1F2937' }}
                        >
                          {ONBOARDING_USER_ROLE_OPTIONS.map((role) => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                        <button
                          disabled={orgRequestActionId === req.request_id}
                          onClick={() => handleOrgRequestReview(req.request_id, "approve")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-[12px] font-semibold disabled:opacity-60"
                          style={{ background: '#2E7D32' }}
                        >
                          {orgRequestActionId === req.request_id
                            ? <span className="w-3.5 h-3.5 border border-white/40 border-t-white rounded-full animate-spin" />
                            : <CheckCircle2 className="w-3.5 h-3.5" />} Approve
                        </button>
                        <button
                          disabled={orgRequestActionId === req.request_id}
                          onClick={() => handleOrgRequestReview(req.request_id, "reject")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold border disabled:opacity-60"
                          style={{ borderColor: '#FECACA', color: '#DC2626', background: '#FFF5F5' }}
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {pendingUsers.length > 0 && (
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#FED7AA', background: '#FFFBF5' }}>
                <div className="px-4 py-3 flex items-center gap-2 border-b" style={{ borderColor: '#FED7AA', background: '#FFF3E0' }}>
                  <Clock className="w-4 h-4" style={{ color: '#E65100' }} />
                  <span className="text-[12px] font-bold uppercase tracking-wider" style={{ color: '#E65100' }}>
                    Platform User Requests — {pendingUsers.length}
                  </span>
                </div>
                <div className="divide-y" style={{ borderColor: '#FEE0B2' }}>
                  {pendingUsers.map(u => (
                    <div key={u.uid} className="px-4 py-3 flex items-center gap-3">
                      {u.photoURL
                        ? <img src={u.photoURL} className="w-9 h-9 rounded-full object-cover shrink-0" />
                        : (
                          <div className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-[12px] font-bold" style={{ background: '#FFE0B2', color: '#E65100' }}>
                            {initials(u)}
                          </div>
                        )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold truncate" style={{ color: '#0A0A0A' }}>{u.displayName || "—"}</p>
                        <p className="text-[12px] truncate" style={{ color: '#6B7280' }}>{u.email}</p>
                      </div>
                      <button
                        disabled={loadingUid === u.uid}
                        onClick={() => handleApprove(u.uid, u.role ?? "Worker")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-[12px] font-semibold disabled:opacity-60"
                        style={{ background: '#2E7D32' }}
                      >
                        {loadingUid === u.uid
                          ? <span className="w-3.5 h-3.5 border border-white/40 border-t-white rounded-full animate-spin" />
                          : <CheckCircle2 className="w-3.5 h-3.5" />} Approve
                      </button>
                      <button
                        disabled={loadingUid === u.uid}
                        onClick={() => handleDeleteUser(u.uid)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold border disabled:opacity-60"
                        style={{ borderColor: '#FECACA', color: '#DC2626', background: '#FFF5F5' }}
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 relative" onClick={() => roleMenuUid && setRoleMenuUid(null)}>
      <div className="inline-flex rounded-xl border p-1" style={{ borderColor: '#E2E8E2', background: '#ffffff' }}>
        {/* {showOnboardingSetupTab && (
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'onboarding-setup' })}
            className="rounded-lg px-3 py-1.5 text-[13px]"
            style={{ background: 'transparent', color: '#4A5568', fontWeight: 600 }}
          >
            Onboarding Setup
          </button>
        )}
        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'user' })}
          className="rounded-lg px-3 py-1.5 text-[13px]"
          style={{ background: 'transparent', color: '#4A5568', fontWeight: 600 }}
        >
          User
        </button>
        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'user-handle' })}
          className="rounded-lg px-3 py-1.5 text-[13px]"
          style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)', color: '#fff', fontWeight: 600 }}
        >
          User Handle
        </button>
        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'user-requests' })}
          className="rounded-lg px-3 py-1.5 text-[13px]"
          style={{ background: 'transparent', color: '#4A5568', fontWeight: 600 }}
        >
          User Requests {isAdmin && totalPendingRequests > 0 ? `(${totalPendingRequests})` : ''}
        </button>
        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'knowledge-base' })}
          className="rounded-lg px-3 py-1.5 text-[13px]"
          style={{ background: 'transparent', color: '#4A5568', fontWeight: 600 }}
        >
          Knowledge Base
        </button> */}
      </div>

      <PeopleDashboardSection currentUserName={currentUser?.name} overview={peopleOverview} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1>Users</h1>
          {totalPendingRequests > 0 && (
            <span className="px-2.5 py-1 rounded-full text-[12px]" style={{ background: '#FFF3E0', color: '#E65100', fontWeight: 600 }}>
              {totalPendingRequests} pending
            </span>
          )}
        </div>
        <button onClick={handleAddUser} className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-[13px]" style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)', fontWeight: 600 }}>
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      {/* ── Pending Approvals (Admin only) ── */}
      {isAdmin && pendingUsers.length > 0 && (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#FED7AA', background: '#FFFBF5' }}>
          <div className="px-4 py-3 flex items-center gap-2 border-b" style={{ borderColor: '#FED7AA', background: '#FFF3E0' }}>
            <Clock className="w-4 h-4" style={{ color: '#E65100' }} />
            <span className="text-[12px] font-bold uppercase tracking-wider" style={{ color: '#E65100' }}>
              Pending Approvals — {pendingUsers.length}
            </span>
          </div>
          <div className="divide-y" style={{ borderColor: '#FEE0B2' }}>
            {pendingUsers.map(u => (
              <div key={u.uid} className="px-4 py-3 flex items-center gap-3">
                {u.photoURL
                  ? <img src={u.photoURL} className="w-9 h-9 rounded-full object-cover shrink-0" />
                  : (
                    <div className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-[12px] font-bold" style={{ background: '#FFE0B2', color: '#E65100' }}>
                      {initials(u)}
                    </div>
                  )}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold truncate" style={{ color: '#0A0A0A' }}>{u.displayName || "—"}</p>
                  <p className="text-[12px] truncate" style={{ color: '#6B7280' }}>{u.email}</p>
                </div>
                {/* Role picker */}
                <div className="relative" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => setRoleMenuUid(roleMenuUid === u.uid ? null : u.uid)}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-medium border"
                    style={{ borderColor: '#E2E8E2', color: '#374151', background: '#fff' }}
                  >
                    {u.role ?? "Assign role"} <ChevronDown className="w-3 h-3" />
                  </button>
                  {roleMenuUid === u.uid && (
                    <div className="absolute top-9 left-0 z-10 bg-white shadow-xl rounded-xl border py-1 min-w-[150px]" style={{ borderColor: '#E2E8E2' }}>
                      {ROLES.map(r => (
                        <button key={r}
                          onClick={() => { setAppUsers(prev => prev.map(x => x.uid === u.uid ? { ...x, role: r } : x)); setRoleMenuUid(null); }}
                          className="w-full text-left px-4 py-2 text-[12px] hover:bg-[#F4F7F4]" style={{ color: '#374151' }}>
                          {r}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  disabled={loadingUid === u.uid}
                  onClick={() => handleApprove(u.uid, u.role ?? "Worker")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-[12px] font-semibold disabled:opacity-60"
                  style={{ background: '#2E7D32' }}
                >
                  {loadingUid === u.uid
                    ? <span className="w-3.5 h-3.5 border border-white/40 border-t-white rounded-full animate-spin" />
                    : <CheckCircle2 className="w-3.5 h-3.5" />} Approve
                </button>
                <button
                  disabled={loadingUid === u.uid}
                  onClick={() => handleDeleteUser(u.uid)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold border disabled:opacity-60"
                  style={{ borderColor: '#FECACA', color: '#DC2626', background: '#FFF5F5' }}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9CA3AF' }} />
          <input
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-lg border text-[13px]"
            style={{ borderColor: '#E2E8E2' }}
          />
        </div>
        <select
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
          className="px-3 py-2 rounded-lg border text-[13px] bg-white"
          style={{ borderColor: '#E2E8E2', color: '#4A5568' }}
        >
          <option>All Roles</option>
          {employeeRoleOptions.map(r => <option key={r}>{r}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-lg border text-[13px] bg-white"
          style={{ borderColor: '#E2E8E2', color: '#4A5568' }}
        >
          <option>All Statuses</option>
          <option>Active</option>
          <option>On Leave</option>
        </select>
      </div>

      {/* ── Employees Table ── */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#E8EFE8', boxShadow: '0px 2px 12px rgba(27, 94, 32, 0.08)' }}>
        <div className="px-4 py-3 flex items-center gap-2 border-b" style={{ borderColor: '#EEF2EE', background: '#F4F7F4' }}>
          <ShieldCheck className="w-4 h-4" style={{ color: '#2E7D32' }} />
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#2E7D32' }}>
            Employees — {filteredEmployees.length}
          </span>
        </div>
        <table className="w-full">
          <thead>
            <tr style={{ background: '#F4F7F4' }}>
              {["Name", "Role", "Department", "Site", "Employment Type", "Status"].map(h => (
                <th key={h} className="px-4 py-3 text-left">
                  <span className="text-[11px] uppercase tracking-[0.5px]" style={{ color: '#9CA3AF', fontWeight: 600 }}>{h}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center">
                  <UsersIcon className="w-8 h-8 mx-auto mb-2 opacity-20" style={{ color: '#9CA3AF' }} />
                  <p className="text-[13px]" style={{ color: '#9CA3AF' }}>No employees found</p>
                </td>
              </tr>
            ) : filteredEmployees.map(e => (
              <tr key={e.id} className="group hover:bg-[#F9FBF9] transition-colors" style={{ borderBottom: '1px solid #EEF2EE' }}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px]" style={{ background: 'linear-gradient(135deg, #1B5E20, #43A047)', fontWeight: 600 }}>
                      {employeeInitials(e)}
                    </div>
                    <span className="text-[13px]" style={{ color: '#0A0A0A', fontWeight: 500 }}>{e.full_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <RoleBadge role={e.role_name ?? "Worker"} />
                </td>
                <td className="px-4 py-3 text-[13px]" style={{ color: '#4A5568' }}>{e.department_name ?? "—"}</td>
                <td className="px-4 py-3 text-[13px]" style={{ color: '#4A5568' }}>{e.site_name ?? "—"}</td>
                <td className="px-4 py-3 text-[13px]" style={{ color: '#4A5568' }}>{e.employment_type ?? "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: e.active_status === 'Active' ? '#2E7D32' : '#C78800' }} />
                    <span className="text-[13px]" style={{ color: e.active_status === 'Active' ? '#2E7D32' : '#C78800', fontWeight: 500 }}>{e.active_status ?? "Unknown"}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── User Detail Slide-over ── */}
      {showDetail && selectedUser && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowDetail(false)} />
          <div className="fixed right-0 top-0 bottom-0 w-[480px] bg-white z-50 shadow-2xl flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: '#E2E8E2' }}>
              <h2>User Details</h2>
              <button onClick={() => setShowDetail(false)} className="p-1.5 rounded-lg hover:bg-[#F4F7F4]">
                <X className="w-5 h-5" style={{ color: '#4A5568' }} />
              </button>
            </div>

            {/* User Header */}
            <div className="px-6 py-5 flex items-center gap-4 border-b" style={{ borderColor: '#EEF2EE' }}>
              {selectedUser.photoURL
                ? <img src={selectedUser.photoURL} className="w-14 h-14 rounded-full object-cover" />
                : (
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-[18px]" style={{ background: 'linear-gradient(135deg, #1B5E20, #43A047)', fontWeight: 600 }}>
                    {initials(selectedUser)}
                  </div>
                )}
              <div>
                <div className="text-[16px]" style={{ color: '#0A0A0A', fontWeight: 600 }}>{selectedUser.displayName || "—"}</div>
                <div className="text-[13px]" style={{ color: '#4A5568' }}>{selectedUser.email}</div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b px-6" style={{ borderColor: '#EEF2EE' }}>
              {[{ id: "profile", label: "Profile" }, { id: "activity", label: "Activity Log" }].map(t => (
                <button
                  key={t.id}
                  onClick={() => setDetailTab(t.id)}
                  className="px-4 py-2.5 text-[13px] relative"
                  style={{ color: detailTab === t.id ? '#1B5E20' : '#4A5568', fontWeight: detailTab === t.id ? 600 : 400 }}
                >
                  {t.label}
                  {detailTab === t.id && <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: '#1B5E20' }} />}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {detailTab === "profile" ? (
                <div className="space-y-5">
                  <div>
                    <label className="block mb-1.5">Role</label>
                    <select
                      value={selectedUser.role ?? "Worker"}
                      onChange={e => isAdmin && handleRoleChange(selectedUser.uid, e.target.value as UserRole)}
                      disabled={!isAdmin}
                      className="w-full h-10 px-3 rounded-lg border text-[13px] bg-white disabled:opacity-60"
                      style={{ borderColor: '#E2E8E2' }}
                    >
                      {ROLES.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  {isAdmin && (
                    <div className="pt-2">
                      <button
                        onClick={() => { handleRevoke(selectedUser.uid); setShowDetail(false); }}
                        className="w-full py-2.5 rounded-lg text-[13px] font-semibold border"
                        style={{ borderColor: '#FECACA', color: '#DC2626', background: '#FFF5F5' }}
                      >
                        <XCircle className="inline w-4 h-4 mr-1.5 -mt-0.5" /> Revoke Access
                      </button>
                      <button
                        onClick={() => handleDeleteUser(selectedUser.uid)}
                        className="w-full mt-2 py-2.5 rounded-lg text-[13px] font-semibold border"
                        style={{ borderColor: '#FECACA', color: '#DC2626', background: '#FFF5F5' }}
                      >
                        <Trash2 className="inline w-4 h-4 mr-1.5 -mt-0.5" /> Delete User
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-0">
                  {activityLog.map((a, i) => (
                    <div key={i} className="flex items-start gap-3 py-3 border-b" style={{ borderColor: '#EEF2EE' }}>
                      <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#9CA3AF' }} />
                      <div>
                        <div className="text-[13px]" style={{ color: '#0A0A0A' }}>{a.action}</div>
                        <div className="text-[11px]" style={{ color: '#9CA3AF' }}>{a.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
