import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenLayout, AppHeader, Card, Avatar, LoadingScreen } from '../components';
import { Colors } from '../theme/colors';
import { usePermits } from '../hooks/usePermits';
import { formatDateTime } from '../utils/formatters';

interface Props {
  navigation: any;
  route: { params: { permitId: string } };
}

export function AcknowledgePermitScreen({ navigation, route }: Props) {
  const { permitId } = route.params;
  const { selectedPermit, loading, fetchPermit, acknowledgePermit } = usePermits();
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [signed, setSigned] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchPermit(permitId); }, [permitId]);

  useEffect(() => {
    if (selectedPermit?.safety_checklist) {
      const init: Record<string, boolean> = {};
      selectedPermit.safety_checklist.forEach(item => { init[item.id] = item.checked; });
      setChecklist(init);
    }
  }, [selectedPermit]);

  const toggleCheck = (id: string) => setChecklist(prev => ({ ...prev, [id]: !prev[id] }));

  const allChecked = selectedPermit?.safety_checklist?.every(item => checklist[item.id]) ?? false;

  const handleConfirm = async () => {
    if (!allChecked) {
      Alert.alert('Safety Checklist', 'Please complete all safety checklist items');
      return;
    }
    if (!signed) {
      Alert.alert('Digital Signature', 'Please sign digitally to confirm');
      return;
    }
    setSubmitting(true);
    try {
      await acknowledgePermit(permitId, checklist);
      Alert.alert('Confirmed', 'Work has been confirmed and started', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to confirm permit');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !selectedPermit) return <LoadingScreen />;

  return (
    <ScreenLayout>
      <AppHeader
        title="Acknowledge Permit"
        onBack={() => navigation.goBack()}
        rightNode={
          <View style={styles.permitRefBadge}>
            <Text style={styles.permitRefText}>{selectedPermit.permit_ref}</Text>
          </View>
        }
      />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Risk Badge */}
        {selectedPermit.risk_level === 'high' && (
          <View style={styles.riskRow}>
            <View style={styles.refChip}>
              <Text style={styles.refChipText}>{selectedPermit.permit_ref}</Text>
            </View>
            <View style={styles.riskBadge}>
              <Ionicons name="flame-outline" size={14} color={Colors.critical} />
              <Text style={styles.riskText}>HIGH RISK</Text>
            </View>
          </View>
        )}

        {/* Summary Card */}
        <Card>
          <Text style={styles.summaryTitle}>{selectedPermit.title} Summary</Text>
          <View style={styles.summaryRow}>
            <Ionicons name="location-outline" size={16} color={Colors.textMuted} />
            <View>
              <Text style={styles.summaryLabel}>Location</Text>
              <Text style={styles.summaryValue}>{selectedPermit.location}</Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="time-outline" size={16} color={Colors.textMuted} />
            <View>
              <Text style={styles.summaryLabel}>Validity Period</Text>
              <Text style={styles.summaryValue}>
                {selectedPermit.validity_start} — {selectedPermit.validity_end}
              </Text>
            </View>
          </View>
        </Card>

        {/* Safety Checklist */}
        <View style={styles.checklistHeader}>
          <Text style={styles.sectionTitle}>Safety Checklist</Text>
          <Text style={styles.mandatoryLabel}>Mandatory</Text>
        </View>

        {selectedPermit.safety_checklist?.map(item => (
          <TouchableOpacity
            key={item.id}
            style={styles.checkRow}
            onPress={() => toggleCheck(item.id)}
          >
            <View style={[styles.checkbox, checklist[item.id] && styles.checkboxDone]}>
              {checklist[item.id] && <Ionicons name="checkmark" size={14} color={Colors.white} />}
            </View>
            <Text style={styles.checkLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}

        {/* Digital Acknowledgment */}
        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Digital Acknowledgment</Text>
        <TouchableOpacity
          style={[styles.signBox, signed && styles.signBoxSigned]}
          onPress={() => setSigned(true)}
        >
          <Ionicons
            name={signed ? 'checkmark-circle' : 'pencil-outline'}
            size={36}
            color={signed ? Colors.success : Colors.textLight}
          />
          <Text style={[styles.signText, signed && styles.signTextDone]}>
            {signed ? 'Signed' : 'Tap here to sign digitally'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.signDisclaimer}>
          By signing, I confirm I have read and will adhere to all safety controls listed in this permit.
        </Text>

        {/* Confirm Button */}
        <TouchableOpacity
          onPress={handleConfirm}
          style={[styles.confirmBtn, submitting && styles.confirmBtnDisabled]}
          disabled={submitting}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} />
          <Text style={styles.confirmText}>{submitting ? 'Confirming...' : 'Confirm & Start Work'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel & Close</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16 },
  permitRefBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  permitRefText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  riskRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  refChip: { backgroundColor: '#EEF2FF', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  refChipText: { color: Colors.blue, fontSize: 12, fontWeight: '700' },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.criticalBg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  riskText: { color: Colors.critical, fontSize: 11, fontWeight: '700' },
  summaryTitle: { fontSize: 17, fontWeight: '800', color: Colors.textDark, marginBottom: 14 },
  summaryRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 12 },
  summaryLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 2 },
  summaryValue: { fontSize: 14, fontWeight: '600', color: Colors.textDark },
  checklistHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textDark, marginBottom: 10 },
  mandatoryLabel: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: Colors.success, borderColor: Colors.success },
  checkLabel: { flex: 1, fontSize: 14, color: Colors.textDark },
  signBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 28,
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.divider,
    marginBottom: 12,
  },
  signBoxSigned: { borderColor: Colors.success, backgroundColor: Colors.successBg },
  signText: { fontSize: 14, color: Colors.textMuted, fontWeight: '500' },
  signTextDone: { color: Colors.success, fontWeight: '700' },
  signDisclaimer: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 10,
  },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  cancelBtn: {
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 14,
  },
  cancelText: { color: Colors.textMid, fontWeight: '600', fontSize: 15 },
});
