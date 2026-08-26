import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { AlertTriangle, Sparkles, TrendingUp, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getVendorSummary,
  type VendorSummary,
  type CapaItem,
  type OpenAction,
} from "../../services/vendors.service";

// Same High/Medium/Low vocabulary the dashboard's contractor_risk_label
// panel colors by (DashboardPage.tsx) — one severity mapping for both
// screens instead of each page re-deriving its own numeric threshold.
const RISK_LABEL_COLOR: Record<string, { text: string; bg: string; border: string }> = {
  High:   { text: "#B91C1C", bg: "#FFF1F2", border: "#FCA5A5" },
  Medium: { text: "#C2410C", bg: "#FFF7ED", border: "#FDBA74" },
  Low:    { text: "#15803D", bg: "#F0FDF4", border: "#86EFAC" },
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

function EmptyState({ text }: { text: string }) {
  return (
    <div className="py-6 text-center text-[12px]" style={{ color: "#9CA3AF" }}>{text}</div>
  );
}

// ── Status pill ───────────────────────────────────────────────────────────────
type PillStatus = CapaItem["status"] | OpenAction["due"];

function StatusPill({ status }: { status: PillStatus }) {
  let bg = "#F1F5F9", color = "#64748B";
  if (status === "Closed")                              { bg = "#DCFCE7"; color = "#15803D"; }
  else if (status === "In Progress")                   { bg = "#FEF3C7"; color = "#B45309"; }
  else if (status === "Due Today" || status === "Overdue") { bg = "#FEE2E2"; color = "#B91C1C"; }
  else if (status === "Due Next Week" || status === "Due This Week") { bg = "#FEF3C7"; color = "#B45309"; }

  return (
    <span className="text-[10px] px-2.5 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap"
      style={{ background: bg, color, fontWeight: 700 }}>
      {status}
    </span>
  );
}

// ── Alert card (tinted, left border) ─────────────────────────────────────────
function AlertCard({
  title, tint, accent, children, ai = false,
}: {
  title: string; tint: string; accent: string;
  children: React.ReactNode; ai?: boolean;
}) {
  return (
    <div
      className="rounded-2xl border p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)]"
      style={{ background: tint, borderColor: accent + "55", borderLeftWidth: 3, borderLeftColor: accent }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: accent }} />
          <span className="text-[14px]" style={{ color: accent, fontWeight: 700 }}>{title}</span>
        </div>
        {ai && (
          <div className="flex items-center gap-1 rounded-full px-2 py-0.5" style={{ background: "#EEF2FF" }}>
            <Sparkles className="w-3 h-3" style={{ color: "#4F46E5" }} />
            <span className="text-[9px]" style={{ color: "#4F46E5", fontWeight: 700 }}>AI</span>
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function AlertRow({ left, right }: { left: string; right: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b last:border-0"
      style={{ borderColor: "rgba(0,0,0,0.06)" }}>
      <span className="text-[12px] truncate mr-2" style={{ color: "#374151", fontWeight: 500 }}>{left}</span>
      <span className="text-[11px] flex-shrink-0" style={{ color: "#6B7280" }}>{right}</span>
    </div>
  );
}

function TrackingRow({ label, status }: { label: string; status: PillStatus }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b last:border-0"
      style={{ borderColor: "#F1F5F9" }}>
      <span className="text-[12px] truncate mr-3" style={{ color: "#374151", fontWeight: 500 }}>{label}</span>
      <StatusPill status={status} />
    </div>
  );
}

// ── Page skeleton loader ──────────────────────────────────────────────────────
function Skeleton({ h = "h-4" }: { h?: string }) {
  return <div className={`${h} rounded-lg animate-pulse`} style={{ background: "#F1F5F9" }} />;
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function VendorsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<VendorSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getVendorSummary()
      .then(setData)
      .catch(() => setError("Failed to load vendor data"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-5">
        <div><Skeleton h="h-7" /><div className="mt-2"><Skeleton h="h-4" /></div></div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {[...Array(8)].map((_, i) => (
            <Card key={i}><Skeleton h="h-32" /></Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 mx-auto mb-2" style={{ color: "#EF4444" }} />
          <p className="text-[14px]" style={{ color: "#6B7280" }}>{error || "No data available"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div>
        <h1 className="text-[22px]" style={{ color: "#0A0A0A", fontWeight: 700 }}>Vendors</h1>
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

          {/* Risk Score */}
          <Card>
            <CardTitle>Contractor Risk Score</CardTitle>
            <div className="flex items-end gap-3">
              <span
                className="text-[48px] leading-none"
                style={{
                  color: data.risk_score.has_contractors === false
                    ? "#111827"
                    : RISK_LABEL_COLOR[data.risk_score.label]?.text ?? "#111827",
                  fontWeight: 700,
                }}
              >
                {data.risk_score.has_contractors === false ? "N/A" : `${data.risk_score.value}/10`}
              </span>
              {data.risk_score.has_contractors !== false && (
                <span
                  className="mb-2 rounded-full px-2.5 py-1 text-[12px]"
                  style={{
                    background: RISK_LABEL_COLOR[data.risk_score.label]?.bg ?? "#F1F5F9",
                    color: RISK_LABEL_COLOR[data.risk_score.label]?.text ?? "#475569",
                    fontWeight: 700,
                  }}
                >
                  {data.risk_score.label}
                </span>
              )}
              {data.risk_score.delta !== null && (
                <div className="mb-2 flex items-center gap-1 rounded-full px-2.5 py-1"
                  style={{ background: data.risk_score.up ? "#DCFCE7" : "#FEE2E2" }}>
                  <TrendingUp className="w-3.5 h-3.5" style={{ color: data.risk_score.up ? "#16A34A" : "#EF4444" }} />
                  <span className="text-[13px]" style={{ color: data.risk_score.up ? "#16A34A" : "#EF4444", fontWeight: 700 }}>
                    {data.risk_score.delta > 0 ? "+" : ""}{data.risk_score.delta}
                  </span>
                </div>
              )}
            </div>
            <p className="mt-1 text-[12px]" style={{ color: "#6B7280" }}>
              Based on {data.total_contractors} contractor{data.total_contractors !== 1 ? "s" : ""} tracked
            </p>
            <p className="mt-1 text-[11px]" style={{ color: "#9CA3AF" }}>
              Estimate derived from the Employment_Type field, not an audited contractor safety record — treat as indicative only.
            </p>
          </Card>

          {/* Compliance donut */}
          <Card>
            <CardTitle>Contractor Compliance</CardTitle>
            {data.total_contractors === 0 ? (
              <EmptyState text="No contractor employees found" />
            ) : (
              <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <PieChart width={120} height={120}>
                    <Pie data={data.compliance} cx={55} cy={55}
                      innerRadius={36} outerRadius={55} dataKey="value" strokeWidth={0}>
                      {data.compliance.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                  </PieChart>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[18px] leading-none" style={{ color: "#111827", fontWeight: 700 }}>
                      {data.total_contractors}
                    </span>
                    <span className="text-[9px] text-center leading-tight mt-0.5" style={{ color: "#6B7280" }}>
                      Total<br />contractors
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2.5 flex-1">
                  {data.compliance.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                      <span className="text-[12px] flex-1" style={{ color: "#374151" }}>{item.name}</span>
                      <span className="text-[12px]" style={{ color: "#111827", fontWeight: 600 }}>{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <p className="mt-2 text-[11px]" style={{ color: "#9CA3AF" }}>
              Based on induction date and incident history — not a formal induction/compliance audit.
            </p>
          </Card>

          {/* Exposure Hours bar chart */}
          <Card>
            <CardTitle>Contractor Exposure Hours</CardTitle>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.exposure_hours} margin={{ top: 16, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 12 }}
                  labelStyle={{ fontWeight: 600, color: "#111827" }}
                />
                <ReferenceLine
                  y={data.threshold}
                  stroke="#EF4444"
                  strokeDasharray="5 3"
                  strokeWidth={1.5}
                  label={{ value: "Threshold", position: "insideTopRight", fontSize: 10, fill: "#EF4444", fontWeight: 600, dy: -4 }}
                />
                <Bar dataKey="hours" fill="#64748B" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Certifications */}
          <Card>
            <CardTitle>Competency / Certifications</CardTitle>
            {data.certifications.every(c => c.pct === 0) ? (
              <EmptyState text="No training program data available" />
            ) : (
              <div className="space-y-3">
                {data.certifications.map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px]" style={{ color: "#374151", fontWeight: 500 }}>{item.label}</span>
                      <span className="text-[12px]" style={{ color: "#111827", fontWeight: 700 }}>{item.pct}%</span>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: "#E2E8F0" }}>
                      <div
                        className="h-2 rounded-full"
                        style={{ width: `${item.pct}%`, background: "linear-gradient(90deg,#4F46E5,#818CF8)" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="space-y-5">
          <div className="text-[18px]" style={{ color: "#111827", fontWeight: 700 }}>
            Breaches &amp; Tracking
          </div>

          {/* High Risk Contractors */}
          <AlertCard title="High Risk Contractors (Predictive)" tint="#FEF2F2" accent="#EF4444" ai>
            {data.high_risk.length === 0
              ? <EmptyState text="No high-risk contractors found" />
              : data.high_risk.map((c) => (
                  <AlertRow key={c.name} left={c.name} right={`${c.risk}% Risk`} />
                ))}
          </AlertCard>

          {/* Permit Violations */}
          <AlertCard title="Permit Violations" tint="#FFFBEB" accent="#F59E0B">
            {data.permit_violations.length === 0
              ? <EmptyState text="No permit violations found" />
              : data.permit_violations.map((c, i) => (
                  <AlertRow key={i} left={`${c.name}: ${c.desc}`} right={c.time} />
                ))}
          </AlertCard>

          {/* Repeat Breaches */}
          <AlertCard title="Repeat Breaches" tint="#FFFBEB" accent="#F59E0B">
            {data.repeat_breaches.length === 0
              ? <EmptyState text="No repeat breaches found" />
              : data.repeat_breaches.map((c) => (
                  <AlertRow key={c.name} left={c.name} right={c.breach} />
                ))}
          </AlertCard>

          {/* Watchlist */}
          <AlertCard title="Contractor Watchlist" tint="#FEF2F2" accent="#EF4444">
            {data.watchlist.length === 0
              ? <EmptyState text="No contractors on watchlist" />
              : data.watchlist.map((c) => (
                  <AlertRow key={c.name} left={c.name} right={`${c.risk}% Risk`} />
                ))}
          </AlertCard>

          {/* CAPA Closure */}
          <Card>
            <CardTitle>Contractor CAPA Closure</CardTitle>
            {data.capa_items.length === 0
              ? <EmptyState text="No CAPA actions found" />
              : data.capa_items.map((item) => (
                  <TrackingRow key={item.label} label={item.label} status={item.status} />
                ))}
          </Card>

          {/* Open Actions */}
          <Card>
            <CardTitle>Open Actions</CardTitle>
            {data.open_actions.length === 0
              ? <EmptyState text="No open actions" />
              : data.open_actions.map((item, i) => (
                  <TrackingRow key={i} label={item.label} status={item.due} />
                ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
