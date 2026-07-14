import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, TextInput, ActivityIndicator, Modal,
} from 'react-native';
import { ScreenLayout } from '../components/layout/ScreenLayout';
import { Colors } from '../theme/colors';
import { useIncidents } from '../hooks/useIncidents';

export default function ReportIncidentScreen({ navigation }: any) {
  const { reportIncident, isLoading: isSubmitting } = useIncidents();
  const [incidentType, setIncidentType] = useState('Injury');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [location, setLocation] = useState('Heavy Assembly Station 1');
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<number>(3);
  const [reason, setReason] = useState('');
  const [anyoneInjured, setAnyoneInjured] = useState<'Yes' | 'No'>('No');
  const [injuredPersonName, setInjuredPersonName] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

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
    
    const severityMap: Record<number, string> = {
      1: 'low',
      2: 'medium',
      3: 'medium',
      4: 'high',
      5: 'critical',
    };

    const ok = await reportIncident({
      incident_type: incidentType.toLowerCase() as any,
      severity: (severityMap[severity] || 'medium') as any,
      description: description.trim(),
      reason: reason.trim(),
      anyone_injured: anyoneInjured,
      injured_person_name: anyoneInjured === 'Yes' ? injuredPersonName.trim() : '',
      mockPhotos: photos,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0].substring(0, 5),
      location: location,
      immediate_actions: 'Area secured',
    } as any);

    if (ok) {
      Alert.alert(
        'Success',
        'Incident report submitted successfully to the safety team.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
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
          <Text style={styles.headerIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SafeGuard HSE</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('Notifications')}>
          <Text style={styles.headerIcon}>🔔</Text>
        </TouchableOpacity>
      </View>

      {/* Step Indicator */}
      <View style={styles.stepIndicatorRow}>
        <View style={styles.segmentsContainer}>
          <View style={[styles.segment, styles.segmentActive]} />
          <View style={styles.segment} />
          <View style={styles.segment} />
        </View>
        <Text style={styles.stepText}>Step 1/3</Text>
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

        {/* Location Dropdown */}
        <Text style={styles.inputLabel}>Location / Station</Text>
        <TouchableOpacity style={styles.dropdown} onPress={() => setLocationPickerVisible(true)}>
          <Text style={styles.dropdownValue}>{location}</Text>
          <Text style={styles.chevronIcon}>▼</Text>
        </TouchableOpacity>

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

        {/* Severity Level */}
        <Text style={styles.inputLabel}>Severity Level</Text>
        <View style={styles.severityRow}>
          {[1, 2, 3, 4, 5].map((level) => (
            <TouchableOpacity
              key={level}
              style={[styles.severityBtn, severity === level && styles.severityBtnActive]}
              onPress={() => setSeverity(level)}
            >
              <Text style={[styles.severityBtnText, severity === level && styles.severityBtnTextActive]}>
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.severityLimitsRow}>
          <Text style={styles.limitText}>LOW</Text>
          <Text style={styles.limitText}>CRITICAL</Text>
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

        {/* Was anyone injured toggle */}
        <Text style={styles.inputLabel}>Was anyone injured?</Text>
        <View style={styles.toggleGroup}>
          <TouchableOpacity
            style={[styles.toggleOption, anyoneInjured === 'Yes' && styles.toggleOptionActive]}
            onPress={() => setAnyoneInjured('Yes')}
          >
            <Text style={[styles.toggleOptionText, anyoneInjured === 'Yes' && styles.toggleOptionTextActive]}>Yes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleOption, anyoneInjured === 'No' && styles.toggleOptionActive]}
            onPress={() => setAnyoneInjured('No')}
          >
            <Text style={[styles.toggleOptionText, anyoneInjured === 'No' && styles.toggleOptionTextActive]}>No</Text>
          </TouchableOpacity>
        </View>

        {/* Injured Person Name */}
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
          </View>
        )}

        {/* Photos Upload Section */}
        <Text style={styles.inputLabel}>Photos / Evidence</Text>
        <View style={styles.photoContainer}>
          <TouchableOpacity style={styles.photoAddBtn} onPress={handleAddPhoto}>
            <Text style={styles.photoAddText}>📸 Add Evidence Photo</Text>
          </TouchableOpacity>
          
          <View style={styles.photoWrapper}>
            {photos.map((item, idx) => (
              <View key={idx} style={styles.photoTag}>
                <Text style={styles.photoLabel}>🖼️ {item}</Text>
                <TouchableOpacity onPress={() => handleRemovePhoto(idx)}>
                  <Text style={styles.photoRemoveBtn}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.draftBtn}>
          <Text style={styles.draftBtnText}>💾 Draft</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext} disabled={isSubmitting}>
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.nextBtnText}>Next  ➔</Text>
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
                <Text style={styles.pickerCloseBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {['Injury', 'Spill', 'Fire', 'Equipment Damage', 'Near Miss'].map((type) => (
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
                  <Text style={styles.checkmarkIcon}>✓</Text>
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
                <Text style={styles.pickerCloseBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {['Heavy Assembly Station 1', 'Welding Station 1', 'Testing Station 1', 'Quality Inspection Station 1', 'Maintenance Station 1'].map((loc) => (
              <TouchableOpacity
                key={loc}
                style={[styles.pickerItem, location === loc && styles.pickerItemActive]}
                onPress={() => {
                  setLocation(loc);
                  setLocationPickerVisible(false);
                }}
              >
                <Text style={[styles.pickerItemText, location === loc && styles.pickerItemTextActive]}>
                  {loc}
                </Text>
                {location === loc && (
                  <Text style={styles.checkmarkIcon}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
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
    gap: 8,
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
