import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Text } from 'react-native';
import { ScreenLayout } from '../components/layout/ScreenLayout';
import { AppHeader } from '../components/layout/AppHeader';
import { FormSection } from '../components/layout/FormSection';
import { Dropdown } from '../components/form/Dropdown';
import { Input } from '../components/form/Input';
import { TextArea } from '../components/form/TextArea';
import { ChipSelector } from '../components/form/ChipSelector';
import { ToggleRow } from '../components/form/ToggleRow';
import { hazardService } from '../services/hazardService';
import { Colors } from '../theme/colors';

/**
 * Log a hazard into the standing register (flow 5).
 *
 * Distinct from ReportRiskScreen, which writes a one-off observation to
 * `risk_reports`. A register entry is a standing condition that gets assessed,
 * contained, controlled, verified and closed — the same eight stages an
 * incident runs — and the worker can follow it the whole way on My Hazards.
 *
 * The severity words here are the register's own four-point scale
 * (Low/Medium/High/Critical), not the 5x5 consequence scale the risk form uses.
 * They are what the backend's hazard assessor resolves, so changing them here
 * without changing `_HAZARD_SEVERITY` would silently leave hazards unscored.
 */

// Ids match the backend hazard_categories seed order 1-10.
const CATEGORIES = [
  { label: 'Mechanical',            value: '1' },
  { label: 'Electrical',            value: '2' },
  { label: 'Chemical',              value: '3' },
  { label: 'Ergonomic',             value: '4' },
  { label: 'Fall / Height',         value: '5' },
  { label: 'Noise / Environmental', value: '6' },
  { label: 'Biological',            value: '7' },
  { label: 'Psychosocial',          value: '8' },
  { label: 'Fire / Explosion',      value: '9' },
  { label: 'Confined Space',        value: '10' },
];

const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];
const PROBABILITIES = ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'];

export default function LogHazardScreen({ navigation }: any) {
  const [category, setCategory] = useState('');
  const [hazardName, setHazardName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [severity, setSeverity] = useState('');
  const [probability, setProbability] = useState('');
  const [personsExposed, setPersonsExposed] = useState('');
  const [existingControls, setExistingControls] = useState('');
  const [stillPresent, setStillPresent] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!hazardName.trim()) e.hazardName = 'Name the hazard';
    if (!category) e.category = 'Select a hazard category';
    if (!severity) e.severity = 'Select how bad it could be';
    if (!probability) e.probability = 'Select how likely it is';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      const res = await hazardService.logHazard({
        hazard_name: hazardName.trim(),
        category_id: Number(category),
        description: description.trim() || undefined,
        severity,
        probability,
        location: location.trim() || undefined,
        controls: existingControls.trim() || undefined,
        persons_exposed: personsExposed ? Number(personsExposed) : undefined,
      });
      Alert.alert(
        res.queued ? 'Saved — waiting to send' : 'Hazard Logged',
        res.queued
          ? 'Saved on this device. There is no signal right now, so it will be sent automatically as soon as you are back online.'
          : 'Added to the hazard register. Your supervisor will assess it — you can follow it on My Hazards.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch {
      Alert.alert('Submission Failed', 'Could not log the hazard. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenLayout>
      <AppHeader title="Log a Hazard" onBack={() => navigation.goBack()} rightIcon="🔔" />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.introBox}>
          <Text style={styles.introText}>
            A hazard is a standing condition that could hurt someone — not an event that
            already happened. It stays on the register until the control is verified.
          </Text>
        </View>

        <FormSection label="What is the hazard?" required>
          <Input
            placeholder="e.g. Unguarded conveyor pinch point"
            value={hazardName}
            onChangeText={(v: string) => { setHazardName(v); setErrors(e => ({ ...e, hazardName: '' })); }}
          />
          {errors.hazardName ? <Text style={styles.errorText}>{errors.hazardName}</Text> : null}
        </FormSection>

        <FormSection label="Hazard Category" required>
          <Dropdown
            options={CATEGORIES}
            value={category}
            onChange={(v: string) => { setCategory(v); setErrors(e => ({ ...e, category: '' })); }}
            placeholder="Select hazard type..."
          />
          {errors.category ? <Text style={styles.errorText}>{errors.category}</Text> : null}
        </FormSection>

        <FormSection label="Description">
          <TextArea
            placeholder="Where is it, and who could be hurt by it?"
            value={description}
            onChangeText={setDescription}
          />
        </FormSection>

        <FormSection label="Location">
          <Input
            placeholder="e.g. Line 3, east walkway"
            value={location}
            onChangeText={setLocation}
          />
        </FormSection>

        <FormSection label="How bad could it be?" required>
          <ChipSelector options={SEVERITIES} value={severity} onChange={(v: string) => {
            setSeverity(v); setErrors(e => ({ ...e, severity: '' }));
          }} />
          {errors.severity ? <Text style={styles.errorText}>{errors.severity}</Text> : null}
        </FormSection>

        <FormSection label="How likely is it?" required>
          <ChipSelector options={PROBABILITIES} value={probability} onChange={(v: string) => {
            setProbability(v); setErrors(e => ({ ...e, probability: '' }));
          }} />
          {errors.probability ? <Text style={styles.errorText}>{errors.probability}</Text> : null}
        </FormSection>

        <FormSection label="How many people are exposed?">
          {/* Numbers exposed is a multiplier the severity x likelihood matrix
              does not carry, so the backend raises the priority a band at five
              or more. Leaving it blank simply skips that rule. */}
          <Input
            placeholder="e.g. 6"
            keyboardType="number-pad"
            value={personsExposed}
            onChangeText={setPersonsExposed}
          />
        </FormSection>

        <FormSection label="Anything already in place?">
          <TextArea
            placeholder="Existing controls, if any"
            value={existingControls}
            onChangeText={setExistingControls}
          />
        </FormSection>

        <ToggleRow
          title="The hazard is still there right now"
          subtitle="Logging it starts the record — it does not make the area safe."
          value={stillPresent}
          onChange={setStillPresent}
        />
        {stillPresent ? (
          <Text style={styles.urgentNote}>
            Tell your supervisor directly as well. Logging it here starts the record;
            it does not make the area safe.
          </Text>
        ) : null}

        <TouchableOpacity
          style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading
            ? <ActivityIndicator color="#FFFFFF" />
            : <Text style={styles.submitText}>Add to Hazard Register</Text>}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, paddingHorizontal: 16 },
  introBox: {
    backgroundColor: '#EEF2FB', borderRadius: 12, padding: 14, marginTop: 12, marginBottom: 4,
  },
  introText: { fontSize: 12.5, color: '#334155', lineHeight: 18 },
  errorText: { fontSize: 11.5, color: Colors.critical, marginTop: 6, fontWeight: '600' },
  urgentNote: {
    fontSize: 12, color: '#B45309', lineHeight: 17, marginTop: 8,
    backgroundColor: '#FFFBEB', borderRadius: 10, padding: 12,
  },
  submitBtn: {
    height: 52, borderRadius: 14, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', marginTop: 24,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
});
