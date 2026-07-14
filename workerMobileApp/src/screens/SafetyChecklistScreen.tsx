import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, TextInput, Image,
} from 'react-native';
import { ScreenLayout } from '../components/layout/ScreenLayout';
import { Avatar } from '../components/display/Avatar';
import { Colors } from '../theme/colors';

export default function SafetyChecklistScreen({ navigation }: any) {
  const [braking, setBraking] = useState<string | null>(null);
  const [tyres, setTyres] = useState<string | null>('fail');
  const [lights, setLights] = useState<string | null>('pass');
  const [extinguisher, setExtinguisher] = useState<string | null>(null);

  const [tyreRemarks, setTyreRemarks] = useState('Low tread on front-left tyre.');

  const handleSubmit = () => {
    Alert.alert('Checklist Submitted', 'Pre-shift inspection has been recorded.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <ScreenLayout bg="#F8FAFC">
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.headerIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SafeGuard HSE</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('Notifications')}>
            <Text style={styles.headerIcon}>🔔</Text>
          </TouchableOpacity>
          <Avatar name="Alex Safety" size={32} bg="#E2E8F0" style={{ marginLeft: 8 }} />
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Title Block */}
        <Text style={styles.pageTitle}>Vehicle Pre-Start Check</Text>
        <Text style={styles.pageSub}>Asset: #TRK-204 • Fleet Alpha • Site Main</Text>

        {/* Step Indicator */}
        <View style={styles.stepRow}>
          <View style={styles.stepItem}>
            <View style={[styles.stepDot, styles.stepDotCompleted]}>
              <Text style={styles.stepDotTextCompleted}>✓</Text>
            </View>
            <Text style={styles.stepLabel}>Operator Info</Text>
          </View>
          <View style={[styles.stepLine, styles.stepLineCompleted]} />
          <View style={styles.stepItem}>
            <View style={[styles.stepDot, styles.stepDotActive]}>
              <Text style={styles.stepDotText}>2</Text>
            </View>
            <Text style={[styles.stepLabel, styles.stepLabelActive]}>Safety Check</Text>
          </View>
        </View>

        {/* Checklist Card Container */}
        <View style={styles.checklistContainer}>
          {/* Item 1: Braking Systems */}
          <View style={styles.checkCard}>
            <Text style={styles.checkTitle}>Braking Systems</Text>
            <Text style={styles.checkDesc}>Test service and parking brakes for response and firmness.</Text>

            {/* Toggle Row */}
            <View style={styles.toggleRow}>
              {['Pass', 'Fail', 'N/A'].map(btn => (
                <TouchableOpacity
                  key={btn}
                  style={[styles.toggleBtn, braking === btn && styles.toggleBtnActive]}
                  onPress={() => setBraking(btn)}
                >
                  <Text style={[styles.toggleBtnText, braking === btn && styles.toggleBtnTextActive]}>
                    {btn}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Input & Camera */}
            <View style={styles.remarksRow}>
              <TextInput
                style={styles.remarksInput}
                placeholder="Add remarks..."
                placeholderTextColor="#94A3B8"
              />
              <TouchableOpacity style={styles.cameraBtn}>
                <Text style={styles.cameraIcon}>📷</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Item 2: Tyres & Wheels */}
          <View style={[styles.checkCard, tyres === 'fail' && styles.checkCardFailed]}>
            <Text style={styles.checkTitle}>Tyres & Wheels</Text>
            <Text style={styles.checkDesc}>Check tread depth, pressure, and nut security.</Text>

            {/* Toggle Row */}
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleBtn, tyres === 'pass' && styles.toggleBtnActiveSuccess]}
                onPress={() => setTyres('pass')}
              >
                <Text style={[styles.toggleBtnText, tyres === 'pass' && styles.toggleBtnTextActive]}>Pass</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, tyres === 'fail' && styles.toggleBtnActiveFail]}
                onPress={() => setTyres('fail')}
              >
                <Text style={[styles.toggleBtnText, tyres === 'fail' && styles.toggleBtnTextActive]}>Fail</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, tyres === 'N/A' && styles.toggleBtnActive]}
                onPress={() => setTyres('N/A')}
              >
                <Text style={[styles.toggleBtnText, tyres === 'N/A' && styles.toggleBtnTextActive]}>N/A</Text>
              </TouchableOpacity>
            </View>

            {/* Input & Camera & Tyre Image Preview */}
            <View style={styles.remarksRow}>
              <TextInput
                style={[styles.remarksInput, tyres === 'fail' && styles.remarksInputFailed]}
                placeholder="Add remarks..."
                placeholderTextColor="#94A3B8"
                value={tyreRemarks}
                onChangeText={setTyreRemarks}
              />
              <View style={styles.imagePreviewContainer}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?q=80&w=150' }}
                  style={styles.tyreThumbnail}
                />
                <TouchableOpacity style={styles.deleteBadge}>
                  <Text style={styles.deleteBadgeText}>×</Text>
                </TouchableOpacity>
              </View>
            </View>
            {tyres === 'fail' && (
              <Text style={styles.actionRequiredText}>ACTION REQUIRED: IMMEDIATE MAINTENANCE</Text>
            )}
          </View>

          {/* Item 3: Lights & Indicators */}
          <View style={styles.checkCard}>
            <Text style={styles.checkTitle}>Lights & Indicators</Text>
            <Text style={styles.checkDesc}>Check headlights, taillights, beacons, and reverse alarm.</Text>

            {/* Toggle Row */}
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleBtn, lights === 'pass' && styles.toggleBtnActiveSuccess]}
                onPress={() => setLights('pass')}
              >
                <Text style={[styles.toggleBtnText, lights === 'pass' && styles.toggleBtnTextActive]}>Pass</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, lights === 'fail' && styles.toggleBtnActiveFail]}
                onPress={() => setLights('fail')}
              >
                <Text style={[styles.toggleBtnText, lights === 'fail' && styles.toggleBtnTextActive]}>Fail</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, lights === 'N/A' && styles.toggleBtnActive]}
                onPress={() => setLights('N/A')}
              >
                <Text style={[styles.toggleBtnText, lights === 'N/A' && styles.toggleBtnTextActive]}>N/A</Text>
              </TouchableOpacity>
            </View>

            {/* Input & Camera */}
            <View style={styles.remarksRow}>
              <TextInput
                style={styles.remarksInput}
                placeholder="Add remarks..."
                placeholderTextColor="#94A3B8"
              />
              <TouchableOpacity style={styles.cameraBtn}>
                <Text style={styles.cameraIcon}>📷</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Item 4: Fire Extinguisher */}
          <View style={styles.checkCard}>
            <Text style={styles.checkTitle}>Fire Extinguisher</Text>
            <Text style={styles.checkDesc}>Presence check, pressure gauge in green, tag is valid.</Text>

            {/* Toggle Row */}
            <View style={styles.toggleRow}>
              {['Pass', 'Fail', 'N/A'].map(btn => (
                <TouchableOpacity
                  key={btn}
                  style={[styles.toggleBtn, extinguisher === btn && styles.toggleBtnActive]}
                  onPress={() => setExtinguisher(btn)}
                >
                  <Text style={[styles.toggleBtnText, extinguisher === btn && styles.toggleBtnTextActive]}>
                    {btn}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Input & Camera */}
            <View style={styles.remarksRow}>
              <TextInput
                style={styles.remarksInput}
                placeholder="Add remarks..."
                placeholderTextColor="#94A3B8"
              />
              <TouchableOpacity style={styles.cameraBtn}>
                <Text style={styles.cameraIcon}>📷</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Save Draft */}
        <TouchableOpacity style={styles.saveDraftLink}>
          <Text style={styles.saveDraftText}>Save Draft</Text>
        </TouchableOpacity>

        {/* Footer Navigation Buttons */}
        <View style={styles.bottomButtonsRow}>
          <TouchableOpacity style={styles.prevBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.prevBtnText}>Previous Step</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextBtn} onPress={handleSubmit}>
            <Text style={styles.nextBtnText}>Next: Fluid Levels</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Floating AI Safety Assistant Action Button */}
      <TouchableOpacity
        style={styles.aiFab}
        onPress={() => navigation.navigate('AISafetyAssistant')}
      >
        <Text style={styles.aiFabIcon}>🤖</Text>
      </TouchableOpacity>
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
    padding: 16,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  pageSub: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 20,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: '#2563EB',
  },
  stepDotCompleted: {
    backgroundColor: '#22C55E',
  },
  stepDotText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepDotTextCompleted: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  stepLabelActive: {
    color: '#2563EB',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 12,
  },
  stepLineCompleted: {
    backgroundColor: '#22C55E',
  },
  checklistContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 20,
  },
  checkCard: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  checkCardFailed: {
    backgroundColor: '#FFF5F5',
  },
  checkTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  checkDesc: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
    lineHeight: 16,
    fontWeight: '500',
  },
  toggleRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 14,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  toggleBtnActive: {
    backgroundColor: '#94A3B8',
  },
  toggleBtnActiveSuccess: {
    backgroundColor: '#22C55E',
  },
  toggleBtnActiveFail: {
    backgroundColor: '#EF4444',
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  toggleBtnTextActive: {
    color: '#FFFFFF',
  },
  remarksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 10,
  },
  remarksInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  remarksInputFailed: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
  },
  cameraBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    fontSize: 18,
  },
  imagePreviewContainer: {
    position: 'relative',
  },
  tyreThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  deleteBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionRequiredText: {
    fontSize: 10,
    color: '#EF4444',
    fontWeight: '800',
    marginTop: 8,
  },
  saveDraftLink: {
    alignSelf: 'center',
    marginVertical: 16,
  },
  saveDraftText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  bottomButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  prevBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prevBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8B5CF6',
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
  aiFab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  aiFabIcon: {
    fontSize: 22,
    color: '#FFFFFF',
  },
});
