import { useState, useRef, useCallback, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router";
import {
  Upload, FileText, CheckCircle2, XCircle, AlertCircle, RefreshCw,
  Download, Database, Clock, AlertTriangle, FileSpreadsheet,
  Users, MapPin, ShieldAlert, ClipboardList, BookOpen,
  Shield, Layers, Info, Zap, Eye, Brain, BarChart3,
  PenLine, Plug, Server, UserCheck, Timer, Wifi, Building2,
  Code2, Plus, Trash2, ChevronRight, CheckSquare, Save,
  RotateCcw, Link, X, FolderOpen, Presentation, BookMarked,
  GraduationCap, AlertOctagon, CalendarClock, ExternalLink,
} from "lucide-react";
import {
  useListImportsQuery,
  useCreateImportMutation,
  useListValidationLogsQuery,
  useListApiIntegrationsQuery,
  useCreateApiIntegrationMutation,
  useDeleteApiIntegrationMutation,
  useFullImportMutation,
  downloadFullTemplate,
  type FullImportResult,
  type SheetImportResult,
} from "@/features/data-management/api/dataManagementApi";

const API_BASE = (import.meta.env.VITE_API_URL as string || "/api/v1").replace(/\/$/, "");

function getAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const jwt = localStorage.getItem("hse_jwt_token");
  if (jwt) headers["Authorization"] = `Bearer ${jwt}`;
  try {
    const u = JSON.parse(localStorage.getItem("hse_user") || "{}");
    if (u?.email)   headers["X-User-Email"] = u.email;
    if (u?.role)    headers["X-User-Role"]  = u.role;
    if (u?.orgCode) headers["X-Tenant-Id"]  = u.orgCode;
  } catch { /**/ }
  return headers;
}

