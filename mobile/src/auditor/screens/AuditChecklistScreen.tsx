import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auditService } from '../services/auditService';

interface ChecklistItem {
  id: number;
  title: string;
  question: string;
  response: 'pass' | 'fail' | 'na' | null;
  remarks: string;
  photoAttached: boolean;
}

const INITIAL_ITEMS: ChecklistItem[] = [
  {
    id: 1,
    title: 'Foundational Cracks Check',
    question: 'Inspect all visible load-bearing concrete for cracks wider than 2mm or signs of spalling.',
    response: 'pass',
    remarks: '',
    photoAttached: false,
  },
  {
    id: 2,
    title: 'Stairwell Handrail Stability',
    question: 'Manual tension test of all emergency stairwell handrails. Must withstand 200lb lateral force.',
    response: 'fail',
    remarks: '',
    photoAttached: true,
  },
  {
    id: 3,
    title: 'Roof Drainage Clearance',
    question: 'Ensure roof drains and scuppers are free of debris and standing water.',
    response: 'na',
    remarks: '',
    photoAttached: false,
  },
];

export function AuditChecklistScreen({ route, navigation }: any) {
  const { audit } = route.params || {};
  const [items, setItems] = useState<ChecklistItem[]>(INITIAL_ITEMS);

  // Load findings from the API when the audit has a real id
  useEffect(() => {
    if (!audit?.id) return;
    auditService.get(Number(audit.id))
      .then((a) => {
        if (a.findings && a.findings.length > 0) {
          const mapped: ChecklistItem[] = a.findings.map((f, idx) => ({
            id: f.id ?? idx + 1,
            title: f.title ?? `Item ${idx + 1}`,
            question: f.question ?? '',
            response: (f.response as ChecklistItem['response']) ?? null,
            remarks: f.remarks ?? '',
            photoAttached: f.photo_attached ?? false,
          }));
          setItems(mapped);
        }
      })
      .catch(() => { /* keep static INITIAL_ITEMS on error */ });
  }, [audit?.id]);

  const handleResponse = (itemId: number, val: 'pass' | 'fail' | 'na') => {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, response: val } : i))
    );
  };

  const handleRemarks = (itemId: number, text: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, remarks: text } : i))
    );
  };

  const togglePhoto = (itemId: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId ? { ...i, photoAttached: !i.photoAttached } : i
      )
    );
  };

  const handleSave = () => {
    Alert.alert('Save Draft', 'Audit draft saved successfully.', [{ text: 'OK' }]);
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    Alert.alert(
      'Submit Audit',
      'Are you sure you want to submit this audit compliance report?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            if (!audit?.id) {
              Alert.alert('Error', 'This audit has no id — reopen it from Assigned Audits.');
              return;
            }
            setSubmitting(true);
            try {
              const res = await auditService.submit(
                Number(audit.id),
                items.map((i) => ({
                  id: i.id,
                  title: i.title,
                  question: i.question,
                  response: i.response,
                  remarks: i.remarks,
                  photo_attached: i.photoAttached,
                })),
              );
              Alert.alert(
                'Success',
                `Audit submitted. Compliance score: ${res.compliance_score ?? '—'}%`,
                [{ text: 'OK', onPress: () => navigation.navigate('AssignedAudits') }],
              );
            } catch (e: any) {
              Alert.alert('Submit failed', e?.response?.data?.detail ?? 'Could not reach the server.');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>HSE Audit Pro</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.bellBtn}>
            <Ionicons name="notifications-outline" size={22} color="#0F172A" />
          </TouchableOpacity>
          <View style={[styles.avatar, { backgroundColor: '#DBEAFE' }]}>
            <Text style={[styles.avatarText, { color: '#2563EB' }]}>JD</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Main Audit Info Card */}
        <View style={styles.topInfoCard}>
          <View style={styles.topInfoRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.auditTitle}>Weekly Facility Safety Audit</Text>
              <Text style={styles.auditSubtitle}>Site ID: #442-T4 | Inspector: John Doe</Text>
            </View>
            <View style={styles.percentBox}>
              <Text style={styles.percentText}>68%</Text>
              <Text style={styles.percentSubText}>Complete</Text>
              <Text style={styles.percentTasks}>17 of 25 tasks completed</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '68%' }]} />
          </View>
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
            <Ionicons name="compass" size={18} color="#FFFFFF" />
          </View>
          <Text style={styles.sectionTitle}>Structural Integrity</Text>
        </View>

        {/* Checklist Cards */}
        {items.map((item) => {
          return (
            <View key={item.id} style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardQuestion}>{item.question}</Text>

              {/* Remarks Box */}
              <Text style={styles.inputLabel}>Observations & Remarks</Text>
              <TextInput
                style={styles.remarksInput}
                placeholder="Enter detailed notes here..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                value={item.remarks}
                onChangeText={(text) => handleRemarks(item.id, text)}
              />

              {/* Assessment Selector */}
              <Text style={styles.inputLabel}>Assessment Result</Text>
              <View style={styles.resultTabRow}>
                {/* PASS Button */}
                <TouchableOpacity
                  style={[
                    styles.resultTab,
                    styles.passTab,
                    item.response === 'pass' && styles.passTabActive,
                  ]}
                  onPress={() => handleResponse(item.id, 'pass')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.resultTabText, item.response === 'pass' && styles.passTabTextActive]}>
                    PASS
                  </Text>
                </TouchableOpacity>

                {/* FAIL Button */}
                <TouchableOpacity
                  style={[
                    styles.resultTab,
                    styles.failTab,
                    item.response === 'fail' && styles.failTabActive,
                  ]}
                  onPress={() => handleResponse(item.id, 'fail')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.resultTabText, item.response === 'fail' && styles.failTabTextActive]}>
                    FAIL
                  </Text>
                </TouchableOpacity>

                {/* N/A Button */}
                <TouchableOpacity
                  style={[
                    styles.resultTab,
                    styles.naTab,
                    item.response === 'na' && styles.naTabActive,
                  ]}
                  onPress={() => handleResponse(item.id, 'na')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.resultTabText, item.response === 'na' && styles.naTabTextActive]}>
                    N/A
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Image Evidence Block */}
              {item.response === 'fail' && item.photoAttached ? (
                <View style={styles.photoContainer}>
                  <View style={styles.photoBox}>
                    <Image
                      source={{ uri: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=200' }}
                      style={styles.photoThumb}
                    />
                    <TouchableOpacity style={styles.deletePhotoBadge} onPress={() => togglePhoto(item.id)}>
                      <Ionicons name="close" size={10} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={styles.addPhotoDashed} onPress={() => togglePhoto(item.id)}>
                    <Ionicons name="camera-outline" size={18} color="#64748B" />
                    <Text style={styles.addPhotoText}>Add Photo</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.uploadDashed}
                  onPress={() => togglePhoto(item.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="cloud-upload-outline" size={18} color="#2563EB" />
                  <Text style={styles.uploadText}>Upload Evidence</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {/* Action Buttons */}
        <View style={styles.footerActionRow}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={styles.submitBtnText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    height: 60,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1.5,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    padding: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  bellBtn: {
    padding: 2,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontWeight: '800',
    fontSize: 12,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  topInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  topInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  auditTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  auditSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 4,
  },
  percentBox: {
    alignItems: 'flex-end',
  },
  percentText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#2563EB',
  },
  percentSubText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
    marginTop: -2,
  },
  percentTasks: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 4,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    marginTop: 8,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 18,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  cardQuestion: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  remarksInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
    minHeight: 60,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  resultTabRow: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  resultTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  resultTabText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  passTab: {},
  passTabActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
  },
  passTabTextActive: {
    color: '#2563EB',
  },
  failTab: {},
  failTabActive: {
    backgroundColor: '#EF4444',
  },
  failTabTextActive: {
    color: '#FFFFFF',
  },
  naTab: {},
  naTabActive: {
    backgroundColor: '#64748B',
  },
  naTabTextActive: {
    color: '#FFFFFF',
  },
  uploadDashed: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
  },
  uploadText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '700',
  },
  photoContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  photoBox: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
  },
  deletePhotoBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#EF4444',
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoDashed: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 10,
  },
  addPhotoText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  footerActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    marginBottom: 40,
  },
  saveBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  saveBtnText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '800',
  },
  submitBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
