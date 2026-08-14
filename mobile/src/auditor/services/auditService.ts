import { apiClient } from '../../api/client';

export interface AuditChecklistItem {
  id?: number;
  title?: string;
  question?: string;
  response?: 'pass' | 'fail' | 'na' | null;
  remarks?: string;
  photo_attached?: boolean;
  /**
   * Stage 03 RESPOND. A failure marked critical is the stop-work case: on
   * submit the audit lands in `immediate_action` and has to be contained before
   * it carries on, rather than going straight to findings.
   */
  critical?: boolean;
}

export interface Audit {
  id: number;
  title: string;
  checklist_type?: string | null;
  site_name?: string | null;
  department?: string | null;
  status:
    | 'scheduled' | 'in_progress' | 'immediate_action' | 'fieldwork'
    | 'findings_raised' | 'capa_open' | 'pending_review' | 'verified'
    | 'completed' | 'overdue' | string;
  priority?: string | null;
  progress?: number | null;
  due_date?: string | null;
  scheduled_date?: string | null;
  compliance_score?: number | null;
  findings?: AuditChecklistItem[];

  // Position on the eight stages, derived server-side from `status`.
  stage?: string | null;
  stage_number?: number | null;
  stage_label?: string | null;
  completed_stages?: string[];
  total_stages?: number | null;
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
  /** `shift` is a spec field on checklist submission — which shift was walked. */
  async submit(
    id: number,
    items: AuditChecklistItem[],
    compliance_score?: number,
    shift?: string,
  ): Promise<Audit> {
    const { data } = await apiClient.post<Audit>(`/audits/${id}/submit`, { items, compliance_score, shift });
    return data;
  },

  /** Stage 01 -> 02. The auditor picks the job up. */
  async start(id: number): Promise<Audit> {
    const { data } = await apiClient.post<Audit>(`/audits/${id}/start`, {});
    return data;
  },

  /**
   * Stage 02/03 -> 04. On site, working the checklist. Also the way back from a
   * contained stop-work finding — the audit carries on rather than restarting.
   */
  async beginFieldwork(id: number): Promise<Audit> {
    const { data } = await apiClient.post<Audit>(`/audits/${id}/fieldwork`, {});
    return data;
  },

  /**
   * Stage 06 VERIFY. `effective: false` returns the audit to IMPROVE — findings
   * that were not really closed out are exactly what an audit trail should catch.
   */
  async verify(id: number, effective: boolean, verification_notes?: string): Promise<Audit> {
    const { data } = await apiClient.post<Audit>(`/audits/${id}/verify`, {
      effective,
      verification_notes,
    });
    return data;
  },

  /** Stage 08 CLOSE. Only reachable once the findings are verified. */
  async close(id: number): Promise<Audit> {
    const { data } = await apiClient.post<Audit>(`/audits/${id}/close`, {});
    return data;
  },
};
