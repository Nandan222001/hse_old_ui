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
