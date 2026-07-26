import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Text, Modal } from 'react-native';
import { ScreenLayout } from '../components/layout/ScreenLayout';
import { AppHeader } from '../components/layout/AppHeader';
import { FormSection } from '../components/layout/FormSection';
import { TextArea } from '../components/form/TextArea';
import { ChipSelector } from '../components/form/ChipSelector';
import { CheckboxGroup } from '../components/form/Checkbox';
import { PhotoUploadBox } from '../components/form/PhotoUploadBox';
import { Colors } from '../theme/colors';
import { useIncidents } from '../hooks/useIncidents';
import { usePhotoCapture } from '../hooks/usePhotoCapture';
import { useGPS } from '../hooks/useGPS';
import { PotentialConsequence, NearMissCause } from '../types';
import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

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

interface Station { id: number; station_name: string; }

export default function ReportNearMissScreen({ navigation }: any) {
  const { reportNearMiss, isLoading } = useIncidents();
  const { photoUris, attachments: photoAttachments, launch: launchPhoto, removePhoto } = usePhotoCapture();
  const { gpsLat, gpsLon, gpsStatus } = useGPS();

  const [description, setDescription] = useState('');
  const [consequence, setConsequence] = useState('');
  const [causes,      setCauses]      = useState<string[]>([]);
  const [suggestion,  setSuggestion]  = useState('');
  const [errors,      setErrors]      = useState<Record<string, string>>({});

  // New fields connected to backend
  const [controlFailure,     setControlFailure]     = useState<'Yes' | 'No'>('No');
  const [hazardStillPresent, setHazardStillPresent] = useState<'Yes' | 'No'>('No');

  // Location from API
  const [stations,             setStations]             = useState<Station[]>([]);
  const [location,             setLocation]             = useState('');
  const [locationId,           setLocationId]           = useState<number | undefined>();
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);

  useEffect(() => {
    apiClient.get(ENDPOINTS.WORKING_STATIONS.LIST)
      .then((res: any) => {
        const rows: Station[] = Array.isArray(res.data) ? res.data : (res.data?.items ?? []);
        setStations(rows);
        if (rows.length > 0 && !location) {
          setLocation(rows[0].station_name);
          setLocationId(rows[0].id);
        }
      })
      .catch(() => {
        const fallback = [{ id: 1, station_name: 'Warehouse – Sector B4' }];
        setStations(fallback);
        if (!location) { setLocation(fallback[0].station_name); setLocationId(fallback[0].id); }
      });
  }, []);

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
      location:                 location,
      location_station_id:      locationId,
      // Map causes array to underlying_cause string for backend NearMissReport schema
      underlying_cause:         causes.length > 0 ? causes.join(', ') : undefined,
      control_failure:          controlFailure,
      hazard_still_present:     hazardStillPresent,
      preventative_suggestion:  suggestion.trim() || undefined,
      photos: photoAttachments.length > 0 ? photoAttachments : undefined,
      gps_latitude:             gpsLat,
      gps_longitude:            gpsLon,
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

        {/* Did a safety control fail? */}
        <FormSection label="Did a safety control fail?">
          <View style={styles.toggleGroup}>
            <TouchableOpacity
              style={[styles.toggleOption, controlFailure === 'Yes' && styles.toggleOptionActive]}
              onPress={() => setControlFailure('Yes')}
            >
              <Text style={[styles.toggleText, controlFailure === 'Yes' && styles.toggleTextActive]}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleOption, controlFailure === 'No' && styles.toggleOptionActive]}
              onPress={() => setControlFailure('No')}
            >
              <Text style={[styles.toggleText, controlFailure === 'No' && styles.toggleTextActive]}>No</Text>
            </TouchableOpacity>
          </View>
        </FormSection>

        {/* Hazard still present? */}
        <FormSection label="Is the hazard still present?">
          <View style={styles.toggleGroup}>
            <TouchableOpacity
              style={[styles.toggleOption, hazardStillPresent === 'Yes' && styles.toggleOptionActive]}
              onPress={() => setHazardStillPresent('Yes')}
            >
              <Text style={[styles.toggleText, hazardStillPresent === 'Yes' && styles.toggleTextActive]}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleOption, hazardStillPresent === 'No' && styles.toggleOptionActive]}
              onPress={() => setHazardStillPresent('No')}
            >
              <Text style={[styles.toggleText, hazardStillPresent === 'No' && styles.toggleTextActive]}>No</Text>
            </TouchableOpacity>
          </View>
        </FormSection>

        {/* Location from API */}
        <FormSection label="Location">
          <TouchableOpacity style={styles.locationCard} onPress={() => setLocationPickerVisible(true)}>
            <Text style={styles.locationTitle}>{location || 'Select station...'}</Text>
            <Text style={styles.locationSub}>Tap to change</Text>
          </TouchableOpacity>
          <View style={styles.gpsRow}>
            <View style={[styles.gpsDot, {
              backgroundColor: gpsStatus === 'ok' ? '#16A34A' : gpsStatus === 'unavailable' ? '#EF4444' : '#F97316',
            }]} />
            <Text style={styles.gpsText}>
              {gpsStatus === 'ok'
                ? `GPS: ${Number(gpsLat).toFixed(5)}, ${Number(gpsLon).toFixed(5)}`
                : gpsStatus === 'unavailable'
                ? 'GPS unavailable'
                : 'Acquiring GPS…'}
            </Text>
          </View>
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

      {/* Location Picker Modal */}
      <Modal
        visible={locationPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLocationPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setLocationPickerVisible(false)}
        >
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>Select Location</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {stations.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.pickerItem, location === s.station_name && styles.pickerItemActive]}
                  onPress={() => {
                    setLocation(s.station_name);
                    setLocationId(s.id);
                    setLocationPickerVisible(false);
                  }}
                >
                  <Text style={[styles.pickerItemText, location === s.station_name && styles.pickerItemTextActive]}>
                    {s.station_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, padding: 16 },
  errorText: { fontSize: 12, color: Colors.critical, marginTop: 6 },
  toggleGroup: { flexDirection: 'row', gap: 12 },
  toggleOption: {
    flex: 1, height: 42, borderRadius: 10, borderWidth: 1.5,
    borderColor: '#CBD5E1', backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
  },
  toggleOptionActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  toggleText: { fontSize: 14, fontWeight: '700', color: '#334155' },
  toggleTextActive: { color: '#FFFFFF' },
  locationCard: {
    backgroundColor: '#F0F4FF', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#C7D2FE',
  },
  locationTitle: { fontSize: 14, fontWeight: '700', color: '#1E40AF' },
  locationSub: { fontSize: 11, color: '#6366F1', marginTop: 2 },
  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 18, alignItems: 'center', marginTop: 8, marginBottom: 16,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: Colors.white, fontWeight: '800', fontSize: 15, letterSpacing: 0.5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  pickerContainer: {
    backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 40,
  },
  pickerTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 16 },
  pickerItem: {
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  pickerItemActive: { backgroundColor: '#EFF6FF', borderRadius: 8, paddingHorizontal: 8 },
  pickerItemText: { fontSize: 14, color: '#334155', fontWeight: '600' },
  pickerItemTextActive: { color: '#2563EB', fontWeight: '700' },
  gpsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAFC', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
    marginTop: 8, borderWidth: 1, borderColor: '#E2E8F0',
  },
  gpsDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  gpsText: { fontSize: 11, color: '#475569', fontWeight: '600', flex: 1 },
});
