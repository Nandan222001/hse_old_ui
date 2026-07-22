import axiosInstance from '../api/axiosInstance';

// ── Types ────────────────────────────────────────────────────────────────────

export interface IncidentListItem {
  id: number;
  incident_date_time: string | null;
  incident_type: string | null;
  severity: string | null;
  description: string | null;
  workflow_status: string | null;
  reported_by: number | null;
  reported_at: string | null;
  acknowledged_at: string | null;
  location_station_id: number | null;
  anyone_injured: string | null;
  severity_classification: string | null;
  created_at: string | null;
}

export interface IncidentDetail {
  id: number;
  organisation_id: number | null;
  report_date: string | null;
  incident_date_time: string | null;
  location_station_id: number | null;
  incident_type: string | null;
  severity: string | null;
  number_persons_involved: number | null;
  description: string | null;
  immediate_cause: string | null;
  root_cause: string | null;
  hazard_id: number | null;
  permit_active: string | null;
  control_failure: string | null;
  reported_by: number | null;
  investigation_status: string | null;
  capa_generated: string | null;
  days_away: number | null;
  root_cause_category: string | null;
  workflow_status: string | null;
  assigned_supervisor_id: number | null;
  escalated_to_manager_id: number | null;
  escalation_reason: string | null;
  reported_at: string | null;
  acknowledged_at: string | null;
  investigation_started_at: string | null;
  investigation_completed_at: string | null;
  escalated_at: string | null;
  approved_at: string | null;
  closed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  closure_notes: string | null;
  regulatory_notified: string | null;
  lessons_learned: string | null;
  communicated_to_teams: string | null;
  manager_signature: string | null;
  anyone_injured: string | null;
  injured_person_name: string | null;
  injured_body_part: string | null;
  hazard_still_present: string | null;
  witnesses_json: string[] | null;
  evidence_json: string[] | null;
  gps_latitude: number | null;
  gps_longitude: number | null;
  five_why_analysis: { why: string; answer: string }[] | null;
  immediate_actions_taken: string | null;
  supervisor_signature: string | null;
  severity_classification: string | null;
}

export interface WorkflowStats {
  reported: number;
  acknowledged: number;
  under_investigation: number;
  escalated: number;
  pending_approval: number;
  closed: number;
  total: number;
}

// ── Worker: Report Incident ──────────────────────────────────────────────────

export interface WorkerReportPayload {
  incident_date_time: string;
  location_station_id?: number | null;
  incident_type: string;
  severity: string;
  description: string;
  anyone_injured?: string;
  injured_person_name?: string;
  injured_body_part?: string;
  hazard_still_present?: string;
  witnesses_json?: string[];
  evidence_json?: string[];
  gps_latitude?: number;
  gps_longitude?: number;
  number_persons_involved?: number;
}

export const workerReportIncident = (payload: WorkerReportPayload) =>
  axiosInstance.post<IncidentDetail>('/incident-workflow/report', payload).then(r => r.data);

// ── Worker: My Reports ───────────────────────────────────────────────────────

export const getMyReports = (skip = 0, limit = 50) =>
  axiosInstance.get<IncidentListItem[]>('/incident-workflow/my-reports', { params: { skip, limit } }).then(r => r.data);

// ── Supervisor: Pending Review ───────────────────────────────────────────────

export const getPendingReview = (skip = 0, limit = 50) =>
  axiosInstance.get<IncidentListItem[]>('/incident-workflow/pending-review', { params: { skip, limit } }).then(r => r.data);

// ── Supervisor: Acknowledge ──────────────────────────────────────────────────

export const acknowledgeIncident = (incidentId: number, notes?: string) =>
  axiosInstance.post<IncidentDetail>(`/incident-workflow/${incidentId}/acknowledge`, { notes }).then(r => r.data);

// ── Supervisor: Investigate ──────────────────────────────────────────────────

export interface InvestigatePayload {
  root_cause: string;
  five_why_analysis?: { why: string; answer: string }[];
  immediate_cause?: string;
  immediate_actions_taken?: string;
  root_cause_category?: string;
  severity_classification: string;
  days_away?: number;
  capa_description?: string;
  capa_responsible_person_id?: number;
  capa_due_date?: string;
  escalate?: boolean;
  escalation_reason?: string;
}

export const investigateIncident = (incidentId: number, payload: InvestigatePayload) =>
  axiosInstance.post<IncidentDetail>(`/incident-workflow/${incidentId}/investigate`, payload).then(r => r.data);

// ── Supervisor: Escalate ─────────────────────────────────────────────────────

export const escalateIncident = (incidentId: number, escalation_reason: string, escalated_to_manager_id?: number) =>
  axiosInstance.post<IncidentDetail>(`/incident-workflow/${incidentId}/escalate`, { escalation_reason, escalated_to_manager_id }).then(r => r.data);

// ── Manager: Queue ───────────────────────────────────────────────────────────

export const getManagerQueue = (skip = 0, limit = 50) =>
  axiosInstance.get<IncidentListItem[]>('/incident-workflow/manager-queue', { params: { skip, limit } }).then(r => r.data);

// ── Manager: Approve/Reject Investigation ────────────────────────────────────

export const approveInvestigation = (incidentId: number, decision: 'approved' | 'rejected', notes?: string) =>
  axiosInstance.post<IncidentDetail>(`/incident-workflow/${incidentId}/approve-investigation`, { decision, notes }).then(r => r.data);

// ── Manager: Close ───────────────────────────────────────────────────────────

export interface CloseIncidentPayload {
  closure_notes?: string;
  regulatory_notified?: string;
  lessons_learned?: string;
  communicated_to_teams?: string;
}

export const closeIncident = (incidentId: number, payload: CloseIncidentPayload) =>
  axiosInstance.post<IncidentDetail>(`/incident-workflow/${incidentId}/close`, payload).then(r => r.data);

// ── Shared: All Incidents ────────────────────────────────────────────────────

export interface IncidentFilters {
  workflow_status?: string;
  severity?: string;
  incident_type?: string;
  skip?: number;
  limit?: number;
}

export const getAllIncidents = (filters: IncidentFilters = {}) =>
  axiosInstance.get<IncidentListItem[]>('/incident-workflow/all', { params: filters }).then(r => r.data);

// ── Shared: Detail ───────────────────────────────────────────────────────────

export const getIncidentDetail = (incidentId: number) =>
  axiosInstance.get<IncidentDetail>(`/incident-workflow/${incidentId}`).then(r => r.data);

// ── Shared: Stats ────────────────────────────────────────────────────────────

export const getWorkflowStats = () =>
  axiosInstance.get<WorkflowStats>('/incident-workflow/stats/summary').then(r => r.data);
