import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { ScreenLayout } from '../components/layout/ScreenLayout';
import { AppHeader } from '../components/layout/AppHeader';
import { SectionCard } from '../components/cards/SectionCard';
import { Input } from '../components/form/Input';
import { CheckboxGroup } from '../components/form/Checkbox';
import { TextArea } from '../components/form/TextArea';
import { AttachBox } from '../components/form/PhotoUploadBox';
import { StepProgressBar } from '../components/display/StepDots';
import { Colors } from '../theme/colors';
import { usePermits } from '../hooks/usePermits';
import { PermitType, SafetyGear } from '../types';

const PERMIT_TYPES: { id: PermitType; icon: string; title: string; desc: string }[] = [
  { id: 'hot_work',          icon: '🔥', title: 'Hot Work Permit',       desc: 'Welding, grinding, open flame' },
  { id: 'confined_space',    icon: '⬜', title: 'Confined Space Entry',   desc: 'Tanks, pits, restricted access' },
  { id: 'working_at_height', icon: '🧗', title: 'Working at Height',      desc: 'Scaffolding, MEWPs, ladders' },
  { id: 'electrical',        icon: '⚡', title: 'Electrical Work',         desc: 'Live systems, switch gear' },
  { id: 'excavation',        icon: '⛏️', title: 'Excavation',             desc: 'Digging, trenching, ground works' },
];

const SAFETY_GEAR_OPTIONS = ['Hard Hat', 'Gloves', 'Eye Pro', 'Respirator', 'Safety Harness', 'Hearing Protection'];
const STEPS = ['Classification', 'Site & Schedule', 'Safety Gear', 'Risk Assessment'];

function gearArrayToObject(selected: string[]): SafetyGear {
  return {
    hard_hat:            selected.includes('Hard Hat'),
    gloves:              selected.includes('Gloves'),
    eye_protection:      selected.includes('Eye Pro'),
    respirator:          selected.includes('Respirator'),
    safety_harness:      selected.includes('Safety Harness'),
    hearing_protection:  selected.includes('Hearing Protection'),
  };
}

