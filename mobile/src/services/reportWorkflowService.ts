import { apiClient } from '../api/client';
import { reportWorkflowEndpoints, type ReportType } from '../api/endpoints';

/**
 * Drives the Worker→Supervisor→Manager workflow for any report type.
 *
 * The backend builds the four routers from one factory, so every type exposes the
 * identical verbs. Mirroring that with a single service keeps the supervisor screens
 * from triplicating logic — `incidentWorkflowService` stays as-is because incidents
 * carry extra investigation fields (CAPA, days away) the other three do not.
 */

/** One row in a supervisor or manager queue. */
export interface ReportListItem {
  id: number;
  report_type: ReportType;
  workflow_status: string | null;
  severity: string | null;
  description: string | null;
  location_station_id: number | null;
  reported_by: number | null;
  reported_at: string | null;
  acknowledged_at: string | null;
  created_at: string | null;
}

export interface ReportDetail extends ReportListItem {
  root_cause: string | null;
  immediate_actions_taken: string | null;
  escalation_reason: string | null;
  closure_notes: string | null;
  details: Record<string, any>;
}

export interface InvestigatePayload {
  root_cause?: string;
  immediate_actions_taken?: string;
  five_why_analysis?: Record<string, any>;
  supervisor_signature?: string;
  /** Raising this to high/critical routes straight to the manager. */
  severity?: string;
}

export interface ClosePayload {
  closure_notes?: string;
  lessons_learned?: string;
  manager_signature?: string;
}

export interface WorkflowStats {
  report_type: ReportType;
  total: number;
  by_status: Record<string, number>;
  pending_supervisor: number;
  pending_manager: number;
}

export function reportWorkflowService(type: ReportType) {
  const E = reportWorkflowEndpoints(type);

  return {
    // ── Supervisor ────────────────────────────────────────────────────────────
    async getPendingReview(): Promise<ReportListItem[]> {
      const { data } = await apiClient.get(E.PENDING_REVIEW);
      return data ?? [];
    },

    async acknowledge(id: number, notes?: string): Promise<ReportDetail> {
      const { data } = await apiClient.post(E.ACKNOWLEDGE(id), { notes });
      return data;
    },

    /**
     * Stage 03 -> 04. Opens the investigation before any findings exist, so the
     * record sits visibly in INVESTIGATE while the work happens rather than
     * jumping from RESPOND straight to a finished RCA.
     */
    async startInvestigation(id: number): Promise<ReportDetail> {
      const { data } = await apiClient.post(E.START_INVESTIGATION(id), {});
      return data;
    },

    async investigate(id: number, payload: InvestigatePayload): Promise<ReportDetail> {
      const { data } = await apiClient.post(E.INVESTIGATE(id), payload);
      return data;
    },

    async escalate(id: number, reason: string, managerId?: number): Promise<ReportDetail> {
      const { data } = await apiClient.post(E.ESCALATE(id), {
        escalation_reason: reason,
        escalated_to_manager_id: managerId,
      });
      return data;
    },

    // ── Manager ───────────────────────────────────────────────────────────────
    async getManagerQueue(): Promise<ReportListItem[]> {
      const { data } = await apiClient.get(E.MANAGER_QUEUE);
      return data ?? [];
    },

    async approveInvestigation(id: number, approved = true, notes?: string): Promise<ReportDetail> {
      const { data } = await apiClient.post(E.APPROVE(id), { approved, notes });
      return data;
    },

    /**
     * Stage 06 VERIFY. `effective: false` returns the record to IMPROVE and
     * reopens its corrective actions — a control that did not hold means the
     * hazard is still live.
     */
    async verifyEffectiveness(
      id: number,
      effective: boolean,
      verificationNotes?: string,
    ): Promise<ReportDetail> {
      const { data } = await apiClient.post(E.VERIFY_EFFECTIVENESS(id), {
        effective,
        verification_notes: verificationNotes,
      });
      return data;
    },

    async close(id: number, payload: ClosePayload): Promise<ReportDetail> {
      const { data } = await apiClient.post(E.CLOSE(id), payload);
      return data;
    },

    // ── Shared ────────────────────────────────────────────────────────────────
    async getStats(): Promise<WorkflowStats> {
      const { data } = await apiClient.get(E.STATS);
      return data;
    },

    async getDetail(id: number): Promise<ReportDetail> {
      const { data } = await apiClient.get(E.DETAIL(id));
      return data;
    },
  };
}
