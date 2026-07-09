import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { ScreenLayout } from '../components/layout/ScreenLayout';
import { AppHeader } from '../components/layout/AppHeader';
import { FormSection } from '../components/layout/FormSection';
import { Card } from '../components/cards/Card';
import { TextArea } from '../components/form/TextArea';
import { ProgressBar } from '../components/display/ProgressBar';
import { PassFailRow } from '../components/display/PassFailRow';
import { Avatar } from '../components/display/Avatar';
import { Colors } from '../theme/colors';

type CheckResult = 'pass' | 'fail' | null;

const ITEMS = [
  { id: '1', icon: '⚙️', title: 'Tires & Wheels',    desc: 'Check for cuts, gouges, and proper inflation pressure.' },
  { id: '2', icon: '🔧', title: 'Hydraulic Leaks',   desc: 'Verify no visible leaks under the chassis or near cylinders.' },
  { id: '3', icon: '📢', title: 'Horn & Alarm',       desc: 'Test if the horn and reverse alarm are audible in noisy environments.' },
  { id: '4', icon: '🪢', title: 'Seat Belt',          desc: 'Inspect seat belt for damage and ensure latch functions correctly.' },
  { id: '5', icon: '💡', title: 'Lights & Signals',   desc: 'Check all lights, indicators, and warning beacons.' },
];

export default function SafetyChecklistScreen({ navigation }: any) {
  const [results,  setResults]  = useState<Record<string, CheckResult>>({});
  const [comments, setComments] = useState('');

  const setResult = (id: string, v: CheckResult) =>
    setResults(prev => ({ ...prev, [id]: prev[id] === v ? null : v }));

  const completed = Object.values(results).filter(Boolean).length;
  const progress  = Math.round((completed / ITEMS.length) * 100);

  const handleSubmit = () => {
    Alert.alert('Checklist Submitted', 'Pre-shift inspection has been recorded.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <ScreenLayout>
      <AppHeader
        title="SafetyCore HSE"
        leftIcon="☰"
        onLeftPress={() => navigation.goBack()}
        rightNode={<Avatar emoji="👷" size={36} bg={Colors.background} />}
      />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.breadcrumb}>← INSPECTIONS / DAILY</Text>
        <Text style={styles.pageTitle}>Safety Checklist</Text>
        <Text style={styles.pageSub}>Pre-Shift Equipment Inspection – Forklift 04</Text>

        <Card style={styles.progressCard} elevation={1}>
          <ProgressBar
            progress={progress}
            label="COMPLETION PROGRESS"
            showPct
            height={10}
          />
          <Text style={styles.progressSub}>{completed} of {ITEMS.length} mandatory items completed</Text>
        </Card>

        <FormSection label="Critical Checks">
          {ITEMS.map((item) => {
            const r = results[item.id] ?? null;
            return (
              <Card key={item.id} style={[styles.itemCard, r === 'fail' && styles.itemFailed]} elevation={1}>
                <View style={styles.itemHeader}>
                  <View style={[styles.iconBox, r === 'fail' && styles.iconBoxFailed]}>
                    <Text style={styles.itemIcon}>{item.icon}</Text>
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemDesc}>{item.desc}</Text>
                  </View>
                </View>
                <PassFailRow value={r} onChange={(v) => setResult(item.id, v)} />
              </Card>
            );
          })}
        </FormSection>

        <FormSection label="Observations & Comments">
          <TextArea
            placeholder="Add details about equipment condition or any minor defects found..."
            value={comments}
            onChangeText={setComments}
            minHeight={90}
          />
        </FormSection>

        <TouchableOpacity style={styles.photoLink}>
          <Text style={styles.photoLinkText}>📷+  ADD PHOTO EVIDENCE</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.draftBtn}>
          <Text style={styles.draftText}>SAVE DRAFT</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitText}>▶ SUBMIT CHECKLIST</Text>
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, padding: 16 },
  breadcrumb: { fontSize: 11, color: Colors.blue, fontWeight: '600', marginBottom: 6 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: Colors.textDark, marginBottom: 4 },
  pageSub: { fontSize: 13, color: Colors.textMuted, marginBottom: 18 },

  progressCard: { marginBottom: 20 },
  progressSub: { fontSize: 12, color: Colors.textMuted, marginTop: 8 },

  itemCard: { marginBottom: 12 },
  itemFailed: { borderColor: Colors.critical, borderWidth: 1.5 },
  itemHeader: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  iconBox: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#EFF2F8', alignItems: 'center', justifyContent: 'center' },
  iconBoxFailed: { backgroundColor: Colors.criticalBg },
  itemIcon: { fontSize: 22 },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: 15, fontWeight: '700', color: Colors.textDark, marginBottom: 4 },
  itemDesc: { fontSize: 13, color: Colors.textMuted, lineHeight: 18 },

  photoLink: { marginBottom: 24 },
  photoLinkText: { fontSize: 13, fontWeight: '700', color: Colors.blue, letterSpacing: 0.5 },

  footer: {
    flexDirection: 'row', gap: 12, padding: 16, paddingBottom: 24,
    backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  draftBtn: {
    flex: 1, borderWidth: 2, borderColor: Colors.border, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  draftText: { fontWeight: '700', color: Colors.textMid, fontSize: 13, letterSpacing: 0.5 },
  submitBtn: { flex: 2, backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  submitText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
});
