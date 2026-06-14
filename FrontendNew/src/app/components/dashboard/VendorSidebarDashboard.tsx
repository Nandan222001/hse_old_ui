import { AlertTriangle, Sparkles } from "lucide-react";

type VendorSidebarDashboardProps = {
  currentUserName?: string;
};

const exposureMonths = [
  { month: "Jan", value: 84 },
  { month: "Feb", value: 128 },
  { month: "Mar", value: 108 },
  { month: "Apr", value: 96 },
  { month: "May", value: 124 },
  { month: "Jun", value: 136 },
  { month: "Jul", value: 116 },
  { month: "Aug", value: 112 },
  { month: "Sep", value: 62 },
];

const competencyRows = [
  { label: "Site Induction", value: 30 },
  { label: "Electrical Safety", value: 80 },
  { label: "Work at Height", value: 75 },
  { label: "Categories", value: 10 },
];

const highRiskContractors = [
  "Contractor A (95% Risk)",
  "Contractor B (88% Risk)",
];

const permitViolations = [
  { label: "Contractor A: Permit Violations", time: "12:35:33 PM" },
  { label: "Contractor B: Permit Violations", time: "11:33:58 PM" },
  { label: "Contractor C: Permit Violations", time: "11:33:33 PM" },
];

const repeatBreaches = [
  "Contractor A (1 Breach)",
  "Contractor B (Breach3)",
  "Contractor C (Breach1)",
];

const watchlist = [
  "Contractor A (95% Risk)",
  "Contractor B (85% Risk)",
  "Contractor C (85% Risk)",
  "Contractor D (85% Risk)",
  "Contractor E (85% Risk)",
];

const capaClosure = [
  { item: "Item 1 - Closed", status: "Closed" },
  { item: "Item 2 - In Progress", status: "Closed" },
  { item: "Item 3 - In Progress", status: "Closed" },
];

const openActions = [
  { action: "Action X - Due Today", due: "Due Today" },
  { action: "Action Y - Due Next Week", due: "Due Today" },
  { action: "Action Y - Due Next Week", due: "Due Next Week" },
];

function ComplianceDonut() {
  return (
    <svg viewBox="0 0 100 100" className="h-[96px] w-[96px]">
      <circle cx="50" cy="50" r="32" fill="none" stroke="#E5E7EB" strokeWidth="12" />
      <circle
        cx="50"
        cy="50"
        r="32"
        fill="none"
        stroke="#58B469"
        strokeWidth="12"
        strokeDasharray="64 201"
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
      />
      <circle
        cx="50"
        cy="50"
        r="32"
        fill="none"
        stroke="#E3B13B"
        strokeWidth="12"
        strokeDasharray="90 175"
        strokeDashoffset="-70"
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
      />
      <circle cx="50" cy="50" r="20" fill="#FFFFFF" />
      <text x="50" y="47" textAnchor="middle" fontSize="8" fill="#6B7280" fontWeight="600">Total</text>
      <text x="50" y="56" textAnchor="middle" fontSize="8" fill="#6B7280" fontWeight="600">contractors</text>
    </svg>
  );
}

