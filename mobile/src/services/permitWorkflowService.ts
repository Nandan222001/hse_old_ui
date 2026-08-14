import { apiClient } from '../api/client';
import { PERMIT_WORKFLOW } from '../api/endpoints';

/**
 * Drives the Permit to Work workflow (flow 6):
 *   Worker raises → Supervisor acknowledges → Manager approves/rejects & monitors →
 *   Auditor verifies the permit is valid and displayed on site.
 *
 * The backend keeps permits in their own table with a `workflow_status` state machine
 * that runs alongside the website's `status` field (only approval flips status='Active').
 */
export interface PermitListItem {
  id: number;
  permit_ref: string | null;
  permit_type_id: number | null;
  workflow_status: string | null;
  status: string | null;
  work_description: string | null;
  location_station_id: number | null;
  requested_by: number | null;
  requested_at: string | null;
  validity_end: string | null;
}

export interface PermitDetail extends PermitListItem {
  duration_requested_hours: number | null;
  number_of_workers: number | null;
  validity_start: string | null;
  acknowledged_by: number | null;
  acknowledged_at: string | null;
  supervisor_notes: string | null;
  approved_by: number | null;
  approved_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  auditor_verified_by: number | null;
  auditor_verified_at: string | null;
  verification_result: string | null;
  verification_notes: string | null;
}

export interface PermitRequestPayload {
  permit_type?: string;
  permit_type_id?: number;
  work_description?: string;
  location?: string;
  location_station_id?: number;
  duration_requested_hours?: number;
  number_of_workers?: number;
  validity_start?: string;
  validity_end?: string;
}

export interface PermitApprovePayload {
  validity_start?: string;
  validity_end?: string;
  notes?: string;
}

export const permitWorkflowService = {
  // ── Worker ──────────────────────────────────────────────────────────────────
  async request(payload: PermitRequestPayload): Promise<PermitDetail> {
    const { data } = await apiClient.post(PERMIT_WORKFLOW.REQUEST, payload);
    return data;
  },
  async myPermits(): Promise<PermitListItem[]> {
    const { data } = await apiClient.get(PERMIT_WORKFLOW.MY_PERMITS);
    return data ?? [];
  },

  // ── Supervisor ────────────────────────────────────────────────────────────────
  async pendingReview(): Promise<PermitListItem[]> {
    const { data } = await apiClient.get(PERMIT_WORKFLOW.PENDING_REVIEW);
    return data ?? [];
  },
  async acknowledge(id: number, supervisorNotes?: string): Promise<PermitDetail> {
    const { data } = await apiClient.post(PERMIT_WORKFLOW.ACKNOWLEDGE(id), {
      supervisor_notes: supervisorNotes,
    });
    return data;
  },

  // ── Manager ─────────────────────────────────────────────────────────────────
  async managerQueue(): Promise<PermitListItem[]> {
    const { data } = await apiClient.get(PERMIT_WORKFLOW.MANAGER_QUEUE);
    return data ?? [];
  },
  async approve(id: number, payload: PermitApprovePayload = {}): Promise<PermitDetail> {
    const { data } = await apiClient.post(PERMIT_WORKFLOW.APPROVE(id), payload);
    return data;
  },
  async reject(id: number, reason: string): Promise<PermitDetail> {
    const { data } = await apiClient.post(PERMIT_WORKFLOW.REJECT(id), { rejection_reason: reason });
    return data;
  },
  async active(): Promise<PermitListItem[]> {
    const { data } = await apiClient.get(PERMIT_WORKFLOW.ACTIVE);
    return data ?? [];
  },
  /**
   * Stage 05 -> 06. Work starts under the permit.
   *
   * An issued permit and one being worked under are different things: the first
   * is a granted authorisation, the second is live work relying on its controls
   * right now.
   */
  async activate(id: number): Promise<PermitDetail> {
    const { data } = await apiClient.post(PERMIT_WORKFLOW.ACTIVATE(id), {});
    return data;
  },

  /**
   * Stage 06 -> 04. Work stops and the cause is established before anyone goes
   * back in. This is the permit's genuine investigate state.
   */
  async suspend(id: number, reason: string): Promise<PermitDetail> {
    const { data } = await apiClient.post(PERMIT_WORKFLOW.SUSPEND(id), { reason });
    return data;
  },

  /** Stage 04 -> 06. Cause established, work may restart. */
  async resume(id: number): Promise<PermitDetail> {
    const { data } = await apiClient.post(PERMIT_WORKFLOW.RESUME(id), {});
    return data;
  },

  /** Stage 06 -> 07. Work finished; the permit is spent and owes its lesson. */
  async completeWork(id: number): Promise<PermitDetail> {
    const { data } = await apiClient.post(PERMIT_WORKFLOW.COMPLETE_WORK(id), {});
    return data;
  },

  /**
   * Close-out at end of work. `deviation_reported` is required because it is the only
   * source for LOTO Compliance % and Permit Deviation Rate.
   *
   * There used to be a second, earlier `close(id, notes)` above this one. It was
   * unreachable — TypeScript takes the last declaration — so every call already
   * used this signature, and it was one of the repo's standing type errors.
   */
  async close(id: number, payload: {
    deviation_reported: 'Yes' | 'No';
    incident_occurred?: 'Yes' | 'No';
    work_start_actual?: string;
    work_end_actual?: string;
    supervisor_notes?: string;
  }): Promise<PermitDetail> {
    const { data } = await apiClient.post(PERMIT_WORKFLOW.CLOSE(id), payload);
    return data;
  },

  // ── Auditor ─────────────────────────────────────────────────────────────────
  async auditList(): Promise<PermitListItem[]> {
    const { data } = await apiClient.get(PERMIT_WORKFLOW.AUDIT_LIST);
    return data ?? [];
  },
  async verify(id: number, result: string, notes?: string): Promise<PermitDetail> {
    const { data } = await apiClient.post(PERMIT_WORKFLOW.VERIFY(id), {
      verification_result: result,
      verification_notes: notes,
    });
    return data;
  },

  // ── Shared ──────────────────────────────────────────────────────────────────
  async detail(id: number): Promise<PermitDetail> {
    const { data } = await apiClient.get(PERMIT_WORKFLOW.DETAIL(id));
    return data;
  },
  async stats() {
    const { data } = await apiClient.get(PERMIT_WORKFLOW.STATS);
    return data;
  },
};
