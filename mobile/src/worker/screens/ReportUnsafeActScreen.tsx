import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Text } from 'react-native';
import { ScreenLayout } from '../components/layout/ScreenLayout';
import { AppHeader } from '../components/layout/AppHeader';
import { FormSection } from '../components/layout/FormSection';
import { TextArea } from '../components/form/TextArea';
import { Dropdown } from '../components/form/Dropdown';
import { ToggleRow } from '../components/form/ToggleRow';
import { PhotoUploadBox } from '../components/form/PhotoUploadBox';
import { Colors } from '../theme/colors';
import { useIncidents } from '../hooks/useIncidents';
import { usePhotoCapture } from '../hooks/usePhotoCapture';

const CATEGORIES  = ['Unsafe Behaviour', 'PPE Violation', 'Housekeeping', 'Equipment Misuse', 'Procedural Breach'];
const ZONES       = ['Zone A', 'Zone B', 'Zone C', 'Zone D'];
const DEPARTMENTS = ['Operations', 'Maintenance', 'Logistics', 'Safety', 'Admin'];

export default function ReportUnsafeActScreen({ navigation }: any) {
  const { reportUnsafeAct, isLoading } = useIncidents();
  const { photoUris, attachments: photoAttachments, launch: launchPhoto, removePhoto } = usePhotoCapture();

  const [category,     setCategory]     = useState('');
  const [details,      setDetails]      = useState('');
  const [intervention, setIntervention] = useState(false);
  const [zone,         setZone]         = useState('Zone A');
  const [department,   setDepartment]   = useState('Operations');
  const [errors,       setErrors]       = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!category)       e.category = 'Please select a category';
    if (!details.trim()) e.details  = 'Observation details are required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const ok = await reportUnsafeAct({
      category,
      observation_details:    details.trim(),
      intervention_performed: intervention,
      location:               zone,
      department,
      photos: photoAttachments.length > 0 ? photoAttachments : undefined,
      // Map to backend UnsafeActReport schema fields
      act_type:                 category,
      description:              details.trim(),
      corrective_advice_given:  intervention ? 'Verbal intervention performed' : undefined,
    } as any);

    if (ok) {
      Alert.alert('Observation Submitted', 'Your unsafe act observation has been recorded.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } else {
      Alert.alert('Submission Failed', 'Could not submit observation. Please try again.');
    }
  };

  return (
    <ScreenLayout>
      <AppHeader title="Report Unsafe Act" onBack={() => navigation.goBack()} rightIcon="🔔" />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <FormSection label="Category" required>
          <Dropdown
            options={CATEGORIES}
            value={category}
            onChange={v => { setCategory(v); setErrors(e => ({ ...e, category: '' })); }}
            placeholder="Select category..."
          />
          {errors.category ? (
            <Text style={styles.errorText}>{errors.category}</Text>
          ) : null}
        </FormSection>

        <FormSection label="Observation Details" required>
          <TextArea
            placeholder="Describe the unsafe act or behavior in detail..."
            value={details}
            onChangeText={v => { setDetails(v); setErrors(e => ({ ...e, details: '' })); }}
            minHeight={110}
            error={errors.details}
          />
        </FormSection>

        <FormSection>
          <ToggleRow
            title="Intervention Performed?"
            subtitle="Did you speak with the individual?"
            value={intervention}
            onChange={setIntervention}
          />
        </FormSection>

        <View style={styles.twoCol}>
          <View style={styles.half}>
            <FormSection label="Location">
              <Dropdown options={ZONES} value={zone} onChange={setZone} />
            </FormSection>
          </View>
          <View style={styles.half}>
            <FormSection label="Department">
              <Dropdown options={DEPARTMENTS} value={department} onChange={setDepartment} />
            </FormSection>
          </View>
        </View>

        <FormSection label="Documentation (Optional)">
          <PhotoUploadBox
            photos={photoUris}
            onTakePhoto={launchPhoto}
            onRemove={removePhoto}
            subtitle="Tap to add photos — camera or gallery (JPG, PNG)"
          />
        </FormSection>

        <TouchableOpacity
          style={[styles.submitBtn, isLoading && styles.submitDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.85}
          disabled={isLoading}
        >
          {isLoading
            ? <ActivityIndicator color={Colors.white} />
            : <Text style={styles.submitText}>▶ SUBMIT OBSERVATION</Text>
          }
        </TouchableOpacity>
        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, padding: 16 },
  twoCol: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  errorText: { fontSize: 12, color: Colors.critical, marginTop: 6 },
  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 18, alignItems: 'center', marginBottom: 12,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: Colors.white, fontWeight: '800', fontSize: 15, letterSpacing: 0.5 },
});
