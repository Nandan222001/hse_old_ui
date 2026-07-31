import { apiClient } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

export interface SupervisorInvestigatePayload {
  root_cause: string;
  five_why_analysis?: Array<{ why: string; answer: string }>;
  immediate_cause?: string;
  immediate_actions_taken?: string;
  root_cause_category?: string;
  severity_classification: string;
  days_away?: number;
  capa_description?: string;
  capa_responsible_person_id?: number;
  capa_due_date?: string;
  escalate: boolean;
  escalation_reason?: string;
}

export interface ManagerApprovePayload {
  decision: 'approved' | 'rejected';
  notes?: string;
}

export interface ManagerClosePayload {
  closure_notes?: string;
  regulatory_notified?: string;
  lessons_learned?: string;
  communicated_to_teams?: string;
}

export const incidentWorkflowService = {
  async acknowledge(incidentId: string): Promise<any> {
    const { data } = await apiClient.post(ENDPOINTS.INCIDENT_WORKFLOW.ACKNOWLEDGE(incidentId), {});
    return data;
  },

  async investigate(incidentId: string, payload: SupervisorInvestigatePayload): Promise<any> {
    const { data } = await apiClient.post(ENDPOINTS.INCIDENT_WORKFLOW.INVESTIGATE(incidentId), payload);
    return data;
  },

  async escalate(incidentId: string, reason: string, managerId?: number): Promise<any> {
    const { data } = await apiClient.post(ENDPOINTS.INCIDENT_WORKFLOW.ESCALATE(incidentId), {
      escalation_reason: reason,
      escalated_to_manager_id: managerId,
    });
    return data;
  },

  async getManagerQueue(): Promise<any[]> {
    const { data } = await apiClient.get(ENDPOINTS.INCIDENT_WORKFLOW.MANAGER_QUEUE);
    return data;
  },

  async approveInvestigation(incidentId: string, payload: ManagerApprovePayload): Promise<any> {
    const { data } = await apiClient.post(ENDPOINTS.INCIDENT_WORKFLOW.APPROVE(incidentId), payload);
    return data;
  },

  async close(incidentId: string, payload: ManagerClosePayload): Promise<any> {
    const { data } = await apiClient.post(ENDPOINTS.INCIDENT_WORKFLOW.CLOSE(incidentId), payload);
    return data;
  },

  async getDetail(incidentId: string): Promise<any> {
    const { data } = await apiClient.get(ENDPOINTS.INCIDENT_WORKFLOW.DETAIL(incidentId));
    return data;
  },

  async getMyCapaActions(): Promise<CapaAction[]> {
    const { data } = await apiClient.get(ENDPOINTS.INCIDENT_WORKFLOW.CAPA_MY_ACTIONS);
    return data ?? [];
  },

  async completeCapaAction(capaId: number, effectivenessRating?: number): Promise<CapaAction> {
    const { data } = await apiClient.post(ENDPOINTS.INCIDENT_WORKFLOW.CAPA_COMPLETE(capaId), {
      effectiveness_rating: effectivenessRating,
    });
    return data;
  },
};

export interface CapaAction {
  id: number;
  incident_id: number | null;
  action_type: string | null;
  description: string | null;
  responsible_person_id: number | null;
  due_date: string | null;
  status: string | null;
}
