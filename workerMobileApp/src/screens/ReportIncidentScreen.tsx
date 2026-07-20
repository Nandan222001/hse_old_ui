import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, TextInput, ActivityIndicator,
} from 'react-native';
import { ScreenLayout } from '../components/layout/ScreenLayout';
import { Colors } from '../theme/colors';
import { useIncidents } from '../hooks/useIncidents';

export default function ReportIncidentScreen({ navigation }: any) {
  const { reportIncident, isLoading: isSubmitting } = useIncidents();
  const [incidentType, setIncidentType] = useState('Injury');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<number>(3);

  const handleNext = async () => {
    if (!description.trim()) {
      Alert.alert('Required', 'Please enter a description of the incident.');
      return;
    }
    
    const severityMap: Record<number, string> = {
      1: 'low',
      2: 'medium',
      3: 'medium',
      4: 'high',
      5: 'critical',
    };

    const ok = await reportIncident({
      incident_type: incidentType.toLowerCase(),
      severity: severityMap[severity] || 'medium',
      description: description.trim(),
      incident_datetime: new Date().toISOString(),
      location: 'Zone B - Sector 4',
      immediate_actions: 'Area cordoned off, first aid applied.',
    });

    if (ok) {
      Alert.alert(
        'Success',
        'Incident report submitted successfully to the safety team.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } else {
      Alert.alert('Submission Failed', 'Failed to report the incident. Please try again.');
    }
  };

  return (
    <ScreenLayout bg="#F8FAFC">
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.headerIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SafeGuard HSE</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('Notifications')}>
          <Text style={styles.headerIcon}>🔔</Text>
        </TouchableOpacity>
      </View>

      {/* Step Indicator */}
      <View style={styles.stepIndicatorRow}>
        <View style={styles.segmentsContainer}>
          <View style={[styles.segment, styles.segmentActive]} />
          <View style={styles.segment} />
          <View style={styles.segment} />
        </View>
        <Text style={styles.stepText}>Step 1/3</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Incident Details</Text>
        <Text style={styles.sectionSub}>Provide the initial classification and description.</Text>

        {/* Incident Type Dropdown */}
        <Text style={styles.inputLabel}>Incident Type</Text>
        <TouchableOpacity style={styles.dropdown} onPress={() => {
          Alert.alert('Select Incident Type', '', [
            { text: 'Injury', onPress: () => setIncidentType('Injury') },
            { text: 'Spill', onPress: () => setIncidentType('Spill') },
            { text: 'Fire', onPress: () => setIncidentType('Fire') },
            { text: 'Equipment Damage', onPress: () => setIncidentType('Equipment Damage') },
            { text: 'Near Miss', onPress: () => setIncidentType('Near Miss') },
          ]);
        }}>
          <Text style={styles.dropdownValue}>{incidentType}</Text>
          <Text style={styles.chevronIcon}>▼</Text>
        </TouchableOpacity>

        {/* Description Input */}
        <Text style={styles.inputLabel}>Description</Text>
        <View style={styles.textAreaContainer}>
          <TextInput
            style={styles.textArea}
            placeholder="Describe what happened in detail..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Severity Level */}
        <Text style={styles.inputLabel}>Severity Level</Text>
        <View style={styles.severityRow}>
          {[1, 2, 3, 4, 5].map((level) => (
            <TouchableOpacity
              key={level}
              style={[styles.severityBtn, severity === level && styles.severityBtnActive]}
              onPress={() => setSeverity(level)}
            >
              <Text style={[styles.severityBtnText, severity === level && styles.severityBtnTextActive]}>
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.severityLimitsRow}>
          <Text style={styles.limitText}>LOW</Text>
          <Text style={styles.limitText}>CRITICAL</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.draftBtn}>
          <Text style={styles.draftBtnText}>💾 Draft</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext} disabled={isSubmitting}>
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.nextBtnText}>Next  ➔</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  headerIcon: {
    fontSize: 22,
    color: '#0F172A',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: -0.5,
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#EFF6FF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  segmentsContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    marginRight: 16,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },
  segmentActive: {
    backgroundColor: '#2563EB',
  },
  stepText: {
    fontSize: 12,
    fontWeight: '750',
    color: '#2563EB',
  },
  scroll: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSub: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 10,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 20,
  },
  dropdownValue: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  chevronIcon: {
    fontSize: 10,
    color: '#64748B',
  },
  textAreaContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 20,
  },
  textArea: {
    height: 120,
    fontSize: 14,
    color: '#0F172A',
  },
  severityRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  severityBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  severityBtnActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  severityBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  severityBtnTextActive: {
    color: '#FFFFFF',
  },
  severityLimitsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  limitText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    padding: 16,
    paddingBottom: 24,
  },
  draftBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  nextBtn: {
    flex: 1.5,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
