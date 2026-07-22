import React, { useState, useMemo } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Text } from 'react-native';
import { ScreenLayout } from '../components/layout/ScreenLayout';
import { AppHeader } from '../components/layout/AppHeader';
import { FormSection } from '../components/layout/FormSection';
import { Dropdown } from '../components/form/Dropdown';
import { Input } from '../components/form/Input';
import { TextArea } from '../components/form/TextArea';
import { ChipSelector } from '../components/form/ChipSelector';
import { ToggleRow } from '../components/form/ToggleRow';
import { PhotoUploadBox } from '../components/form/PhotoUploadBox';
import { hazardService } from '../services/hazardService';
import { usePhotoCapture } from '../hooks/usePhotoCapture';
import { Colors } from '../theme/colors';

// ── Hazard categories (ids match backend hazard_categories seed order 1-10) ──
const CATEGORIES = [
  { label: 'Mechanical',          value: '1' },
  { label: 'Electrical',          value: '2' },
  { label: 'Chemical',            value: '3' },
  { label: 'Ergonomic',           value: '4' },
  { label: 'Fall / Height',       value: '5' },
  { label: 'Noise / Environmental', value: '6' },
  { label: 'Biological',          value: '7' },
  { label: 'Psychosocial',        value: '8' },
  { label: 'Fire / Explosion',    value: '9' },
  { label: 'Confined Space',      value: '10' },
];

const SEVERITIES    = ['Minor', 'Significant', 'Serious', 'Fatal'];
const PROBABILITIES = ['Rare', 'Unlikely', 'Possible', 'Likely'];

type Rating = 'Low' | 'Medium' | 'High' | 'Critical';

// Risk matrix: severity × probability → rating
const RISK_MATRIX: Record<string, Record<string, Rating>> = {
  Fatal:       { Rare: 'Medium', Unlikely: 'High',   Possible: 'Critical', Likely: 'Critical' },
  Serious:     { Rare: 'Low',    Unlikely: 'Medium', Possible: 'High',     Likely: 'Critical' },
  Significant: { Rare: 'Low',    Unlikely: 'Medium', Possible: 'High',     Likely: 'High' },
  Minor:       { Rare: 'Low',    Unlikely: 'Low',    Possible: 'Medium',   Likely: 'Medium' },
};

const RATING_COLOR: Record<Rating, string> = {
  Low:      Colors.success,
  Medium:   Colors.blue,
  High:     Colors.warning,
  Critical: Colors.critical,
};

export default function ReportRiskScreen({ navigation }: any) {
  const { photoUris, attachments: photoAttachments, launch: launchPhoto, removePhoto } = usePhotoCapture();

  const [category,    setCategory]    = useState('');
  const [description, setDescription] = useState('');
  const [location,    setLocation]    = useState('');
  const [severity,    setSeverity]    = useState('');
  const [probability, setProbability] = useState('');
  const [stillPresent, setStillPresent] = useState(true);
  const [mitigation,  setMitigation]  = useState('');
  const [isLoading,   setIsLoading]   = useState(false);
  const [errors,      setErrors]      = useState<Record<string, string>>({});

  const rating: Rating | null = useMemo(() => {
    if (severity && probability) return RISK_MATRIX[severity]?.[probability] ?? null;
    return null;
  }, [severity, probability]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!category)            e.category = 'Select a hazard category';
    if (!description.trim())  e.description = 'Describe the hazard';
    if (!severity)            e.severity = 'Select the severity';
    if (!probability)         e.probability = 'Select the likelihood';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      await hazardService.reportRisk({
        category_id: Number(category),
        hazard_name: description.trim(),
        severity,
        probability,
      });
      Alert.alert(
        'Hazard Reported',
        `Your ${rating ?? ''} hazard observation has been submitted to your supervisor.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch {
      Alert.alert('Submission Failed', 'Could not submit the hazard report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenLayout>
      <AppHeader title="Report a Hazard" onBack={() => navigation.goBack()} rightIcon="🔔" />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <FormSection label="Hazard Category" required>
          <Dropdown
            options={CATEGORIES}
            value={category}
            onChange={v => { setCategory(v); setErrors(e => ({ ...e, category: '' })); }}
            placeholder="Select hazard type..."
          />
          {errors.category ? <Text style={styles.errorText}>{errors.category}</Text> : null}
        </FormSection>

        <FormSection label="Hazard Description" required>
          <TextArea
            placeholder="What is the hazard? e.g. exposed live wiring near walkway..."
            value={description}
            onChangeText={v => { setDescription(v); setErrors(e => ({ ...e, description: '' })); }}
            minHeight={100}
            maxLength={500}
            error={errors.description}
          />
        </FormSection>

        <FormSection label="Location">
          <Input
            placeholder="Where is the hazard? e.g. Bay 4, Loading Dock"
            value={location}
            onChangeText={setLocation}
          />
        </FormSection>

        <FormSection label="Severity (Consequence)" required>
          <ChipSelector
            options={SEVERITIES}
            value={severity}
            onChange={v => { setSeverity(v); setErrors(e => ({ ...e, severity: '' })); }}
          />
          {errors.severity ? <Text style={styles.errorText}>{errors.severity}</Text> : null}
        </FormSection>

        <FormSection label="Likelihood (Probability)" required>
          <ChipSelector
            options={PROBABILITIES}
            value={probability}
            onChange={v => { setProbability(v); setErrors(e => ({ ...e, probability: '' })); }}
          />
          {errors.probability ? <Text style={styles.errorText}>{errors.probability}</Text> : null}
        </FormSection>

        {rating && (
          <View style={[styles.ratingCard, { borderColor: RATING_COLOR[rating] }]}>
            <Text style={styles.ratingLabel}>CALCULATED HAZARD RATING</Text>
            <View style={[styles.ratingBadge, { backgroundColor: RATING_COLOR[rating] }]}>
              <Text style={styles.ratingBadgeText}>{rating.toUpperCase()}</Text>
            </View>
          </View>
        )}

        <FormSection label="Photo Evidence">
          <PhotoUploadBox
            photos={photoUris}
            onTakePhoto={launchPhoto}
            onRemove={removePhoto}
            subtitle="Tap to add photos — camera or gallery (JPG, PNG)"
          />
        </FormSection>

        <FormSection label="Immediate Danger">
          <ToggleRow
            title="Hazard is still present"
            subtitle="Is the danger active right now?"
            value={stillPresent}
            onChange={setStillPresent}
          />
        </FormSection>

        <FormSection label="Suggested Control / Mitigation">
          <TextArea
            placeholder="How could this hazard be controlled or removed?"
            value={mitigation}
            onChangeText={setMitigation}
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
            : <Text style={styles.submitText}>SUBMIT HAZARD REPORT</Text>
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
  ratingCard: {
    borderWidth: 1.5, borderRadius: 14, padding: 16, marginBottom: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.card,
  },
  ratingLabel: { fontSize: 11, fontWeight: '800', color: Colors.textMuted, letterSpacing: 0.6 },
  ratingBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10 },
  ratingBadgeText: { color: Colors.white, fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 18, alignItems: 'center', marginTop: 8, marginBottom: 16,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: Colors.white, fontWeight: '800', fontSize: 15, letterSpacing: 0.5 },
});
