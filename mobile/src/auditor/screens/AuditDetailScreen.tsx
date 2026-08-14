import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { auditService, Audit } from '../services/auditService';

const STATUS_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  scheduled: { bg: '#EFF6FF', fg: '#3B82F6', label: 'Scheduled' },
  in_progress: { bg: '#F5F3FF', fg: '#8B5CF6', label: 'In Progress' },
  // Stop-work: a critical finding has to be contained before the audit resumes.
  immediate_action: { bg: '#FEE2E2', fg: '#B91C1C', label: 'Stop Work' },
  fieldwork: { bg: '#F5F3FF', fg: '#8B5CF6', label: 'Fieldwork' },
  findings_raised: { bg: '#FFF7ED', fg: '#C2410C', label: 'Findings Raised' },
  capa_open: { bg: '#FFF7ED', fg: '#C2410C', label: 'Actions Open' },
  pending_review: { bg: '#EFF6FF', fg: '#2563EB', label: 'Awaiting Verification' },
  verified: { bg: '#ECFDF5', fg: '#059669', label: 'Verified' },
  overdue: { bg: '#FEE2E2', fg: '#EF4444', label: 'Overdue' },
  completed: { bg: '#DCFCE7', fg: '#16A34A', label: 'Completed' },
};

function fmt(d?: string | null) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' }); }
  catch { return '—'; }
}

