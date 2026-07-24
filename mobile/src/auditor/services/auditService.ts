import { apiClient } from '../../api/client';

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
};
