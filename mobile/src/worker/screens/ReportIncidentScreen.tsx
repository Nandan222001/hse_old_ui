import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '../components/display/Icon';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, TextInput, ActivityIndicator, Modal,
} from 'react-native';
import { ScreenLayout } from '../components/layout/ScreenLayout';
import { Colors } from '../theme/colors';
import { useIncidents } from '../hooks/useIncidents';
import { useGeoTag } from '../hooks/useGeoTag';
import { lookupService, WorkingStation, HazardOption } from '../services/lookupService';
import type { IncidentType, SeverityLevel, YesNo } from '../types';

const INCIDENT_TYPES: IncidentType[] = [
  'Injury',
  'Dangerous Occurrence',
  'Property Damage',
  'Environmental',
];

/** Ordered least → most severe; "Lost Time" and "Fatal" are what drive LTIFR/LTISR/DART/FAR. */
const SEVERITIES: SeverityLevel[] = ['Minor', 'Moderate', 'Severe', 'Lost Time', 'Fatal'];

// WF-03 Q2. These values are the ones the backend decision tree accepts —
// anything else classifies as "unrecognised" and escalates rather than guessing.
const TREATMENT_LEVELS = [
  { value: 'first_aid', label: 'First aid only' },
  { value: 'medical_treatment', label: 'Medical treatment' },
  { value: 'hospitalisation', label: 'Hospitalised / >3 days lost' },
  { value: 'fatality', label: 'Fatality' },
];