export function AuditDetailScreen({ route, navigation }: any) {
  const initial = route.params?.audit || {};
  const [audit, setAudit] = useState<Audit | any>(initial);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!initial?.id) { setLoading(false); return; }
    try { setAudit(await auditService.get(Number(initial.id))); }
    catch { /* keep params */ }
    finally { setLoading(false); }
  }, [initial?.id]);

  useEffect(() => { load(); }, [load]);

  const st = STATUS_STYLE[audit.status] || STATUS_STYLE.scheduled;
  const findings = audit.findings || [];
  const passed = findings.filter((f: any) => (f.response || '').toLowerCase() === 'pass').length;
  const failed = findings.filter((f: any) => (f.response || '').toLowerCase() === 'fail').length;
  const done = audit.status === 'completed';

  /**
   * Run one lifecycle transition and take the server's word for the result.
   *
   * Every one of these is gated backend-side — the checklist decides whether a
   * submit lands in stop-work, findings or straight to verification, and close
   * is refused until the findings are verified. So the screen never predicts the
   * next status, it re-reads it.
   */
  const [busy, setBusy] = useState(false);
  const act = async (fn: () => Promise<Audit>, failureTitle: string) => {
    try {
      setBusy(true);
      setAudit(await fn());
    } catch (e: any) {
      const d = e?.response?.data?.detail;
      Alert.alert(failureTitle, typeof d === 'string' ? d : (e?.message || 'Unknown error'));
    } finally {
      setBusy(false);
    }
  };

  const confirmVerify = () =>
    Alert.alert(
      'Did the findings get resolved?',
      'Answering no returns the audit to its corrective actions.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Not resolved',
          style: 'destructive',
          onPress: () => act(() => auditService.verify(audit.id, false), 'Verification failed'),
        },
        {
          text: 'Resolved',
          onPress: () => act(() => auditService.verify(audit.id, true), 'Verification failed'),
        },
      ],
    );

  const timeline = [
    { label: 'Scheduled', date: fmt(audit.scheduled_date), state: 'done' },
    { label: 'On-Site Field Audit', date: fmt(audit.due_date), state: done ? 'done' : 'active' },
    { label: 'Review & Findings', date: done ? 'Submitted' : 'Pending', state: done ? 'done' : 'todo' },
    { label: 'Final Report', date: done ? `Score ${audit.compliance_score ?? 0}%` : 'Target', state: done ? 'done' : 'todo' },
  ];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>HSE Audit Pro</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.crumb}>Audits › Audit #{audit.id ?? '—'}</Text>
        <Text style={styles.title}>{audit.title || 'Audit'}</Text>

        <View style={styles.badgeRow}>
          <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
            <Text style={[styles.statusText, { color: st.fg }]}>{st.label}</Text>
          </View>
          <View style={styles.dateChip}>
            <Ionicons name="calendar-outline" size={12} color="#64748B" />
            <Text style={styles.dateChipText}>{fmt(audit.scheduled_date)} – {fmt(audit.due_date)}</Text>
          </View>
        </View>


        {/* One action at a time — whichever stage the audit is actually waiting
            on. Showing "Conduct Audit" at every status was how a submitted
            audit still invited you to walk it again. */}
        {busy ? (
          <ActivityIndicator color="#2563EB" style={{ marginVertical: 16 }} />
        ) : (
          <>
            {['scheduled', 'planned', 'draft', 'overdue'].includes(audit.status) && (
              <TouchableOpacity style={styles.conductBtn} onPress={() => act(() => auditService.start(audit.id), 'Could not start')} activeOpacity={0.9}>
                <Ionicons name="play" size={16} color="#FFFFFF" />
                <Text style={styles.conductBtnText}>Start Audit</Text>
              </TouchableOpacity>
            )}

            {audit.status === 'in_progress' && (
              <TouchableOpacity style={styles.conductBtn} onPress={() => act(() => auditService.beginFieldwork(audit.id), 'Could not begin fieldwork')} activeOpacity={0.9}>
                <Ionicons name="walk" size={16} color="#FFFFFF" />
                <Text style={styles.conductBtnText}>Begin Fieldwork</Text>
              </TouchableOpacity>
            )}

            {audit.status === 'immediate_action' && (
              <>
                <View style={styles.stopWork}>
                  <Text style={styles.stopWorkTitle}>Stop work — critical finding</Text>
                  <Text style={styles.stopWorkText}>
                    Contain the hazard before the audit continues. Resume fieldwork once it is made safe.
                  </Text>
                </View>
                <TouchableOpacity style={styles.conductBtn} onPress={() => act(() => auditService.beginFieldwork(audit.id), 'Could not resume')} activeOpacity={0.9}>
                  <Ionicons name="refresh" size={16} color="#FFFFFF" />
                  <Text style={styles.conductBtnText}>Contained — Resume Fieldwork</Text>
                </TouchableOpacity>
              </>
            )}

            {audit.status === 'fieldwork' && (
              <TouchableOpacity style={styles.conductBtn} onPress={() => navigation.navigate('AuditChecklist', { audit })} activeOpacity={0.9}>
                <Ionicons name="clipboard" size={16} color="#FFFFFF" />
                <Text style={styles.conductBtnText}>Conduct Audit</Text>
              </TouchableOpacity>
            )}

            {['pending_review', 'findings_raised', 'capa_open'].includes(audit.status) && (
              <TouchableOpacity style={styles.conductBtn} onPress={confirmVerify} activeOpacity={0.9}>
                <Ionicons name="checkmark-done" size={16} color="#FFFFFF" />
                <Text style={styles.conductBtnText}>Verify Findings</Text>
              </TouchableOpacity>
            )}

            {audit.status === 'verified' && (
              <TouchableOpacity style={[styles.conductBtn, styles.closeBtn]} onPress={() => act(() => auditService.close(audit.id), 'Could not close')} activeOpacity={0.9}>
                <Ionicons name="lock-closed" size={16} color="#FFFFFF" />
                <Text style={styles.conductBtnText}>Close Audit</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {loading && <ActivityIndicator color="#2563EB" style={{ marginTop: 16 }} />}

        {/* Overview */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Audit Overview</Text>
          <View style={styles.kv}><Text style={styles.k}>Type</Text><Text style={styles.v}>{audit.checklist_type || '—'}</Text></View>
          <View style={styles.kv}><Text style={styles.k}>Site</Text><Text style={styles.v}>{audit.site_name || '—'}</Text></View>
          <View style={styles.kv}><Text style={styles.k}>Department</Text><Text style={styles.v}>{audit.department || '—'}</Text></View>
          <View style={styles.kv}><Text style={styles.k}>Priority</Text><Text style={styles.v}>{audit.priority || '—'}</Text></View>
          <View style={styles.kv}><Text style={styles.k}>Checklist Items</Text><Text style={styles.v}>{findings.length}</Text></View>
          {done && (
            <>
              <View style={styles.kv}><Text style={styles.k}>Result</Text><Text style={[styles.v, { color: '#16A34A' }]}>{audit.compliance_score ?? 0}% compliance</Text></View>
              <View style={styles.kv}><Text style={styles.k}>Passed / Failed</Text><Text style={styles.v}>{passed} / {failed}</Text></View>
            </>
          )}
        </View>

        {/* Timeline */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Timeline</Text>
          {timeline.map((t, i) => (
            <View key={i} style={styles.tRow}>
              <View style={[styles.tDot, t.state === 'done' ? styles.tDone : t.state === 'active' ? styles.tActive : styles.tTodo]}>
                <Ionicons name={t.state === 'done' ? 'checkmark' : t.state === 'active' ? 'time' : 'ellipse-outline'} size={12} color={t.state === 'todo' ? '#94A3B8' : '#FFFFFF'} />
              </View>
              <View>
                <Text style={[styles.tLabel, t.state === 'active' && { color: '#2563EB' }]}>{t.label}</Text>
                <Text style={styles.tDate}>{t.date}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Site details */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Site Details</Text>
          <View style={styles.siteRow}>
            <Ionicons name="location-outline" size={16} color="#2563EB" />
            <Text style={styles.siteName}>{audit.site_name || 'Site not set'}</Text>
          </View>
          <Text style={styles.siteMeta}>Department: {audit.department || '—'}</Text>
        </View>

        {done && (
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('AuditChecklist', { audit })}>
            <Text style={styles.secondaryBtnText}>View Submitted Checklist</Text>
          </TouchableOpacity>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { height: 60, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: 1.5, borderBottomColor: '#F1F5F9' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E3A8A' },
  scroll: { padding: 16, paddingBottom: 20 },
  crumb: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginTop: 4 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  statusBadge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  statusText: { fontSize: 11, fontWeight: '800' },
  dateChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F1F5F9', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  dateChipText: { fontSize: 11, color: '#475569', fontWeight: '600' },
  conductBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#1D4ED8', borderRadius: 12, height: 48, marginTop: 16 },
  closeBtn: { backgroundColor: '#059669' },
  stopWork: { backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderWidth: 1, borderRadius: 12, padding: 14, marginTop: 16 },
  stopWorkTitle: { fontSize: 13, fontWeight: '800', color: '#B91C1C', marginBottom: 4 },
  stopWorkText: { fontSize: 12, color: '#7F1D1D', lineHeight: 17 },
  conductBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', padding: 16, marginTop: 16 },
  cardHeading: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  kv: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  k: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  v: { fontSize: 13, color: '#0F172A', fontWeight: '700' },
  tRow: { flexDirection: 'row', gap: 12, marginBottom: 14, alignItems: 'center' },
  tDot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  tDone: { backgroundColor: '#2563EB' },
  tActive: { backgroundColor: '#3B82F6' },
  tTodo: { backgroundColor: '#F1F5F9' },
  tLabel: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  tDate: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  siteRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  siteName: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  siteMeta: { fontSize: 12, color: '#64748B', marginTop: 6 },
  secondaryBtn: { borderWidth: 1.5, borderColor: '#2563EB', borderRadius: 12, height: 46, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  secondaryBtnText: { color: '#2563EB', fontSize: 13, fontWeight: '800' },
});
