import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { submitOrQueue, type SubmitResult } from '../../services/offlineQueue';

/**
 * A worker's one-off risk observations on `risk_reports` — raising them, and
 * following each one to closure.
 *
 * Split out of `hazardService`, which had been carrying both this and the
 * standing hazard register. They are separate tables with separate lifecycles
 * and separate screens, and one service holding both is how a caller ends up
 * logging a register entry when it meant to report a sighting. `hazardService`
 * now owns only the register; this owns only observations.
 *
 * The stage fields come straight off `/risk-workflow/my-reports` — the backend
 * derives them from `workflow_status` and every role reads the same derivation,
 * so the worker, the supervisor and the manager cannot disagree about where a
 * risk has got to.
 */

/** What the risk form collects. The 5×5 matrix words, before translation. */
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

/** One of this worker's risk reports, with its position on the eight stages. */
export interface MyRisk {
  id: number;
  report_type: string;
  workflow_status: string | null;
  severity: string | null;
  description: string | null;
  reported_at: string | null;
  acknowledged_at: string | null;
  created_at: string | null;
  assessed_priority: string | null;
  is_hipo: boolean | null;
  response_due_at: string | null;
  stage: string | null;
  stage_number: number | null;
  stage_label: string | null;
  completed_stages: string[];
  total_stages: number | null;
}

/**
 * The WF-01 verdict, as the backend returns it under `details`.
 *
 * `risk_score` is the raw likelihood × consequence the worker's own answers
 * produced; `adjusted_risk_score` is that plus the mandatory uplifts, and it is
 * what banded the risk and set `blocks_work`. A worker who entered a 12 and
 * sees a High band needs both numbers or the rating looks arbitrary.
 */
export interface RiskDetails {
  risk_title?: string | null;
  risk_category?: string | null;
  likelihood?: string | null;
  consequence?: string | null;
  risk_score?: number | null;
  adjusted_risk_score?: number | null;
  uplift_total?: number | null;
  risk_band?: string | null;
  risk_colour?: string | null;
  blocks_work?: number | boolean | null;
  approval_route?: string | null;
  review_frequency?: string | null;
  risk_explanation?: string | null;
  existing_controls?: string | null;
  suggested_controls?: string | null;
  hazard_id?: number | null;
}

/** The full record, including what the supervisor and manager wrote on it. */
export interface RiskDetail extends MyRisk {
  root_cause: string | null;
  immediate_actions_taken: string | null;
  closure_notes: string | null;
  escalation_reason: string | null;
  closed_at: string | null;
  details: RiskDetails;
}

export const riskService = {
  /**
   * Report a risk. Goes to `risk_reports` (a worker's field observation), NOT
   * the `hazards` catalog — only the workflow table has a supervisor queue
   * behind it, and not the register either, which is `hazardService.logHazard`.
   */
  async reportRisk(payload: ReportRiskRequest): Promise<SubmitResult<unknown>> {
    const key = (payload.severity ?? '').trim().toLowerCase();

    return submitOrQueue(
      ENDPOINTS.RISK.REPORT,
      {
        description: payload.hazard_name,
        risk_title: payload.hazard_name,
        risk_category: payload.category_id != null ? String(payload.category_id) : undefined,
        likelihood: (payload.probability ?? '').trim().toLowerCase() || undefined,
        consequence: CONSEQUENCE[key],
        severity: WORKFLOW_SEVERITY[key] ?? 'medium',
      },
      { client: 'worker', label: 'Risk observation' },
    );
  },

  /** Every risk this worker reported, newest first, each with its stage. */
  async myRisks(): Promise<MyRisk[]> {
    const { data } = await apiClient.get<MyRisk[]>(ENDPOINTS.RISK.MY_REPORTS);
    return data ?? [];
  },

  async getRisk(id: number): Promise<RiskDetail> {
    const { data } = await apiClient.get<RiskDetail>(ENDPOINTS.RISK.DETAIL(id));
    return data;
  },
};
