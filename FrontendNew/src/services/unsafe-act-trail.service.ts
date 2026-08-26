import axiosInstance from '../api/axiosInstance';
import type { StageKey, TrailActionLike, TrailPersonLike, TrailStageLike } from '../app/components/tracking/lifecycle';

/**
 * Admin unsafe-act lifecycle tracking — every action from capture to closure.
 *
 * Backed by /unsafe-act-trail, which reconstructs the trail from the workflow
 * timestamps and the CAPA rows linked by the polymorphic (subject_family,
 * subject_id) pair. Same response shape as /near-miss-trail and
 * /incident-trail on purpose: the console renders all three through one
 * component.
 *
 * This is the same `unsafe_acts` table the mobile app writes to, so an unsafe
 * act reported on a phone appears here the moment it is submitted, and each
 * supervisor and manager step lands as a new action on the trail.
 */

export type { StageKey };
export { STAGE_ORDER } from '../app/components/tracking/lifecycle';

export type TrailAction = TrailActionLike;
export type TrailStage = TrailStageLike;
export type TrailPerson = TrailPersonLike;

export interface ChronologyWarning {
  action: string;
  stage: StageKey;
  occurred_at: string;
  source: string;
  precedes: string;
  precedes_at: string;
  reason: string;
}

export interface TrackedUnsafeAct {
  id: number;
  reference: string;
  family: string;
  description: string | null;
  station_name: string | null;
  severity: string | null;
  priority: string | null;
  severity_label: string | null;
  workflow_status: string | null;
  stage: StageKey | null;
  stage_number: number | null;
  is_hipo: boolean;
  is_recurring: boolean;
  act_type: string | null;
  reported_at: string | null;
  closed_at: string | null;
  response_due_at: string | null;
  is_overdue: boolean;
  last_action_at: string | null;
  action_count: number;
  capa_total: number;
  capa_open: number;
  reported_by_id: number | null;
  reported_by_name: string | null;
  supervisor_id: number | null;
  supervisor_name: string | null;
  auditor_verified: boolean;
}

export interface TrackedUnsafeActListResponse {
  count: number;
  items: TrackedUnsafeAct[];
  stage_counts: Record<StageKey, number>;
}

export interface UnsafeActTrailResponse {
  record: {
    id: number;
    reference: string;
    family: string;
    description: string | null;
    severity: string | null;
    severity_label: string | null;
    priority: string | null;
    workflow_status: string | null;
    stage: StageKey | null;
    stage_number: number | null;
    is_hipo: boolean;
    is_recurring: boolean;
    act_type: string | null;
    person_observed: string | null;
    rule_violated: string | null;
    corrective_advice_given: string | null;
    observed_date_time: string | null;
    reported_at: string | null;
    closed_at: string | null;
    root_cause: string | null;
    closure_notes: string | null;
    lessons_learned: string | null;
    verification_result: string | null;
  };
  stages: TrailStage[];
  actions: TrailAction[];
  people: TrailPerson[];
  named_in_report: { witnesses: string[] };
  unstaged_actions: TrailAction[];
  total_actions: number;
  total_stages: number;
  skipped_stages: StageKey[];
  chronology_warnings: ChronologyWarning[];
}

export const getTrackedUnsafeActs = (params?: { stage?: string; q?: string; limit?: number }) =>
  axiosInstance
    .get<TrackedUnsafeActListResponse>('/unsafe-act-trail', { params })
    .then((r) => r.data);

export const getUnsafeActTrail = (recordId: number) =>
  axiosInstance
    .get<UnsafeActTrailResponse>(`/unsafe-act-trail/${recordId}`)
    .then((r) => r.data);
