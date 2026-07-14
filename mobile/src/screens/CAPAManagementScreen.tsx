import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { incidentWorkflowService } from '../services/incidentWorkflowService';
import { Colors } from '../theme/colors';

export function CAPAManagementScreen({ route, navigation }: any) {
  const incidentId = route.params?.incidentId;

  // Real data state
  const [incident, setIncident] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form inputs
  const [why1, setWhy1] = useState('');
  const [why2, setWhy2] = useState('');
  const [why3, setWhy3] = useState('');
  const [why4, setWhy4] = useState('');
  const [why5, setWhy5] = useState('');
  const [immediateCause, setImmediateCause] = useState('');
  const [immediateActions, setImmediateActions] = useState('');
  const [capaDesc, setCapaDesc] = useState('');
  const [capaAssigneeId, setCapaAssigneeId] = useState('15');
  const [capaDueDate, setCapaDueDate] = useState('2026-07-31');
  const [aiDrafting, setAiDrafting] = useState(false);

  // Static mock fallback task list if no incidentId is passed
  const staticTasks = [
    { id: '1', action: 'Install guardrails on scaffolding Platform 3', priority: 'High', deadline: 'Today, 18:00' },
    { id: '2', action: 'Replace faulty gas sensor in Terminal Tank Farm', priority: 'High', deadline: 'Tomorrow' }
  ];

  useEffect(() => {
    if (incidentId) {
      fetchIncidentDetails();
    }
  }, [incidentId]);

  const fetchIncidentDetails = async () => {
    setLoading(true);
    try {
      const data = await incidentWorkflowService.getDetail(incidentId);
      setIncident(data);
      // Pre-fill form if already investigated
      if (data.root_cause) {
        setImmediateCause(data.immediate_cause || '');
        setImmediateActions(data.immediate_actions_taken || '');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to load incident details from database.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async () => {
    setSubmitting(true);
    try {
      await incidentWorkflowService.acknowledge(incidentId);
      Alert.alert('Acknowledged', 'Incident acknowledged successfully!');
      fetchIncidentDetails();
    } catch (e: any) {
      console.log('Acknowledge Error:', e);
      const detail = e.response?.data?.detail;
      const errMsg = typeof detail === 'string' ? detail : (typeof detail === 'object' && detail !== null ? JSON.stringify(detail) : (e.message || 'Unknown error'));
      Alert.alert('Error', `Acknowledge request failed: ${errMsg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAIDraft = () => {
    setAiDrafting(true);
    setTimeout(() => {
      if (incident?.incident_type === 'spill') {
        setWhy1('Generator 2 oil seal cracked during continuous high load.');
        setWhy2('Generator operated at high temperature due to ventilation blockage.');
        setWhy3('Ventilation cleaning schedule was skipped during maintenance cycle.');
        setWhy4('Maintenance scheduler was overloaded and deferred the ticket.');
        setWhy5('No automated trigger alert exists for deferred PM maintenance.');
        setImmediateCause('Gasket wear and dry seal crack.');
        setImmediateActions('Placed spill tray, wiped floor, shut generator.');
        setCapaDesc('Execute immediate replacement of all generator gaskets and clean ducts.');
      } else {
        setWhy1('Worker tripped over loose tie-down strap on the walkway.');
        setWhy2('Strap was left extended after unloading materials.');
        setWhy3('Pre-shift safety sweep of walkways was skipped today.');
        setWhy4('Supervisor was busy with urgent operations briefing.');
        setWhy5('No physical walkway boundaries/guardrails installed.');
        setImmediateCause('Obstruction in active walking lane.');
        setImmediateActions('Cleared the strap, applied first aid to worker.');
        setCapaDesc('Install high-visibility floor tape and clear walkway barriers.');
      }
      setAiDrafting(false);
    }, 800);
  };

  const handleSubmitInvestigation = async () => {
    if (!why1.trim()) {
      Alert.alert('Required', 'Please fill at least the first "Why".');
      return;
    }
    setSubmitting(true);
    const payload = {
      root_cause: why5.trim() || why1.trim(),
      five_why_analysis: [
        { why: 'Why 1', answer: why1 },
        { why: 'Why 2', answer: why2 },
        { why: 'Why 3', answer: why3 },
        { why: 'Why 4', answer: why4 },
        { why: 'Why 5', answer: why5 },
      ].filter(item => item.answer.trim() !== ''),
      immediate_cause: immediateCause,
      immediate_actions_taken: immediateActions,
      root_cause_category: 'Equipment Failure',
      severity_classification: 'First Aid',
      days_away: 0,
      capa_description: capaDesc,
      capa_responsible_person_id: parseInt(capaAssigneeId) || 15,
      capa_due_date: capaDueDate,
      escalate: false,
    };

    try {
      await incidentWorkflowService.investigate(incidentId, payload);
      Alert.alert('Success', 'RCA Investigation & CAPA plan submitted to Manager!');
      navigation.goBack();
    } catch (e: any) {
      console.log('RCA Submit Error:', e);
      const detail = e.response?.data?.detail;
      const errMsg = typeof detail === 'string' ? detail : (typeof detail === 'object' && detail !== null ? JSON.stringify(detail) : (e.message || 'Unknown error'));
      Alert.alert('Error', `Failed to submit investigation: ${errMsg}`);
    } finally {
      setSubmitting(false);
    }
  };

  // If no incidentId, render standard static list (Figma view)
  if (!incidentId) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#0B1C30" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Corrective Actions (CAPA)</Text>
        </View>
        <ScrollView contentContainerStyle={styles.scroll}>
          {staticTasks.map(t => (
            <View key={t.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.title}>{t.action}</Text>
                <View style={styles.pBadge}>
                  <Text style={styles.pBadgeText}>{t.priority}</Text>
                </View>
              </View>
              <Text style={styles.sub}>Deadline: {t.deadline}</Text>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Real-time API detail view
  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0B1C30" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review & Investigate</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Fetching incident from server...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Incident Summary */}
          {incident && (
            <View style={styles.detailCard}>
              <View style={styles.row}>
                <Text style={styles.incidentRef}>INC-{incident.id}</Text>
                <View style={[styles.statusBadge, { backgroundColor: incident.workflow_status === 'reported' ? '#FEF2F2' : '#EFF6FF' }]}>
                  <Text style={[styles.statusText, { color: incident.workflow_status === 'reported' ? '#EF4444' : '#3B82F6' }]}>
                    {incident.workflow_status?.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.detailType}>Type: {incident.incident_type?.toUpperCase()}</Text>
              <Text style={styles.detailDesc}>{incident.description || 'No description provided.'}</Text>
              {incident.immediate_cause && (
                <Text style={styles.detailCause}>Worker Action: {incident.immediate_cause}</Text>
              )}
            </View>
          )}

          {/* Action Step 1: Acknowledge */}
          {incident && incident.workflow_status === 'reported' && (
            <View style={styles.actionSection}>
              <Text style={styles.sectionHeading}>Step 1: Acknowledge Incident</Text>
              <Text style={styles.sectionDesc}>Confirm scene assessment and take initial control.</Text>
              <TouchableOpacity style={styles.actionButton} onPress={handleAcknowledge} disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="eye-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                    <Text style={styles.actionButtonText}>Acknowledge Now</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Action Step 2: Investigation & CAPA Form */}
          {incident && incident.workflow_status !== 'reported' && (
            <View style={styles.formContainer}>
              <View style={styles.formHeaderRow}>
                <Text style={styles.sectionHeading}>Step 2: Root Cause & CAPA Plan</Text>
                <TouchableOpacity style={styles.aiBtn} onPress={handleAIDraft} disabled={aiDrafting}>
                  {aiDrafting ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="sparkles" size={14} color="#FFF" style={{ marginRight: 4 }} />
                      <Text style={styles.aiBtnText}>AI Draft</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* 5 Whys Form */}
              <Text style={styles.label}>5 Whys Analysis</Text>
              <TextInput style={styles.input} placeholder="Why 1: What was the direct cause?" value={why1} onChangeText={setWhy1} />
              <TextInput style={styles.input} placeholder="Why 2: Why did that occur?" value={why2} onChangeText={setWhy2} />
              <TextInput style={styles.input} placeholder="Why 3: Why was that the case?" value={why3} onChangeText={setWhy3} />
              <TextInput style={styles.input} placeholder="Why 4: What is the underlying reason?" value={why4} onChangeText={setWhy4} />
              <TextInput style={styles.input} placeholder="Why 5: What is the root cause?" value={why5} onChangeText={setWhy5} />

              {/* Causes */}
              <Text style={styles.label}>Immediate Cause</Text>
              <TextInput style={styles.input} placeholder="e.g. Loose seal / Broken bolt" value={immediateCause} onChangeText={setImmediateCause} />
              
              <Text style={styles.label}>Immediate Actions Taken</Text>
              <TextInput style={styles.input} placeholder="e.g. Area cordoned off" value={immediateActions} onChangeText={setImmediateActions} />

              {/* CAPA Setup */}
              <Text style={styles.sectionHeading}>Corrective Action (CAPA)</Text>
              <Text style={styles.label}>Action Item Description</Text>
              <TextInput style={[styles.input, { height: 60 }]} placeholder="What corrective action must be completed?" multiline value={capaDesc} onChangeText={setCapaDesc} />
              
              <Text style={styles.label}>Responsible Employee ID</Text>
              <TextInput style={styles.input} value={capaAssigneeId} onChangeText={setCapaAssigneeId} keyboardType="numeric" />
              
              <Text style={styles.label}>CAPA Due Date (YYYY-MM-DD)</Text>
              <TextInput style={styles.input} value={capaDueDate} onChangeText={setCapaDueDate} />

              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitInvestigation} disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" style={{ marginRight: 6 }} />
                    <Text style={styles.submitBtnText}>Submit Investigation to Manager</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FF' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0B1C30', marginLeft: 12 },
  scroll: { padding: 20, paddingBottom: 60 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.04 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 12 },
  title: { fontSize: 13, fontWeight: '700', color: '#0B1C30', flex: 1 },
  pBadge: { backgroundColor: '#FEF2F2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  pBadgeText: { fontSize: 10, fontWeight: '700', color: '#EF4444' },
  sub: { fontSize: 11, color: '#737686' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  loadingText: { fontSize: 14, color: '#737686', marginTop: 12 },
  detailCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  incidentRef: { fontSize: 16, fontWeight: '800', color: '#0B1C30' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '700' },
  detailType: { fontSize: 12, fontWeight: '700', color: '#737686', marginBottom: 8 },
  detailDesc: { fontSize: 14, color: '#4A5568', lineHeight: 20 },
  detailCause: { fontSize: 12, color: '#EF4444', marginTop: 8, fontWeight: '600' },
  actionSection: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  sectionHeading: { fontSize: 15, fontWeight: '700', color: '#0B1C30', marginBottom: 8 },
  sectionDesc: { fontSize: 12, color: '#737686', textAlign: 'center', marginBottom: 16 },
  actionButton: { backgroundColor: '#004AC6', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, width: '100%' },
  actionButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  formContainer: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  formHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  aiBtn: { backgroundColor: '#8B5CF6', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  aiBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  label: { fontSize: 12, fontWeight: '700', color: '#4A5568', marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#CBD5E0', borderRadius: 10, padding: 10, fontSize: 13, color: '#2D3748', backgroundColor: '#F8FAFC', marginBottom: 8 },
  submitBtn: { backgroundColor: '#10B981', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, marginTop: 20 },
  submitBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' }
});
