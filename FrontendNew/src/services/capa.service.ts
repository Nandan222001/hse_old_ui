import axiosInstance from '../api/axiosInstance';

export interface CapaListItem {
  id: number;
  capa_ref: string | null;
  description: string | null;
  incident_id: number | null;
  subject_family: string | null;
  subject_id: number | null;
  status: string | null;
  step: number;
  step_label: string;
  priority_band: string | null;
  capa_type: string | null;
  due_date: string | null;
  elapsed_percent: number | null;
  is_overdue: boolean;
  escalation_level: number;
  responsible_person_id: number | null;
  responsible_person_name: string | null;
  systemic_flag: boolean;
  reopened_count: number;
}

export interface CapaListPage {
  data: CapaListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const getAllCapaActions = (page = 1, pageSize = 25, overdueOnly = false) =>
  axiosInstance
    .get<CapaListPage>('/capa/all', { params: { page, pageSize, overdue_only: overdueOnly } })
    .then((r) => r.data);
