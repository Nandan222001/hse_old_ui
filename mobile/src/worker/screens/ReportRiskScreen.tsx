import React, { useState, useMemo, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Text } from 'react-native';
import { ScreenLayout } from '../components/layout/ScreenLayout';
import { AppHeader } from '../components/layout/AppHeader';
import { FormSection } from '../components/layout/FormSection';
import { Dropdown } from '../components/form/Dropdown';
import { DropdownWithOther, OTHER_VALUE } from '../components/form/DropdownWithOther';
import { DateTimePickerModal } from '../components/inputs/DateTimePickerModal';
import { lookupService, WorkingStation, HazardOption } from '../services/lookupService';
import { Input } from '../components/form/Input';
import { TextArea } from '../components/form/TextArea';
import { ChipSelector } from '../components/form/ChipSelector';
import { ToggleRow } from '../components/form/ToggleRow';
import { MediaUploadBox } from '../components/form/PhotoUploadBox';
import { riskService } from '../services/riskService';
import { useMediaCapture } from '../hooks/useMediaCapture';
import { Colors } from '../theme/colors';
import { toLocalIso } from '../utils/formatters';

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

/** What kind of harm this could cause. The same four the near miss form uses —
 *  a supervisor reading both should not have to learn two vocabularies. */
const CONSEQUENCES = ['Minor Injury', 'Lost Time Injury', 'Property Damage', 'Environmental Impact'];

/** The condition behind it, as the reporter saw it. Not the root cause, which
 *  the supervisor establishes later. */
const CONDITIONS = [
  'Missing or defective guard',
  'Slippery or obstructed floor',
  'Poor lighting',
  'Damaged tool or equipment',
  'Exposed electrical part',
  'Working at height without protection',
  'Procedure not followed',
];

const SEVERITIES    = ['Minor', 'Significant', 'Serious', 'Fatal'];

/** "25 Aug 2026, 22:15" — what the picker shows in the field. */
function formatObserved(d: Date): string {
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) +
    ', ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

