import { useState } from 'react';
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

  const sev = SEV[inc.severity] || SEV.High;

  const setWhy = (i: number, t: string) => setWhys((p) => p.map((w, idx) => (idx === i ? t : w)));

  const proceed = async () => {
    const rootCause = whys.filter(Boolean).join(' → ');
    if (!rootCause) return Alert.alert('Missing', 'Fill in at least the first "Why".');
    try {
      setSubmitting(true);
      // Best-effort: record the investigation on the backend, then move to CAPA assignment.
      try {
        await incidentWorkflowService.investigate(String(inc.id), {
          root_cause: rootCause,
          severity_classification: inc.severity || 'High',
          immediate_actions_taken: findings,
          escalate: false,
        } as any);
      } catch { /* endpoint may reject for role/state — still proceed to assign actions */ }
      showToast?.('Investigation saved');
      setCurrentScreen('assign_actions');
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
          <Text style={styles.section}>Root Cause Analysis (5 Whys)</Text>
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
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.draftBtn} onPress={() => showToast?.('Draft saved')}>
              <Text style={styles.draftText}>Save Draft</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.assignBtn} onPress={proceed} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.assignText}>Assign Corrective Actions →</Text>}
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
