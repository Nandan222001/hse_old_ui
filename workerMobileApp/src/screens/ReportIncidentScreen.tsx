import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { ScreenLayout } from '../components/layout/ScreenLayout';
import { AppHeader } from '../components/layout/AppHeader';
import { FormSection } from '../components/layout/FormSection';
import { Input } from '../components/form/Input';
import { TextArea } from '../components/form/TextArea';
import { ChipSelector } from '../components/form/ChipSelector';
import { PhotoUploadBox } from '../components/form/PhotoUploadBox';
import { SeveritySelector } from '../components/display/SeveritySelector';
import { Avatar } from '../components/display/Avatar';
import { Colors } from '../theme/colors';
import { useIncidents } from '../hooks/useIncidents';
import { usePhotoCapture } from '../hooks/usePhotoCapture';
import { IncidentType, SeverityLevel } from '../types';

const INCIDENT_TYPES = ['Injury', 'Spill', 'Fire', 'Equipment Damage', 'Near Miss'];

const CHIP_TO_INCIDENT_TYPE: Record<string, IncidentType> = {
  'Injury':           'injury',
  'Spill':            'spill',
  'Fire':             'fire',
  'Equipment Damage': 'equipment_damage',
  'Near Miss':        'near_miss',
};

export default function ReportIncidentScreen({ navigation }: any) {
  const { reportIncident, isLoading } = useIncidents();
  const { photoUris, attachments: photoAttachments, launch: launchPhoto, removePhoto } = usePhotoCapture();

  const [incidentType, setIncidentType] = useState('Injury');
  const [date,         setDate]         = useState(new Date().toLocaleDateString('en-GB'));
  const [time,         setTime]         = useState(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
  const [location,     setLocation]     = useState('');
  const [description,  setDescription]  = useState('');
  const [actions,      setActions]      = useState('');
  const [severity,     setSeverity]     = useState<SeverityLevel>('medium');
  const [errors,       setErrors]       = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!location.trim())    e.location    = 'Location is required';
    if (!description.trim()) e.description = 'Description is required';
    if (!actions.trim())     e.actions     = 'Immediate actions are required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const ok = await reportIncident({
      incident_type:     CHIP_TO_INCIDENT_TYPE[incidentType] ?? 'injury',
      date,
      time,
      location:          location.trim(),
      description:       description.trim(),
      immediate_actions: actions.trim(),
      severity,
      photos: photoAttachments.length > 0 ? photoAttachments : undefined,
    });

    if (ok) {
      Alert.alert('Report Submitted', 'Your incident report has been submitted confidentially.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } else {
      Alert.alert('Submission Failed', 'Could not submit report. Please try again.');
    }
  };

  return (
    <ScreenLayout>
      <AppHeader
        title="Safety Suite"
        onBack={() => navigation.goBack()}
        rightNode={<Avatar emoji="👷" size={36} bg={Colors.background} />}
      />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Report Incident</Text>
        <Text style={styles.pageSub}>Provide detailed information for the safety audit trail.</Text>

        <FormSection label="Incident Type">
          <ChipSelector
            options={INCIDENT_TYPES}
            value={incidentType}
            onChange={v => { setIncidentType(v); setErrors(e => ({ ...e, incidentType: '' })); }}
          />
        </FormSection>

        <View style={styles.twoCol}>
          <Input label="Date" value={date} onChangeText={setDate} containerStyle={styles.half} />
          <Input label="Time" value={time} onChangeText={setTime} containerStyle={styles.half} />
        </View>

        <FormSection label="Location">
          <Input
            placeholder="Specify location..."
            value={location}
            onChangeText={v => { setLocation(v); setErrors(e => ({ ...e, location: '' })); }}
            rightIcon="🎯"
            error={errors.location}
          />
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapText}>📍 Pin on Map</Text>
          </View>
        </FormSection>

        <FormSection label="Description of Incident">
          <TextArea
            placeholder="Describe what happened in detail..."
            value={description}
            onChangeText={v => { setDescription(v); setErrors(e => ({ ...e, description: '' })); }}
            minHeight={90}
            error={errors.description}
          />
        </FormSection>

        <FormSection label="Immediate Actions Taken">
          <Input
            placeholder="e.g. Area cordoned off, first aid..."
            value={actions}
            onChangeText={v => { setActions(v); setErrors(e => ({ ...e, actions: '' })); }}
            error={errors.actions}
          />
        </FormSection>

        <FormSection label="Severity Level">
          <SeveritySelector value={severity} onChange={v => setSeverity(v as SeverityLevel)} />
        </FormSection>

        <FormSection label="Upload Evidence">
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
            : <Text style={styles.submitText}>▶ Submit Report</Text>
          }
        </TouchableOpacity>
        <Text style={styles.confidential}>CONFIDENTIAL & SECURE SUBMISSION</Text>
        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, padding: 16 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: Colors.textDark, marginBottom: 4, marginTop: 8 },
  pageSub: { fontSize: 13, color: Colors.textMuted, marginBottom: 18 },

  twoCol: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },

  mapPlaceholder: {
    height: 110, backgroundColor: '#CFD8DC', borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  mapText: { fontSize: 15, fontWeight: '700', color: Colors.white },

  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginBottom: 8,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  confidential: { textAlign: 'center', fontSize: 11, color: Colors.textLight, letterSpacing: 0.5 },
});
