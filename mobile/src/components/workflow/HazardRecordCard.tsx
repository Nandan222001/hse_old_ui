/**
 * Everything captured about a hazard, in one card.
 *
 * The sibling of IncidentRecordCard, and written for the same reason. A hazard
 * passes through eight stages and every stage writes to the register, but each
 * screen rendered only the fields its own stage needed: the supervisor saw what
 * the worker reported and nothing of the assessment, and the manager's sheet
 * showed a description and an interim control — approving controls without
 * being able to read the root cause they answer.
 *
 * Six blocks, in the order the record was filled in:
 *
 *   1. Reported by the worker  — the log form, every field of it
 *   2. Assessment              — 02 ASSESS, the priority that ranks it
 *   3. Immediate response      — 03 RESPOND, what was done that day
 *   4. Review                  — 04 INVESTIGATE, root cause and exposure
 *   5. Controls                — 05 IMPROVE + 06 VERIFY, planned and checked
 *   6. Lessons and closure     — 07 LEARN + 08 CLOSE, plus auditor assurance
 *
 * A block renders only once it has content, so a hazard logged this morning
 * shows one and grows a block per stage as the workflow fills it in.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { HazardRegisterItem } from '../../services/hazardRegisterService';

const HIERARCHY_LABEL: Record<string, string> = {
  eliminate: 'Eliminate the hazard',
  substitute: 'Substitute something safer',
  engineering: 'Engineering control',
  administrative: 'Administrative control',
  ppe: 'PPE only',
};

const fmtDateTime = (iso?: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? String(iso) : d.toLocaleString();
};

const fmtDate = (iso?: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? String(iso) : d.toLocaleDateString();
};

/** Flags arrive as booleans from some endpoints and as 0/1 from others. */
const yesNo = (v: unknown) => (v === null || v === undefined ? null : v ? 'Yes' : 'No');

const fmtGps = (lat?: any, lng?: any) =>
  lat && lng ? `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}` : null;

/** One field. Renders nothing when blank — an absent answer and a "No" differ,
 *  which is why yesNo() returns null rather than "No" for a missing flag. */
function Row({ label, value }: { label: string; value?: any }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{String(value)}</Text>
    </View>
  );
}

