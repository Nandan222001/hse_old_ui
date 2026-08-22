import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { submitOrQueue, type SubmitResult } from '../../services/offlineQueue';

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

/** What a worker logs into the standing hazard register. */
export interface LogHazardRequest {
  hazard_name: string;
  category_id?: number;
  description?: string;
  severity?: string;
  probability?: string;
  location?: string;
  location_station_id?: number;
  controls?: string;
  persons_exposed?: number;
  gps_latitude?: string;
  gps_longitude?: string;
}

/** One register entry as the worker sees it, with its derived stage. */
export interface MyHazard {
  id: number;
  reference: string | null;
  hazard_name: string | null;
  description: string | null;
  severity: string | null;
  probability: string | null;
  register_status: string | null;
  assessed_priority: string | null;
  risk_score: number | null;
  interim_control: string | null;
  planned_controls: string | null;
  station_name: string | null;
  category_name: string | null;
  logged_at: string | null;
  response_due_at: string | null;
  is_overdue: boolean | null;
  stage: string | null;
  stage_number: number | null;
  stage_label: string | null;
  completed_stages: string[];
  total_stages: number | null;
}

export const hazardService = {
  /**
   * Log a hazard into the standing register.
   *
   * Distinct from `reportRisk` below, which writes a one-off observation to
   * `risk_reports`. This creates a register entry a supervisor assesses,
   * contains and controls, and which the worker can then follow through all
   * eight stages — the same lifecycle an incident runs.
   */
  async logHazard(payload: LogHazardRequest): Promise<SubmitResult<MyHazard>> {
    return submitOrQueue<MyHazard>(
      ENDPOINTS.HAZARD_REGISTER.LOG,
      payload,
      { client: 'worker', label: 'Hazard register entry' },
    );
  },

  /** Every hazard this worker logged, newest first, each with its stage. */
  async myHazards(): Promise<MyHazard[]> {
    const { data } = await apiClient.get<MyHazard[]>(ENDPOINTS.HAZARD_REGISTER.MY_LOGS);
    return data ?? [];
  },

  async getHazard(id: number): Promise<MyHazard> {
    const { data } = await apiClient.get<MyHazard>(ENDPOINTS.HAZARD_REGISTER.DETAIL(id));
    return data;
  },

  async reportRisk(payload: ReportRiskRequest): Promise<SubmitResult<unknown>> {
    const key = (payload.severity ?? '').trim().toLowerCase();

    // Goes to risk_reports (a worker's field observation), NOT the hazards catalog —
    // only the workflow table has a supervisor queue behind it.
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
      { client: 'worker', label: 'Risk / hazard report' },
    );
  },
};
