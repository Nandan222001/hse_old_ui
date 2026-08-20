import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, FileText, Gauge, RefreshCw, ShieldCheck, Sparkles, TriangleAlert } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getPermitsSummary, type PermitsSummary } from "../../services/analytics.service";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

function MetricCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string | number;
  hint: string;
  tone: "blue" | "green" | "amber" | "red";
}) {
  const accent =
    tone === "green" ? "#16A34A" : tone === "amber" ? "#D97706" : tone === "red" ? "#DC2626" : "#2563EB";

  return (
    <Card className="overflow-hidden border-none shadow-[0_10px_26px_rgba(15,23,42,0.08)]" style={{ background: "linear-gradient(180deg, #FFFFFF 0%, #F8FAFF 100%)" }}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em]" style={{ color: "#64748B" }}>{label}</p>
            <p className="mt-2 text-3xl font-bold" style={{ color: accent }}>{value}</p>
            <p className="mt-1 text-[12px]" style={{ color: "#64748B" }}>{hint}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: `${accent}12`, color: accent }}>
            <Gauge className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ratio(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 100);
}

export function EquipmentCertificationPage() {
  const [data, setData] = useState<PermitsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const summary = await getPermitsSummary();
      setData(summary);
    } catch {
      setError("Failed to load the Module 4 dashboard. Make sure the analytics backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const ptwCompliance = data?.permit_compliance_pct ?? 0;
  const activePermits = data?.active_permits ?? 0;
  const exposureHours = data?.work_exposure_hours ?? 0;
  const openViolations = data?.permit_violations.length ?? 0;
  const totalPermits = data ? data.work_by_type.reduce((sum, row) => sum + row.active + row.closed + row.expired, 0) : 0;
  const closedPermits = data ? data.work_by_type.reduce((sum, row) => sum + row.closed, 0) : 0;
  const controlCoverage = ratio(closedPermits, totalPermits);
  const trend = useMemo(
    () => data?.expiry_timeline.map((item) => ({
      label: item.label,
      value: Math.round(item.width),
      rightText: item.rightText,
      color: item.color,
    })) ?? [],
    [data],
  );

  const warningTone = ptwCompliance >= 90 ? "green" : ptwCompliance >= 75 ? "amber" : "red";

  return (
    <div className="space-y-6">
      <div
        className="overflow-hidden rounded-[28px] border shadow-[0_16px_40px_rgba(15,23,42,0.08)]"
        style={{
          borderColor: "#D9E4FB",
          background: "linear-gradient(135deg, #0F2E63 0%, #173A78 42%, #F8FBFF 42%, #FFFFFF 100%)",
        }}
      >
        <div className="grid gap-6 p-6 lg:grid-cols-[1.3fr_0.9fr] lg:p-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/90">
              <Sparkles className="h-3.5 w-3.5" />
              Module 4 - Assets & Operations
            </div>
            <h1 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight text-white lg:text-4xl">
              PTW-led asset control dashboard
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80">
              Built from the workbook’s computed Module 4 logic: permit-to-work compliance, LOTO proxy compliance,
              active permit pressure, and the explicit maintenance data gaps called out in the sheet.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={fetchData} disabled={loading} className="bg-white text-slate-900 hover:bg-white/90">
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh Module 4
              </Button>
              <a href="#module4-breakdown" className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/15">
                View breakdown
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="grid gap-3 rounded-[24px] border border-slate-200 bg-white/95 p-4 shadow-[0_14px_32px_rgba(15,23,42,0.12)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">PTW Compliance</p>
                <p className="mt-2 text-4xl font-bold text-slate-900">{ptwCompliance}%</p>
              </div>
              <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                {warningTone === "green" ? "On track" : warningTone === "amber" ? "Watch" : "Critical"}
              </Badge>
            </div>
            <div className="h-3 rounded-full bg-slate-200">
              <div
                className="h-3 rounded-full"
                style={{
                  width: `${Math.max(ptwCompliance, 4)}%`,
                  background: warningTone === "green"
                    ? "linear-gradient(90deg, #22C55E, #16A34A)"
                    : warningTone === "amber"
                      ? "linear-gradient(90deg, #F59E0B, #D97706)"
                      : "linear-gradient(90deg, #F87171, #DC2626)",
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-slate-50 p-3">
                <div className="text-[11px] uppercase tracking-[0.1em] text-slate-400">Active permits</div>
                <div className="mt-1 text-2xl font-bold text-slate-900">{activePermits}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <div className="text-[11px] uppercase tracking-[0.1em] text-slate-400">Exposure hours</div>
                <div className="mt-1 text-2xl font-bold text-slate-900">{exposureHours.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Permits" value={totalPermits} hint="Current PTW population in view" tone="blue" />
        <MetricCard label="LOTO Proxy" value={`${controlCoverage}%`} hint="No-deviation isolation / lockout proxy" tone="amber" />
        <MetricCard label="Deviation Alerts" value={openViolations} hint="Permits with reported deviations" tone="red" />
      </div>

      {(data?.permit_violations.length ?? 0) > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div className="text-sm">
            <div className="font-semibold">PTW risk attention required</div>
            <div className="mt-0.5 text-amber-800">
              {data?.permit_violations.length ?? 0} permits have reported deviations and should be reviewed against isolation and close-out controls.
            </div>
          </div>
        </div>
      )}

      {error ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center text-sm text-red-700">{error}</CardContent>
        </Card>
      ) : loading && !data ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-slate-500">Loading Module 4 dashboard...</CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
            <Card className="border-slate-200 shadow-[0_10px_26px_rgba(15,23,42,0.08)]">
              <CardHeader id="module4-breakdown" className="pb-2">
                <CardTitle className="flex items-center gap-2 text-[18px]">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Computation Inputs
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {[
                  { label: "Permits Issued", value: data?.work_by_type.reduce((sum, row) => sum + row.active + row.closed + row.expired, 0) ?? 0 },
                  { label: "Permits Properly Closed", value: data?.work_by_type.reduce((sum, row) => sum + row.closed, 0) ?? 0 },
                  { label: "Permits Expired", value: data?.work_by_type.reduce((sum, row) => sum + row.expired, 0) ?? 0 },
                  { label: "Permits Active", value: data?.work_by_type.reduce((sum, row) => sum + row.active, 0) ?? 0 },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">{item.label}</div>
                    <div className="mt-2 text-2xl font-bold text-slate-900">{item.value}</div>
                  </div>
                ))}
                <div className="md:col-span-2 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-slate-700">
                  Workbook note: only two KPIs are directly computable from PTW data. Maintenance, inspection, and SCE
                  KPIs remain unavailable until CMMS / asset-register data is connected.
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-[0_10px_26px_rgba(15,23,42,0.08)]">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-[18px]">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  Data Gap Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  "No CMMS or asset register was shared.",
                  "Inspection and maintenance KPIs are not computable yet.",
                  "SCE / critical equipment health needs a separate source.",
                ].map((text) => (
                  <div key={text} className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                    <TriangleAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                    <span>{text}</span>
                  </div>
                ))}
                <div className="rounded-xl border border-dashed border-slate-300 p-3 text-sm text-slate-600">
                  Suggested next feed: equipment master, inspection register, maintenance work orders, and SCE register.
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <Card className="border-slate-200 shadow-[0_10px_26px_rgba(15,23,42,0.08)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-[18px]">PTW Status Mix</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data?.work_by_type ?? []}>
                    <CartesianGrid stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "#475569", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip />
                    <Bar dataKey="closed" stackId="a" fill="#22C55E" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="active" stackId="a" fill="#F59E0B" />
                    <Bar dataKey="expired" stackId="a" fill="#EF4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-[0_10px_26px_rgba(15,23,42,0.08)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-[18px]">Expiry Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(data?.expiry_timeline ?? []).slice(0, 5).map((item) => (
                  <div key={item.label}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">{item.label}</span>
                      <span className="text-slate-500">{item.rightText}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200">
                      <div className="h-2 rounded-full" style={{ width: `${Math.max(item.width, 4)}%`, background: item.color }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="border-slate-200 shadow-[0_10px_26px_rgba(15,23,42,0.08)]">
            <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-[18px]">
            <FileText className="h-5 w-5 text-slate-700" />
                Active Permit Watchlist
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    {["Permit", "Type", "Issued By", "Location", "Status", "Expiry"].map((head) => (
                      <th key={head} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data?.active_work_rows ?? []).slice(0, 8).map((row) => (
                    <tr key={row.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{row.id}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{row.type}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{row.issued_by}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{row.location}</td>
                      <td className="px-4 py-3 text-sm">
                        <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                          {row.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">{row.expiry}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
