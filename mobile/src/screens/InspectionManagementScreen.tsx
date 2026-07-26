import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
  RefreshControl, Modal, TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../api/client';

interface Inspection {
  id: string;
  title: string;
  date: string;
  rating: number;
  followUp: boolean;
}

interface Station { id: number; station_name: string; }

const INSPECTION_TYPES = ['Routine', 'Compliance', 'Follow-up', 'Incident Follow-up', 'Scheduled'];

function ratingMeta(rating: number, followUp: boolean) {
  if (rating >= 4 && !followUp) return { label: 'Passed', color: '#16A34A', bg: '#F0FDF4' };
  if (rating >= 3) return { label: 'Needs Follow-up', color: '#F97316', bg: '#FFF7ED' };
  return { label: 'Failed', color: '#EF4444', bg: '#FEF2F2' };
}

export function InspectionManagementScreen({ navigation }: any) {
  const [list, setList] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Station picker
  const [stations, setStations] = useState<Station[]>([]);
  const [stationId, setStationId] = useState<number | null>(null);
  const [stationPickerVisible, setStationPickerVisible] = useState(false);
  const [stationName, setStationName] = useState('');

  // Form fields
  const [inspectionType, setInspectionType] = useState('Routine');
  const [typePickerVisible, setTypePickerVisible] = useState(false);
  const [issuesFound, setIssuesFound] = useState('0');
  const [criticalIssues, setCriticalIssues] = useState('0');
  const [housekeepingRating, setHousekeepingRating] = useState<number>(3);
  const [complianceRating, setComplianceRating] = useState<number>(3);
  const [followUpRequired, setFollowUpRequired] = useState<'Yes' | 'No'>('No');

  const load = useCallback(() => {
    setLoading(true);
    apiClient.get('/safety-walks/')
      .then((res: any) => {
        const rows = Array.isArray(res.data) ? res.data : (res.data?.items ?? []);
        const mapped: Inspection[] = rows.map((r: any) => ({
          id: String(r.id),
          title: `${r.inspection_type || 'Safety'} Inspection`,
          date: r.inspection_date_time ? new Date(r.inspection_date_time).toLocaleDateString() : '—',
          rating: Number(r.compliance_rating) || 0,
          followUp: String(r.follow_up_required).toLowerCase() === 'yes',
        }));
        mapped.sort((a, b) => (a.date < b.date ? 1 : -1));
        setList(mapped.slice(0, 40));
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    // Load stations for the form
    apiClient.get('/working-stations/')
      .then((res: any) => {
        const rows: Station[] = Array.isArray(res.data) ? res.data : (res.data?.items ?? []);
        setStations(rows);
        if (rows.length > 0) { setStationId(rows[0].id); setStationName(rows[0].station_name); }
      })
      .catch(() => {});
  }, [load]);

  const handleLogWalk = async () => {
    setSubmitting(true);
    try {
      await apiClient.post('/safety-walks/', {
        inspection_date_time: new Date().toISOString(),
        location_station_id: stationId,
        inspection_type: inspectionType,
        issues_found: parseInt(issuesFound, 10) || 0,
        critical_issues: parseInt(criticalIssues, 10) || 0,
        housekeeping_rating: housekeepingRating,
        compliance_rating: complianceRating,
        follow_up_required: followUpRequired,
      });
      Alert.alert('Saved', 'Safety walk logged successfully.');
      setShowForm(false);
      // Reset form
      setIssuesFound('0'); setCriticalIssues('0');
      setHousekeepingRating(3); setComplianceRating(3); setFollowUpRequired('No');
      setInspectionType('Routine');
      load();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Could not save safety walk.');
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
        <Text style={styles.headerTitle}>Inspections</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} colors={['#004AC6']} />}
      >
        {loading && list.length === 0 ? (
          <ActivityIndicator color="#004AC6" style={{ marginTop: 30 }} />
        ) : list.length === 0 ? (
          <Text style={styles.empty}>No inspections recorded yet. Tap + to log one.</Text>
        ) : (
          list.map((i) => {
            const meta = ratingMeta(i.rating, i.followUp);
            return (
              <View key={i.id} style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{i.title}</Text>
                  <Text style={styles.sub}>{i.date} · Compliance {i.rating}/5</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: meta.bg }]}>
                  <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Log Safety Walk Modal */}
      <Modal visible={showForm} animationType="slide" transparent onRequestClose={() => setShowForm(false)}>
        <KeyboardAvoidingView style={styles.modalBg} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Log Safety Walk</Text>
              <TouchableOpacity onPress={() => setShowForm(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color="#63739B" />
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {/* Inspection Type */}
              <Text style={styles.label}>Inspection Type</Text>
              <TouchableOpacity style={styles.picker} onPress={() => setTypePickerVisible(true)}>
                <Text style={styles.pickerText}>{inspectionType}</Text>
                <Ionicons name="chevron-down" size={16} color="#64748B" />
              </TouchableOpacity>

              {/* Location / Station */}
              <Text style={styles.label}>Location / Station</Text>
              <TouchableOpacity style={styles.picker} onPress={() => setStationPickerVisible(true)}>
                <Text style={styles.pickerText}>{stationName || 'Select station...'}</Text>
                <Ionicons name="chevron-down" size={16} color="#64748B" />
              </TouchableOpacity>

              {/* Issues Found */}
              <Text style={styles.label}>Issues Found</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={issuesFound}
                onChangeText={setIssuesFound}
                placeholder="0"
                placeholderTextColor="#94A3B8"
              />

              {/* Critical Issues */}
              <Text style={styles.label}>Critical Issues</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={criticalIssues}
                onChangeText={setCriticalIssues}
                placeholder="0"
                placeholderTextColor="#94A3B8"
              />

              {/* Housekeeping Rating */}
              <Text style={styles.label}>Housekeeping Rating (1–5)</Text>
              <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <TouchableOpacity
                    key={n}
                    style={[styles.ratingBtn, housekeepingRating === n && styles.ratingBtnActive]}
                    onPress={() => setHousekeepingRating(n)}
                  >
                    <Text style={[styles.ratingBtnText, housekeepingRating === n && styles.ratingBtnTextActive]}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Compliance Rating */}
              <Text style={styles.label}>Compliance Rating (1–5)</Text>
              <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <TouchableOpacity
                    key={n}
                    style={[styles.ratingBtn, complianceRating === n && styles.ratingBtnActive]}
                    onPress={() => setComplianceRating(n)}
                  >
                    <Text style={[styles.ratingBtnText, complianceRating === n && styles.ratingBtnTextActive]}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Follow-up Required */}
              <Text style={styles.label}>Follow-up Required?</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[styles.toggleBtn, followUpRequired === 'Yes' && styles.toggleBtnActive]}
                  onPress={() => setFollowUpRequired('Yes')}
                >
                  <Text style={[styles.toggleBtnText, followUpRequired === 'Yes' && styles.toggleBtnTextActive]}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, followUpRequired === 'No' && styles.toggleBtnActive]}
                  onPress={() => setFollowUpRequired('No')}
                >
                  <Text style={[styles.toggleBtnText, followUpRequired === 'No' && styles.toggleBtnTextActive]}>No</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                onPress={handleLogWalk}
                disabled={submitting}
              >
                {submitting
                  ? <ActivityIndicator color="#FFF" />
                  : <Text style={styles.submitBtnText}>SAVE INSPECTION</Text>
                }
              </TouchableOpacity>
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Inspection Type Picker */}
      <Modal visible={typePickerVisible} transparent animationType="slide" onRequestClose={() => setTypePickerVisible(false)}>
        <TouchableOpacity style={styles.overlayDismiss} activeOpacity={1} onPress={() => setTypePickerVisible(false)}>
          <View style={styles.pickerSheet}>
            {INSPECTION_TYPES.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.pickerOption, inspectionType === t && styles.pickerOptionActive]}
                onPress={() => { setInspectionType(t); setTypePickerVisible(false); }}
              >
                <Text style={[styles.pickerOptionText, inspectionType === t && styles.pickerOptionTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Station Picker */}
      <Modal visible={stationPickerVisible} transparent animationType="slide" onRequestClose={() => setStationPickerVisible(false)}>
        <TouchableOpacity style={styles.overlayDismiss} activeOpacity={1} onPress={() => setStationPickerVisible(false)}>
          <View style={styles.pickerSheet}>
            <ScrollView style={{ maxHeight: 300 }}>
              {stations.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.pickerOption, stationId === s.id && styles.pickerOptionActive]}
                  onPress={() => { setStationId(s.id); setStationName(s.station_name); setStationPickerVisible(false); }}
                >
                  <Text style={[styles.pickerOptionText, stationId === s.id && styles.pickerOptionTextActive]}>{s.station_name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FF' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0B1C30', marginLeft: 12, flex: 1 },
  addBtn: { backgroundColor: '#004AC6', borderRadius: 20, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  empty: { textAlign: 'center', color: '#737686', marginTop: 30 },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.04 },
  title: { fontSize: 14, fontWeight: '700', color: '#0B1C30' },
  sub: { fontSize: 11, color: '#737686', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  // Modal
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '90%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: '#0B1C30' },
  label: { fontSize: 12, fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 14, height: 44, fontSize: 14, color: '#0F172A' },
  picker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 14, height: 44 },
  pickerText: { fontSize: 14, color: '#0F172A', fontWeight: '600' },
  ratingRow: { flexDirection: 'row', gap: 8 },
  ratingBtn: { flex: 1, height: 40, borderRadius: 8, borderWidth: 1.5, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF' },
  ratingBtnActive: { backgroundColor: '#004AC6', borderColor: '#004AC6' },
  ratingBtnText: { fontSize: 14, fontWeight: '700', color: '#334155' },
  ratingBtnTextActive: { color: '#FFF' },
  toggleRow: { flexDirection: 'row', gap: 12 },
  toggleBtn: { flex: 1, height: 42, borderRadius: 10, borderWidth: 1.5, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF' },
  toggleBtnActive: { backgroundColor: '#004AC6', borderColor: '#004AC6' },
  toggleBtnText: { fontSize: 14, fontWeight: '700', color: '#334155' },
  toggleBtnTextActive: { color: '#FFF' },
  submitBtn: { marginTop: 20, backgroundColor: '#004AC6', borderRadius: 12, height: 48, alignItems: 'center', justifyContent: 'center' },
  submitBtnText: { color: '#FFF', fontWeight: '800', fontSize: 14, letterSpacing: 0.4 },
  // Inline pickers
  overlayDismiss: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  pickerSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: 36 },
  pickerOption: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  pickerOptionActive: { backgroundColor: '#EFF6FF', borderRadius: 8, paddingHorizontal: 8 },
  pickerOptionText: { fontSize: 14, fontWeight: '600', color: '#334155' },
  pickerOptionTextActive: { color: '#2563EB', fontWeight: '700' },
});
