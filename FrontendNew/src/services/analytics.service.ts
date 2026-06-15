import axiosInstance from '../api/axiosInstance';

// ── Violations Summary ────────────────────────────────────────────────────────

export interface ViolationItem {
  label: string;
  value: number;
}

export interface RcaItem {
  name: string;
  value: number;
  color: string;
}

export interface SeverityMixItem {
  label: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface ViolationsSummary {
  by_type: ViolationItem[];
  by_location: ViolationItem[];
  by_root_cause: RcaItem[];
  cause_data: RcaItem[];
  monthly_trend: { month: string; value: number }[];
  near_miss_monthly: { month: string; value: number }[];
  downtime_by_type: ViolationItem[];
  open_capa_items: string[];
  severity_mix: SeverityMixItem[];
}

export const getViolationsSummary = (months = 10) =>
  axiosInstance
    .get<ViolationsSummary>(`/analytics/violations-summary?months=${months}`)
    .then((r) => r.data);

// ── Permits Summary ───────────────────────────────────────────────────────────

export interface PermitViolation {
  text: string;
  time: string;
}

export interface ActiveWorkRow {
  id: string;
  type: string;
  contractor: string;
  location: string;
  status: string;
  expiry: string;
}

export interface ExpiryTimelineBar {
  label: string;
  left: number;
  width: number;
  color: string;
  rightText: string;
}

export interface PermitsSummary {
  active_permits: number;
  total_workers_on_site: number;
  risk_work_data: { subject: string; A: number }[];
  permit_violations: PermitViolation[];
  active_work_rows: ActiveWorkRow[];
  expiry_timeline: ExpiryTimelineBar[];
}

export const getPermitsSummary = () =>
  axiosInstance.get<PermitsSummary>('/analytics/permits-summary').then((r) => r.data);

// ── Risk Summary ──────────────────────────────────────────────────────────────

export interface TaskRow {
  id: string;
  desc: string;
  owner: string;
  due: string;
  status: string;
}

export interface AgingBar {
  bucket: string;
  low: number;
  medium: number;
  high: number;
  critical: number;
  line: number;
}

export interface RiskSummary {
  zone_risk: { zone: string; value: number }[];
  task_rows: TaskRow[];
  aging_bars: AgingBar[];
  kpis: {
    control_effectiveness: string;
    unverified_controls: number;
    risk_escalations: number;
  };
}

export const getRiskSummary = () =>
  axiosInstance.get<RiskSummary>('/analytics/risk-summary').then((r) => r.data);

// ── Policies ──────────────────────────────────────────────────────────────────

export interface PolicyRecord {
  id: number;
  policy_name: string;
  category: string | null;
  issue_date: string | null;
  owner: string | null;
  status: string | null;
}

export const getPolicies = (limit = 100) =>
  axiosInstance
    .get<PolicyRecord[]>(`/policys/?limit=${limit}`)
    .then((r) => r.data);

// ── Near Miss ─────────────────────────────────────────────────────────────────

export interface NearMiss {
  NearMiss_ID: string;
  Title: string;
  Description: string;
  Site_ID: string;
  Zone_ID: string;
  Reported_By: string;
  Reported_At: string;
  Incident_Date: string;
  Category: string;
  Severity: 'Critical' | 'High' | 'Medium' | 'Low';
  Potential_Outcome: string;
  Immediate_Action: string;
  Status: string;
  Investigation_Status: string;
}

export interface NearMissFilters {
  site_id?: string;
  severity?: string;
  status?: string;
}

interface RawNearMiss {
  id: number;
  report_date: string | null;
  event_date_time: string | null;
  location_station_id: number | null;
  description: string | null;
  potential_consequence: string | null;
  underlying_cause: string | null;
  control_failure: string | null;
  reported_by: number | null;
  capa_escalation: string | null;
}

function mapNearMiss(r: RawNearMiss): NearMiss {
  const isCapa = (r.capa_escalation ?? '').toLowerCase() === 'yes';
  return {
    NearMiss_ID: String(r.id),
    Title: r.description?.split('.')[0]?.slice(0, 80) ?? `Near Miss #${r.id}`,
    Description: r.description ?? '',
    Site_ID: r.location_station_id ? String(r.location_station_id) : '—',
    Zone_ID: '—',
    Reported_By: r.reported_by ? `Employee #${r.reported_by}` : 'Unknown',
    Reported_At: r.report_date ?? '',
    Incident_Date: r.event_date_time ? r.event_date_time.split('T')[0] : (r.report_date ?? ''),
    Category: 'Near Miss',
    Severity: 'Medium',
    Potential_Outcome: r.potential_consequence ?? '',
    Immediate_Action: r.underlying_cause ?? '',
    Status: isCapa ? 'Under Investigation' : 'Open',
    Investigation_Status: isCapa ? 'In Progress' : 'Pending',
  };
}

// ── Root Cause Analysis ───────────────────────────────────────────────────────

export interface RootCauseAnalysis {
  RCA_ID: string;
  Incident_ID: string;
  Incident_Type: string;
  Site_ID: string;
  Zone_ID: string;
  Conducted_By: string;
  Start_Date: string;
  Completion_Date: string;
  Root_Causes: string;
  Contributing_Factors: string;
  Corrective_Actions: string;
  Preventive_Measures: string;
  Status: string;
  Priority: string;
}

export interface RCAFilters {
  site_id?: string;
  status?: string;
}

interface RawIncident {
  id: number;
  report_date: string | null;
  incident_date_time: string | null;
  location_station_id: number | null;
  incident_type: string | null;
  severity: string | null;
  description: string | null;
  immediate_cause: string | null;
  root_cause: string | null;
  root_cause_category: string | null;
  reported_by: number | null;
  investigation_status: string | null;
  capa_generated: string | null;
}

function mapIncidentToRCA(r: RawIncident): RootCauseAnalysis {
  const invStatus = r.investigation_status?.toLowerCase() ?? '';
  const status = invStatus.includes('complete') || invStatus.includes('closed')
    ? 'Closed'
    : invStatus.includes('progress')
    ? 'In Progress'
    : 'Pending';
  const sev = (r.severity ?? '').toLowerCase();
  const priority = sev.includes('critical') || sev.includes('significant')
    ? 'Critical'
    : sev.includes('high') || sev.includes('major')
    ? 'High'
    : sev.includes('medium') || sev.includes('moderate')
    ? 'Medium'
    : 'Low';
  return {
    RCA_ID: `RCA-${String(r.id).padStart(4, '0')}`,
    Incident_ID: `INC-${String(r.id).padStart(4, '0')}`,
    Incident_Type: r.incident_type ?? 'Unknown',
    Site_ID: r.location_station_id ? `Station-${r.location_station_id}` : '—',
    Zone_ID: '—',
    Conducted_By: r.reported_by ? `Employee #${r.reported_by}` : 'Unknown',
    Start_Date: r.incident_date_time ? r.incident_date_time.split('T')[0] : (r.report_date ?? ''),
    Completion_Date: status === 'Closed' ? (r.report_date ?? '') : '',
    Root_Causes: r.root_cause ?? r.root_cause_category ?? 'Under investigation',
    Contributing_Factors: r.immediate_cause ?? '—',
    Corrective_Actions: r.capa_generated === 'Yes' ? 'CAPA generated — see Actions page' : '—',
    Preventive_Measures: '—',
    Status: status,
    Priority: priority,
  };
}

export async function getRootCauseAnalysis(filters: RCAFilters = {}): Promise<RootCauseAnalysis[]> {
  const raw = await axiosInstance
    .get<RawIncident[]>('/incidents/?limit=200')
    .then((r) => r.data);

  let results = raw.map(mapIncidentToRCA);

  if (filters.status) {
    results = results.filter((r) => r.Status === filters.status);
  }
  if (filters.site_id) {
    results = results.filter((r) => r.Site_ID === filters.site_id);
  }

  return results;
}

// ── Equipment Certifications ──────────────────────────────────────────────────

export interface EquipmentCertification {
  Cert_ID: string;
  Equipment_Name: string;
  Equipment_Type: string;
  Site_ID: string;
  Zone_ID: string;
  Serial_Number: string;
  Manufacturer: string;
  Model: string;
  Certification_Type: string;
  Certified_By: string;
  Issue_Date: string;
  Expiry_Date: string;
  Next_Inspection: string;
  Status: string;
  Compliance_Standard: string;
}

export interface EquipmentCertFilters {
  site_id?: string;
  status?: string;
  equipment_type?: string;
}

// No backend model yet — returns empty list until equipment endpoint is added
export async function getEquipmentCertifications(_filters: EquipmentCertFilters = {}): Promise<EquipmentCertification[]> {
  return [];
}

export async function getNearMiss(filters: NearMissFilters = {}): Promise<NearMiss[]> {
  const raw = await axiosInstance
    .get<RawNearMiss[]>('/near-misss/?limit=200')
    .then((r) => r.data);

  let results = raw.map(mapNearMiss);

  if (filters.severity) {
    results = results.filter((r) => r.Severity === filters.severity);
  }
  if (filters.status) {
    results = results.filter((r) => r.Status === filters.status);
  }
  if (filters.site_id) {
    results = results.filter((r) => r.Site_ID === filters.site_id);
  }

  return results;
}
