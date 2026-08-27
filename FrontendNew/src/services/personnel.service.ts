import axiosInstance from '../api/axiosInstance';
import type { User, Worker, Contractor, AccessLog, SLAConfig } from '../types';

// Backend Employee shape
interface BackendEmployee {
  id: number;
  full_name: string;
  gender: string;
  employment_type: string;
  employment_start_date: string;
  role_id: number;
  department_id: number;
  shift_pattern: string;
  active_status: string;
  created_at: string;
  updated_at: string;
}

export const getUsers = () =>
  axiosInstance.get<BackendEmployee[]>('/employees/').then((r) =>
    r.data.map((e) => ({
      User_ID: String(e.id),
      Name: e.full_name,
      Email: '',
      Role: 'Worker',
      Site: '',
      Department: String(e.department_id ?? ''),
      Status: e.active_status ?? 'Active',
      Last_Login: '',
    } as unknown as User))
  );

export const getWorkers = (_contractor?: string) =>
  axiosInstance.get<BackendEmployee[]>('/employees/').then((r) =>
    r.data.map((e) => ({
      Worker_ID: String(e.id),
      Name: e.full_name,
      Contractor: '',
      Zone: '',
      PPE_Status: 'Compliant',
      Last_Entry: '',
      Status: e.active_status ?? 'Active',
    } as unknown as Worker))
  );

// These don't exist in backend yet — return empty arrays
export const getContractors = (): Promise<Contractor[]> => Promise.resolve([]);

export const getAccessLog = (): Promise<AccessLog[]> => Promise.resolve([]);

export const getSLAConfig = (): Promise<SLAConfig[]> => Promise.resolve([]);

export type { User, Worker, Contractor, AccessLog, SLAConfig };

// ── Employee Directory ──────────────────────────────────────────────────────

export interface EmployeeDirectoryRow {
  id: number;
  full_name: string;
  role_name: string | null;
  department_name: string | null;
  site_name: string | null;
  employment_type: string | null;
  shift_pattern: string | null;
  active_status: string | null;
}

export const getEmployeeDirectory = () =>
  axiosInstance.get<EmployeeDirectoryRow[]>('/people/directory').then((r) => r.data);

// ── Team Hierarchy ───────────────────────────────────────────────────────────

export interface TeamHierarchyRow {
  id: number;
  full_name: string;
  role_name: string | null;
  manager_id: number | null;
  active_status: string | null;
  email: string | null;
  has_login: boolean;
  is_active: boolean | null;
}

export const getTeamHierarchy = () =>
  axiosInstance.get<TeamHierarchyRow[]>('/people/hierarchy').then((r) => r.data);

// ── People Dashboard Overview ───────────────────────────────────────────────

export interface PeopleKpiMetric {
  value: number;
  subtitle: string;
  tone: 'green' | 'amber' | 'red' | 'blue';
  change: string;
  sparkline?: number[];
}

export interface PeopleFatiguePoint {
  week: string;
  week_start: string;
  normal: number;
  overtime: number;
}

export interface PeopleToolboxPoint {
  month: string;
  month_start: string;
  meetings: number;
}

export interface PeopleHighRiskRole {
  role: string;
  status: string;
  tone: 'green' | 'amber' | 'red' | 'blue';
}

export interface PeopleTrainingExpiry {
  label: string;
  value: number;
}

export interface PeopleBehaviourItem {
  label: string;
  value: number;
  color: string;
}

export interface PeopleActionItem {
  title: string;
  detail: string;
  tone: 'green' | 'amber' | 'red' | 'blue';
  priority?: string;
}

export interface PeopleOverview {
  competency_coverage: PeopleKpiMetric;
  worker_exposure_index: PeopleKpiMetric;
  supervisor_safety_score: PeopleKpiMetric;
  fatigue_trend: PeopleFatiguePoint[];
  fatigue_trend_range: string;
  toolbox_trend: PeopleToolboxPoint[];
  toolbox_trend_range: string;
  high_risk_roles: PeopleHighRiskRole[];
  training_expiry: PeopleTrainingExpiry[];
  expiring_soon_count: number;
  behaviour_breakdown: PeopleBehaviourItem[];
  coaching_actions: PeopleActionItem[];
  open_actions: PeopleActionItem[];
}

export const getPeopleOverview = () =>
  axiosInstance.get<PeopleOverview>('/people/overview').then((r) => r.data);
