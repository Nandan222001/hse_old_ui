import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { permitWorkflowService } from '../services/permitWorkflowService';

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  requested:    { label: 'Awaiting your acknowledgement', color: '#F97316', bg: '#FFF7ED' },
  acknowledged: { label: 'Acknowledged — forwarded to Manager', color: '#2563EB', bg: '#EFF6FF' },
  approved:     { label: 'Approved — active on site', color: '#16A34A', bg: '#F0FDF4' },
  rejected:     { label: 'Rejected', color: '#EF4444', bg: '#FEF2F2' },
};

export function PermitRequestManagementScreen({ navigation, route }: any) {
  const permit = route?.params?.permit;
  const [submitting, setSubmitting] = useState(false);

  if (!permit) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#0B1C30" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Review Permit Request</Text>
        </View>
        <Text style={styles.empty}>No permit selected. Go back and tap a permit from the list.</Text>
      </SafeAreaView>
    );
  }

  const ws = String(permit.workflow_status || 'requested').toLowerCase();
  const meta = STATUS_META[ws] || STATUS_META.requested;
  const canAcknowledge = ws === 'requested';
  const canClose = ws === 'approved';

  const acknowledge = async () => {
    try {
      setSubmitting(true);
      await permitWorkflowService.acknowledge(Number(permit.id));
      Alert.alert('Acknowledged', 'Permit acknowledged and forwarded to the Manager for approval.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Failed', e?.response?.data?.detail || 'Could not acknowledge this permit.');
    } finally {
      setSubmitting(false);
    }
  };

  const closePermit = async () => {
    try {
      setSubmitting(true);
      await permitWorkflowService.close(Number(permit.id), 'Work completed, permit closed from mobile.');
      Alert.alert('Permit Closed', 'This permit has been marked complete and closed out.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Failed', e?.response?.data?.detail || 'Could not close this permit.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0B1C30" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Permit Request</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.statusBanner, { backgroundColor: meta.bg }]}>
          <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>{permit.title || 'Permit to Work'}</Text>
          <Text style={styles.ref}>{permit.permit_ref}</Text>

          <View style={styles.row}><Ionicons name="pin-outline" size={15} color="#737686" /><Text style={styles.meta}>{permit.location || 'Site'}</Text></View>
          <View style={styles.row}><Ionicons name="person-outline" size={15} color="#737686" /><Text style={styles.meta}>Requested by {permit.requestor || '—'}</Text></View>
          <View style={styles.row}><Ionicons name="time-outline" size={15} color="#737686" /><Text style={styles.meta}>Valid till {permit.validity_end || '—'}</Text></View>
          {!!permit.permit_type && (
            <View style={styles.row}><Ionicons name="document-text-outline" size={15} color="#737686" /><Text style={styles.meta}>{permit.permit_type}</Text></View>
          )}
        </View>

        {canAcknowledge ? (
          <TouchableOpacity
            style={[styles.ackBtn, submitting && { opacity: 0.6 }]}
            onPress={acknowledge}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                <Text style={styles.ackBtnText}>Acknowledge &amp; Forward to Manager</Text>
              </>
            )}
          </TouchableOpacity>
        ) : canClose ? (
          <TouchableOpacity
            style={[styles.ackBtn, submitting && { opacity: 0.6 }]}
            onPress={closePermit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="checkmark-done-circle" size={18} color="#FFFFFF" />
                <Text style={styles.ackBtnText}>Close Permit — Work Complete</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <Text style={styles.doneNote}>
            No action needed — this permit has already moved past supervisor review.
          </Text>
        )}
        <Text style={styles.hint}>
          As Supervisor you acknowledge that you have reviewed this request. Final approval is done by the HSE Manager.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FF' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0B1C30', marginLeft: 12 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  empty: { textAlign: 'center', marginTop: 40, color: '#737686', paddingHorizontal: 30 },
  statusBanner: { borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 16 },
  statusText: { fontSize: 13, fontWeight: '700' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.04 },
  title: { fontSize: 17, fontWeight: '800', color: '#0B1C30' },
  ref: { fontSize: 12, color: '#94A3B8', fontWeight: '600', marginTop: 2, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  meta: { fontSize: 13, color: '#434655', flex: 1 },
  ackBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#004AC6', borderRadius: 12, paddingVertical: 15 },
  ackBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  doneNote: { textAlign: 'center', color: '#64748B', fontSize: 13, paddingVertical: 12 },
  hint: { fontSize: 12, color: '#94A3B8', marginTop: 16, lineHeight: 17, textAlign: 'center' },
});
