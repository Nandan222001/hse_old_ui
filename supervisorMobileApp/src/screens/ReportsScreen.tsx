import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenLayout, AppHeader, Card, Badge } from '../components';
import { Colors } from '../theme/colors';

interface Props {
  navigation: any;
}

const REPORT_TYPES = [
  { id: '1', title: 'Safety Walk Reports', icon: 'walk-outline' as const, count: 8, color: Colors.blue },
  { id: '2', title: 'Incident Reports', icon: 'warning-outline' as const, count: 3, color: Colors.critical },
  { id: '3', title: 'Permit History', icon: 'document-text-outline' as const, count: 24, color: Colors.success },
  { id: '4', title: 'Toolbox Talk Logs', icon: 'mic-outline' as const, count: 12, color: Colors.warning },
  { id: '5', title: 'CAPA Actions', icon: 'checkmark-done-outline' as const, count: 5, color: '#7B1FA2' },
];

export function ReportsScreen({ navigation }: Props) {
  return (
    <ScreenLayout>
      <AppHeader title="Reports" showBell />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>This week's report summary</Text>

        {REPORT_TYPES.map(rt => (
          <TouchableOpacity key={rt.id} style={styles.reportCard}>
            <View style={[styles.iconBox, { backgroundColor: rt.color + '20' }]}>
              <Ionicons name={rt.icon} size={22} color={rt.color} />
            </View>
            <View style={styles.reportInfo}>
              <Text style={styles.reportTitle}>{rt.title}</Text>
              <Text style={styles.reportCount}>{rt.count} records</Text>
            </View>
            <View style={styles.right}>
              <Badge label={String(rt.count)} variant="info" />
              <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
            </View>
          </TouchableOpacity>
        ))}

        {/* Export Section */}
        <View style={styles.exportCard}>
          <Ionicons name="download-outline" size={24} color={Colors.blue} />
          <View style={styles.exportInfo}>
            <Text style={styles.exportTitle}>Export Reports</Text>
            <Text style={styles.exportSub}>Download full compliance report as PDF</Text>
          </View>
          <TouchableOpacity style={styles.exportBtn}>
            <Text style={styles.exportBtnText}>Export</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16 },
  subtitle: { fontSize: 13, color: Colors.textMuted, marginBottom: 16 },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  reportInfo: { flex: 1 },
  reportTitle: { fontSize: 14, fontWeight: '600', color: Colors.textDark },
  reportCount: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  exportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    padding: 16,
    gap: 12,
    marginTop: 8,
  },
  exportInfo: { flex: 1 },
  exportTitle: { fontSize: 15, fontWeight: '700', color: Colors.textDark },
  exportSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  exportBtn: {
    backgroundColor: Colors.blue,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  exportBtnText: { color: Colors.white, fontWeight: '600', fontSize: 13 },
});