export default function ReportIncidentScreen({ navigation }: any) {
  const { reportIncident, isLoading: isSubmitting } = useIncidents();
  const { geo } = useGeoTag();

  const [incidentType, setIncidentType] = useState<IncidentType>('Injury');
  const [pickerVisible, setPickerVisible] = useState(false);

  const [stations, setStations] = useState<WorkingStation[]>([]);
  const [stationId, setStationId] = useState<number | null>(null);
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);

  const [hazards, setHazards] = useState<HazardOption[]>([]);
  const [hazardId, setHazardId] = useState<number | null>(null);
  const [hazardPickerVisible, setHazardPickerVisible] = useState(false);

  const [incidentDateTime, setIncidentDateTime] = useState<Date>(new Date());
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<SeverityLevel>('Minor');
  const [reason, setReason] = useState('');
  const [personsInvolved, setPersonsInvolved] = useState('');
  const [anyoneInjured, setAnyoneInjured] = useState<YesNo>('No');
  // ── WF-03 decision tree inputs ─────────────────────────────────────────────
  // The `severity` picker above is the reporter's impression and drives nothing.
  // These three are what the backend's decision tree reads to assign P1-P5, the
  // investigation SLA and any statutory deadline. Without them an injury
  // reported from the app can never classify at submission time.
  const [treatmentLevel, setTreatmentLevel] = useState('');
  const [dangerousOccurrence, setDangerousOccurrence] = useState<YesNo>('No');
  const [worstCaseFatal, setWorstCaseFatal] = useState<YesNo>('No');
  const [injuredPersonName, setInjuredPersonName] = useState('');
  const [injuredBodyPart, setInjuredBodyPart] = useState('');
  const [permitActive, setPermitActive] = useState<YesNo>('No');
  const [controlFailure, setControlFailure] = useState<YesNo>('No');
  const [hazardStillPresent, setHazardStillPresent] = useState<YesNo>('No');
  const [immediateActions, setImmediateActions] = useState('');
  const [witnessDraft, setWitnessDraft] = useState('');
  const [witnesses, setWitnesses] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    lookupService.workingStations()
      .then(rows => {
        setStations(rows);
        setStationId(prev => prev ?? rows[0]?.id ?? null);
      })
      .catch(() => setStations([]));
    lookupService.hazards().then(setHazards).catch(() => setHazards([]));
  }, []);

  const stationName = useMemo(
    () => stations.find(s => s.id === stationId)?.station_name ?? 'Select a station',
    [stations, stationId],
  );
  const hazardName = useMemo(
    () => hazards.find(h => h.id === hazardId)?.hazard_name ?? 'None',
    [hazards, hazardId],
  );

  const addWitness = () => {
    const name = witnessDraft.trim();
    if (!name) return;
    setWitnesses(prev => [...prev, name]);
    setWitnessDraft('');
  };

  const handleAddPhoto = () => {
    const mockPhotoNames = [
      'evidence_spill_01.jpg',
      'floor_strap_obstruction.jpg',
      'damaged_scaffolding_clip.jpg',
      'exhaust_steam_leak.jpg',
      'valve_gasket_wear.jpg'
    ];
    const nextPhoto = mockPhotoNames[Math.floor(Math.random() * mockPhotoNames.length)];
    const timeStamp = new Date().getTime().toString().slice(-4);
    setPhotos(prev => [...prev, `${timeStamp}_${nextPhoto}`]);
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleNext = async () => {
    if (!description.trim()) {
      Alert.alert('Required', 'Please enter a description of the incident.');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Required', 'Please enter the reason / immediate cause.');
      return;
    }
    if (anyoneInjured === 'Yes' && !injuredPersonName.trim()) {
      Alert.alert('Required', 'Please enter the name of the injured person.');
      return;
    }
    if (!stationId) {
      Alert.alert('Required', 'Please select the location / working station.');
      return;
    }

    const ok = await reportIncident({
      incident_date_time: incidentDateTime.toISOString(),
      location_station_id: stationId,
      incident_type: incidentType,
      severity,
      description: description.trim(),
      immediate_cause: reason.trim(),
      number_persons_involved: personsInvolved ? Number(personsInvolved) : undefined,
      anyone_injured: anyoneInjured,
      injured_person_name: anyoneInjured === 'Yes' ? injuredPersonName.trim() : undefined,
      injured_body_part: anyoneInjured === 'Yes' ? injuredBodyPart.trim() || undefined : undefined,
      // WF-03 Q2-Q4. Treatment level only applies when someone was hurt; the
      // other two stand alone (a near miss can still be a dangerous occurrence
      // or a high-potential event).
      treatment_level: anyoneInjured === 'Yes' ? treatmentLevel || undefined : undefined,
      dangerous_occurrence: dangerousOccurrence === 'Yes',
      worst_case_fatal: worstCaseFatal === 'Yes',
      hazard_id: hazardId ?? undefined,
      permit_active: permitActive,
      control_failure: controlFailure,
      hazard_still_present: hazardStillPresent,
      immediate_actions_taken: immediateActions.trim() || undefined,
      witnesses,
      ...geo,
      mockPhotos: photos,
    } as any);

    if (ok.ok) {
      Alert.alert(
        ok.queued ? 'Saved — waiting to send' : 'Success',
        ok.queued
          ? 'Saved on this device. There is no signal right now, so it will be sent automatically as soon as you are back online.'
          : 'Incident report submitted successfully to the safety team.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
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
          <Icon emoji="☰" style={styles.headerIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SafeGuard HSE</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('Notifications')}>
          <Icon emoji="🔔" style={styles.headerIcon} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Incident Details</Text>
        <Text style={styles.sectionSub}>Provide the initial classification and description.</Text>

        {/* Incident Type Dropdown */}
        <Text style={styles.inputLabel}>Incident Type</Text>
        <TouchableOpacity style={styles.dropdown} onPress={() => setPickerVisible(true)}>
          <Text style={styles.dropdownValue}>{incidentType}</Text>
          <Text style={styles.chevronIcon}>▼</Text>
        </TouchableOpacity>

        {/* Location Dropdown — resolves to a working_stations FK */}
        <Text style={styles.inputLabel}>Location / Station</Text>
        <TouchableOpacity style={styles.dropdown} onPress={() => setLocationPickerVisible(true)}>
          <Text style={styles.dropdownValue}>{stationName}</Text>
          <Text style={styles.chevronIcon}>▼</Text>
        </TouchableOpacity>

        {/* Incident Date & Time */}
        <Text style={styles.inputLabel}>Incident Date &amp; Time</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="YYYY-MM-DD HH:MM"
            placeholderTextColor="#94A3B8"
            value={formatDateTime(incidentDateTime)}
            onChangeText={t => {
              const parsed = new Date(t.replace(' ', 'T'));
              if (!isNaN(parsed.getTime())) setIncidentDateTime(parsed);
            }}
          />
        </View>

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

        {/* Severity Level — spec enum, matched verbatim by the KPI engine */}
        <Text style={styles.inputLabel}>Severity Level</Text>
        <View style={styles.severityRow}>
          {SEVERITIES.map((level) => (
            <TouchableOpacity
              key={level}
              style={[styles.severityChip, severity === level && styles.severityBtnActive]}
              onPress={() => setSeverity(level)}
            >
              <Text
                style={[styles.severityChipText, severity === level && styles.severityBtnTextActive]}
                numberOfLines={1}
              >
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.severityLimitsRow}>
          <Text style={styles.limitText}>MINOR</Text>
          <Text style={styles.limitText}>FATAL</Text>
        </View>

        {/* Incident Reason */}
        <Text style={styles.inputLabel}>Reason / Immediate Cause</Text>
        <View style={styles.textAreaContainer}>
          <TextInput
            style={[styles.textArea, { height: 75 }]}
            placeholder="Explain why the incident occurred..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            value={reason}
            onChangeText={setReason}
          />
        </View>

        {/* Number of Persons Involved */}
        <Text style={styles.inputLabel}>Number of Persons Involved</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="0"
            placeholderTextColor="#94A3B8"
            keyboardType="number-pad"
            value={personsInvolved}
            onChangeText={t => setPersonsInvolved(t.replace(/[^0-9]/g, ''))}
          />
        </View>

        {/* Was anyone injured toggle */}
        <YesNoRow label="Was anyone injured?" value={anyoneInjured} onChange={setAnyoneInjured} />

        {/* Injury detail */}
        {anyoneInjured === 'Yes' && (
          <View>
            <Text style={styles.inputLabel}>Injured Person Name</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter full name of the injured person..."
                placeholderTextColor="#94A3B8"
                value={injuredPersonName}
                onChangeText={setInjuredPersonName}
              />
            </View>

            <Text style={styles.inputLabel}>Body Part Injured</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Left hand, Lower back..."
                placeholderTextColor="#94A3B8"
                value={injuredBodyPart}
                onChangeText={setInjuredBodyPart}
              />
            </View>

            {/* WF-03 Q2 — sets the severity, the investigation deadline and any
                regulator notification. Optional here on purpose: a worker in the
                field may not know yet, and the supervisor confirms it during the
                investigation. Left blank the incident stays unclassified rather
                than being guessed. */}
            <Text style={styles.inputLabel}>Level of treatment (if known)</Text>
            <View style={styles.wfChipRow}>
              {TREATMENT_LEVELS.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[styles.wfChip, treatmentLevel === t.value && styles.wfChipOn]}
                  onPress={() => setTreatmentLevel(treatmentLevel === t.value ? '' : t.value)}
                >
                  <Text style={[styles.wfChipText, treatmentLevel === t.value && styles.wfChipTextOn]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* WF-03 Q3 and Q4 — asked for every report, injury or not. A near miss
            that could have killed someone is a high-potential incident and gets
            the P2 investigation protocol. */}
        <YesNoRow
          label="Dangerous occurrence? (collapse, explosion, major release)"
          value={dangerousOccurrence}
          onChange={setDangerousOccurrence}
        />
        <YesNoRow
          label="Could this have killed or seriously injured someone?"
          value={worstCaseFatal}
          onChange={setWorstCaseFatal}
        />

        {/* Linked Hazard */}
        <Text style={styles.inputLabel}>Linked Hazard</Text>
        <TouchableOpacity style={styles.dropdown} onPress={() => setHazardPickerVisible(true)}>
          <Text style={styles.dropdownValue}>{hazardName}</Text>
          <Text style={styles.chevronIcon}>▼</Text>
        </TouchableOpacity>

        {/* Control context — these three feed the risk / close-out analytics */}
        <YesNoRow label="Permit active at the time?" value={permitActive} onChange={setPermitActive} />
        <YesNoRow label="Control failure?" value={controlFailure} onChange={setControlFailure} />
        <YesNoRow label="Hazard still present?" value={hazardStillPresent} onChange={setHazardStillPresent} />

        {/* Immediate Actions Taken */}
        <Text style={styles.inputLabel}>Immediate Actions Taken</Text>
        <View style={styles.textAreaContainer}>
          <TextInput
            style={[styles.textArea, { height: 75 }]}
            placeholder="What was done right away to make the area safe?"
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            value={immediateActions}
            onChangeText={setImmediateActions}
          />
        </View>

        {/* Witnesses */}
        <Text style={styles.inputLabel}>Witnesses</Text>
        <View style={styles.witnessRow}>
          <View style={[styles.inputContainer, styles.witnessInput]}>
            <TextInput
              style={styles.textInput}
              placeholder="Add a witness name..."
              placeholderTextColor="#94A3B8"
              value={witnessDraft}
              onChangeText={setWitnessDraft}
              onSubmitEditing={addWitness}
              returnKeyType="done"
            />
          </View>
          <TouchableOpacity style={styles.witnessAddBtn} onPress={addWitness}>
            <Icon name="plus" size={16} color="#2563EB" />
          </TouchableOpacity>
        </View>
        {witnesses.length > 0 && (
          <View style={styles.photoWrapper}>
            {witnesses.map((name, idx) => (
              <View key={`${name}-${idx}`} style={styles.photoTag}>
                <Icon name="user" size={12} color="#334155" style={{ marginRight: 4 }} />
                <Text style={styles.photoLabel}>{name}</Text>
                <TouchableOpacity onPress={() => setWitnesses(prev => prev.filter((_, i) => i !== idx))}>
                  <Icon emoji="✕" style={styles.photoRemoveBtn} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Photos Upload Section */}
        <Text style={styles.inputLabel}>Photos / Evidence</Text>
        <View style={styles.photoContainer}>
          <TouchableOpacity style={[styles.photoAddBtn, styles.photoAddRow]} onPress={handleAddPhoto}>
            <Icon name="camera" size={15} color="#2563EB" style={styles.photoAddIcon} />
            <Text style={styles.photoAddText}>Add Evidence Photo</Text>
          </TouchableOpacity>
          
          <View style={styles.photoWrapper}>
            {photos.map((item, idx) => (
              <View key={idx} style={styles.photoTag}>
                <Icon name="image" size={12} color="#334155" style={{ marginRight: 4 }} />
                <Text style={styles.photoLabel}>{item}</Text>
                <TouchableOpacity onPress={() => handleRemovePhoto(idx)}>
                  <Icon emoji="✕" style={styles.photoRemoveBtn} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* GPS is auto-captured, so surface what will be attached */}
        <View style={styles.gpsRow}>
          <Icon name="map-pin" size={13} color="#64748B" style={{ marginRight: 6 }} />
          <Text style={styles.gpsText}>
            {geo.gps_latitude != null
              ? `GPS ${geo.gps_latitude.toFixed(5)}, ${geo.gps_longitude?.toFixed(5)}`
              : 'GPS unavailable — report will be submitted without coordinates'}
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.draftBtn, styles.footerBtnRow]}>
          <Icon name="save" size={15} color="#475569" style={styles.footerBtnIcon} />
          <Text style={styles.draftBtnText}>Draft</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext} disabled={isSubmitting}>
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <View style={styles.footerBtnRow}>
              <Text style={styles.nextBtnText}>Next</Text>
              <Icon name="arrow-right" size={15} color="#FFFFFF" style={styles.footerBtnIconRight} />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet Picker Modal */}
      <Modal
        visible={pickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setPickerVisible(false)}
        >
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Incident Type</Text>
              <TouchableOpacity onPress={() => setPickerVisible(false)}>
                <Icon emoji="✕" style={styles.pickerCloseBtn} />
              </TouchableOpacity>
            </View>
            
            {INCIDENT_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.pickerItem, incidentType === type && styles.pickerItemActive]}
                onPress={() => {
                  setIncidentType(type);
                  setPickerVisible(false);
                }}
              >
                <Text style={[styles.pickerItemText, incidentType === type && styles.pickerItemTextActive]}>
                  {type}
                </Text>
                {incidentType === type && (
                  <Icon emoji="✓" style={styles.checkmarkIcon} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Location Picker Modal */}
      <Modal
        visible={locationPickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setLocationPickerVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setLocationPickerVisible(false)}
        >
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Location</Text>
              <TouchableOpacity onPress={() => setLocationPickerVisible(false)}>
                <Icon emoji="✕" style={styles.pickerCloseBtn} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.pickerScroll}>
              {stations.length === 0 && (
                <Text style={styles.pickerEmpty}>No working stations configured.</Text>
              )}
              {stations.map((st) => (
                <TouchableOpacity
                  key={st.id}
                  style={[styles.pickerItem, stationId === st.id && styles.pickerItemActive]}
                  onPress={() => {
                    setStationId(st.id);
                    setLocationPickerVisible(false);
                  }}
                >
                  <Text style={[styles.pickerItemText, stationId === st.id && styles.pickerItemTextActive]}>
                    {st.station_name}
                  </Text>
                  {stationId === st.id && (
                    <Icon emoji="✓" style={styles.checkmarkIcon} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Linked Hazard Picker Modal */}
      <Modal
        visible={hazardPickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setHazardPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setHazardPickerVisible(false)}
        >
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Link a Hazard</Text>
              <TouchableOpacity onPress={() => setHazardPickerVisible(false)}>
                <Icon emoji="✕" style={styles.pickerCloseBtn} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.pickerScroll}>
              <TouchableOpacity
                style={[styles.pickerItem, hazardId === null && styles.pickerItemActive]}
                onPress={() => { setHazardId(null); setHazardPickerVisible(false); }}
              >
                <Text style={[styles.pickerItemText, hazardId === null && styles.pickerItemTextActive]}>
                  None
                </Text>
                {hazardId === null && <Icon emoji="✓" style={styles.checkmarkIcon} />}
              </TouchableOpacity>
              {hazards.map((hz) => (
                <TouchableOpacity
                  key={hz.id}
                  style={[styles.pickerItem, hazardId === hz.id && styles.pickerItemActive]}
                  onPress={() => { setHazardId(hz.id); setHazardPickerVisible(false); }}
                >
                  <Text style={[styles.pickerItemText, hazardId === hz.id && styles.pickerItemTextActive]}>
                    {hz.hazard_name}
                  </Text>
                  {hazardId === hz.id && <Icon emoji="✓" style={styles.checkmarkIcon} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScreenLayout>
  );
}

function YesNoRow({
  label, value, onChange,
}: { label: string; value: YesNo; onChange: (v: YesNo) => void }) {
  return (
    <View>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.toggleGroup}>
        {(['Yes', 'No'] as YesNo[]).map(opt => (
          <TouchableOpacity
            key={opt}
            style={[styles.toggleOption, value === opt && styles.toggleOptionActive]}
            onPress={() => onChange(opt)}
          >
            <Text style={[styles.toggleOptionText, value === opt && styles.toggleOptionTextActive]}>
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

/** `YYYY-MM-DD HH:MM` in local time — ISO-parseable once the space becomes a `T`. */
function formatDateTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const styles = StyleSheet.create({
  wfChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  wfChip: {
    borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 9, backgroundColor: '#FFFFFF',
  },
  wfChipOn: { borderColor: '#0B3D91', backgroundColor: '#EFF6FF' },
  wfChipText: { fontSize: 13, color: '#475569', fontWeight: '600' },
  wfChipTextOn: { color: '#0B3D91' },
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
    fontWeight: '700',
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
    gap: 6,
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
  severityChip: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  severityChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  witnessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  witnessInput: {
    flex: 1,
  },
  witnessAddBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  gpsText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    flex: 1,
  },
  pickerScroll: {
    maxHeight: 320,
  },
  pickerEmpty: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    paddingVertical: 16,
    textAlign: 'center',
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
  footerBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBtnIcon: {
    marginRight: 6,
  },
  footerBtnIconRight: {
    marginLeft: 6,
  },
  photoAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAddIcon: {
    marginRight: 6,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  pickerCloseBtn: {
    fontSize: 18,
    color: '#64748B',
    paddingHorizontal: 8,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  pickerItemActive: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  pickerItemText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
  },
  pickerItemTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  checkmarkIcon: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '800',
  },
  toggleGroup: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  toggleOption: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleOptionActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  toggleOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  toggleOptionTextActive: {
    color: '#FFFFFF',
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 20,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 14,
    color: '#0F172A',
  },
  photoContainer: {
    marginBottom: 20,
  },
  photoAddBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#2563EB',
    borderStyle: 'dashed',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  photoAddText: {
    color: '#2563EB',
    fontWeight: '700',
    fontSize: 13,
  },
  photoWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 8,
  },
  photoLabel: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  photoRemoveBtn: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '800',
    paddingHorizontal: 4,
  },
});
