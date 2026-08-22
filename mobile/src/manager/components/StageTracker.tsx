import { View, Text, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import type { TrackStage } from '../../services/incidentWorkflowService';

/**
 * The eight-stage progress tracker for one incident, plus "you are here".
 *
 * MgrInvestigation already explained the *current* stage at the bottom of the
 * screen, but only once you had scrolled to the action buttons. Putting the
 * whole track at the top answers the question a manager actually opens an
 * incident with — how far along is this, and what is left — before they read
 * anything else.
 *
 * The track comes from the backend rather than being derived here, so this
 * component and the dashboard queue always agree on which stage is current.
 */

/**
 * Structural rather than `IncidentNextAction`, so the hazard register renders
 * the same tracker. The two endpoints return an identical shape apart from the
 * status field's name — incidents call it `workflow_status`, the register
 * `register_status` — and both are accepted below. A second copy of this
 * component for hazards would drift from this one the first time a stage was
 * restyled.
 */
export interface StageTrackerInfo {
  stage: string | null;
  stage_number: number | null;
  stage_label?: string | null;
  is_closed: boolean;
  is_mine: boolean;
  track: TrackStage[];
  next_action: {
    action: string;
    detail: string;
    owner_role: string;
    cta: string;
    unblocks: string | null;
  } | null;
  workflow_status?: string | null;
  register_status?: string | null;
}

interface Props {
  info: StageTrackerInfo;
}

function Dot({ stage }: { stage: TrackStage }) {
  const done = stage.state === 'done';
  const current = stage.state === 'current';
  return (
    <View style={styles.dotWrap}>
      <View
        style={[
          styles.dot,
          done && styles.dotDone,
          current && styles.dotCurrent,
        ]}
      >
        {done ? (
          <Check size={11} color="#FFFFFF" strokeWidth={3} />
        ) : (
          <Text style={[styles.dotNum, current && styles.dotNumCurrent]}>{stage.number}</Text>
        )}
      </View>
      <Text
        style={[styles.dotLabel, current && styles.dotLabelCurrent]}
        numberOfLines={1}
      >
        {stage.short}
      </Text>
    </View>
  );
}

export function StageTracker({ info }: Props) {
  const { track, next_action: next, is_closed: isClosed, is_mine: isMine } = info;

  return (
    <View style={styles.card}>
      <View style={styles.track}>
        {track.map((stage, i) => (
          <View key={stage.key} style={styles.segment}>
            {i > 0 && (
              <View
                style={[
                  styles.connector,
                  (stage.state === 'done' || stage.state === 'current') && styles.connectorDone,
                ]}
              />
            )}
            <Dot stage={stage} />
          </View>
        ))}
      </View>

      {isClosed ? (
        <View style={styles.closedRow}>
          <Check size={14} color="#15803D" strokeWidth={3} />
          <Text style={styles.closedText}>Closed — all eight stages complete.</Text>
        </View>
      ) : next ? (
        <View style={styles.nextBox}>
          <Text style={styles.hereLabel}>
            YOU ARE HERE · {String(info.stage_number ?? '').padStart(2, '0')} {info.stage}
          </Text>
          <Text style={styles.nextAction}>{next.action}</Text>
          <Text style={styles.nextDetail}>{next.detail}</Text>
          <View style={styles.metaRow}>
            {/* Saying whose step it is stops a manager waiting on a supervisor
                and a supervisor waiting on the manager. */}
            <Text style={styles.waiting}>
              {isMine ? 'Waiting on you' : `Waiting on the ${next.owner_role.replace('_', ' ')}`}
            </Text>
            {!!next.unblocks && <Text style={styles.unblocks}>→ {next.unblocks}</Text>}
          </View>
        </View>
      ) : (
        <Text style={styles.unknown}>
          This record's status ({info.workflow_status ?? info.register_status}) is not part
          of the eight-stage lifecycle, so no next step can be derived.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 14,
    borderWidth: 1, borderColor: '#E3E9F6',
  },
  track: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  segment: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  connector: { flex: 1, height: 2, backgroundColor: '#E2E8F0', marginTop: -14 },
  connectorDone: { backgroundColor: '#0B3D91' },
  dotWrap: { alignItems: 'center', width: 30 },
  dot: {
    width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF',
  },
  dotDone: { backgroundColor: '#0B3D91', borderColor: '#0B3D91' },
  dotCurrent: { borderColor: '#0B3D91', borderWidth: 3, backgroundColor: '#EEF2FB' },
  dotNum: { fontSize: 10, fontWeight: '800', color: '#94A3B8' },
  dotNumCurrent: { color: '#0B3D91' },
  dotLabel: { fontSize: 8, fontWeight: '700', color: '#94A3B8', marginTop: 4 },
  dotLabelCurrent: { color: '#0B3D91' },

  nextBox: { backgroundColor: '#F7F9FE', borderRadius: 10, padding: 12 },
  hereLabel: { fontSize: 10, fontWeight: '800', color: '#0B3D91', letterSpacing: 0.6, marginBottom: 4 },
  nextAction: { fontSize: 15, fontWeight: '800', color: '#0B1C30', marginBottom: 3 },
  nextDetail: { fontSize: 12, color: '#64748B', lineHeight: 17 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, gap: 8 },
  waiting: { fontSize: 11, fontWeight: '800', color: '#334155' },
  unblocks: { fontSize: 10, color: '#64748B' },

  closedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: '#F0FDF4', borderRadius: 10, padding: 12,
  },
  closedText: { fontSize: 13, fontWeight: '700', color: '#166534' },

  unknown: { fontSize: 12, color: '#B45309', lineHeight: 17 },
});