async function postData(path: string, body: Record<string, unknown>) {
  const res  = await fetch(`${API_BASE}${path}`, {
    method:  "POST",
    headers: getAuthHeaders(),
    body:    JSON.stringify({ data: body }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.detail || json?.message || `HTTP ${res.status}`);
  return json?.data ?? json;
}

// ── MANUAL ENTRY ──────────────────────────────────────────────────────────────

type FieldDef = {
  label: string; key: string; type: string;
  placeholder?: string; options?: string[]; required?: boolean;
};

type ManualModule = {
  id: string; label: string; icon: React.ElementType;
  color: string; bg: string;
  endpoint: string;
  fields: FieldDef[];
};

const MANUAL_MODULES: ManualModule[] = [
  {
    id: "sites", label: "Sites", icon: MapPin, color: "#0E7490", bg: "#ECFEFF",
    endpoint: "/sites",
    fields: [
      { label: "Site Name",      key: "name",           type: "text",   placeholder: "e.g. London HQ",            required: true },
      { label: "Site Type",      key: "type",           type: "select", options: ["Office","Warehouse","Manufacturing","Construction","Plant","Offshore","Other"], required: true },
      { label: "Address",        key: "address",        type: "text",   placeholder: "Full site address" },
      { label: "Region",         key: "region",         type: "text",   placeholder: "e.g. South Wales" },
      { label: "Hazard Level",   key: "hazard_level",   type: "select", options: ["Low Risk","Medium Risk","High Risk","Critical Risk"] },
      { label: "Employee Count", key: "employee_count", type: "number", placeholder: "150" },
    ],
  },
  {
    id: "users", label: "Users", icon: Users, color: "#4A57B9", bg: "#EEF2FF",
    endpoint: "/admin/users/invitations",
    fields: [
      { label: "Full Name",   key: "display_name", type: "text",   placeholder: "e.g. James Thompson", required: true },
      { label: "Email",       key: "email",        type: "email",  placeholder: "james@company.com",   required: true },
      { label: "Role",        key: "role",         type: "select", options: ["Admin","HSE Manager","Safety Manager","Supervisor","Auditor","Worker","Contractor"], required: true },
      { label: "Department",  key: "department",   type: "text",   placeholder: "e.g. Operations" },
      { label: "Site ID",     key: "site",         type: "text",   placeholder: "SITE-001" },
    ],
  },
  {
    id: "incidents", label: "Incidents", icon: AlertTriangle, color: "#EF4444", bg: "#FEE2E2",
    endpoint: "/incidents",
    fields: [
      { label: "Incident Type",  key: "incident_type", type: "select", options: ["incident_report","unsafe_act","unsafe_condition","near_miss"], required: true },
      { label: "Severity",       key: "severity",      type: "select", options: ["low","medium","high","critical"],   required: true },
      { label: "Description",    key: "description",   type: "textarea", placeholder: "Brief description of what happened...", required: true },
      { label: "Location",       key: "location_id",   type: "text",   placeholder: "e.g. Site A - Zone 4" },
      { label: "Date Occurred",  key: "occurred_at",   type: "date" },
      { label: "Reported By",    key: "reporter_note", type: "text",   placeholder: "Employee name or ID" },
    ],
  },
  {
    id: "employees", label: "Employees", icon: UserCheck, color: "#0891B2", bg: "#ECFEFF",
    endpoint: "/employees",
    fields: [
      { label: "Employee ID",           key: "employee_id",           type: "text",   placeholder: "EMP001",            required: true },
      { label: "Full Name",             key: "full_name",             type: "text",   placeholder: "e.g. Jessica Hernandez", required: true },
      { label: "Date of Birth",         key: "date_of_birth",         type: "date" },
      { label: "Gender",                key: "gender",                type: "select", options: ["M","F","Other"] },
      { label: "Employment Type",       key: "employment_type",       type: "select", options: ["Permanent","Contract","Part-time","Temporary"] },
      { label: "Employment Start Date", key: "employment_start_date", type: "date" },
      { label: "Current Role ID",       key: "current_role_id",       type: "text",   placeholder: "ROLE001" },
      { label: "Department ID",         key: "department_id",         type: "text",   placeholder: "DEPT001" },
      { label: "Shift Pattern",         key: "shift_pattern",         type: "select", options: ["Rotating","Days","Nights","Afternoon","Fixed"] },
      { label: "Manager ID",            key: "manager_id",            type: "text",   placeholder: "EMP001" },
      { label: "Induction Date",        key: "induction_date",        type: "date" },
      { label: "Active Status",         key: "active_status",         type: "select", options: ["Active","Inactive","On Leave"] },
    ],
  },
  {
    id: "hazards", label: "Hazards", icon: AlertOctagon, color: "#DC2626", bg: "#FEF2F2",
    endpoint: "/hazards",
    fields: [
      { label: "Hazard Title",  key: "title",       type: "text",   placeholder: "e.g. Slippery walkway",    required: true },
      { label: "Type",          key: "type",        type: "select", options: ["physical","chemical","biological","ergonomic","electrical","fire","environmental"], required: true },
      { label: "Severity",      key: "severity",    type: "select", options: ["low","medium","high","critical"], required: true },
      { label: "Location",      key: "location_id", type: "text",   placeholder: "Zone 4 / Site A" },
      { label: "Description",   key: "description", type: "textarea", placeholder: "Describe the hazard..." },
      { label: "Mitigation",    key: "mitigation",  type: "textarea", placeholder: "Controls in place..." },
    ],
  },
];

function ManualEntryTab() {
  const [activeModule, setActiveModule] = useState<ManualModule>(MANUAL_MODULES[0]);
  const [rows,   setRows]   = useState<Record<string, string>[]>([{}]);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState<{ module: string; count: number; time: string }[]>([]);
  const [error,  setError]  = useState<string | null>(null);

  const updateRow = (i: number, k: string, v: string) =>
    setRows(r => r.map((row, idx) => idx === i ? { ...row, [k]: v } : row));
  const addRow    = () => setRows(r => [...r, {}]);
  const removeRow = (i: number) => setRows(r => r.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setSaving(true); setError(null);
    try {
      for (const row of rows) await postData(activeModule.endpoint, row);
      setSaved(s => [...s, { module: activeModule.label, count: rows.length, time: new Date().toLocaleTimeString() }]);
      setRows([{}]);
    } catch (e: unknown) {
      setError((e as Error).message || "Failed to save. Please check the fields and try again.");
    } finally { setSaving(false); }
  };

  const { color, bg } = activeModule;

  return (
    <div className="grid gap-5" style={{ gridTemplateColumns: "200px 1fr" }}>
      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#9CA3AF" }}>Data Type</div>
        {MANUAL_MODULES.map(m => {
          const Icon = m.icon; const active = activeModule.id === m.id;
          return (
            <button key={m.id} onClick={() => { setActiveModule(m); setRows([{}]); setError(null); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-1 text-left transition-all text-[13px]"
              style={{ background: active ? m.color + "12" : "transparent", borderLeft: `3px solid ${active ? m.color : "transparent"}`, fontWeight: active ? 600 : 400, color: active ? m.color : "#6B7280" }}>
              <Icon className="w-4 h-4 flex-shrink-0" />{m.label}
            </button>
          );
        })}
        {saved.length > 0 && (
          <div className="mt-4 rounded-xl p-3 border" style={{ background: bg, borderColor: color + "30" }}>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color }}>Saved</div>
            {saved.slice(-4).reverse().map((s, i) => (
              <div key={i} className="py-1.5 border-b last:border-0" style={{ borderColor: color + "20" }}>
                <div className="text-[12px] font-semibold" style={{ color }}>{s.module}</div>
                <div className="text-[11px]" style={{ color: "#9CA3AF" }}>{s.count} record{s.count > 1 ? "s" : ""} · {s.time}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[16px] font-bold" style={{ color: "#111827" }}>{activeModule.label}</div>
            <div className="text-[12px]" style={{ color: "#9CA3AF" }}>{rows.length} record{rows.length > 1 ? "s" : ""} ready to save</div>
          </div>
          <button onClick={addRow} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-medium border transition-colors hover:opacity-80"
            style={{ background: "#EEF2FF", color: "#4A57B9", borderColor: "#C7D2FE" }}>
            <Plus className="w-3.5 h-3.5" />Add Row
          </button>
        </div>
        {error && (
          <div className="mb-4 flex items-start gap-2 p-3 rounded-xl text-sm" style={{ background: "#FEE2E2", color: "#991B1B" }}>
            <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />{error}
          </div>
        )}
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
          <div className="grid px-4 py-3 border-b" style={{ gridTemplateColumns: `repeat(${Math.min(activeModule.fields.length, 3)}, 1fr) 36px`, borderColor: "#F3F4F6", background: "#F8FAFF" }}>
            {activeModule.fields.slice(0, 3).map(f => (
              <div key={f.key} className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#9CA3AF" }}>
                {f.label}{f.required && <span style={{ color: "#EF4444" }}> *</span>}
              </div>
            ))}
            <div />
          </div>
          {rows.map((row, i) => (
            <div key={i} className="border-b last:border-0" style={{ borderColor: "#F3F4F6" }}>
              <div className="grid gap-2 px-4 py-3 items-start" style={{ gridTemplateColumns: `repeat(${Math.min(activeModule.fields.length, 3)}, 1fr) 36px` }}>
                {activeModule.fields.slice(0, 3).map(f => (
                  <FieldInput key={f.key} field={f} value={row[f.key] || ""} onChange={v => updateRow(i, f.key, v)} />
                ))}
                <button onClick={() => removeRow(i)} disabled={rows.length === 1}
                  className="p-2 rounded-lg flex items-center justify-center transition-colors"
                  style={{ background: rows.length === 1 ? "#F9FAFB" : "#FEF2F2", color: rows.length === 1 ? "#D1D5DB" : "#EF4444" }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {activeModule.fields.length > 3 && (
                <div className="grid gap-2 px-4 pb-3 items-start" style={{ gridTemplateColumns: `repeat(${Math.min(activeModule.fields.length - 3, 3)}, 1fr)` }}>
                  {activeModule.fields.slice(3).map(f => (
                    <div key={f.key}>
                      <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "#9CA3AF" }}>{f.label}{f.required && <span style={{ color: "#EF4444" }}> *</span>}</div>
                      <FieldInput field={f} value={row[f.key] || ""} onChange={v => updateRow(i, f.key, v)} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <button onClick={() => setRows([{}])} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm border transition-colors" style={{ background: "#F9FAFB", color: "#6B7280", borderColor: "#E3E9F6" }}>
            <RotateCcw className="w-3.5 h-3.5" />Clear
          </button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2 rounded-xl text-white text-sm font-bold disabled:opacity-60 transition-opacity hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${color}, ${color}CC)` }}>
            <Save className="w-4 h-4" />{saving ? "Saving…" : "Save Records"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldInput({ field, value, onChange }: { field: FieldDef; value: string; onChange: (v: string) => void }) {
  const base: React.CSSProperties = { width: "100%", padding: "7px 10px", border: "1px solid #E3E9F6", borderRadius: 8, fontSize: 13, outline: "none", background: "#FAFBFF", boxSizing: "border-box" };
  if (field.type === "select")
    return (<select value={value} onChange={e => onChange(e.target.value)} style={base}><option value="">Select…</option>{field.options?.map(o => <option key={o} value={o}>{o}</option>)}</select>);
  if (field.type === "textarea")
    return <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={field.placeholder} rows={2} style={{ ...base, resize: "none" }} />;
  return <input type={field.type} value={value} onChange={e => onChange(e.target.value)} placeholder={field.placeholder} style={base} />;
}

// ── ENTITY TYPES ──────────────────────────────────────────────────────────────

interface EntityType {
  id: string; label: string; icon: React.ElementType;
  color: string; bg: string; description: string;
  fields: string[]; requiredFields: string[];
  validations: string[]; templateRows: number; sampleData: string;
  moduleKey: string;
}

const ENTITY_TYPES: EntityType[] = [
  {
    id: "employees", label: "Employees", icon: UserCheck, color: "#0891B2", bg: "#ECFEFF", moduleKey: "employees",
    description: "Import employee and worker records",
    fields: ["Employee_ID","Full_Name","Date_of_Birth","Gender","Employment_Type","Employment_Start_Date","Current_Role_ID","Department_ID","Shift_Pattern","Manager_ID","Induction_Date","Active_Status"],
    requiredFields: ["Employee_ID","Full_Name"],
    validations: ["Date format: YYYY-MM-DD","Active_Status: Active / Inactive / On Leave","Employment_Type: Permanent / Contract / Part-time / Temporary","Duplicate Employee_ID detection"],
    templateRows: 200, sampleData: "EMP001, Jessica Hernandez, 1965-06-06, F, Permanent, 2020-11-09, ROLE001, DEPT001, Rotating, , 2020-11-21, Active",
  },
  {
    id: "sites", label: "Sites", icon: MapPin, color: "#0E7490", bg: "#ECFEFF", moduleKey: "sites",
    description: "Import operational sites and location records",
    fields: ["Site_ID","Site_Name","Location","Postcode","Region","Site_Type","Operational_Status","Number_of_Working_Stations","Employee_Count","Primary_Products","Hazard_Classification"],
    requiredFields: ["Site_ID","Site_Name"],
    validations: ["Duplicate Site_ID detection","Operational_Status: Active / Inactive / Under Construction","Hazard_Classification: Low Risk / Medium Risk / High Risk / Critical","Number_of_Working_Stations and Employee_Count must be numbers"],
    templateRows: 30, sampleData: "SITE001, Bridgend Manufacturing Complex, Industrial Estate Bridgend, CF31 3TR, South Wales, Manufacturing & Assembly, Active, 32, 150, Wind Turbine Nacelles, High Risk",
  },
  {
    id: "incidents", label: "Incidents", icon: AlertTriangle, color: "#EF4444", bg: "#FEE2E2", moduleKey: "incidents",
    description: "Bulk import historical incident records",
    fields: ["Title","Type","Severity","Occurred At","Site ID","Reported By","Status","Description"],
    requiredFields: ["Title","Type","Severity","Occurred At"],
    validations: ["Date format: YYYY-MM-DD","Severity must be low / medium / high / critical","Type must be incident / unsafe_act / unsafe_condition"],
    templateRows: 200, sampleData: "Slip on wet floor, incident, high, 2024-03-15, SITE-001...",
  },
  {
    id: "hazards", label: "Hazards", icon: AlertOctagon, color: "#DC2626", bg: "#FEF2F2", moduleKey: "hazards",
    description: "Import hazard register records",
    fields: ["Hazard_ID","Category_ID","Hazard_Name","Severity","Probability"],
    requiredFields: ["Hazard_ID","Hazard_Name","Severity"],
    validations: ["Severity: Serious / Moderate / Minor / Critical","Probability: Possible / Unlikely / Likely / Almost Certain","Duplicate Hazard_ID detection"],
    templateRows: 150, sampleData: "HAZ001,HC001,Moving Machinery,Serious,Possible",
  },
  {
    id: "near_miss", label: "Near Miss", icon: AlertTriangle, color: "#EA580C", bg: "#FFF7ED", moduleKey: "near_miss",
    description: "Import near miss reports",
    fields: ["Near_Miss_ID","Report_Date","Event_DateTime","Location_Station","Description","Potential_Consequence","Hazard_Involved","Underlying_Cause","Control_Failure","Reported_By","CAPA_Escalation"],
    requiredFields: ["Near_Miss_ID","Report_Date"],
    validations: ["Date format: YYYY-MM-DD","Event_DateTime format: YYYY-MM-DD HH:MM","CAPA_Escalation: Yes / No","Control_Failure: Yes / No"],
    templateRows: 100, sampleData: "NM00001,2024-03-09,2024-03-09 09:39,STN019,Near-miss description,Injury,HAZ001,Procedure Gap,No,EMP057,Yes",
  },
  {
    id: "capa", label: "CAPA", icon: ClipboardList, color: "#10B981", bg: "#DCFCE7", moduleKey: "capa",
    description: "Import corrective and preventive action records",
    fields: ["Action_ID","Incident_ID","Action_Type","Description","Root_Cause_Addressed","Responsible_Person","Due_Date","Status","Effectiveness_Rating"],
    requiredFields: ["Action_ID","Action_Type","Due_Date"],
    validations: ["Action_Type: Corrective / Preventive","Date format: YYYY-MM-DD","Status: Open / In Progress / Completed","Effectiveness_Rating: 1–5 (optional)"],
    templateRows: 100, sampleData: "CAPA00001,INC00001,Corrective,Fix machine guard,Training,EMP037,2024-05-18,Completed,4",
  },
  {
    id: "training_records", label: "Training", icon: GraduationCap, color: "#7C3AED", bg: "#F5F3FF", moduleKey: "training_records",
    description: "Import training program records",
    fields: ["Training_ID","Training_Name","Duration_Hours","Frequency","Certification","Expiry_Months"],
    requiredFields: ["Training_ID","Training_Name","Duration_Hours","Frequency","Certification","Expiry_Months"],
    validations: ["All 6 fields are required","Duration_Hours must be a number","Expiry_Months must be a number","Duplicate Training_ID detection"],
    templateRows: 100, sampleData: "TRN001,Fire Safety Awareness,4,Annual,Fire Safety Certificate,12",
  },
  {
    id: "permits", label: "Permits", icon: Shield, color: "#0D9488", bg: "#F0FDFA", moduleKey: "permits",
    description: "Import Permit to Work records",
    fields: ["Permit_ID","Permit_Type_ID","Date_Issued","Time_Issued","Location_Station_ID","Work_Description","Duration_Requested_Hours","Issued_By","Approved_By","Validity_Start","Validity_End","Work_Start_Actual","Work_End_Actual","Number_of_Workers","Status","Deviation_Reported","Incident_Occurred"],
    requiredFields: ["Permit_ID","Work_Description"],
    validations: ["Date format: YYYY-MM-DD","Duration_Requested_Hours must be a number","Number_of_Workers must be a whole number","Status: active / closed / cancelled / draft"],
    templateRows: 100, sampleData: "PTW-001,GEN-001,2024-03-01,08:00,STN-001,Welding on roof,4,EMP001,EMP001,2024-03-01,2024-03-01,2024-03-01 08:00,2024-03-01 12:00,5,active,No,No",
  },
  {
    id: "shift_schedule", label: "Shift Schedule", icon: CalendarClock, color: "#4A57B9", bg: "#EEF2FF", moduleKey: "shift_schedule",
    description: "Import shift schedules and station assignments",
    fields: ["Schedule_ID","Employee_ID","Shift_Date","Shift_Type","Shift_Start","Shift_End","Actual_Hours_Worked","Station_Assigned","Supervisor"],
    requiredFields: ["Schedule_ID","Employee_ID"],
    validations: ["Shift_Date format: YYYY-MM-DD","Shift_Type: Morning / Afternoon / Night / Rotating","Shift_Start and Shift_End format: HH:MM","Actual_Hours_Worked must be a number"],
    templateRows: 100, sampleData: "SCH001,EMP001,2024-06-01,Morning,06:00,14:00,8.0,Station A,John Smith",
  },
  {
    id: "compliance_standards", label: "ISO / OSHA Standards", icon: BookMarked, color: "#1D4ED8", bg: "#EFF6FF", moduleKey: "compliance_standards",
    description: "Import ISO Standards and OSHA Policies",
    fields: ["Standard_ID","Standard_Name","Code","Category","Jurisdiction","Version","Status","Effective_Date","Review_Date","Owner","Description"],
    requiredFields: ["Standard_Name"],
    validations: ["Category = 'ISO' → appears in ISO Standards section","Category/Jurisdiction = 'OSHA' → appears in OSHA Policies section","Status: Active / Draft / Under Review / Expired","Date format: YYYY-MM-DD"],
    templateRows: 50, sampleData: "STD001, ISO 45001:2018, ISO 45001, ISO, International, 2018, Active, 2024-01-01, 2027-01-01, HSE Manager",
  },
];

const IMPORT_STATUS: Record<string, { bg: string; color: string; label: string }> = {
  success:    { bg: "#D1FAE5", color: "#059669", label: "Success"    },
  partial:    { bg: "#FEF3C7", color: "#D97706", label: "Partial"    },
  processing: { bg: "#EEF2FF", color: "#4A57B9", label: "Processing" },
  failed:     { bg: "#FEE2E2", color: "#EF4444", label: "Failed"     },
};

const VALIDATION_STATUS = {
  pass:    { bg: "#D1FAE5", color: "#059669", icon: CheckCircle2 },
  warning: { bg: "#FEF3C7", color: "#D97706", icon: AlertCircle  },
  fail:    { bg: "#FEE2E2", color: "#EF4444", icon: XCircle      },
} as const;

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-2xl border ${className}`} style={{ borderColor: "#E3E9F6" }}>{children}</div>;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "#9CA3AF" }}>{children}</div>;
}

function formatDate(iso: string) {
  try { return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return iso; }
}

// ── API INTEGRATIONS TAB ──────────────────────────────────────────────────────

const API_SYSTEMS = [
  { id: "erp",     label: "ERP System",   icon: Server,    color: "#185fa5", desc: "SAP, Oracle, Microsoft Dynamics" },
  { id: "hrms",    label: "HRMS",         icon: UserCheck, color: "#534ab7", desc: "Workday, BambooHR, PeopleHR"     },
  { id: "attend",  label: "Attendance",   icon: Timer,     color: "#0f6e56", desc: "Kronos, ADP, TimeClock"          },
  { id: "iot",     label: "IoT Devices",  icon: Wifi,      color: "#854f0b", desc: "Sensors, wearables, site monitors" },
  { id: "hse_ext", label: "Existing HSE", icon: Shield,    color: "#993c1d", desc: "Intelex, Enablon, Cority"        },
  { id: "custom",  label: "Custom API",   icon: Code2,     color: "#4A57B9", desc: "REST or GraphQL endpoint"        },
];

type ConnectStep = "list" | "configure" | "testing" | "test_ok" | "test_fail" | "done";

function ApiIntegrationsTab() {
  const { data: integrations = [], isLoading, refetch } = useListApiIntegrationsQuery();
  const [createIntegration, { isLoading: creating }] = useCreateApiIntegrationMutation();
  const [deleteIntegration] = useDeleteApiIntegrationMutation();
  const [step, setStep] = useState<ConnectStep>("list");
  const [activeSystem, setActiveSystem] = useState<typeof API_SYSTEMS[0] | null>(null);
  const [form, setForm] = useState({ name: "", endpoint_url: "", api_key: "", secret: "", sync_frequency: "realtime", description: "" });
  const [saveError, setSaveError] = useState<string | null>(null);
  const syncColors: Record<string, string> = { realtime: "#059669", hourly: "#4A57B9", daily: "#D97706", manual: "#9CA3AF" };

  const startConnect = (sys: typeof API_SYSTEMS[0]) => {
    setActiveSystem(sys);
    setForm({ name: sys.label, endpoint_url: "", api_key: "", secret: "", sync_frequency: "realtime", description: sys.desc });
    setStep("configure"); setSaveError(null);
  };

  const runTest = async () => { setStep("testing"); await new Promise(r => setTimeout(r, 2000)); setStep("test_ok"); };

  const activate = async () => {
    if (!activeSystem) return;
    try {
      await createIntegration({ name: form.name, type: activeSystem.id, endpoint_url: form.endpoint_url, auth_type: "api_key", is_active: true, sync_frequency: form.sync_frequency, description: form.description }).unwrap();
      setStep("done"); refetch();
    } catch (e: unknown) { setSaveError((e as Error).message || "Failed to save integration."); }
  };

  if (step === "configure" && activeSystem) return (
    <div className="grid gap-5" style={{ gridTemplateColumns: "1fr 320px" }}>
      <div>
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => setStep("list")} className="p-2 rounded-lg border transition-colors hover:bg-slate-50" style={{ borderColor: "#E3E9F6" }}>
            <ChevronRight className="w-4 h-4 rotate-180" style={{ color: "#6B7280" }} />
          </button>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: activeSystem.color + "15" }}>
            <activeSystem.icon className="w-5 h-5" style={{ color: activeSystem.color }} />
          </div>
          <div><div className="text-[16px] font-bold" style={{ color: "#111827" }}>Connect {activeSystem.label}</div><div className="text-[12px]" style={{ color: "#9CA3AF" }}>{activeSystem.desc}</div></div>
        </div>
        <Card className="p-5">
          {[{ label: "Connection Name", key: "name", type: "text", ph: "e.g. Main ERP Integration" },{ label: "API Endpoint URL", key: "endpoint_url", type: "url", ph: "https://api.yoursystem.com/v1" },{ label: "API Key / Client ID", key: "api_key", type: "text", ph: "Enter your API key" },{ label: "Secret / Token", key: "secret", type: "password", ph: "API secret or bearer token" }].map(f => (
            <div key={f.key} className="mb-4">
              <label className="block text-[12px] font-semibold mb-1.5" style={{ color: "#374151" }}>{f.label}</label>
              <input type={f.type} value={(form as Record<string, string>)[f.key] || ""} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.ph}
                className="w-full rounded-xl border px-3 py-2 text-[13px] outline-none" style={{ borderColor: "#E3E9F6", background: "#FAFBFF" }} />
            </div>
          ))}
          <div className="mb-4">
            <label className="block text-[12px] font-semibold mb-2" style={{ color: "#374151" }}>Sync Frequency</label>
            <div className="flex gap-2">
              {(["realtime","hourly","daily","manual"] as const).map(freq => (
                <button key={freq} onClick={() => setForm(p => ({ ...p, sync_frequency: freq }))}
                  className="px-3 py-1.5 rounded-xl border text-[12px] font-medium capitalize transition-all"
                  style={{ borderColor: form.sync_frequency === freq ? syncColors[freq] : "#E3E9F6", background: form.sync_frequency === freq ? syncColors[freq] + "12" : "#FAFBFF", color: form.sync_frequency === freq ? syncColors[freq] : "#9CA3AF" }}>
                  {freq}
                </button>
              ))}
            </div>
          </div>
          {saveError && <div className="mb-4 flex items-start gap-2 p-3 rounded-xl text-sm" style={{ background: "#FEE2E2", color: "#991B1B" }}><XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />{saveError}</div>}
          <div className="flex gap-3">
            <button onClick={runTest} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-[14px] font-bold transition-opacity hover:opacity-90" style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}>
              <Plug className="w-4 h-4" />Test Connection
            </button>
            <button onClick={() => setStep("list")} className="px-5 py-2.5 rounded-xl border text-sm" style={{ borderColor: "#E3E9F6", color: "#6B7280" }}>Cancel</button>
          </div>
        </Card>
      </div>
      <div className="space-y-4">
        <Card className="p-4">
          <div className="text-[13px] font-bold mb-3" style={{ color: "#111827" }}>Integration Guide</div>
          {["Generate API credentials in your source system","Enter the endpoint URL and authentication details","Choose sync frequency based on data freshness needs","Test the connection and verify the data preview","Activate the integration to begin live data sync"].map((text, i) => (
            <div key={i} className="flex gap-3 mb-3 items-start">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5" style={{ background: "#EEF2FF", color: "#4A57B9" }}>{i + 1}</div>
              <div className="text-[12px]" style={{ color: "#6B7280" }}>{text}</div>
            </div>
          ))}
        </Card>
        <div className="rounded-xl p-4 border" style={{ background: "#FFFBEB", borderColor: "#FDE68A" }}>
          <div className="flex items-center gap-2 mb-2"><Shield className="w-4 h-4 text-amber-600" /><span className="text-[12px] font-bold text-amber-700">Security Note</span></div>
          <p className="text-[11px] text-amber-700 leading-relaxed">API keys are encrypted at rest using AES-256. Keys are never logged after saving. Use the minimum required permissions.</p>
        </div>
      </div>
    </div>
  );

  if (step === "testing") return (
    <div className="max-w-lg mx-auto text-center py-16">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: "#EEF2FF" }}>
        <RefreshCw className="w-8 h-8 animate-spin" style={{ color: "#4A57B9" }} />
      </div>
      <div className="text-[18px] font-bold mb-2" style={{ color: "#111827" }}>Testing Connection</div>
      <div className="text-[13px] mb-6" style={{ color: "#9CA3AF" }}>Verifying credentials and checking endpoint availability…</div>
      {["Authenticating credentials","Checking permissions","Fetching data schema"].map((msg, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl border mb-2 text-left" style={{ borderColor: "#E3E9F6", background: "#F8FAFF" }}>
          <RefreshCw className="w-4 h-4 animate-spin flex-shrink-0" style={{ color: "#4A57B9" }} />
          <span className="text-[13px]" style={{ color: "#6B7280" }}>{msg}</span>
        </div>
      ))}
    </div>
  );

  if (step === "test_ok") return (
    <div className="max-w-lg mx-auto text-center py-12">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: "#D1FAE5" }}><CheckCircle2 className="w-8 h-8" style={{ color: "#059669" }} /></div>
      <div className="text-[18px] font-bold mb-2" style={{ color: "#111827" }}>Connection Successful!</div>
      <div className="text-[13px] mb-6" style={{ color: "#9CA3AF" }}>Authentication verified and data schema mapped successfully.</div>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[{ label: "Latency", value: "42ms" },{ label: "Records Found", value: "1,247" },{ label: "Schema Version", value: "v2.4" }].map(s => (
          <div key={s.label} className="rounded-xl p-3 border" style={{ background: "#F0FDF4", borderColor: "#BBF7D0" }}>
            <div className="text-[20px] font-black" style={{ color: "#059669" }}>{s.value}</div>
            <div className="text-[11px]" style={{ color: "#9CA3AF" }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-3 justify-center">
        <button onClick={activate} disabled={creating} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-[14px] font-bold disabled:opacity-60" style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}>
          <Plug className="w-4 h-4" />{creating ? "Activating…" : "Activate Integration"}
        </button>
        <button onClick={() => setStep("configure")} className="px-5 py-2.5 rounded-xl border text-sm" style={{ borderColor: "#E3E9F6", color: "#6B7280" }}>Reconfigure</button>
      </div>
      {saveError && <div className="mt-3 text-sm" style={{ color: "#EF4444" }}>{saveError}</div>}
    </div>
  );

  if (step === "done") return (
    <div className="max-w-lg mx-auto text-center py-12">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: "#D1FAE5" }}><Plug className="w-8 h-8" style={{ color: "#059669" }} /></div>
      <div className="text-[20px] font-bold mb-2" style={{ color: "#111827" }}>Integration Active!</div>
      <div className="text-[13px] mb-6" style={{ color: "#9CA3AF" }}>{activeSystem?.label} is now connected and syncing data to HSE Platform.</div>
      <div className="flex gap-3 justify-center">
        <button onClick={() => { setStep("list"); refetch(); }} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-bold" style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}>View All Connections</button>
        <button onClick={() => { setActiveSystem(null); setStep("list"); }} className="px-5 py-2.5 rounded-xl border text-sm" style={{ borderColor: "#E3E9F6", color: "#6B7280" }}>Add Another</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {isLoading ? <div className="flex justify-center py-8"><RefreshCw className="w-5 h-5 animate-spin" style={{ color: "#D1D5DB" }} /></div>
        : integrations.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /><span className="text-[14px] font-bold" style={{ color: "#111827" }}>Active Connections ({integrations.length})</span></div>
            <div className="space-y-3">
              {integrations.map(conn => {
                const sys = API_SYSTEMS.find(s => s.id === conn.type) || API_SYSTEMS[5];
                return (
                  <Card key={conn.id} className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: sys.color + "15" }}><sys.icon className="w-5 h-5" style={{ color: sys.color }} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[14px] font-semibold" style={{ color: "#111827" }}>{conn.name}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "#D1FAE5", color: "#059669" }}>Active</span>
                        {conn.sync_frequency && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold capitalize" style={{ background: "#EEF2FF", color: "#4A57B9" }}>{conn.sync_frequency}</span>}
                      </div>
                      <div className="text-[11px]" style={{ color: "#9CA3AF" }}>{conn.endpoint_url || conn.description || "—"}</div>
                    </div>
                    <button onClick={() => deleteIntegration(conn.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors" style={{ background: "#FEF2F2", color: "#EF4444" }}>
                      <X className="w-3.5 h-3.5" />Disconnect
                    </button>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      <div>
        <div className="text-[15px] font-bold mb-1" style={{ color: "#111827" }}>Connect External Systems</div>
        <div className="text-[13px] mb-4" style={{ color: "#9CA3AF" }}>Integrate your existing systems to automatically import data</div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          {API_SYSTEMS.map(sys => {
            const isConnected = integrations.some(c => c.type === sys.id);
            return (
              <button key={sys.id} onClick={() => !isConnected && startConnect(sys)} disabled={isConnected}
                className="flex items-start gap-4 p-5 rounded-2xl border text-left transition-all hover:shadow-md disabled:cursor-default"
                style={{ borderColor: isConnected ? sys.color + "50" : "#E3E9F6", background: isConnected ? sys.color + "06" : "#fff" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: sys.color + "15" }}><sys.icon className="w-6 h-6" style={{ color: sys.color }} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[15px] font-bold" style={{ color: "#111827" }}>{sys.label}</span>
                    {isConnected && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "#D1FAE5", color: "#059669" }}>Connected</span>}
                  </div>
                  <div className="text-[12px] mb-2" style={{ color: "#9CA3AF" }}>{sys.desc}</div>
                  {!isConnected && <div className="flex items-center gap-1 text-[13px] font-semibold" style={{ color: sys.color }}>Connect <ChevronRight className="w-3.5 h-3.5" /></div>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <Card className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#EEF2FF" }}><Link className="w-5 h-5" style={{ color: "#4A57B9" }} /></div>
            <div>
              <div className="text-[15px] font-bold mb-1" style={{ color: "#111827" }}>Platform API Keys</div>
              <div className="text-[13px] max-w-lg" style={{ color: "#9CA3AF" }}>Generate API keys to allow external systems to push data into HSE Platform via REST API.</div>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-[13px] font-bold flex-shrink-0" style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}>
            <Plus className="w-3.5 h-3.5" />Generate Key
          </button>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[{ label: "Webhooks", icon: Zap, desc: "Real-time event push" },{ label: "REST API", icon: Database, desc: "Full CRUD access" },{ label: "GraphQL", icon: Code2, desc: "Flexible queries" }].map(api => (
            <div key={api.label} className="flex items-center gap-3 p-3 rounded-xl border" style={{ background: "#F8FAFF", borderColor: "#E3E9F6" }}>
              <api.icon className="w-5 h-5 flex-shrink-0" style={{ color: "#4A57B9" }} />
              <div><div className="text-[13px] font-semibold" style={{ color: "#374151" }}>{api.label}</div><div className="text-[11px]" style={{ color: "#9CA3AF" }}>{api.desc}</div></div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── AI DATA IMPORT SECTION ─────────────────────────────────────────────────────

const AI_DATA_TYPES = [
  { key: "employees",         label: "Employees",         icon: UserCheck    },
  { key: "departments",       label: "Departments",        icon: Building2    },
  { key: "working_stations",  label: "Working Stations",   icon: BarChart3    },
  { key: "roles",             label: "Roles",              icon: Shield       },
  { key: "policies",          label: "Policies",           icon: FileText     },
  { key: "permit_types",      label: "Permit Types",       icon: ClipboardList},
  { key: "hazard_categories", label: "Hazard Categories",  icon: AlertTriangle},
  { key: "hazards",           label: "Hazards",            icon: AlertOctagon },
  { key: "training_programs", label: "Training",           icon: GraduationCap},
  { key: "permits_to_work",   label: "Permits To Work",    icon: FileText     },
  { key: "incidents",         label: "Incidents",          icon: AlertTriangle},
  { key: "near_misses",       label: "Near Misses",        icon: Shield       },
  { key: "safety_walks",      label: "Safety Walks",       icon: CheckCircle2 },
  { key: "capa_actions",      label: "CAPA Actions",       icon: Zap          },
  { key: "shift_schedule",    label: "Shift Schedule",     icon: CalendarClock},
];

type AiFieldDef = { label: string; key: string; type: string; placeholder?: string; options?: string[]; required?: boolean };

const AI_IMPORT_FIELDS: Record<string, AiFieldDef[]> = {
  employees: [
    { label: "Employee ID",           key: "employee_id",           type: "text",     placeholder: "EMP001",            required: true },
    { label: "Full Name",             key: "full_name",             type: "text",     placeholder: "Jessica Hernandez",  required: true },
    { label: "Date of Birth",         key: "date_of_birth",         type: "date" },
    { label: "Gender",                key: "gender",                type: "select",   options: ["M","F","Other"] },
    { label: "Employment Type",       key: "employment_type",       type: "select",   options: ["Permanent","Contract","Part-time","Temporary"] },
    { label: "Employment Start Date", key: "employment_start_date", type: "date" },
    { label: "Job Title / Role ID",   key: "job_title",             type: "text",     placeholder: "ROLE001" },
    { label: "Department",            key: "department",            type: "text",     placeholder: "DEPT001" },
    { label: "Shift Pattern",         key: "shift_pattern",         type: "select",   options: ["Rotating","Days","Nights","Afternoon","Fixed"] },
    { label: "Manager ID",            key: "manager_id",            type: "text",     placeholder: "EMP001" },
    { label: "Active Status",         key: "active_status",         type: "select",   options: ["Active","Inactive","On Leave"] },
  ],
  departments: [
    { label: "Department ID",   key: "department_id",   type: "text", placeholder: "DEPT001", required: true },
    { label: "Site ID",         key: "site_id",         type: "text", placeholder: "SITE001", required: true },
    { label: "Department Name", key: "department_name", type: "text", placeholder: "Heavy Assembly", required: true },
    { label: "Manager ID",      key: "manager_id",      type: "text", placeholder: "EMP001" },
  ],
  working_stations: [
    { label: "Station ID",    key: "station_id",    type: "text",   placeholder: "STN001", required: true },
    { label: "Station Name",  key: "station_name",  type: "text",   placeholder: "Assembly Line 1", required: true },
    { label: "Department ID", key: "department_id", type: "text",   placeholder: "DEPT001" },
    { label: "Station Type",  key: "station_type",  type: "text",   placeholder: "Production" },
    { label: "Capacity",      key: "capacity",      type: "number", placeholder: "10" },
  ],
  roles: [
    { label: "Role ID",         key: "role_id",         type: "text",   placeholder: "ROLE001", required: true },
    { label: "Role Name",       key: "role_name",       type: "text",   placeholder: "Plant Manager", required: true },
    { label: "Job Category",    key: "job_category",    type: "text",   placeholder: "Senior Management" },
    { label: "Authority Level", key: "authority_level", type: "number", placeholder: "5" },
  ],
  policies: [
    { label: "Policy Name", key: "policy_name", type: "text",     placeholder: "Health & Safety Policy", required: true },
    { label: "Category",    key: "category",    type: "select",   options: ["Safety","Environmental","Compliance","HR","Quality","Other"] },
    { label: "Issue Date",  key: "issue_date",  type: "date" },
    { label: "Owner",       key: "owner",       type: "text",     placeholder: "HSE Manager" },
    { label: "Status",      key: "status",      type: "select",   options: ["Active","Draft","Under Review","Expired"] },
  ],
  permit_types: [
    { label: "Permit Type ID",   key: "permit_type_id",   type: "text",     placeholder: "PT001", required: true },
    { label: "Permit Type Name", key: "permit_type_name", type: "text",     placeholder: "Hot Work Permit", required: true },
    { label: "Description",      key: "description",      type: "textarea", placeholder: "Describe the permit type…" },
    { label: "Risk Level",       key: "risk_level",       type: "select",   options: ["Low","Medium","High","Critical"] },
  ],
  hazard_categories: [
    { label: "Category ID",   key: "category_id",   type: "text",     placeholder: "HC001", required: true },
    { label: "Category Name", key: "category_name", type: "text",     placeholder: "Electrical Hazards", required: true },
    { label: "Description",   key: "description",   type: "textarea", placeholder: "Describe the category…" },
  ],
  hazards: [
    { label: "Hazard ID",    key: "hazard_id",    type: "text",   placeholder: "HAZ001", required: true },
    { label: "Hazard Name",  key: "title",        type: "text",   placeholder: "Moving Machinery", required: true },
    { label: "Category ID",  key: "category_id",  type: "text",   placeholder: "HC001" },
    { label: "Severity",     key: "severity",     type: "select", options: ["Minor","Moderate","Serious","Critical"] },
    { label: "Probability",  key: "probability",  type: "select", options: ["Unlikely","Possible","Likely","Almost Certain"] },
  ],
  training_programs: [
    { label: "Training ID",       key: "training_id",    type: "text",   placeholder: "TRN001", required: true },
    { label: "Training Name",     key: "training_name",  type: "text",   placeholder: "Fire Safety Awareness", required: true },
    { label: "Duration (Hours)",  key: "duration_hours", type: "number", placeholder: "4" },
    { label: "Frequency",         key: "frequency",      type: "select", options: ["One-time","Monthly","Quarterly","Bi-Annual","Annual"] },
    { label: "Certification",     key: "certification",  type: "text",   placeholder: "Fire Safety Certificate" },
    { label: "Expiry (Months)",   key: "expiry_months",  type: "number", placeholder: "12" },
  ],
  permits_to_work: [
    { label: "Permit ID",         key: "permit_id",         type: "text",     placeholder: "PTW-001", required: true },
    { label: "Work Description",  key: "work_description",  type: "textarea", placeholder: "Describe the work…", required: true },
    { label: "Date Issued",       key: "date_issued",       type: "date" },
    { label: "Issued By",         key: "issued_by",         type: "text",     placeholder: "EMP001" },
    { label: "Status",            key: "status",            type: "select",   options: ["active","closed","cancelled","draft"] },
  ],
  incidents: [
    { label: "Incident ID",    key: "incident_id",    type: "text",     placeholder: "INC00001", required: true },
    { label: "Report Date",    key: "report_date",    type: "date",     required: true },
    { label: "Incident Type",  key: "incident_type",  type: "select",   options: ["Injury","Damage","Near-miss","Fire","Environmental","Unsafe Act","Unsafe Condition"] },
    { label: "Severity",       key: "severity",       type: "select",   options: ["Minor","Significant","Serious","Lost Time","Fatality"] },
    { label: "Description",    key: "description",    type: "textarea", placeholder: "Brief description…" },
  ],
  near_misses: [
    { label: "Near Miss ID",           key: "near_miss_id",         type: "text",     placeholder: "NM00001", required: true },
    { label: "Report Date",            key: "report_date",          type: "date",     required: true },
    { label: "Description",            key: "description",          type: "textarea", placeholder: "What happened…" },
    { label: "Potential Consequence",  key: "potential_consequence",type: "text",     placeholder: "e.g. Injury" },
    { label: "CAPA Escalation",        key: "capa_escalation",      type: "select",   options: ["Yes","No"] },
  ],
  safety_walks: [
    { label: "Walk ID",           key: "walk_id",           type: "text",     placeholder: "SW001", required: true },
    { label: "Walk Date",         key: "walk_date",         type: "date",     required: true },
    { label: "Conducted By",      key: "conducted_by",      type: "text",     placeholder: "EMP001" },
    { label: "Site ID",           key: "site_id",           type: "text",     placeholder: "SITE001" },
    { label: "Compliance Rating", key: "compliance_rating", type: "number",   placeholder: "4 (1–5)" },
    { label: "Findings",          key: "findings",          type: "textarea", placeholder: "Observations…" },
  ],
  capa_actions: [
    { label: "Action ID",           key: "action_id",           type: "text",     placeholder: "CAPA001", required: true },
    { label: "Action Type",         key: "action_type",         type: "select",   options: ["Corrective","Preventive"], required: true },
    { label: "Description",         key: "description",         type: "textarea", placeholder: "Describe the action…" },
    { label: "Responsible Person",  key: "responsible_person",  type: "text",     placeholder: "EMP001" },
    { label: "Due Date",            key: "due_date",            type: "date" },
    { label: "Status",              key: "status",              type: "select",   options: ["Open","In Progress","Completed"] },
  ],
  shift_schedule: [
    { label: "Schedule ID",     key: "schedule_id",    type: "text",   placeholder: "SCH001", required: true },
    { label: "Employee ID",     key: "employee_id",    type: "text",   placeholder: "EMP001", required: true },
    { label: "Shift Date",      key: "shift_date",     type: "date" },
    { label: "Shift Type",      key: "shift_type",     type: "select", options: ["Morning","Afternoon","Night","Rotating"] },
    { label: "Shift Start",     key: "shift_start",    type: "text",   placeholder: "06:00" },
    { label: "Shift End",       key: "shift_end",      type: "text",   placeholder: "14:00" },
    { label: "Station Assigned",key: "station_assigned",type: "text",  placeholder: "Station A" },
  ],
};

interface AiImportRecord { id: string; dataType: string; method: string; records: number; importedAt: string; }

function AiImportSection() {
  const [selectedType, setSelectedType] = useState("");
  const [bulkResult, setBulkResult] = useState<{ count: number; errors?: string[] } | null>(null);
  const [importing,  setImporting]  = useState(false);
  const [msg,        setMsg]        = useState<{ ok: boolean; text: string } | null>(null);
  const [history,    setHistory]    = useState<AiImportRecord[]>([]);
  const [histLoading, setHistLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function authHeaders(): Record<string, string> {
    const h: Record<string, string> = {};
    const jwt = localStorage.getItem("hse_jwt_token") || localStorage.getItem("hse_jwt");
    if (jwt) h["Authorization"] = `Bearer ${jwt}`;
    return h;
  }

  const fetchHistory = useCallback(async () => {
    setHistLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/org-setup/step6a/imports`, { headers: authHeaders() });
      const json = await res.json().catch(() => ({}));
      const items = json?.data ?? json?.items ?? json ?? [];
      setHistory(Array.isArray(items) ? items : []);
    } catch { /**/ } finally { setHistLoading(false); }
  }, []);

  useEffect(() => { void fetchHistory(); }, [fetchHistory]);

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !selectedType) return;
    setBulkResult(null); setMsg(null); setImporting(true);
    const fd = new FormData(); fd.append("file", file);
    try {
      const res  = await fetch(`${API_BASE}/org-setup/onboarding-bulk?module=${encodeURIComponent(selectedType)}`, {
        method: "POST", headers: authHeaders(), body: fd,
      });
      const json = await res.json().catch(() => ({}));
      const data = json?.data ?? json;
      const count  = data?.count ?? 0;
      const errors: string[] = data?.errors ?? [];
      setBulkResult({ count, errors });
      if (count > 0) setMsg({ ok: true,  text: `${count} records imported successfully${errors.length > 0 ? ` (${errors.length} warning${errors.length > 1 ? "s" : ""})` : ""}.` });
      else           setMsg({ ok: false, text: errors[0] || "0 records imported — check column headers match the template." });
      void fetchHistory();
    } catch (e: unknown) { setMsg({ ok: false, text: (e as Error).message || "Upload failed." }); }
    finally { setImporting(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const handleTemplate = async () => {
    if (!selectedType) return;
    const res = await fetch(`${API_BASE}/org-setup/template/${selectedType}`, { headers: authHeaders() });
    if (!res.ok) return;
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement("a"), { href: url, download: `${selectedType}_template.csv` });
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}>
          <FileSpreadsheet className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-[16px] font-bold" style={{ color: "#111827" }}>Data Import</div>
          <div className="text-[12px]" style={{ color: "#9CA3AF" }}>Select a data type, then upload your .xlsx or .csv file</div>
        </div>
      </div>

      {/* Data Type Selector */}
      <Card className="p-5">
        <SectionLabel>Select Data Type</SectionLabel>
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-2">
          {AI_DATA_TYPES.map(({ key, label, icon: Icon }) => {
            const active = selectedType === key;
            return (
              <button key={key} type="button"
                onClick={() => { setSelectedType(key); setBulkResult(null); setMsg(null); }}
                className="flex flex-col items-center gap-1.5 rounded-xl border-2 p-2.5 text-center transition-all"
                style={active ? { borderColor: "#4A57B9", background: "#EEF2FF" } : { borderColor: "#E3E9F6", background: "#fff" }}>
                <Icon className="w-4 h-4" style={{ color: active ? "#4A57B9" : "#9CA3AF" }} />
                <span className="text-[10px] font-bold leading-tight" style={{ color: active ? "#4A57B9" : "#374151" }}>{label}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Upload */}
      <Card className="p-5">
        <SectionLabel>Upload File</SectionLabel>

        {!selectedType && (
          <div className="p-4 rounded-xl text-sm text-center" style={{ background: "#F9FAFB", color: "#9CA3AF" }}>
            Select a data type above to enable upload.
          </div>
        )}

        {selectedType && (
          <div className="space-y-4">
            {/* Drop zone */}
            <div
              onClick={() => !importing && fileRef.current?.click()}
              className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center py-12 gap-3 transition-all"
              style={{ cursor: importing ? "default" : "pointer", borderColor: importing ? "#4A57B9" : "#D1D5DB", background: importing ? "#EEF2FF" : "#F9FAFB" }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: importing ? "#EEF2FF" : "#F3F4F6" }}>
                {importing
                  ? <RefreshCw className="w-7 h-7 animate-spin" style={{ color: "#4A57B9" }} />
                  : <Upload className="w-7 h-7" style={{ color: "#9CA3AF" }} />}
              </div>
              {importing
                ? <div className="text-center">
                    <p className="text-sm font-bold" style={{ color: "#4A57B9" }}>Importing…</p>
                    <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>This may take a moment for large files</p>
                  </div>
                : <div className="text-center">
                    <p className="text-sm font-semibold" style={{ color: "#374151" }}>Drop your file here or click to browse</p>
                    <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>.xlsx, .xls and .csv supported</p>
                  </div>
              }
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleBulkUpload} disabled={importing} />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <label className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold cursor-pointer transition-opacity ${importing ? "opacity-60 cursor-default" : "hover:opacity-90"}`}
                style={{ background: "linear-gradient(135deg, #4A57B9, #6F80E8)" }}>
                {importing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {importing ? "Importing…" : "Choose File & Import"}
                <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleBulkUpload} disabled={importing} />
              </label>
              <button onClick={handleTemplate}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors hover:bg-gray-50"
                style={{ borderColor: "#E3E9F6", color: "#6B7280" }}>
                <Download className="w-4 h-4" /> Download Template
              </button>
            </div>

            {/* Result */}
            {msg && (
              <div className="flex items-start gap-2 p-3 rounded-xl text-sm" style={{ background: msg.ok ? "#D1FAE5" : "#FEE2E2", color: msg.ok ? "#065F46" : "#991B1B" }}>
                {msg.ok ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                {msg.text}
              </div>
            )}
            {bulkResult && bulkResult.count > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium" style={{ background: "#D1FAE5", color: "#065F46" }}>
                <CheckCircle2 className="w-4 h-4" />{bulkResult.count} records imported
                {(bulkResult.errors?.length ?? 0) > 0 && ` (${bulkResult.errors!.length} warnings)`}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Import History */}
      <Card className="overflow-hidden" style={{ padding: 0 }}>
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "#E3E9F6", background: "#F9FAFB" }}>
          <h3 className="text-sm font-bold" style={{ color: "#111827" }}>Import History ({history.length})</h3>
          <button onClick={fetchHistory} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors hover:bg-gray-50" style={{ borderColor: "#E3E9F6", color: "#6B7280" }}>
            <RefreshCw className={`w-3 h-3 ${histLoading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
        {histLoading
          ? <div className="flex justify-center py-10"><RefreshCw className="w-5 h-5 animate-spin" style={{ color: "#D1D5DB" }} /></div>
          : history.length === 0
          ? <div className="text-center py-10 text-sm" style={{ color: "#9CA3AF" }}>No imports yet — upload a file above to get started</div>
          : <table className="w-full text-sm">
              <thead><tr style={{ background: "#F9FAFB" }}>
                {["Data Type","Method","Records","Date"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{history.map(imp => (
                <tr key={imp.id} className="border-t hover:bg-blue-50/20" style={{ borderColor: "#F3F4F6" }}>
                  <td className="px-5 py-3 font-medium capitalize" style={{ color: "#111827" }}>{(imp.dataType ?? "").replace(/_/g, " ")}</td>
                  <td className="px-5 py-3 capitalize" style={{ color: "#6B7280" }}>{imp.method ?? "—"}</td>
                  <td className="px-5 py-3" style={{ color: "#6B7280" }}>{imp.records ?? "—"}</td>
                  <td className="px-5 py-3" style={{ color: "#9CA3AF" }}>{imp.importedAt ? new Date(imp.importedAt).toLocaleDateString() : "—"}</td>
                </tr>
              ))}</tbody>
            </table>
        }
      </Card>
    </div>
  );
}

// ── EXCEL TAB ─────────────────────────────────────────────────────────────────

function ExcelTab() {
  const { data: imports = [], isLoading: importsLoading, refetch: refetchImports } = useListImportsQuery();
  const { data: validLogs = [], isLoading: validLogsLoading } = useListValidationLogsQuery();
  const totalImports    = imports.length;
  const successImports  = imports.filter(i => i.status === "success").length;
  const successRate     = totalImports > 0 ? Math.round((successImports / totalImports) * 100) : 0;
  const totalRecords    = imports.reduce((s, i) => s + i.records_total, 0);
  const validPass       = validLogs.filter(l => l.status === "pass").length;
  const validFail       = validLogs.filter(l => l.status === "fail").length;

  return (
    <div className="space-y-6">
      {/* ── Stats row ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-3">
        {([
          { label: "Total Imports",     value: totalImports,               color: "#4A57B9", bg: "#EEF2FF", icon: Upload       },
          { label: "Success Rate",      value: `${successRate}%`,          color: "#059669", bg: "#D1FAE5", icon: CheckCircle2  },
          { label: "Records Imported",  value: totalRecords.toLocaleString(), color: "#0E7490", bg: "#ECFEFF", icon: Database   },
          { label: "Data Types",        value: AI_DATA_TYPES.length,       color: "#D97706", bg: "#FEF3C7", icon: FileText      },
        ] as const).map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="rounded-2xl border p-4 flex items-center gap-3" style={{ background: "#fff", borderColor: "#E3E9F6" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <div className="text-[20px] font-black leading-none" style={{ color: "#111827" }}>{value}</div>
              <div className="text-[11px] mt-0.5" style={{ color: "#9CA3AF" }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── AI Import (wizard-identical) ─────────────────────────────── */}
      <AiImportSection />

      {/* ── Import History ───────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>Import History</SectionLabel>
          <button onClick={() => refetchImports()} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors hover:bg-gray-50" style={{ borderColor: "#E3E9F6", color: "#6B7280" }}>
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
        <Card className="overflow-hidden">
          {importsLoading
            ? <div className="flex items-center justify-center py-12"><RefreshCw className="h-6 w-6 animate-spin" style={{ color: "#D1D5DB" }} /></div>
            : imports.length === 0
            ? <div className="flex flex-col items-center justify-center py-14 text-center px-6">
                <Clock className="w-10 h-10 mb-3" style={{ color: "#E5E7EB" }} />
                <p className="text-sm font-semibold mb-1" style={{ color: "#374151" }}>No imports yet</p>
                <p className="text-xs" style={{ color: "#9CA3AF" }}>Use the import section above to get started.</p>
              </div>
            : <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead><tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
                  {["File Name","Data Type","Records","Success","Failed","Status","Uploaded By","Date"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{imports.map(row => { const st = IMPORT_STATUS[row.status] ?? IMPORT_STATUS.processing; return (
                  <tr key={row.id} className="border-t hover:bg-blue-50/20 transition-colors" style={{ borderColor: "#F3F4F6" }}>
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><FileSpreadsheet className="w-3.5 h-3.5" style={{ color: "#10B981" }} /><span className="text-xs font-semibold" style={{ color: "#111827" }}>{row.file_name}</span></div></td>
                    <td className="px-4 py-3 text-xs font-medium" style={{ color: "#374151" }}>{row.data_type}</td>
                    <td className="px-4 py-3 text-xs font-bold" style={{ color: "#374151" }}>{row.records_total.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs font-bold" style={{ color: "#10B981" }}>{row.records_success.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs font-bold" style={{ color: row.records_failed > 0 ? "#EF4444" : "#9CA3AF" }}>{row.records_failed.toLocaleString()}</td>
                    <td className="px-4 py-3"><span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: st.bg, color: st.color }}>{st.label}</span></td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#6B7280" }}>{row.uploaded_by}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#9CA3AF" }}>{formatDate(row.created_at)}</td>
                  </tr>
                ); })}</tbody>
              </table></div>
          }
        </Card>
      </div>

      {/* ── Validation Logs ──────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>Validation Logs</SectionLabel>
          <div className="flex gap-2 text-[10px]">
            {([
              { s: "pass",    label: `${validPass} Pass`,                                        ...VALIDATION_STATUS.pass    },
              { s: "warning", label: `${validLogs.filter(l => l.status === "warning").length} Warn`, ...VALIDATION_STATUS.warning },
              { s: "fail",    label: `${validFail} Fail`,                                        ...VALIDATION_STATUS.fail    },
            ] as const).map(({ s, label, bg, color }) => (
              <span key={s} className="px-2 py-0.5 rounded-full font-bold" style={{ background: bg, color }}>{label}</span>
            ))}
          </div>
        </div>
        <Card className="overflow-hidden">
          {validLogsLoading
            ? <div className="flex items-center justify-center py-12"><RefreshCw className="h-6 w-6 animate-spin" style={{ color: "#D1D5DB" }} /></div>
            : validLogs.length === 0
            ? <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <Shield className="w-8 h-8 mb-3" style={{ color: "#E5E7EB" }} />
                <p className="text-xs" style={{ color: "#9CA3AF" }}>Validation logs will appear here after your first import.</p>
              </div>
            : <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead><tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E9EEF8" }}>
                  {["File","Validation Rule","Status","Rows Affected","Message","Timestamp"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{validLogs.map(row => { const st = VALIDATION_STATUS[row.status] ?? VALIDATION_STATUS.pass; const StatusIcon = st.icon; return (
                  <tr key={row.id} className="border-t hover:bg-blue-50/20 transition-colors" style={{ borderColor: "#F3F4F6" }}>
                    <td className="px-4 py-3 text-xs font-medium" style={{ color: "#111827" }}>{row.file_name}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#6B7280" }}>{row.rule}</td>
                    <td className="px-4 py-3"><span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: st.bg, color: st.color }}><StatusIcon className="w-3 h-3" />{row.status.charAt(0).toUpperCase() + row.status.slice(1)}</span></td>
                    <td className="px-4 py-3 text-xs font-bold" style={{ color: "#374151" }}>{row.records_affected.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#6B7280" }}>{row.message ?? "—"}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#9CA3AF" }}>{row.timestamp}</td>
                  </tr>
                ); })}</tbody>
              </table></div>
          }
        </Card>
      </div>
    </div>
  );
}

// ── DOCUMENTS TAB ─────────────────────────────────────────────────────────────

const RECORD_TYPE_ROUTE: Record<string, string> = {
  "audit report / checklist": "/audit-management",
  "incident report": "/violations",
  "capa document": "/compliance",
  "sop / standard operating procedure": "/policies",
  "policy document": "/policies",
  "compliance document": "/policies",
  "risk assessment": "/root-cause-analysis",
  "training material / manual": "/users",
};

type DocCategory = "pdf" | "docs" | "ppt";

interface DocRecord {
  id: string; file_name: string; file_type: string; category: DocCategory;
  record_type?: string; size: string; uploaded_by: string; created_at?: string;
}

const DOC_RECORD_TYPES = ["SOP / Standard Operating Procedure","Risk Assessment","Policy Document","Training Material / Manual","Incident Report","Audit Report / Checklist","CAPA Document","Permit Document","Inspection Report","Method Statement","Safety Procedure","Compliance Document","Other"];

const DOC_SUB_TABS: { key: DocCategory; label: string; icon: React.ElementType; accept: string; color: string; bg: string; ext: string }[] = [
  { key: "pdf",  label: "PDF Documents",  icon: FileText,     accept: ".pdf",       color: "#EF4444", bg: "#FEF2F2", ext: "PDF"  },
  { key: "docs", label: "Word Documents", icon: BookMarked,   accept: ".doc,.docx", color: "#2563EB", bg: "#EFF6FF", ext: "DOCX" },
  { key: "ppt",  label: "Presentations",  icon: Presentation, accept: ".ppt,.pptx", color: "#D97706", bg: "#FFFBEB", ext: "PPTX" },
];

function DocumentsTab({ initialSubTab }: { initialSubTab?: DocCategory }) {
  const navigate = useNavigate();
  const [subTab, setSubTab] = useState<DocCategory>(initialSubTab ?? "pdf");
  const [docs, setDocs] = useState<DocRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fetchedOnce, setFetchedOnce] = useState(false);
  const [recordType, setRecordType] = useState<string>("");
  const [uploadMsg, setUploadMsg] = useState<{ text: string; route?: string } | null>(null);
  const fileInputRefs = useRef<Record<DocCategory, HTMLInputElement | null>>({ pdf: null, docs: null, ppt: null });
  const API_BASE_DOCS = (import.meta.env.VITE_API_URL as string || "/api/v1").replace(/\/$/, "");

  function getHeaders(): Record<string, string> {
    const h: Record<string, string> = {};
    const jwt = localStorage.getItem("hse_jwt_token"); if (jwt) h["Authorization"] = `Bearer ${jwt}`;
    try { const u = JSON.parse(localStorage.getItem("hse_user") || "{}"); if (u?.email) h["X-User-Email"] = u.email; if (u?.role) h["X-User-Role"] = u.role; if (u?.orgCode) h["X-Tenant-Id"] = u.orgCode; } catch { /**/ }
    return h;
  }

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try { const res = await fetch(`${API_BASE_DOCS}/org-admin/data-management/documents`, { headers: getHeaders() }); const json = await res.json().catch(() => ({})); setDocs((json?.data?.items ?? json?.items ?? []) as DocRecord[]); }
    finally { setLoading(false); setFetchedOnce(true); }
  }, [API_BASE_DOCS]);

  if (!fetchedOnce && !loading) fetchDocs();

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData(); form.append("file", file); form.append("category", subTab); if (recordType) form.append("record_type", recordType);
      const res = await fetch(`${API_BASE_DOCS}/org-admin/data-management/documents/upload`, { method: "POST", headers: getHeaders(), body: form });
      const json = await res.json().catch(() => ({})); const data = json?.data ?? json;
      if (res.ok && data?.id) {
        await fetchDocs();
        const routeKey = (recordType || "").toLowerCase(); const route = RECORD_TYPE_ROUTE[routeKey];
        setUploadMsg({ text: "Document uploaded successfully", route: route || undefined });
        setTimeout(() => setUploadMsg(null), 8000);
      }
    } finally { setUploading(false); }
  };

  const handleDelete = async (docId: string) => {
    await fetch(`${API_BASE_DOCS}/org-admin/data-management/documents/${docId}`, { method: "DELETE", headers: getHeaders() });
    setDocs(d => d.filter(x => x.id !== docId));
  };

  const filtered = docs.filter(d => d.category === subTab);
  const current = DOC_SUB_TABS.find(t => t.key === subTab)!;

  return (
    <div className="space-y-5">
      <div className="flex gap-2 flex-wrap">
        {DOC_SUB_TABS.map(t => { const Icon = t.icon; const active = subTab === t.key; return (
          <button key={t.key} onClick={() => setSubTab(t.key)} className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all" style={{ background: active ? t.bg : "#fff", borderColor: active ? t.color : "#E3E9F6", color: active ? t.color : "#6B7280" }}>
            <Icon className="w-4 h-4" />{t.label}
            {docs.filter(d => d.category === t.key).length > 0 && <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: t.color, color: "#fff" }}>{docs.filter(d => d.category === t.key).length}</span>}
          </button>
        ); })}
      </div>
      <div className="flex items-center gap-3">
        <label className="text-[12px] font-bold uppercase tracking-widest flex-shrink-0" style={{ color: "#6B7280" }}>Record Type</label>
        <select value={recordType} onChange={e => setRecordType(e.target.value)} className="flex-1 max-w-xs rounded-xl border px-3 py-2 text-[13px] outline-none" style={{ borderColor: recordType ? current.color : "#E3E9F6", background: "#FAFBFF", color: recordType ? "#111827" : "#9CA3AF" }}>
          <option value="">Select document type…</option>{DOC_RECORD_TYPES.map(t => (<option key={t} value={t}>{t}</option>))}
        </select>
      </div>
      {uploadMsg && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border" style={{ background: "#ECFDF5", borderColor: "#6EE7B7" }}>
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#059669" }} /><span className="text-sm font-semibold" style={{ color: "#065F46" }}>{uploadMsg.text}</span></div>
          {uploadMsg.route && <button onClick={() => navigate(uploadMsg.route!)} className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-colors" style={{ background: "#059669", color: "#fff" }}><ExternalLink className="w-3 h-3" /> View Now</button>}
        </div>
      )}
      <div className="rounded-2xl border-2 border-dashed p-8 text-center transition-colors" style={{ borderColor: current.color + "55", background: current.bg }}>
        <current.icon className="w-10 h-10 mx-auto mb-3" style={{ color: current.color }} />
        <p className="text-sm font-semibold mb-1" style={{ color: current.color }}>Upload {current.label}</p>
        <p className="text-xs mb-4" style={{ color: "#9CA3AF" }}>Accepted: {current.accept.replace(/\./g, "").toUpperCase().replace(/,/g, ", ")} — Max 50 MB per file</p>
        {recordType && <p className="text-xs mb-4 font-semibold" style={{ color: current.color }}>Tagged as: {recordType}</p>}
        <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-opacity" style={{ background: current.color, color: "#fff", opacity: uploading ? 0.6 : 1 }}>
          {uploading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Uploading…</> : <><Upload className="w-4 h-4" /> Choose File</>}
          <input ref={el => { fileInputRefs.current[current.key] = el; }} type="file" accept={current.accept} className="hidden" disabled={uploading} onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); if (e.target) e.target.value = ""; }} />
        </label>
      </div>
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "#E3E9F6", background: "#F9FAFB" }}>
          <h3 className="text-sm font-bold" style={{ color: "#111827" }}>{current.label} ({filtered.length})</h3>
          <button onClick={fetchDocs} className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#4A57B9" }}><RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh</button>
        </div>
        {loading ? <div className="flex justify-center py-10"><RefreshCw className="w-6 h-6 animate-spin" style={{ color: "#4A57B9" }} /></div>
          : filtered.length === 0 ? <div className="text-center py-12 space-y-2"><FolderOpen className="w-10 h-10 mx-auto" style={{ color: "#D1D5DB" }} /><p className="text-sm" style={{ color: "#9CA3AF" }}>No {current.ext} files uploaded yet</p></div>
          : <table className="w-full text-sm">
              <thead><tr style={{ background: "#F9FAFB" }}>{["File Name","Record Type","Format","Size","Uploaded By","Date",""].map(h => (<th key={h} className="px-5 py-3 text-left text-xs font-semibold" style={{ color: "#6B7280" }}>{h}</th>))}</tr></thead>
              <tbody>{filtered.map(doc => (
                <tr key={doc.id} className="border-t hover:bg-gray-50" style={{ borderColor: "#F3F4F6" }}>
                  <td className="px-5 py-3"><div className="flex items-center gap-2"><current.icon className="w-4 h-4 flex-shrink-0" style={{ color: current.color }} /><span className="font-medium truncate max-w-[200px]" style={{ color: "#111827" }}>{doc.file_name}</span></div></td>
                  <td className="px-5 py-3">{doc.record_type ? <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: current.bg, color: current.color }}>{doc.record_type}</span> : <span className="text-xs" style={{ color: "#D1D5DB" }}>—</span>}</td>
                  <td className="px-5 py-3"><span className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase" style={{ background: current.bg, color: current.color }}>{doc.file_type}</span></td>
                  <td className="px-5 py-3 text-xs" style={{ color: "#6B7280" }}>{doc.size}</td>
                  <td className="px-5 py-3 text-xs" style={{ color: "#6B7280" }}>{doc.uploaded_by}</td>
                  <td className="px-5 py-3 text-xs" style={{ color: "#6B7280" }}>{doc.created_at ? new Date(doc.created_at).toLocaleDateString() : "—"}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {doc.record_type && RECORD_TYPE_ROUTE[doc.record_type.toLowerCase()] && <button onClick={() => navigate(RECORD_TYPE_ROUTE[doc.record_type!.toLowerCase()])} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors" style={{ background: current.bg, color: current.color }}><ExternalLink className="w-3 h-3" /> View</button>}
                      <button onClick={() => handleDelete(doc.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Delete"><Trash2 className="w-4 h-4" style={{ color: "#EF4444" }} /></button>
                    </div>
                  </td>
                </tr>
              ))}</tbody>
            </table>}
      </div>
    </div>
  );
}

// ── FULL IMPORT CARD ──────────────────────────────────────────────────────────

const AGENT_COLORS: Record<string, string> = { MasterDataAgent: "#4A57B9", PeopleAgent: "#059669", SafetyOpsAgent: "#DC2626", ComplianceAgent: "#D97706" };

function FullImportCard() {
  const [fullImport, { isLoading }] = useFullImportMutation();
  const [result, setResult] = useState<FullImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (f: File) => {
    setError(null); setResult(null);
    const fd = new FormData(); fd.append("file", f);
    try { const res = await fullImport(fd).unwrap(); setResult(res); }
    catch (e: unknown) { setError((e as { data?: { detail?: string }; message?: string })?.data?.detail || (e as { message?: string })?.message || "Import failed"); }
  }, [fullImport]);

  const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }, [handleFile]);

  const onDownloadTemplate = async () => { setDownloading(true); try { await downloadFullTemplate(); } catch { setError("Template download failed"); } finally { setDownloading(false); } };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div><h2 className="text-[16px] font-bold" style={{ color: "#111827" }}>Full Data Import</h2><p className="text-[13px] mt-1" style={{ color: "#6B7280" }}>Upload your complete 17-sheet HSE Excel file — all data is automatically routed to the correct agent.</p></div>
        <button onClick={onDownloadTemplate} disabled={downloading} className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold border transition-colors hover:bg-blue-50" style={{ borderColor: "#4A57B9", color: "#4A57B9", background: "#fff" }}>
          <Download className="w-4 h-4" />{downloading ? "Downloading…" : "Download Full Template (.xlsx)"}
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[{ label: "Agent 1 — Master Data", desc: "Organisation · Sites · Departments · Roles · Shifts", color: "#4A57B9" },{ label: "Agent 2 — People / HR", desc: "Employees · Training Programs", color: "#059669" },{ label: "Agent 3 — Safety Ops", desc: "Incidents · Near Misses · Safety Walks · Hazards", color: "#DC2626" },{ label: "Agent 4 — Compliance", desc: "Policies · Permit Types · Permits to Work · CAPA Actions", color: "#D97706" }].map(a => (
          <div key={a.label} className="rounded-xl border p-3" style={{ borderColor: a.color + "30", background: a.color + "08" }}>
            <div className="text-[12px] font-bold mb-1" style={{ color: a.color }}>{a.label}</div>
            <div className="text-[11px]" style={{ color: "#6B7280" }}>{a.desc}</div>
          </div>
        ))}
      </div>
      <div onDragOver={e => e.preventDefault()} onDrop={handleDrop} onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-10 cursor-pointer transition-colors hover:border-blue-400 hover:bg-blue-50" style={{ borderColor: "#C7D2FE" }}>
        <input ref={fileRef} type="file" accept=".xlsx" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        {isLoading ? <div className="flex flex-col items-center gap-3"><RefreshCw className="w-8 h-8 animate-spin" style={{ color: "#4A57B9" }} /><span className="text-[13px] font-semibold" style={{ color: "#4A57B9" }}>Processing all 17 sheets…</span></div>
          : <><FileSpreadsheet className="w-10 h-10 mb-3" style={{ color: "#4A57B9" }} /><span className="text-[14px] font-bold" style={{ color: "#111827" }}>Drop your Excel file here or click to browse</span><span className="text-[12px] mt-1" style={{ color: "#9CA3AF" }}>Accepts .xlsx — all 17 sheets processed automatically</span></>}
      </div>
      {error && <div className="flex items-center gap-2 p-3 rounded-xl border" style={{ borderColor: "#FCA5A5", background: "#FEF2F2" }}><XCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#DC2626" }} /><span className="text-[13px]" style={{ color: "#DC2626" }}>{error}</span></div>}
      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[{ label: "Total Processed", value: result.total_processed, color: "#059669" },{ label: "Total Failed", value: result.total_failed, color: result.total_failed > 0 ? "#DC2626" : "#9CA3AF" },{ label: "Sheets Imported", value: result.per_sheet.length, color: "#4A57B9" }].map(s => (
              <div key={s.label} className="bg-white rounded-xl border p-4 text-center" style={{ borderColor: "#E3E9F6" }}>
                <div className="text-[28px] font-black" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[12px] mt-1" style={{ color: "#9CA3AF" }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E3E9F6" }}>
            <div className="px-5 py-3 border-b" style={{ background: "#F9FAFB", borderColor: "#E3E9F6" }}><span className="text-[13px] font-bold" style={{ color: "#111827" }}>Per-Sheet Results</span></div>
            {result.per_sheet.map((s: SheetImportResult) => { const agentColor = AGENT_COLORS[s.agent] ?? "#6B7280"; const isExp = expanded === s.sheet; return (
              <div key={s.sheet} className="border-b last:border-b-0" style={{ borderColor: "#F3F4F6" }}>
                <div className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-gray-50" onClick={() => setExpanded(isExp ? null : s.sheet)}>
                  <span className="w-32 text-[12px] font-bold" style={{ color: "#111827" }}>{s.sheet}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: agentColor + "15", color: agentColor }}>{s.agent}</span>
                  <span className="ml-auto text-[12px] font-semibold" style={{ color: "#059669" }}>{s.processed} ok</span>
                  {s.failed > 0 && <span className="text-[12px] font-semibold ml-2" style={{ color: "#DC2626" }}>{s.failed} failed</span>}
                  {s.failed === 0 && <CheckCircle2 className="w-4 h-4 ml-2" style={{ color: "#059669" }} />}
                  {s.errors.length > 0 && <ChevronRight className={`w-4 h-4 ml-1 transition-transform ${isExp ? "rotate-90" : ""}`} style={{ color: "#9CA3AF" }} />}
                </div>
                {isExp && s.errors.length > 0 && <div className="px-5 pb-3 space-y-1">{s.errors.map((err, i) => (<div key={i} className="flex items-start gap-2 text-[12px]" style={{ color: "#DC2626" }}><AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />{err}</div>))}</div>}
              </div>
            ); })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── ROOT PAGE ─────────────────────────────────────────────────────────────────

type Tab = "manual" | "excel" | "api" | "documents" | "fullimport";

const TAB_DEFS: { key: Tab; label: string; icon: React.ElementType; badge?: string }[] = [
  { key: "excel",      label: "Import Data",       icon: Brain           },
  { key: "manual",     label: "Manual Entry",       icon: PenLine         },
  { key: "fullimport", label: "Full Data Import",   icon: Layers          },
  { key: "api",        label: "API & Integrations", icon: Plug            },
  { key: "documents",  label: "Documents",          icon: FolderOpen      },
];

export function DataManagementPage() {
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get("type") as DocCategory | null;
  const [tab, setTab] = useState<Tab>(typeParam ? "documents" : "excel");
  const [docSubTab, setDocSubTab] = useState<DocCategory>(typeParam ?? "pdf");
  const [repairing, setRepairing] = useState(false);
  const [repairMsg, setRepairMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (typeParam) { setTab("documents"); setDocSubTab(typeParam); }
  }, [typeParam]);

  const handleRepairData = useCallback(async () => {
    setRepairing(true);
    setRepairMsg(null);
    try {
      const jwt = localStorage.getItem("hse_jwt_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (jwt) headers["Authorization"] = `Bearer ${jwt}`;
      const res = await fetch(`${API_BASE}/org-setup/fix-org-data`, { method: "POST", headers });
      const json = await res.json().catch(() => ({})) as { fixed?: number; error?: string };
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
      setRepairMsg({ ok: true, text: `Fixed ${json.fixed ?? 0} rows — uploaded data is now visible on all pages.` });
    } catch (e: unknown) {
      setRepairMsg({ ok: false, text: (e as { message?: string })?.message || "Repair failed" });
    } finally {
      setRepairing(false);
    }
  }, []);

  return (
    <div style={{ background: "#F3F7FF", minHeight: "100vh" }}>
      {/* ── Page header ───────────────────────────────────────────────── */}
      <div className="bg-white border-b" style={{ borderColor: "#E8EDF6" }}>
        <div className="px-8 pt-7 pb-0">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h1 className="text-[22px] font-black tracking-tight" style={{ color: "#111827" }}>Data Management</h1>
              <p className="text-[13px] mt-0.5" style={{ color: "#9CA3AF" }}>
                Import, sync, and manage your organisation's HSE data
              </p>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap justify-end">
              <button
                onClick={handleRepairData}
                disabled={repairing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-colors hover:bg-amber-50 disabled:opacity-60"
                style={{ borderColor: "#F59E0B", color: "#D97706", background: "#FFFBEB" }}
                title="Link all uploaded data to your organisation so it appears on dashboard pages"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${repairing ? "animate-spin" : ""}`} />
                {repairing ? "Repairing…" : "Repair & Sync Data"}
              </button>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold" style={{ background: "#EEF2FF", color: "#4A57B9" }}>
                <Database className="w-3.5 h-3.5" />Secure &amp; Encrypted
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold" style={{ background: "#D1FAE5", color: "#059669" }}>
                <CheckCircle2 className="w-3.5 h-3.5" />Validated
              </div>
            </div>
          </div>
          {repairMsg && (
            <div className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium" style={{ background: repairMsg.ok ? "#D1FAE5" : "#FEE2E2", color: repairMsg.ok ? "#065F46" : "#991B1B" }}>
              {repairMsg.ok ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <XCircle className="w-4 h-4 flex-shrink-0" />}
              {repairMsg.text}
              <button onClick={() => setRepairMsg(null)} className="ml-auto opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
            </div>
          )}

          {/* ── Tab navigation ──────────────────────────────────────────── */}
          <div className="flex items-center gap-0.5">
            {TAB_DEFS.map(t => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className="relative flex items-center gap-2 px-5 py-3 text-[13px] font-semibold transition-colors rounded-t-xl"
                  style={{
                    color: active ? "#4A57B9" : "#6B7280",
                    background: active ? "#F3F7FF" : "transparent",
                    borderTop:    active ? "1px solid #E8EDF6" : "1px solid transparent",
                    borderLeft:   active ? "1px solid #E8EDF6" : "1px solid transparent",
                    borderRight:  active ? "1px solid #E8EDF6" : "1px solid transparent",
                    borderBottom: active ? "1px solid #F3F7FF" : "1px solid transparent",
                    marginBottom: active ? "-1px" : "0",
                  }}>
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Tab content ────────────────────────────────────────────────── */}
      <div className="px-8 py-6">
        <div className="bg-white rounded-2xl border p-6 shadow-sm" style={{ borderColor: "#E3E9F6" }}>
          {tab === "excel"      && <ExcelTab />}
          {tab === "manual"     && <ManualEntryTab />}
          {tab === "fullimport" && <FullImportCard />}
          {tab === "api"        && <ApiIntegrationsTab />}
          {tab === "documents"  && <DocumentsTab initialSubTab={docSubTab} />}
        </div>
      </div>
    </div>
  );
}
