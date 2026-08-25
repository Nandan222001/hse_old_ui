import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Text, TextInput } from 'react-native';
import { ScreenLayout } from '../components/layout/ScreenLayout';
import { AppHeader } from '../components/layout/AppHeader';
import { FormSection } from '../components/layout/FormSection';
import { TextArea } from '../components/form/TextArea';
import { ChipSelector } from '../components/form/ChipSelector';
import { MediaUploadBox } from '../components/form/PhotoUploadBox';
import { Colors } from '../theme/colors';
import { useIncidents } from '../hooks/useIncidents';
import { useMediaCapture } from '../hooks/useMediaCapture';
import { YesNo } from '../types';
import { useGeoTag } from '../hooks/useGeoTag';
import { lookupService, WorkingStation, HazardOption } from '../services/lookupService';
import { DropdownWithOther, OTHER_VALUE } from '../components/form/DropdownWithOther';
import { DateTimePickerModal } from '../components/inputs/DateTimePickerModal';
import { toLocalIso } from '../utils/formatters';

/** The picker speaks "YYYY-MM-DD HH:MM"; the form holds a Date. */
function toPickerValue(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

const CONSEQUENCES = ['Minor Injury', 'Lost Time Injury', 'Property Damage', 'Environmental Impact'];
const CONDITIONS    = ['Slippery Floor', 'Missing Guard', 'Distraction', 'Poor Lighting'];
/** Spec enum for near-miss severity (distinct from the incident severity ladder). */
const SEVERITIES    = ['Low', 'Medium', 'High'];

// The chosen label is sent as-is, not mapped to a snake_case enum first. The
// column already holds labels almost everywhere — "Environmental Release",
// "Property Damage", "Serious Injury" and so on across 500-odd rows — against
// 13 snake_case values, all written by this screen. The app was the odd one
// out, and an "Other" answer is free text regardless, so one column of readable
// strings beats two conventions. Both readers cope: MyNearMissesScreen falls
// back to the raw value and the web trail's underscore replacement is a no-op
// on a label.

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
  // Each dropdown keeps its selection and its "Other" text apart, so switching
  // to Other and back does not throw away what was typed.
  const [consequenceOther, setConsequenceOther] = useState('');
  const [condition, setCondition] = useState('');
  const [conditionOther, setConditionOther] = useState('');
  const [stationValue, setStationValue] = useState('');
  const [stationOther, setStationOther] = useState('');
  const [hazardValue, setHazardValue] = useState('');
  const [hazardOther, setHazardOther] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [suggestion,  setSuggestion]  = useState('');
  const [eventDateTime, setEventDateTime] = useState<Date>(new Date());
  const [controlFailure, setControlFailure] = useState<YesNo>('No');
  const [hazardStillPresent, setHazardStillPresent] = useState<YesNo>('No');
  const [capaEscalation, setCapaEscalation] = useState<YesNo>('No');
  const [witnessDraft, setWitnessDraft] = useState('');
  const [witnesses,   setWitnesses]   = useState<string[]>([]);
  const [errors,      setErrors]      = useState<Record<string, string>>({});

  const [stations, setStations] = useState<WorkingStation[]>([]);
  const [hazards, setHazards] = useState<HazardOption[]>([]);

  useEffect(() => {
    // Failing softly: a lookup that will not load leaves the list empty, and
    // "Other" is still there to type into. Blocking the report because the
    // station list is unreachable would be the wrong trade on a site.
    lookupService.workingStations().then(setStations).catch(() => setStations([]));
    lookupService.hazards().then(setHazards).catch(() => setHazards([]));
  }, []);

  const stationOptions = useMemo(
    () => stations.map(st => ({ label: st.station_name, value: String(st.id) })),
    [stations],
  );
  const hazardOptions = useMemo(
    () => hazards.map(h => ({ label: h.hazard_name, value: String(h.id) })),
    [hazards],
  );

  /** A dropdown's value as the API wants it: the typed text when Other, the
   *  chosen label otherwise, and undefined when nothing was picked. */
  const pick = (value: string, other: string): string | undefined => {
    if (value === OTHER_VALUE) return other.trim() || undefined;
    return value || undefined;
  };

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
    if (consequence === OTHER_VALUE && !consequenceOther.trim()) {
      e.consequence = 'Describe what could have happened';
    }
    if (!stationValue) e.station = 'Select where it happened';
    if (stationValue === OTHER_VALUE && !stationOther.trim()) {
      e.station = 'Describe where it happened';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    // A listed station or hazard goes in as its id; "Other" goes in as text with
    // the id left unset, which is what the *_other columns are for.
    const stationPicked = stationValue && stationValue !== OTHER_VALUE;
    const hazardPicked = hazardValue && hazardValue !== OTHER_VALUE;

    const ok = await reportNearMiss({
      description:              description.trim(),
      // The listed options are already the values the register stores, and an
      // "Other" answer is the worker's own words. One field carries both.
      potential_consequence:    pick(consequence, consequenceOther),
      severity,
      underlying_cause:         pick(condition, conditionOther),
      location_station_id:      stationPicked ? Number(stationValue) : undefined,
      location_other:           stationPicked ? undefined : pick(stationValue, stationOther),
      // Local wall-clock, not UTC — the backend starts the response SLA from
      // this value. See toLocalIso.
      observed_date_time:       toLocalIso(eventDateTime),
      hazard_id:                hazardPicked ? Number(hazardValue) : undefined,
      hazard_other:             hazardPicked ? undefined : pick(hazardValue, hazardOther),
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

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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
          <DropdownWithOther
            options={CONSEQUENCES}
            value={consequence}
            onChange={v => { setConsequence(v); setErrors(e => ({ ...e, consequence: '' })); }}
            otherText={consequenceOther}
            onOtherTextChange={setConsequenceOther}
            placeholder="What could this have caused?"
            otherPlaceholder="What could have happened? e.g. crush injury from stacked stillages"
            error={errors.consequence}
          />
          {errors.consequence ? (
            <Text style={styles.errorText}>{errors.consequence}</Text>
          ) : null}
        </FormSection>

        <FormSection label="Severity">
          <ChipSelector options={SEVERITIES} value={severity} onChange={setSeverity} />
        </FormSection>

        {/* One condition, not several. The multi-select this replaces produced a
            `causes` array the API has no field for and `near_misses` has no
            column for — Pydantic dropped it and only the joined string in
            underlying_cause was ever stored, so single-select loses nothing
            that was persisted and gains a way to say "Other". */}
        <FormSection label="Condition / Cause">
          <DropdownWithOther
            options={CONDITIONS}
            value={condition}
            onChange={setCondition}
            otherText={conditionOther}
            onOtherTextChange={setConditionOther}
            placeholder="What was behind it?"
            otherPlaceholder="Describe the condition you saw"
          />
        </FormSection>

        <FormSection label="Event Date & Time" required>
          <TouchableOpacity onPress={() => setPickerOpen(true)} activeOpacity={0.8}>
            <View style={styles.inputBox} pointerEvents="none">
              <Text style={styles.input}>{formatDateTime(eventDateTime)}</Text>
            </View>
          </TouchableOpacity>
        </FormSection>

        <FormSection label="Location / Working Station" required>
          <DropdownWithOther
            options={stationOptions}
            value={stationValue}
            onChange={v => { setStationValue(v); setErrors(e => ({ ...e, station: '' })); }}
            otherText={stationOther}
            onOtherTextChange={setStationOther}
            placeholder={stations.length ? 'Where did it happen?' : 'No stations loaded — use Other'}
            otherPlaceholder="Where exactly? e.g. old paint store, north end"
            otherLabel="Other (not a listed station)"
            error={errors.station}
          />
          {errors.station ? <Text style={styles.errorText}>{errors.station}</Text> : null}
        </FormSection>

        <FormSection label="Linked Hazard">
          <DropdownWithOther
            options={hazardOptions}
            value={hazardValue}
            onChange={setHazardValue}
            otherText={hazardOther}
            onOtherTextChange={setHazardOther}
            placeholder={hazards.length ? 'Is this a known hazard?' : 'No hazards loaded — use Other'}
            otherPlaceholder="Describe the hazard in your own words"
            otherLabel="Other (not on the register)"
          />
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

      <DateTimePickerModal
        visible={pickerOpen}
        value={toPickerValue(eventDateTime)}
        title="When did it happen?"
        onConfirm={(v) => {
          // Parsed by hand rather than via new Date(string): an unzoned string
          // is read as UTC by some engines, which would move the event across
          // the date line the response SLA is measured from.
          const [datePart, timePart] = v.split(' ');
          const [y, mo, da] = datePart.split('-').map(Number);
          const [hh, mi] = (timePart ?? '00:00').split(':').map(Number);
          setEventDateTime(new Date(y, mo - 1, da, hh, mi));
          setPickerOpen(false);
        }}
        onCancel={() => setPickerOpen(false)}
      />
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
