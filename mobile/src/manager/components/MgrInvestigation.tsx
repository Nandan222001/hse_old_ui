import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, Calendar, Camera } from 'lucide-react-native';
import type { ScreenProps } from './types';
import { incidentWorkflowService } from '../../services/incidentWorkflowService';

const SEV: Record<string, { color: string; bg: string }> = {
  Critical: { color: '#DC2626', bg: '#FEE2E2' },
  High: { color: '#EA580C', bg: '#FFEDD5' },
  Medium: { color: '#2563EB', bg: '#DBEAFE' },
  Low: { color: '#16A34A', bg: '#DCFCE7' },
};

const WHYS = [
  'Why did the incident occur?',
  'Why did that happen?',
  'Why was that the case?',
  'Why did that condition exist?',
  'Why (systemic root cause)?',
];

export function MgrInvestigation({ setCurrentScreen, selectedIncident, showToast }: ScreenProps) {
  const inc: any = selectedIncident || {};
  const [whys, setWhys] = useState<string[]>(['', '', '', '', '']);
  const [findings, setFindings] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<any>(null);

  const sev = SEV[inc.severity] || SEV.High;

  /**
   * Load what the supervisor actually submitted.
   *
   * The screen previously rendered five empty "Why" boxes, so a manager
   * reviewing an investigation saw none of it and was implicitly asked to redo
   * the analysis from scratch. Approving work you cannot see is not a review.
   */
  useEffect(() => {
    let cancelled = false;
    if (!inc.id) { setLoading(false); return; }

    incidentWorkflowService.getDetail(String(inc.id))
      .then((d: any) => {
        if (cancelled) return;
        setDetail(d);

        // five_why_analysis is stored as [{why, answer}]; fall back to the
        // single root_cause when an older record has no structured chain.
        const chain: string[] = Array.isArray(d?.five_why_analysis)
          ? d.five_why_analysis.map((s: any) => s?.answer ?? '')
          : [];
        const filled = ['', '', '', '', ''].map((_, i) => chain[i] ?? '');
        if (!chain.length && d?.root_cause) filled[0] = d.root_cause;
        setWhys(filled);

        setFindings(d?.immediate_actions_taken || '');
      })
      .catch(() => { /* leave the form empty — the header still shows the incident */ })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [inc.id]);

  const setWhy = (i: number, t: string) => setWhys((p) => p.map((w, idx) => (idx === i ? t : w)));

  /**
   * Approve the supervisor's investigation (stage 06 VERIFY).
   *
   * This used to call `investigate` — the supervisor's own endpoint — which
   * overwrote their root cause with whatever the manager typed and never
   * advanced the incident. It then swallowed every error and reported success
   * regardless, so an incident could sit in `pending_approval` forever while
   * the manager believed they had signed it off.
   *
   * It now calls the manager endpoint, and a failure is surfaced instead of
   * being hidden behind a success toast.
   */
  const approve = async () => {
    try {
      setSubmitting(true);
      await incidentWorkflowService.approveInvestigation(String(inc.id), {
        decision: 'approved',
        notes: findings || undefined,
      });
      showToast?.('Investigation approved');
      setCurrentScreen('assign_actions');
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : (e?.message || 'Unknown error');
      Alert.alert('Approval failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Send it back for rework (stage 06, the other outcome). The backend returns
   * the incident to `under_investigation` and clears the completion timestamp.
   */
  const reject = async () => {
    if (!findings.trim()) {
      return Alert.alert('Reason needed', 'Record what is missing before returning this to the supervisor.');
    }
    try {
      setSubmitting(true);
      await incidentWorkflowService.approveInvestigation(String(inc.id), {
        decision: 'rejected',
        notes: findings,
      });
      showToast?.('Returned to supervisor for rework');
      setCurrentScreen('app');
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : (e?.message || 'Unknown error');
      Alert.alert('Could not return investigation', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentScreen('app')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <ArrowLeft size={22} color="#0B3D91" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Investigation</Text>
        <View style={styles.mgrBadge}><Text style={styles.mgrBadgeText}>HSE MANAGER</Text></View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Incident card */}
          <View style={[styles.incCard, { borderLeftColor: sev.color }]}>
            <View style={styles.incTop}>
              <Text style={styles.incRef}>{inc.ref || `INC-${inc.id ?? ''}`}</Text>
              <View style={[styles.sevBadge, { backgroundColor: sev.bg }]}>
                <Text style={[styles.sevText, { color: sev.color }]}>{(inc.severity || 'HIGH').toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.incTitle}>{inc.title || inc.message || 'Incident'}</Text>
            <View style={styles.incMetaRow}>
              <View style={styles.metaItem}><Calendar size={13} color="#737686" /><Text style={styles.metaText}>{inc.time || inc.date || '—'}</Text></View>
              {!!(inc.zone || inc.location) && <View style={styles.metaItem}><MapPin size={13} color="#737686" /><Text style={styles.metaText}>{inc.zone || inc.location}</Text></View>}
            </View>
            <View style={styles.statusPill}><Text style={styles.statusText}>{inc.status || 'IN INVESTIGATION'}</Text></View>
          </View>

          {/* 5 Whys */}
          {/* What the manager is actually signing off on. The classification
              drives the investigation deadline and, where reportable, the
              regulator's clock — approving without seeing it is signing blind. */}
          {detail && (
            <View style={styles.verdictCard}>
              <Text style={styles.verdictRow}>
                Severity: <Text style={styles.verdictValue}>{detail.severity_label || 'Unclassified'}</Text>
              </Text>
              {detail.investigation_due_at && (
                <Text style={styles.verdictRow}>
                  Investigation due: <Text style={styles.verdictValue}>{String(detail.investigation_due_at).slice(0, 10)}</Text>
                  {detail.min_investigator ? `  ·  min ${detail.min_investigator}` : ''}
                </Text>
              )}
              {!!detail.is_hipo && <Text style={styles.verdictFlag}>HIPO — high potential incident</Text>}
              {!!detail.requires_systemic_rca && (
                <Text style={styles.verdictFlag}>Recurring pattern — systemic root cause required</Text>
              )}
              {!!detail.statutory_reportable && (
                <Text style={styles.verdictAlert}>
                  Statutory notification required: {detail.statutory_regulator || 'regulator not resolved'}
                  {detail.statutory_due_at ? `  ·  by ${String(detail.statutory_due_at).replace('T', ' ').slice(0, 16)}` : ''}
                  {detail.statutory_authorised_at ? '  ·  authorised' : '  ·  NOT YET AUTHORISED'}
                </Text>
              )}
            </View>
          )}

          <Text style={styles.section}>Root Cause Analysis (5 Whys)</Text>
          {loading && <ActivityIndicator color="#0B3D91" style={{ marginBottom: 8 }} />}
          {!loading && detail?.root_cause && (
            <Text style={styles.reviewNote}>Submitted by the supervisor — review and amend if needed.</Text>
          )}
          {WHYS.map((q, i) => (
            <View key={i} style={styles.whyRow}>
              <View style={styles.whyNum}><Text style={styles.whyNumText}>{i + 1}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.whyQ}>{q}</Text>
                <TextInput
                  style={styles.whyInput}
                  placeholder="Enter your answer..."
                  placeholderTextColor="#94A3B8"
                  value={whys[i]}
                  onChangeText={(t) => setWhy(i, t)}
                  multiline
                />
              </View>
            </View>
          ))}

          {/* Evidence placeholder */}
          <Text style={styles.section}>Evidence & Documentation</Text>
          <TouchableOpacity style={styles.uploadBox} onPress={() => showToast?.('Photo upload coming soon')}>
            <Camera size={22} color="#94A3B8" />
            <Text style={styles.uploadText}>Attach photos / documents</Text>
          </TouchableOpacity>

          {/* Findings */}
          <Text style={styles.section}>Investigation Findings</Text>
          <TextInput
            style={styles.findings}
            placeholder="Document investigation findings and final conclusions here..."
            placeholderTextColor="#94A3B8"
            value={findings}
            onChangeText={setFindings}
            multiline
          />

          {/* Actions */}
          {/* Approve or return — the two outcomes the backend actually accepts.
              "Save Draft" was removed: it only ever raised a toast and saved
              nothing, which is worse than not offering it. */}
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.draftBtn} onPress={reject} disabled={submitting}>
              <Text style={styles.draftText}>Return for rework</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.assignBtn} onPress={approve} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.assignText}>Approve investigation →</Text>}
            </TouchableOpacity>
          </View>
          <View style={{ height: 30 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F7FC' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0B3D91', flex: 1 },
  mgrBadge: { backgroundColor: '#0B3D91', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  mgrBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  scroll: { padding: 20, paddingBottom: 40 },
  incCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, borderLeftWidth: 4, borderWidth: 1, borderColor: '#EEF2F7', marginBottom: 20 },
  incTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  incRef: { fontSize: 11, color: '#94A3B8', fontWeight: '700' },
  sevBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  sevText: { fontSize: 10, fontWeight: '800' },
  incTitle: { fontSize: 18, fontWeight: '800', color: '#0B1C30', marginTop: 6, marginBottom: 10 },
  incMetaRow: { flexDirection: 'row', gap: 16, marginBottom: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 12, color: '#737686' },
  statusPill: { backgroundColor: '#EAF0FB', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start' },
  verdictCard: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 14, marginTop: 16, gap: 6 },
  verdictRow: { fontSize: 13, color: '#475569' },
  verdictValue: { fontWeight: '700', color: '#0B1C30' },
  verdictFlag: { fontSize: 12, fontWeight: '700', color: '#B45309' },
  verdictAlert: { fontSize: 12, fontWeight: '700', color: '#B91C1C', lineHeight: 17 },
  reviewNote: { fontSize: 12, color: '#64748B', marginBottom: 8 },
  statusText: { fontSize: 12, fontWeight: '700', color: '#0B3D91' },
  section: { fontSize: 16, fontWeight: '800', color: '#0B1C30', marginBottom: 12, marginTop: 4 },
  whyRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  whyNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#0B3D91', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  whyNumText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  whyQ: { fontSize: 12, color: '#63739B', marginBottom: 6, fontWeight: '600' },
  whyInput: { backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', padding: 12, fontSize: 14, color: '#0B1C30', minHeight: 46, textAlignVertical: 'top' },
  uploadBox: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#CBD5E1', padding: 20, alignItems: 'center', gap: 8, marginBottom: 20 },
  uploadText: { fontSize: 13, color: '#94A3B8', fontWeight: '600' },
  findings: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, fontSize: 14, color: '#0B1C30', minHeight: 100, textAlignVertical: 'top', marginBottom: 20 },
  btnRow: { flexDirection: 'row', gap: 12 },
  draftBtn: { flex: 1, borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12, paddingVertical: 15, alignItems: 'center', backgroundColor: '#FFFFFF' },
  draftText: { fontSize: 14, fontWeight: '700', color: '#0B1C30' },
  assignBtn: { flex: 1.6, backgroundColor: '#0B3D91', borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  assignText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
});
