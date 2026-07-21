import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { TextArea } from '../form/TextArea';
import type { InvestigatePayload } from '../../services/reportWorkflowService';

/**
 * The supervisor's investigation write-up, before a report moves to the manager.
 *
 * Root cause is the only required field — a supervisor on site should not be blocked
 * from closing out their step by five optional "why" boxes. The severity picker
 * matters: raising it to high/critical makes the backend route straight to the
 * manager instead of parking in pending_approval, so the modal says so out loud.
 */

const SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;
type Severity = (typeof SEVERITIES)[number];

const SEVERITY_COLOR: Record<Severity, string> = {
  low: Colors.success,
  medium: Colors.warning,
  high: Colors.critical,
  critical: Colors.critical,
};

const WHY_LABELS = [
  'Why did it happen?',
  'Why did that happen?',
  'And why was that?',
  'And why was that?',
  'Root of the chain',
];

interface Props {
  visible: boolean;
  /** Severity the worker reported, pre-selected for the supervisor. */
  initialSeverity?: string | null;
  reportLabel: string;
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (payload: InvestigatePayload) => void;
}

export function InvestigationFormModal({
  visible,
  initialSeverity,
  reportLabel,
  isSubmitting = false,
  onCancel,
  onSubmit,
}: Props) {
  const [rootCause, setRootCause] = useState('');
  const [actions, setActions] = useState('');
  const [whys, setWhys] = useState<string[]>(['', '', '', '', '']);
  const [showWhys, setShowWhys] = useState(false);
  const [severity, setSeverity] = useState<Severity>('medium');
  const [touched, setTouched] = useState(false);

  // The modal stays mounted while `visible` toggles, so useState's initialiser only
  // ever ran for the first report opened. Re-sync each time it opens, or every
  // report after the first would show the previous one's severity.
  useEffect(() => {
    if (!visible) return;
    const s = (initialSeverity ?? '').toLowerCase() as Severity;
    setSeverity(SEVERITIES.includes(s) ? s : 'medium');
  }, [visible, initialSeverity]);

  const rootCauseError = touched && !rootCause.trim() ? 'Root cause is required' : undefined;
  const willEscalate = severity === 'high' || severity === 'critical';

  const reset = () => {
    setRootCause('');
    setActions('');
    setWhys(['', '', '', '', '']);
    setShowWhys(false);
    setTouched(false);
  };

  const handleSubmit = () => {
    setTouched(true);
    if (!rootCause.trim()) return;

    // Backend stores five_why_analysis as a JSON object; only send the boxes filled in.
    const fiveWhy = whys.reduce<Record<string, string>>((acc, val, i) => {
      if (val.trim()) acc[`why${i + 1}`] = val.trim();
      return acc;
    }, {});

    onSubmit({
      root_cause: rootCause.trim(),
      immediate_actions_taken: actions.trim() || undefined,
      five_why_analysis: Object.keys(fiveWhy).length ? fiveWhy : undefined,
      severity,
    });
    reset();
  };

  const handleCancel = () => {
    reset();
    onCancel();
  };

  const filledWhys = useMemo(() => whys.filter((w) => w.trim()).length, [whys]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleCancel}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Investigation</Text>
            <TouchableOpacity onPress={handleCancel} hitSlop={8}>
              <Ionicons name="close" size={22} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle} numberOfLines={2}>
            {reportLabel}
          </Text>

          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
            <TextArea
              label="Root cause *"
              placeholder="What actually caused this?"
              value={rootCause}
              onChangeText={setRootCause}
              minHeight={80}
              error={rootCauseError}
            />

            <TextArea
              label="Immediate actions taken"
              placeholder="What did you do on site right away?"
              value={actions}
              onChangeText={setActions}
              minHeight={70}
            />

            {/* Optional, and collapsed by default so the required field stays in view. */}
            <TouchableOpacity style={styles.whysToggle} onPress={() => setShowWhys(!showWhys)}>
              <Ionicons
                name={showWhys ? 'chevron-down' : 'chevron-forward'}
                size={16}
                color={Colors.primary}
              />
              <Text style={styles.whysToggleText}>
                5-Why analysis {filledWhys > 0 ? `(${filledWhys}/5 filled)` : '(optional)'}
              </Text>
            </TouchableOpacity>

            {showWhys &&
              whys.map((val, i) => (
                <TextArea
                  key={i}
                  label={`${i + 1}. ${WHY_LABELS[i]}`}
                  placeholder="Because…"
                  value={val}
                  onChangeText={(t) => setWhys((prev) => prev.map((p, j) => (j === i ? t : p)))}
                  minHeight={54}
                />
              ))}

            <Text style={styles.fieldLabel}>Severity</Text>
            <View style={styles.sevRow}>
              {SEVERITIES.map((s) => {
                const active = severity === s;
                return (
                  <TouchableOpacity
                    key={s}
                    style={[styles.sevChip, active && { backgroundColor: SEVERITY_COLOR[s] }]}
                    onPress={() => setSeverity(s)}
                  >
                    <Text style={[styles.sevChipText, active && styles.sevChipTextActive]}>{s}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.routeNote}>
              <Ionicons
                name={willEscalate ? 'arrow-up-circle' : 'information-circle-outline'}
                size={16}
                color={willEscalate ? Colors.critical : Colors.textMuted}
              />
              <Text style={[styles.routeText, willEscalate && { color: Colors.critical }]}>
                {willEscalate
                  ? 'High severity — this goes straight to the manager.'
                  : 'This will be sent to the manager for approval.'}
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={handleCancel}>
              <Text style={styles.btnGhostText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, isSubmitting && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.btnPrimaryText}>Submit investigation</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(11,28,48,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    maxHeight: '90%',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '800', color: Colors.textDark },
  subtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 2, marginBottom: 14 },
  body: { flexGrow: 0 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.textMid, marginBottom: 6 },
  whysToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10 },
  whysToggleText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  sevRow: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  sevChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  sevChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMid,
    textTransform: 'capitalize',
  },
  sevChipTextActive: { color: Colors.white },
  routeNote: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  routeText: { fontSize: 12, color: Colors.textMuted, flex: 1 },
  footer: { flexDirection: 'row', gap: 10, marginTop: 14 },
  btn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGhost: { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border },
  btnGhostText: { color: Colors.textMid, fontWeight: '700', fontSize: 14 },
  btnPrimary: { backgroundColor: Colors.primary },
  btnPrimaryText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  btnDisabled: { opacity: 0.6 },
});