export function HazardRecordCard({ hazard }: { hazard: HazardRegisterItem | any }) {
  if (!hazard) return null;

  const h = hazard;
  const hasAssessment = h.assessed_priority || h.assessed_label || h.risk_score != null;
  const hasResponse = h.interim_control || h.work_stopped;
  const hasReview = h.root_cause || h.review_notes || h.review_started_at;
  const hasControls = h.planned_controls || h.controls_verified_at;
  const hasClosure =
    h.lessons_learned || h.closure_notes || h.closed_at || h.auditor_verified_at;

  return (
    <View>
      {/* ── 1. Reported by the worker ────────────────────────────────────── */}
      <View style={styles.block}>
        <Text style={styles.blockTitle}>Reported by the worker</Text>
        <Row label="Hazard" value={h.hazard_name} />
        <Row label="Category" value={h.category_name} />
        <Row label="Description" value={h.description} />
        {/* One of the two, never both: the free text is stored only when what
            the worker typed matched no station on record. */}
        <Row label="Where" value={h.station_name || h.location_other} />
        <Row label="Reported by" value={h.logged_by_name} />
        <Row label="Logged" value={fmtDateTime(h.logged_at)} />
        {/* The frozen copies, not `severity`/`probability` — those two are
            rewritten by stage 02, so reading them here would print the
            assessor's scoring under the reporter's name. Older hazards, logged
            before the copies existed, have neither and simply show no row. */}
        <Row label="How bad" value={h.reported_severity} />
        <Row label="How likely" value={h.reported_probability} />
        <Row label="People exposed" value={h.reported_persons_exposed} />
        <Row label="Still there now" value={yesNo(h.still_present)} />
        <Row label="Controls already in place" value={h.existing_controls} />
        <Row label="GPS" value={fmtGps(h.gps_latitude, h.gps_longitude)} />
      </View>

      {/* ── 2. Assessment ───────────────────────────────────────────────── */}
      {!!hasAssessment && (
        <View style={[styles.block, styles.assessBlock]}>
          <Text style={styles.blockTitle}>Assessment</Text>
          <Row label="Priority" value={h.assessed_priority} />
          <Row label="Assessed as" value={h.assessed_label} />
          <Row label="Risk score" value={h.risk_score != null ? `${h.risk_score} / 25` : null} />
          <Row label="People exposed" value={h.persons_exposed} />
          <Row label="Assessed by" value={h.assessed_by_name} />
          <Row label="Assessed at" value={fmtDateTime(h.assessed_at)} />
          <Row label="Response due" value={fmtDateTime(h.response_due_at)} />
          {!!h.is_overdue && <Text style={styles.alert}>Overdue — the response deadline has passed</Text>}
        </View>
      )}

      {/* ── 3. Immediate response ───────────────────────────────────────── */}
      {!!hasResponse && (
        <View style={styles.block}>
          <Text style={styles.blockTitle}>Immediate response</Text>
          <Row label="Interim control" value={h.interim_control} />
          <Row label="Put in place by" value={h.interim_control_by_name} />
          <Row label="At" value={fmtDateTime(h.interim_control_at)} />
          {!!h.work_stopped && <Text style={styles.alert}>Work was stopped</Text>}
        </View>
      )}

      {/* ── 4. Review ───────────────────────────────────────────────────── */}
      {!!hasReview && (
        <View style={styles.block}>
          <Text style={styles.blockTitle}>Review</Text>
          <Row label="Root cause" value={h.root_cause} />
          <Row label="Review notes" value={h.review_notes} />
          <Row label="Reviewed by" value={h.reviewed_by_name} />
          <Row label="Started" value={fmtDateTime(h.review_started_at)} />
          <Row label="Reviewed at" value={fmtDateTime(h.reviewed_at)} />
        </View>
      )}

      {/* ── 5. Controls ─────────────────────────────────────────────────── */}
      {!!hasControls && (
        <View style={[styles.block, styles.controlBlock]}>
          <Text style={styles.blockTitle}>Controls</Text>
          <Row label="Planned control" value={h.planned_controls} />
          <Row
            label="Hierarchy"
            value={
              h.control_hierarchy
                ? HIERARCHY_LABEL[String(h.control_hierarchy)] ?? h.control_hierarchy
                : null
            }
          />
          <Row label="Owner" value={h.control_owner_name} />
          <Row label="Due" value={fmtDate(h.control_due_date)} />
          <Row label="Planned by" value={h.controls_planned_by_name} />
          <Row label="Planned at" value={fmtDateTime(h.controls_planned_at)} />
          <Row label="Verified by" value={h.controls_verified_by_name} />
          <Row label="Verified at" value={fmtDateTime(h.controls_verified_at)} />
          <Row label="What was checked" value={h.control_verification_notes} />
          {/* A verification that failed sent the hazard back a stage. The count
              is the honest record of that and belongs in front of whoever is
              deciding whether to trust this control. */}
          {!!h.verification_failures && (
            <Text style={styles.alert}>
              Failed verification {h.verification_failures}{' '}
              {h.verification_failures === 1 ? 'time' : 'times'}
            </Text>
          )}
          {String(h.control_hierarchy) === 'ppe' && (
            <Text style={styles.flag}>PPE only — the hazard itself is still there</Text>
          )}
        </View>
      )}

      {/* ── 6. Lessons and closure ──────────────────────────────────────── */}
      {!!hasClosure && (
        <View style={styles.block}>
          <Text style={styles.blockTitle}>Lessons and closure</Text>
          <Row label="Lesson learned" value={h.lessons_learned} />
          <Row label="Captured by" value={h.lesson_captured_by_name} />
          <Row label="Captured at" value={fmtDateTime(h.lesson_captured_at)} />
          <Row label="Closure notes" value={h.closure_notes} />
          <Row label="Closed by" value={h.closed_by_name} />
          <Row label="Closed at" value={fmtDateTime(h.closed_at)} />
          <Row label="Auditor verified by" value={h.auditor_verified_by_name} />
          <Row label="Auditor verified at" value={fmtDateTime(h.auditor_verified_at)} />
          <Row label="Auditor notes" value={h.verification_notes} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 12,
  },
  assessBlock: { backgroundColor: '#F8FAFC' },
  controlBlock: { borderColor: '#BFDBFE' },
  blockTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0B3D91',
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  row: { flexDirection: 'row', paddingVertical: 3, alignItems: 'flex-start' },
  rowLabel: { width: 132, fontSize: 12, color: '#64748B', fontWeight: '600' },
  rowValue: { flex: 1, fontSize: 12, color: '#0B1C30', fontWeight: '600' },
  flag: { marginTop: 4, fontSize: 12, fontWeight: '800', color: '#C2410C' },
  alert: { marginTop: 4, fontSize: 12, fontWeight: '800', color: '#B91C1C' },
});
