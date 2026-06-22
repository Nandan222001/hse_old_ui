import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { AlertTriangle, Sparkles, TrendingUp } from "lucide-react";
import { useAuth } from "../context/AuthContext";

// ── Mock data ────────────────────────────────────────────────────────────────
const MOCK = {
  riskScore: { value: "7.2/10", delta: "1.5", up: true },
  totalContractors: 77,
  compliance: [
    { name: "Compliant",     value: 32, color: "#22C55E" },
    { name: "Non-Compliant", value: 45, color: "#F59E0B" },
    { name: "Pending",       value: 23, color: "#CBD5E1" },
  ],
  exposureHours: [
    { month: "Jan", hours: 420 },
    { month: "Feb", hours: 380 },
    { month: "Mar", hours: 510 },
    { month: "Apr", hours: 460 },
    { month: "May", hours: 530 },
    { month: "Jun", hours: 490 },
    { month: "Jul", hours: 610 },
    { month: "Aug", hours: 570 },
    { month: "Sep", hours: 540 },
  ],
  threshold: 500,
  certifications: [
    { label: "Site Induction",    pct: 30 },
    { label: "Electrical Safety", pct: 80 },
    { label: "Work at Height",    pct: 75 },
    { label: "Categories",        pct: 10 },
  ],
  highRisk: [
    { name: "Contractor A", risk: 95 },
    { name: "Contractor B", risk: 88 },
  ],
  permitViolations: [
    { name: "Contractor A", desc: "Permit Violations", time: "12:35:33 PM" },
    { name: "Contractor B", desc: "Permit Violations", time: "11:33:58 PM" },
    { name: "Contractor C", desc: "Permit Violations", time: "11:33:33 PM" },
  ],
  repeatBreaches: [
    { name: "Contractor A", breach: "1 Breach" },
    { name: "Contractor B", breach: "Breach3" },
    { name: "Contractor C", breach: "Breach1" },
  ],
  watchlist: [
    { name: "Contractor A", risk: 95 },
    { name: "Contractor B", risk: 85 },
    { name: "Contractor C", risk: 85 },
    { name: "Contractor D", risk: 85 },
    { name: "Contractor E", risk: 85 },
  ],
  capaItems: [
    { label: "Item 1", status: "Closed" as const },
    { label: "Item 2", status: "In Progress" as const },
    { label: "Item 3", status: "In Progress" as const },
  ],
  openActions: [
    { label: "Action X", due: "Due Today" as const },
    { label: "Action Y", due: "Due Next Week" as const },
    { label: "Action Z", due: "Due Next Week" as const },
  ],
};

