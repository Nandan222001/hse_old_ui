import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Text } from 'react-native';
import { ScreenLayout } from '../components/layout/ScreenLayout';
import { AppHeader } from '../components/layout/AppHeader';
import { FormSection } from '../components/layout/FormSection';
import { TextArea } from '../components/form/TextArea';
import { ChipSelector } from '../components/form/ChipSelector';
import { CheckboxGroup } from '../components/form/Checkbox';
import { PhotoUploadBox } from '../components/form/PhotoUploadBox';
import { LocationCard } from '../components/cards/LocationCard';
import { Colors } from '../theme/colors';
import { useIncidents } from '../hooks/useIncidents';
import { usePhotoCapture } from '../hooks/usePhotoCapture';
import { PotentialConsequence, NearMissCause } from '../types';

const CONSEQUENCES = ['Minor Injury', 'Lost Time Injury', 'Property Damage', 'Environmental Impact'];
const CONDITIONS    = ['Slippery Floor', 'Missing Guard', 'Distraction', 'Poor Lighting'];

const CHIP_TO_CONSEQUENCE: Record<string, PotentialConsequence> = {
  'Minor Injury':         'minor_injury',
  'Lost Time Injury':     'lost_time_injury',
  'Property Damage':      'property_damage',
  'Environmental Impact': 'environmental_impact',
};

const CAUSE_LABEL_TO_TYPE: Record<string, NearMissCause> = {
  'Slippery Floor': 'slippery_floor',
  'Missing Guard':  'missing_guard',
  'Distraction':    'distraction',
  'Poor Lighting':  'poor_lighting',
};

export default function ReportNearMissScreen({ navigation }: any) {
  const { reportNearMiss, isLoading } = useIncidents();
  const { photoUris, attachments: photoAttachments, launch: launchPhoto, removePhoto } = usePhotoCapture();

  const [description, setDescription] = useState('');
  const [consequence, setConsequence] = useState('');
  const [causes,      setCauses]      = useState<string[]>([]);
  const [suggestion,  setSuggestion]  = useState('');
  const [errors,      setErrors]      = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!description.trim()) e.description = 'Please describe what happened';
    if (!consequence)         e.consequence = 'Select the potential consequence';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const mappedCauses: NearMissCause[] = causes
      .map(c => CAUSE_LABEL_TO_TYPE[c])
      .filter(Boolean) as NearMissCause[];

    const ok = await reportNearMiss({
      description:              description.trim(),
      potential_consequence:    CHIP_TO_CONSEQUENCE[consequence],
      causes:                   mappedCauses,
      location:                 'Warehouse – Sector B4',
      preventative_suggestion:  suggestion.trim() || undefined,
      photos: photoAttachments.length > 0 ? photoAttachments : undefined,
    });

    if (ok) {
      Alert.alert('Report Submitted', 'Your near miss report has been submitted.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } else {
      Alert.alert('Submission Failed', 'Could not submit report. Please try again.');
    }
  };

  return (
    <ScreenLayout>
      <AppHeader title="Report Near Miss" onBack={() => navigation.goBack()} rightIcon="🔔" />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <FormSection label="What Happened?">
          <TextArea
            placeholder="Briefly describe the sequence of events..."
            value={description}
            onChangeText={v => { setDescription(v); setErrors(e => ({ ...e, description: '' })); }}
            minHeight={100}
            maxLength={500}
            error={errors.description}
          />
        </FormSection>

        <FormSection label="Capture Photo">
          <PhotoUploadBox
            photos={photoUris}
            onTakePhoto={launchPhoto}
            onRemove={removePhoto}
            subtitle="Tap to add photos — camera or gallery (JPG, PNG)"
          />
        </FormSection>

        <FormSection label="Potential Consequence" required>
          <ChipSelector
            options={CONSEQUENCES}
            value={consequence}
            onChange={v => { setConsequence(v); setErrors(e => ({ ...e, consequence: '' })); }}
          />
          {errors.consequence ? (
            <Text style={styles.errorText}>{errors.consequence}</Text>
          ) : null}
        </FormSection>

        <FormSection label="Condition / Cause">
          <CheckboxGroup options={CONDITIONS} selected={causes} onChange={setCauses} columns={2} />
        </FormSection>

        <FormSection label="Location">
          <LocationCard
            title="Warehouse – Sector B4"
            subtitle="Grd Floor, Loading Dock"
            onEdit={() => {}}
          />
        </FormSection>

        <FormSection label="Preventative Suggestion">
          <TextArea
            placeholder="How can we prevent this in the future?"
            value={suggestion}
            onChangeText={setSuggestion}
            minHeight={80}
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
            : <Text style={styles.submitText}>SUBMIT REPORT</Text>
          }
        </TouchableOpacity>
        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, padding: 16 },
  errorText: { fontSize: 12, color: Colors.critical, marginTop: 6 },
  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 18, alignItems: 'center', marginTop: 8, marginBottom: 16,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: Colors.white, fontWeight: '800', fontSize: 15, letterSpacing: 0.5 },
});
