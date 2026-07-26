import { apiClient } from '../../api/client';
import { PERMIT_WORKFLOW, HAZARD_REGISTER } from '../../api/endpoints';

export interface AuditChecklistItem {
  id?: number;
  title?: string;
  question?: string;
  response?: 'pass' | 'fail' | 'na' | null;
  remarks?: string;
  photo_attached?: boolean;
}

export interface Audit {
  id: number;
  title: string;
  checklist_type?: string | null;
  site_name?: string | null;
  department?: string | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue' | string;
  priority?: string | null;
  progress?: number | null;
  due_date?: string | null;
  scheduled_date?: string | null;
  compliance_score?: number | null;
  findings?: AuditChecklistItem[];
}

/** Auditor workflow — the same shared apiClient/token every other role uses. */
export const auditService = {
  async listAssigned(): Promise<Audit[]> {
    const { data } = await apiClient.get<Audit[]>('/audits/');
    return data;
  },

  async get(id: number): Promise<Audit> {
    const { data } = await apiClient.get<Audit>(`/audits/${id}`);
    return data;
  },

  /** Submit completed checklist. compliance_score is derived server-side if omitted. */
  async submit(id: number, items: AuditChecklistItem[], compliance_score?: number): Promise<Audit> {
    const { data } = await apiClient.post<Audit>(`/audits/${id}/submit`, { items, compliance_score });
    return data;
  },

  // ── Permit to Work verification (flow 6 — auditor step) ──────────────────

  /** Permits that are Active and awaiting on-site auditor verification. */
  async listPermitsToVerify(): Promise<any[]> {
    const { data } = await apiClient.get(PERMIT_WORKFLOW.AUDIT_LIST);
    return Array.isArray(data) ? data : (data?.items ?? []);
  },

  /**
   * Record the on-site PTW verification result.
   * @param permitId  ID of the permit to verify
   * @param result    'valid' | 'invalid' | 'not_displayed'
   * @param notes     Optional verification notes
   */
  async verifyPermit(permitId: number, result: string, notes?: string): Promise<any> {
    const { data } = await apiClient.post(PERMIT_WORKFLOW.VERIFY(permitId), {
      verification_result: result,
      verification_notes: notes,
    });
    return data;
  },

  // ── Hazard register verification (flow 5 — auditor step) ─────────────────

  /** Hazards in open/under_review status awaiting on-site verification. */
  async listHazardsToVerify(): Promise<any[]> {
    const { data } = await apiClient.get(HAZARD_REGISTER.AUDIT_LIST);
    return Array.isArray(data) ? data : (data?.items ?? []);
  },

  /**
   * Record that the auditor has verified a hazard is being managed.
   * @param hazardId  ID of the hazard to verify
   * @param notes     Verification notes
   */
  async verifyHazard(hazardId: number, notes?: string): Promise<any> {
    const { data } = await apiClient.post(HAZARD_REGISTER.VERIFY(hazardId), {
      verification_notes: notes,
    });
    return data;
  },
};