// ── Shared card wrapper ───────────────────────────────────────────────────────
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border bg-white p-5 shadow-[0_6px_16px_rgba(15,23,42,0.08)] ${className}`}
      style={{ borderColor: "#D8E2F4" }}
    >
      {children}
    </div>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 text-[15px]" style={{ color: "#111827", fontWeight: 700 }}>
      {children}
    </div>
  );
}

// ── Left column cards ─────────────────────────────────────────────────────────

function RiskScoreCard() {
  return (
    <Card>
      <CardTitle>Contractor Risk Score</CardTitle>
      <div className="flex items-end gap-3">
        <span className="text-[48px] leading-none" style={{ color: "#111827", fontWeight: 700 }}>
          {MOCK.riskScore.value}
        </span>
        <div className="mb-2 flex items-center gap-1 rounded-full px-2.5 py-1"
          style={{ background: "#DCFCE7" }}>
          <TrendingUp className="w-3.5 h-3.5" style={{ color: "#16A34A" }} />
          <span className="text-[13px]" style={{ color: "#16A34A", fontWeight: 700 }}>
            {MOCK.riskScore.delta}
          </span>
        </div>
      </div>
      <p className="mt-1 text-[12px]" style={{ color: "#6B7280" }}>Overall contractor safety risk index</p>
    </Card>
  );
}

function ComplianceCard() {
  return (
    <Card>
      <CardTitle>Contractor Compliance</CardTitle>
      <div className="flex items-center gap-4">
        {/* Donut chart */}
        <div className="relative flex-shrink-0">
          <PieChart width={120} height={120}>
            <Pie
              data={MOCK.compliance}
              cx={55}
              cy={55}
              innerRadius={36}
              outerRadius={55}
              dataKey="value"
              strokeWidth={0}
            >
              {MOCK.compliance.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[18px] leading-none" style={{ color: "#111827", fontWeight: 700 }}>
              {MOCK.totalContractors}
            </span>
            <span className="text-[9px] text-center leading-tight mt-0.5" style={{ color: "#6B7280" }}>
              Total<br/>contractors
            </span>
          </div>
        </div>
        {/* Legend */}
        <div className="flex flex-col gap-2.5">
          {MOCK.compliance.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
              <span className="text-[12px]" style={{ color: "#374151" }}>{item.name}</span>
              <span className="text-[12px] ml-auto pl-3" style={{ color: "#111827", fontWeight: 600 }}>
                {item.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function ExposureHoursCard() {
  return (
    <Card>
      <CardTitle>Contractor Exposure Hours</CardTitle>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={MOCK.exposureHours} margin={{ top: 16, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid stroke="#E2E8F0" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 12 }}
            labelStyle={{ fontWeight: 600, color: "#111827" }}
          />
          <ReferenceLine
            y={MOCK.threshold}
            stroke="#EF4444"
            strokeDasharray="5 3"
            strokeWidth={1.5}
            label={{ value: "Threshold", position: "insideTopRight", fontSize: 10, fill: "#EF4444", fontWeight: 600, dy: -4 }}
          />
          <Bar dataKey="hours" fill="#64748B" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

function CertificationsCard() {
  return (
    <Card>
      <CardTitle>Competency / Certifications</CardTitle>
      <div className="space-y-3">
        {MOCK.certifications.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[12px]" style={{ color: "#374151", fontWeight: 500 }}>{item.label}</span>
              <span className="text-[12px]" style={{ color: "#111827", fontWeight: 700 }}>{item.pct}%</span>
            </div>
            <div className="h-2 rounded-full" style={{ background: "#E2E8F0" }}>
              <div
                className="h-2 rounded-full"
                style={{ width: `${item.pct}%`, background: "linear-gradient(90deg, #4F46E5, #818CF8)" }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── Right column cards ────────────────────────────────────────────────────────

function AlertCard({
  title,
  tint,
  accent,
  children,
  ai = false,
}: {
  title: string;
  tint: string;
  accent: string;
  children: React.ReactNode;
  ai?: boolean;
}) {
  return (
    <div
      className="rounded-2xl border p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)]"
      style={{ background: tint, borderColor: accent + "40", borderLeftWidth: 3, borderLeftColor: accent }}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: accent }} />
          <span className="text-[14px]" style={{ color: accent, fontWeight: 700 }}>{title}</span>
        </div>
        {ai && (
          <div className="flex items-center gap-1 rounded-full px-2 py-0.5"
            style={{ background: "#EEF2FF" }}>
            <Sparkles className="w-3 h-3" style={{ color: "#4F46E5" }} />
            <span className="text-[9px]" style={{ color: "#4F46E5", fontWeight: 700 }}>AI</span>
          </div>
        )}
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function AlertRow({ left, right }: { left: string; right: string }) {
  return (
    <div className="flex items-center justify-between py-1 px-1">
      <span className="text-[12px]" style={{ color: "#374151", fontWeight: 500 }}>{left}</span>
      <span className="text-[11px]" style={{ color: "#6B7280" }}>{right}</span>
    </div>
  );
}

function StatusPill({ status }: { status: "Closed" | "In Progress" | "Due Today" | "Due Next Week" }) {
  const cfg = {
    "Closed":        { bg: "#DCFCE7", color: "#15803D" },
    "In Progress":   { bg: "#FEF3C7", color: "#B45309" },
    "Due Today":     { bg: "#FEE2E2", color: "#B91C1C" },
    "Due Next Week": { bg: "#FEF3C7", color: "#B45309" },
  }[status];
  return (
    <span className="text-[10px] px-2.5 py-0.5 rounded-full flex-shrink-0"
      style={{ background: cfg.bg, color: cfg.color, fontWeight: 700 }}>
      {status}
    </span>
  );
}

function TrackingCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <div className="space-y-2">{children}</div>
    </Card>
  );
}

function TrackingRow({ label, status }: { label: string; status: "Closed" | "In Progress" | "Due Today" | "Due Next Week" }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b last:border-0" style={{ borderColor: "#F1F5F9" }}>
      <span className="text-[12px]" style={{ color: "#374151", fontWeight: 500 }}>{label}</span>
      <StatusPill status={status} />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function VendorsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div>
        <h1 className="text-[22px]" style={{ color: "#0A0A0A", fontWeight: 700 }}>
          Vendors
        </h1>
        <p className="mt-0.5 text-[13px]" style={{ color: "#6B7280" }}>
          Welcome, {user?.name ?? "User"} — Contractor &amp; Vendor Safety Performance
        </p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

        {/* ── LEFT COLUMN ── */}
        <div className="space-y-5">
          <div className="text-[18px]" style={{ color: "#111827", fontWeight: 700 }}>
            Left Panel &amp; Compliance
          </div>

          <RiskScoreCard />
          <ComplianceCard />
          <ExposureHoursCard />
          <CertificationsCard />
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="space-y-5">
          <div className="text-[18px]" style={{ color: "#111827", fontWeight: 700 }}>
            Breaches &amp; Tracking
          </div>

          {/* High Risk Contractors */}
          <AlertCard title="High Risk Contractors (Predictive)" tint="#FEF2F2" accent="#EF4444" ai>
            {MOCK.highRisk.map((c) => (
              <AlertRow key={c.name} left={c.name} right={`${c.risk}% Risk`} />
            ))}
          </AlertCard>

          {/* Permit Violations */}
          <AlertCard title="Permit Violations" tint="#FFFBEB" accent="#F59E0B">
            {MOCK.permitViolations.map((c) => (
              <AlertRow key={c.name} left={`${c.name}: ${c.desc}`} right={c.time} />
            ))}
          </AlertCard>

          {/* Repeat Breaches */}
          <AlertCard title="Repeat Breaches" tint="#FFFBEB" accent="#F59E0B">
            {MOCK.repeatBreaches.map((c) => (
              <AlertRow key={c.name} left={c.name} right={c.breach} />
            ))}
          </AlertCard>

          {/* Contractor Watchlist */}
          <AlertCard title="Contractor Watchlist" tint="#FEF2F2" accent="#EF4444">
            {MOCK.watchlist.map((c) => (
              <AlertRow key={c.name} left={c.name} right={`${c.risk}% Risk`} />
            ))}
          </AlertCard>

          {/* Contractor CAPA Closure */}
          <TrackingCard title="Contractor CAPA Closure">
            {MOCK.capaItems.map((item) => (
              <TrackingRow key={item.label} label={item.label} status={item.status} />
            ))}
          </TrackingCard>

          {/* Open Actions */}
          <TrackingCard title="Open Actions">
            {MOCK.openActions.map((item) => (
              <TrackingRow key={item.label} label={item.label} status={item.due} />
            ))}
          </TrackingCard>
        </div>
      </div>
    </div>
  );
}
