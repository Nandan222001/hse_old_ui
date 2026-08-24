import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Text, TextInput } from 'react-native';
import { ScreenLayout } from '../components/layout/ScreenLayout';
import { AppHeader } from '../components/layout/AppHeader';
import { FormSection } from '../components/layout/FormSection';
import { TextArea } from '../components/form/TextArea';
import { ChipSelector } from '../components/form/ChipSelector';
import { CheckboxGroup } from '../components/form/Checkbox';
import { MediaUploadBox } from '../components/form/PhotoUploadBox';
import { Colors } from '../theme/colors';
import { useIncidents } from '../hooks/useIncidents';
import { useMediaCapture } from '../hooks/useMediaCapture';
import { PotentialConsequence, NearMissCause, YesNo } from '../types';
import { useGeoTag } from '../hooks/useGeoTag';
import { lookupService, WorkingStation, HazardOption } from '../services/lookupService';

const CONSEQUENCES = ['Minor Injury', 'Lost Time Injury', 'Property Damage', 'Environmental Impact'];
const CONDITIONS    = ['Slippery Floor', 'Missing Guard', 'Distraction', 'Poor Lighting'];
/** Spec enum for near-miss severity (distinct from the incident severity ladder). */
const SEVERITIES    = ['Low', 'Medium', 'High'];

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
  const {
    items: mediaItems, attachments: mediaAttachments,
    launch: launchMedia, remove: removeMedia,
  } = useMediaCapture();

  const { geo } = useGeoTag();

  const [description, setDescription] = useState('');
  const [consequence, setConsequence] = useState('');
  const [severity,    setSeverity]    = useState('Medium');
  const [causes,      setCauses]      = useState<string[]>([]);
  const [suggestion,  setSuggestion]  = useState('');
  const [eventDateTime, setEventDateTime] = useState<Date>(new Date());
  const [controlFailure, setControlFailure] = useState<YesNo>('No');
  const [hazardStillPresent, setHazardStillPresent] = useState<YesNo>('No');
  const [capaEscalation, setCapaEscalation] = useState<YesNo>('No');
  const [witnessDraft, setWitnessDraft] = useState('');
  const [witnesses,   setWitnesses]   = useState<string[]>([]);
  const [errors,      setErrors]      = useState<Record<string, string>>({});

  const [stations, setStations] = useState<WorkingStation[]>([]);
  const [stationId, setStationId] = useState<number | null>(null);
  const [hazards, setHazards] = useState<HazardOption[]>([]);
  const [hazardId, setHazardId] = useState<number | null>(null);

  useEffect(() => {
    lookupService.workingStations()
      .then(rows => {
        setStations(rows);
        setStationId(prev => prev ?? rows[0]?.id ?? null);
      })
      .catch(() => setStations([]));
    lookupService.hazards().then(setHazards).catch(() => setHazards([]));
  }, []);

  const stationLabel = useMemo(
    () => stations.find(s => s.id === stationId)?.station_name ?? 'Select a station',
    [stations, stationId],
  );

  const addWitness = () => {
    const name = witnessDraft.trim();
    if (!name) return;
    setWitnesses(prev => [...prev, name]);
    setWitnessDraft('');
  };

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
      severity,
      causes:                   mappedCauses,
      // The backend derives underlying_cause from the condition checkboxes; send the
      // human-readable labels so the register stays readable.
      underlying_cause:         causes.join(', ') || undefined,
      location_station_id:      stationId ?? undefined,
      observed_date_time:       eventDateTime.toISOString(),
      hazard_id:                hazardId ?? undefined,
      control_failure:          controlFailure,
      hazard_still_present:     hazardStillPresent,
      capa_escalation:          capaEscalation,
      witnesses:                witnesses.length > 0 ? witnesses : undefined,
      gps_latitude:             geo.gps_latitude != null ? String(geo.gps_latitude) : undefined,
      gps_longitude:            geo.gps_longitude != null ? String(geo.gps_longitude) : undefined,
      preventative_suggestion:  suggestion.trim() || undefined,
      photos: mediaAttachments.length > 0 ? mediaAttachments : undefined,
    } as any);

    if (ok.ok) {
      Alert.alert(
        ok.queued ? 'Saved — waiting to send' : 'Report Submitted',
        ok.queued
          ? 'Saved on this device. There is no signal right now, so it will be sent automatically as soon as you are back online.'
          : 'Your near miss report has been submitted.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
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
          <MediaUploadBox
            items={mediaItems}
            onAdd={launchMedia}
            onRemove={removeMedia}
            subtitle="Tap to take a photo, record a video, or attach one you already have"
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

        <FormSection label="Severity">
          <ChipSelector options={SEVERITIES} value={severity} onChange={setSeverity} />
        </FormSection>

        <FormSection label="Condition / Cause">
          <CheckboxGroup options={CONDITIONS} selected={causes} onChange={setCauses} columns={2} />
        </FormSection>

        <FormSection label="Event Date & Time">
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD HH:MM"
              placeholderTextColor={Colors.textMuted}
              value={formatDateTime(eventDateTime)}
              onChangeText={(t: string) => {
                const parsed = new Date(t.replace(' ', 'T'));
                if (!isNaN(parsed.getTime())) setEventDateTime(parsed);
              }}
            />
          </View>
        </FormSection>

        <FormSection label="Location / Working Station" required>
          <View style={styles.chipWrap}>
            {stations.map(st => (
              <TouchableOpacity
                key={st.id}
                style={[styles.pill, stationId === st.id && styles.pillActive]}
                onPress={() => setStationId(st.id)}
              >
                <Text style={[styles.pillText, stationId === st.id && styles.pillTextActive]}>
                  {st.station_name}
                </Text>
              </TouchableOpacity>
            ))}
            {stations.length === 0 && <Text style={styles.mutedText}>{stationLabel}</Text>}
          </View>
        </FormSection>

        <FormSection label="Linked Hazard">
          <View style={styles.chipWrap}>
            <TouchableOpacity
              style={[styles.pill, hazardId === null && styles.pillActive]}
              onPress={() => setHazardId(null)}
            >
              <Text style={[styles.pillText, hazardId === null && styles.pillTextActive]}>None</Text>
            </TouchableOpacity>
            {hazards.map(hz => (
              <TouchableOpacity
                key={hz.id}
                style={[styles.pill, hazardId === hz.id && styles.pillActive]}
                onPress={() => setHazardId(hz.id)}
              >
                <Text style={[styles.pillText, hazardId === hz.id && styles.pillTextActive]}>
                  {hz.hazard_name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </FormSection>

        <FormSection label="Control Failure?">
          <ChipSelector options={['Yes', 'No']} value={controlFailure} onChange={v => setControlFailure(v as YesNo)} />
        </FormSection>

        <FormSection label="Hazard Still Present?">
          <ChipSelector options={['Yes', 'No']} value={hazardStillPresent} onChange={v => setHazardStillPresent(v as YesNo)} />
        </FormSection>

        <FormSection label="Escalate to CAPA?">
          <ChipSelector options={['Yes', 'No']} value={capaEscalation} onChange={v => setCapaEscalation(v as YesNo)} />
        </FormSection>

        <FormSection label="Witnesses">
          <View style={styles.witnessRow}>
            <View style={[styles.inputBox, { flex: 1 }]}>
              <TextInput
                style={styles.input}
                placeholder="Add a witness name..."
                placeholderTextColor={Colors.textMuted}
                value={witnessDraft}
                onChangeText={setWitnessDraft}
                onSubmitEditing={addWitness}
                returnKeyType="done"
              />
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={addWitness}>
              <Text style={styles.addBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          {witnesses.length > 0 && (
            <View style={styles.chipWrap}>
              {witnesses.map((name, idx) => (
                <TouchableOpacity
                  key={`${name}-${idx}`}
                  style={styles.pill}
                  onPress={() => setWitnesses(prev => prev.filter((_, i) => i !== idx))}
                >
                  <Text style={styles.pillText}>{name}  ✕</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
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

/** `YYYY-MM-DD HH:MM` in local time — ISO-parseable once the space becomes a `T`. */
function formatDateTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const styles = StyleSheet.create({
  scroll: { flex: 1, padding: 16 },
  errorText: { fontSize: 12, color: Colors.critical, marginTop: 6 },
  inputBox: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    justifyContent: 'center',
  },
  input: { fontSize: 14, color: Colors.textDark },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pillText: { fontSize: 13, fontWeight: '700', color: Colors.textDark },
  pillTextActive: { color: Colors.white },
  mutedText: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
  witnessRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  addBtn: {
    width: 48, height: 48, borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { fontSize: 22, fontWeight: '800', color: Colors.primary, lineHeight: 26 },
  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 18, alignItems: 'center', marginTop: 8, marginBottom: 16,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: Colors.white, fontWeight: '800', fontSize: 15, letterSpacing: 0.5 },
});
