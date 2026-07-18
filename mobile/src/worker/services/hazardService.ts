import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

export interface ReportRiskRequest {
  /** Hazard category id (see hazard_categories) */
  category_id?: number;
  /** Short risk / hazard description */
  hazard_name: string;
  /** Consequence: Minor | Significant | Serious | Fatal */
  severity?: string;
  /** Likelihood: Rare | Unlikely | Possible | Likely */
  probability?: string;
}

export const hazardService = {
  async reportRisk(payload: ReportRiskRequest): Promise<boolean> {
    await apiClient.post(ENDPOINTS.HAZARDS.CREATE, payload);
    return true;
  },
};