export function VendorSidebarDashboard({ currentUserName }: VendorSidebarDashboardProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl leading-tight font-extrabold sm:text-3xl md:text-4xl" style={{ color: "#1F2937" }}>
        Welcome, {currentUserName || "Feroze"}
      </h2>

      <div
        className="rounded-xl border p-3 md:p-4"
        style={{
          borderColor: "#C7CFDD",
          background: "linear-gradient(180deg, #F8FAFD 0%, #EFF3F9 100%)",
          boxShadow: "0 14px 28px rgba(31, 41, 55, 0.08)",
        }}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-xl border p-3" style={{ borderColor: "#B9C2D3", background: "#FFFFFF" }}>
            <h3 className="text-xl font-extrabold sm:text-2xl" style={{ color: "#1F2937" }}>Left Panel &amp; Compliance</h3>

            <div className="rounded-lg border p-3" style={{ borderColor: "#D9E0EF", background: "#F2F5FC" }}>
              <div className="text-lg font-bold sm:text-xl" style={{ color: "#202637" }}>Contractor Risk Score</div>
              <div className="mt-1 flex items-end gap-2">
                <span className="text-4xl leading-none font-extrabold sm:text-5xl" style={{ color: "#1F2937" }}>7.2/10</span>
                <span className="pb-2 text-lg font-bold sm:text-xl" style={{ color: "#4EA968" }}>▲ 1.5</span>
              </div>
            </div>

            <div className="rounded-lg border p-3" style={{ borderColor: "#D9E0EF", background: "#FFFFFF" }}>
              <h4 className="text-lg font-bold sm:text-xl" style={{ color: "#202637" }}>Contractor Compliance</h4>
              <div className="mt-2 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <ComplianceDonut />
                <div className="space-y-2 text-[15px]">
                  <div className="flex items-center gap-2"><span className="h-3.5 w-3.5 rounded-sm" style={{ background: "#58B469" }} />Compliant (32%)</div>
                  <div className="flex items-center gap-2"><span className="h-3.5 w-3.5 rounded-sm" style={{ background: "#E3B13B" }} />Non-Compliant (45%)</div>
                  <div className="flex items-center gap-2"><span className="h-3.5 w-3.5 rounded-sm" style={{ background: "#9CA3AF" }} />Pending (0%)</div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-3" style={{ borderColor: "#D9E0EF", background: "#FFFFFF" }}>
              <h4 className="text-lg font-bold sm:text-xl" style={{ color: "#202637" }}>Contractor Exposure Hours</h4>
              <div className="mt-3 h-[146px] overflow-hidden rounded-md border px-2 pt-2" style={{ borderColor: "#E2E8F0", background: "#FAFBFD" }}>
                <div className="relative h-[110px]">
                  <div className="absolute left-0 right-0 top-[31px] border-t border-dashed" style={{ borderColor: "#94A3B8" }} />
                  <span className="absolute right-0 top-[14px] text-[11px] font-semibold" style={{ color: "#475569" }}>Threshold</span>
                  <div className="flex h-full items-end gap-2 pt-1">
                    {exposureMonths.map((entry) => (
                      <div key={entry.month} className="flex flex-1 flex-col items-center gap-1">
                        <div className="w-full max-w-[18px] rounded-t" style={{ height: `${entry.value}px`, background: "#5F6E94" }} />
                        <span className="text-[10px]" style={{ color: "#6B7280" }}>{entry.month}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-3" style={{ borderColor: "#D9E0EF", background: "#FFFFFF" }}>
              <h4 className="text-lg font-bold sm:text-xl" style={{ color: "#202637" }}>Competency/Certifications</h4>
              <div className="mt-2 space-y-2">
                {competencyRows.map((row) => (
                  <div key={row.label}>
                    <div className="mb-1 flex items-center justify-between text-[14px] font-medium" style={{ color: "#374151" }}>
                      <span>{row.label}</span>
                      <span>{row.value}%</span>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: "#E5E7EB" }}>
                      <div className="h-full rounded-full" style={{ width: `${row.value}%`, background: "#6B7BA5" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border p-3" style={{ borderColor: "#B9C2D3", background: "#FFFFFF" }}>
            <h3 className="text-xl font-extrabold sm:text-2xl" style={{ color: "#1F2937" }}>Breaches &amp; Tracking</h3>

            <div className="rounded-lg border p-3" style={{ borderColor: "#E9BDC0", background: "#FDF1F2" }}>
              <div className="mb-2 flex items-center justify-between">
                <h4 className="flex items-center gap-2 text-base font-bold sm:text-lg" style={{ color: "#621E24" }}>
                  <AlertTriangle className="h-5 w-5" /> High Risk Contractors (Predictive)
                </h4>
                <Sparkles className="h-5 w-5" style={{ color: "#202637" }} />
              </div>
              <div className="space-y-1 text-sm sm:text-base" style={{ color: "#111827" }}>
                {highRiskContractors.map((row) => <div key={row}>{row}</div>)}
              </div>
            </div>

            <div className="rounded-lg border p-3" style={{ borderColor: "#ECDDA6", background: "#FFF9EA" }}>
              <h4 className="mb-2 flex items-center gap-2 text-base font-bold sm:text-lg" style={{ color: "#7A5608" }}>
                <AlertTriangle className="h-5 w-5" /> Permit Violations
              </h4>
              <div className="space-y-2 text-sm sm:text-base" style={{ color: "#111827" }}>
                {permitViolations.map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-2">
                    <span>{row.label}</span>
                    <span className="text-[14px]" style={{ color: "#6B7280" }}>{row.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border p-3" style={{ borderColor: "#E8DCA9", background: "#FFFBEF" }}>
              <h4 className="mb-2 flex items-center gap-2 text-base font-bold sm:text-lg" style={{ color: "#8B5C0A" }}>
                <AlertTriangle className="h-5 w-5" /> Repeat Breaches
              </h4>
              <div className="space-y-1 text-sm sm:text-base" style={{ color: "#111827" }}>
                {repeatBreaches.map((row) => <div key={row}>{row}</div>)}
              </div>
            </div>

            <div className="rounded-lg border p-3" style={{ borderColor: "#E7A7AD", background: "#FDEEF0" }}>
              <h4 className="mb-2 text-base font-bold sm:text-lg" style={{ color: "#A11F2C" }}>Contractor Watchlist</h4>
              <div className="space-y-1 text-sm sm:text-base" style={{ color: "#111827" }}>
                {watchlist.map((row) => <div key={row}>{row}</div>)}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 rounded-xl border p-3 md:grid-cols-2" style={{ borderColor: "#8ED5D8", background: "#F7FFFF" }}>
          <div>
            <h4 className="text-base font-bold sm:text-lg" style={{ color: "#1F2937" }}>Contractor CAPA Closure</h4>
            <div className="mt-2 space-y-1 text-sm sm:text-base" style={{ color: "#1F2937" }}>
              {capaClosure.map((row) => (
                <div key={row.item} className="flex items-center justify-between gap-2">
                  <span>{row.item}</span>
                  <span style={{ color: "#2F855A", fontWeight: 700 }}>{row.status}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-base font-bold sm:text-lg" style={{ color: "#1F2937" }}>Open Actions</h4>
            <div className="mt-2 space-y-1 text-sm sm:text-base" style={{ color: "#1F2937" }}>
              {openActions.map((row, idx) => (
                <div key={`${row.action}-${idx}`} className="flex items-center justify-between gap-2">
                  <span>{row.action}</span>
                  <span style={{ color: row.due.includes("Week") ? "#A94442" : "#C53030", fontWeight: 700 }}>{row.due}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}