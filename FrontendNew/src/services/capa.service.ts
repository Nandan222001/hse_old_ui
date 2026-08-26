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

export interface AssignableOwner {
  employee_id: number;
  name: string;
  department: string;
  role: string;
}

export const getAllCapaActions = (
  page = 1,
  pageSize = 25,
  overdueOnly = false,
  unassignedOnly = false,
) =>
  axiosInstance
    .get<CapaListPage>('/capa/all', {
      params: {
        page,
        pageSize,
        overdue_only: overdueOnly,
        unassigned_only: unassignedOnly,
      },
    })
    .then((r) => r.data);

/** Step 05 of WF-04. Supervisors and safety managers, scoped to this org. */
export const getAssignableOwners = () =>
  axiosInstance.get<AssignableOwner[]>('/capa/assignable-owners').then((r) => r.data);

/**
 * Name the owner of a corrective action.
 *
 * An audit raises its actions with no owner on purpose — the auditor finds the
 * non-conformance, whoever runs the site decides who fixes it. Until this is
 * called the action appears in nobody's "My Actions" and the escalation chain,
 * which is addressed off the owner, has nobody to chase.
 */
export const assignCapa = (capaId: number, responsiblePersonId: number) =>
  axiosInstance
    .post(`/capa/${capaId}/assign`, { responsible_person_id: responsiblePersonId })
    .then((r) => r.data);