export default function RaisePermitScreen({ navigation }: any) {
  const { createPermit, isLoading } = usePermits();

  const [selectedPermit, setSelectedPermit] = useState<PermitType>('hot_work');
  const [workDescription, setWorkDescription] = useState('');
  const [location, setLocation]     = useState('');
  const [startDate, setStartDate]   = useState('');
  const [endDate, setEndDate]       = useState('');
  const [gear, setGear]             = useState<string[]>(['Hard Hat', 'Gloves']);
  const [riskText, setRiskText]     = useState('');
  const [errors, setErrors]         = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!workDescription.trim())  e.workDescription = 'Work description is required';
    if (!location.trim())         e.location        = 'Work location is required';
    if (!startDate.trim())        e.startDate       = 'Start date is required';
    if (!endDate.trim())          e.endDate         = 'End date is required';
    if (!riskText.trim())         e.riskText        = 'Risk assessment summary is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Alert.alert('Incomplete Form', 'Please fill in all required fields before submitting.');
      return;
    }

    const result = await createPermit({
      permit_type:          selectedPermit,
      work_location:        location.trim(),
      start_datetime:       startDate.trim(),
      end_datetime:         endDate.trim(),
      work_description:     workDescription.trim(),
      safety_gear:          gearArrayToObject(gear),
      risk_assessment_text: riskText.trim(),
    });

    if (result) {
      Alert.alert(
        '✅ Permit Submitted',
        `Permit ${result.permit_ref} has been submitted for approval.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } else {
      Alert.alert('Submission Failed', 'Could not submit the permit. Please try again.');
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Permit',
      'Are you sure you want to discard this permit request?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
      ],
    );
  };

  return (
    <ScreenLayout>
      <AppHeader title="Raise Permit Request" leftIcon="☰" onLeftPress={() => navigation.goBack()} />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Raise Permit Request</Text>
        <Text style={styles.pageSub}>Submit a new digital work permit for approval.</Text>

        <StepProgressBar total={STEPS.length} current={0} style={styles.stepBar} />

        {/* Step 1 — Classification */}
        <SectionCard label="Permit Classification" stepNum={1} style={styles.card}>
          {PERMIT_TYPES.map(pt => (
            <TouchableOpacity
              key={pt.id}
              style={[styles.permitRow, selectedPermit === pt.id && styles.permitRowSelected]}
              onPress={() => setSelectedPermit(pt.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.permitIcon}>{pt.icon}</Text>
              <View style={styles.permitInfo}>
                <Text style={styles.permitTitle}>{pt.title}</Text>
                <Text style={styles.permitDesc}>{pt.desc}</Text>
              </View>
              {selectedPermit === pt.id && <Text style={styles.checkMark}>✅</Text>}
            </TouchableOpacity>
          ))}

          <TextArea
            label="Work Description *"
            placeholder="Describe the work to be performed..."
            value={workDescription}
            onChangeText={t => { setWorkDescription(t); setErrors(e => ({ ...e, workDescription: '' })); }}
            minHeight={80}
          />
          {errors.workDescription ? <Text style={styles.errorText}>{errors.workDescription}</Text> : null}
        </SectionCard>

        {/* Step 2 — Site & Schedule */}
        <SectionCard label="Site & Schedule" stepNum={2} style={styles.card}>
          <Input
            label="Work Location *"
            placeholder="e.g. North Sector Depot - Block A"
            value={location}
            onChangeText={t => { setLocation(t); setErrors(e => ({ ...e, location: '' })); }}
            rightIcon="📍"
          />
          {errors.location ? <Text style={styles.errorText}>{errors.location}</Text> : null}

          <View style={styles.dateRow}>
            <View style={{ flex: 1 }}>
              <Input
                label="Start Date & Time *"
                placeholder="e.g. 2026-06-11 08:00"
                value={startDate}
                onChangeText={t => { setStartDate(t); setErrors(e => ({ ...e, startDate: '' })); }}
                containerStyle={{ flex: 1 }}
              />
              {errors.startDate ? <Text style={styles.errorText}>{errors.startDate}</Text> : null}
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="End Date & Time *"
                placeholder="e.g. 2026-06-11 18:00"
                value={endDate}
                onChangeText={t => { setEndDate(t); setErrors(e => ({ ...e, endDate: '' })); }}
                containerStyle={{ flex: 1 }}
              />
              {errors.endDate ? <Text style={styles.errorText}>{errors.endDate}</Text> : null}
            </View>
          </View>
        </SectionCard>

        {/* Step 3 — Safety Gear */}
        <SectionCard label="Mandatory Safety Gear" stepNum={3} style={styles.card}>
          <CheckboxGroup
            options={SAFETY_GEAR_OPTIONS}
            selected={gear}
            onChange={setGear}
            columns={2}
          />
        </SectionCard>

        {/* Step 4 — Risk Assessment */}
        <SectionCard label="Risk Assessment" stepNum={4} style={styles.card}>
          <TextArea
            label="Hazards & Mitigations *"
            placeholder="Summarize potential hazards and mitigation steps..."
            value={riskText}
            onChangeText={t => { setRiskText(t); setErrors(e => ({ ...e, riskText: '' })); }}
            minHeight={100}
          />
          {errors.riskText ? <Text style={styles.errorText}>{errors.riskText}</Text> : null}
          <AttachBox title="Attach Risk Assessment (JSA)" subtitle="PDF, JPG, or PNG (Max 5MB)" />
        </SectionCard>

        {/* Actions */}
        <TouchableOpacity
          style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.85}
          disabled={isLoading}
        >
          {isLoading
            ? <ActivityIndicator color={Colors.white} />
            : <Text style={styles.submitText}>▶ Submit Request</Text>
          }
        </TouchableOpacity>

        <View style={styles.secondaryRow}>
          <TouchableOpacity
            style={styles.draftBtn}
            onPress={() => Alert.alert('Draft Saved', 'Draft saving will be available in a future update.')}
          >
            <Text style={styles.draftText}>Save Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll:    { flex: 1, padding: 16 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: Colors.textDark, marginBottom: 4, marginTop: 8 },
  pageSub:   { fontSize: 13, color: Colors.textMuted, marginBottom: 16 },
  stepBar:   { marginBottom: 20 },
  card:      { marginBottom: 14 },

  permitRow: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, marginBottom: 10,
  },
  permitRowSelected: { borderColor: Colors.blue, backgroundColor: '#EFF5FF' },
  permitIcon:  { fontSize: 24, marginRight: 12 },
  permitInfo:  { flex: 1 },
  permitTitle: { fontSize: 14, fontWeight: '700', color: Colors.textDark },
  permitDesc:  { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  checkMark:   { fontSize: 18 },

  dateRow:   { flexDirection: 'row', gap: 10 },
  errorText: { fontSize: 12, color: Colors.critical, marginTop: -6, marginBottom: 8, marginLeft: 2 },

  submitBtn:         { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  submitBtnDisabled: { backgroundColor: Colors.textMuted },
  submitText:        { color: Colors.white, fontWeight: '700', fontSize: 16 },

  secondaryRow: { flexDirection: 'row', gap: 12 },
  draftBtn: {
    flex: 1, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 12, paddingVertical: 13, alignItems: 'center',
  },
  draftText:  { fontWeight: '600', color: Colors.textDark },
  cancelBtn: {
    flex: 1, borderWidth: 1.5, borderColor: Colors.criticalBg,
    borderRadius: 12, paddingVertical: 13, alignItems: 'center',
  },
  cancelText: { fontWeight: '600', color: Colors.critical },
});