/** The picker speaks "YYYY-MM-DD HH:MM"; the form holds a Date. */
function toPickerValue(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

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
  const {
    items: mediaItems, attachments: mediaAttachments,
    launch: launchMedia, remove: removeMedia,
  } = useMediaCapture();

  const [category,    setCategory]    = useState('');
  const [description, setDescription] = useState('');
  const [severity,    setSeverity]    = useState('');
  const [probability, setProbability] = useState('');
  const [stillPresent, setStillPresent] = useState(true);
  const [mitigation,  setMitigation]  = useState('');
  const [isLoading,   setIsLoading]   = useState(false);
  const [errors,      setErrors]      = useState<Record<string, string>>({});

  // ── Context fields ─────────────────────────────────────────────────────────
  // Each dropdown keeps its selection and its "Other" text apart, so switching
  // to Other and back does not throw away what was typed.
  const [consequence, setConsequence] = useState('');
  const [consequenceOther, setConsequenceOther] = useState('');
  const [condition, setCondition] = useState('');
  const [conditionOther, setConditionOther] = useState('');
  const [stationValue, setStationValue] = useState('');
  const [stationOther, setStationOther] = useState('');
  const [hazardValue, setHazardValue] = useState('');
  const [hazardOther, setHazardOther] = useState('');

  // When it was seen, not when the form was opened. It drives the night-shift
  // uplift in the WF-01 score (22:00-06:00), so a wrong time changes the band.
  const [observedAt, setObservedAt] = useState<Date>(new Date());
  const [pickerOpen, setPickerOpen] = useState(false);

  const [stations, setStations] = useState<WorkingStation[]>([]);
  const [hazards, setHazards] = useState<HazardOption[]>([]);

  useEffect(() => {
    // Failing softly: a lookup that will not load leaves the list empty, and
    // "Other" is still there to type into. Blocking the whole report because
    // the station list is unreachable would be the wrong trade on a site.
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
    if (!consequence)         e.consequence = 'Select what this could cause';
    // Choosing Other and typing nothing is the one way these fields can be
    // half-filled, so it is the one case worth blocking on.
    if (consequence === OTHER_VALUE && !consequenceOther.trim()) {
      e.consequence = 'Describe what this could cause';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      // A listed station or hazard goes in as its id; "Other" goes in as text
      // with the id left unset, which is what the *_other columns are for.
      const stationPicked = stationValue && stationValue !== OTHER_VALUE;
      const hazardPicked = hazardValue && hazardValue !== OTHER_VALUE;

      const res = await riskService.reportRisk({
        category_id: Number(category),
        hazard_name: description.trim(),
        severity,
        probability,
        observed_date_time: toLocalIso(observedAt),
        potential_consequence: pick(consequence, consequenceOther),
        underlying_cause: pick(condition, conditionOther),
        location_station_id: stationPicked ? Number(stationValue) : undefined,
        location_other: stationPicked ? undefined : pick(stationValue, stationOther),
        hazard_id: hazardPicked ? Number(hazardValue) : undefined,
        hazard_other: hazardPicked ? undefined : pick(hazardValue, hazardOther),
        photos: mediaAttachments.length > 0 ? mediaAttachments : undefined,
      });
      Alert.alert(
        res.queued ? 'Saved — waiting to send' : 'Hazard Reported',
        res.queued
          ? 'Saved on this device. There is no signal right now, so it will be sent automatically as soon as you are back online.'
          : `Your ${rating ?? ''} hazard observation has been submitted to your supervisor.`,
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

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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

        <FormSection label="When did you see it?" required>
          <TouchableOpacity onPress={() => setPickerOpen(true)} activeOpacity={0.8}>
            <Input
              placeholder="Select date and time"
              value={formatObserved(observedAt)}
              editable={false}
              pointerEvents="none"
            />
          </TouchableOpacity>
        </FormSection>

        <FormSection label="Potential Consequence" required>
          <DropdownWithOther
            options={CONSEQUENCES}
            value={consequence}
            onChange={v => { setConsequence(v); setErrors(e => ({ ...e, consequence: '' })); }}
            otherText={consequenceOther}
            onOtherTextChange={setConsequenceOther}
            placeholder="What could this cause?"
            otherPlaceholder="What could happen? e.g. hearing damage over a full shift"
            error={errors.consequence}
          />
          {errors.consequence ? <Text style={styles.errorText}>{errors.consequence}</Text> : null}
        </FormSection>

        <FormSection label="Condition / Cause">
          <DropdownWithOther
            options={CONDITIONS}
            value={condition}
            onChange={setCondition}
            otherText={conditionOther}
            onOtherTextChange={setConditionOther}
            placeholder="What is behind it?"
            otherPlaceholder="Describe the condition you saw"
          />
        </FormSection>

        <FormSection label="Location / Working Station">
          <DropdownWithOther
            options={stationOptions}
            value={stationValue}
            onChange={setStationValue}
            otherText={stationOther}
            onOtherTextChange={setStationOther}
            placeholder={stations.length ? 'Where was it?' : 'No stations loaded — use Other'}
            otherPlaceholder="Where exactly? e.g. behind the north loading bay"
            otherLabel="Other (not a listed station)"
          />
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
          <MediaUploadBox
            items={mediaItems}
            onAdd={launchMedia}
            onRemove={removeMedia}
            subtitle="Tap to take a photo, record a video, or attach one you already have"
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

      <DateTimePickerModal
        visible={pickerOpen}
        value={toPickerValue(observedAt)}
        title="When did you see it?"
        onConfirm={(v) => {
          // "YYYY-MM-DD HH:MM" -> Date. Parsed by hand rather than via
          // new Date(string), which reads an unzoned string as UTC on some
          // engines and would shift a 22:15 sighting out of the night-shift
          // window the score depends on.
          const [datePart, timePart] = v.split(' ');
          const [y, mo, da] = datePart.split('-').map(Number);
          const [hh, mi] = (timePart ?? '00:00').split(':').map(Number);
          setObservedAt(new Date(y, mo - 1, da, hh, mi));
          setPickerOpen(false);
        }}
        onCancel={() => setPickerOpen(false)}
      />
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
