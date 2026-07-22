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

/**
 * The risk screen speaks the 5x5 matrix words; the workflow API speaks its own
 * consequence scale plus a low/medium/high/critical severity that drives escalation.
 * Serious and Fatal map to high/critical so the supervisor's investigation routes
 * straight to the manager instead of waiting for approval.
 */
const CONSEQUENCE: Record<string, string> = {
  minor: 'minor',
  significant: 'moderate',
  serious: 'major',
  fatal: 'catastrophic',
};

const WORKFLOW_SEVERITY: Record<string, string> = {
  minor: 'low',
  significant: 'medium',
  serious: 'high',
  fatal: 'critical',
};

export const hazardService = {
  async reportRisk(payload: ReportRiskRequest): Promise<boolean> {
    const key = (payload.severity ?? '').trim().toLowerCase();

    // Goes to risk_reports (a worker's field observation), NOT the hazards catalog —
    // only the workflow table has a supervisor queue behind it.
    await apiClient.post(ENDPOINTS.RISK.REPORT, {
      description: payload.hazard_name,
      risk_title: payload.hazard_name,
      risk_category: payload.category_id != null ? String(payload.category_id) : undefined,
      likelihood: (payload.probability ?? '').trim().toLowerCase() || undefined,
      consequence: CONSEQUENCE[key],
      severity: WORKFLOW_SEVERITY[key] ?? 'medium',
    });
    return true;
  },
};
