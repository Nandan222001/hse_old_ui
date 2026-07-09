import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenLayout, Card } from '../components';
import { Colors } from '../theme/colors';

interface Props { navigation: any; }

const SAFETY_STATS = [
  { label: 'Open\nIncidents', value: '3', color: Colors.critical, bg: Colors.criticalBg },
  { label: 'Near\nMiss', value: '2', color: Colors.warning, bg: Colors.warningBg },
  { label: 'Observations', value: '8', color: Colors.blue, bg: '#E3F2FD' },
  { label: 'Open\nCAPAs', value: '5', color: '#5E35B1', bg: '#EDE7F6' },
];

const MODULES = [
  { id: 'incidents', icon: '🚨', label: 'Incidents', count: '3 Open', color: Colors.critical, bg: Colors.criticalBg },
  { id: 'nearmiss', icon: '⚠️', label: 'Near Miss', count: '2 Open', color: Colors.warning, bg: Colors.warningBg },
  { id: 'observations', icon: '👁️', label: 'Observations', count: '8 Open', color: Colors.blue, bg: '#E3F2FD' },
  { id: 'inspections', icon: '🔍', label: 'Inspections', count: '2 Pending', color: '#5E35B1', bg: '#EDE7F6' },
  { id: 'capa', icon: '✅', label: 'CAPA', count: '5 Open', color: Colors.success, bg: Colors.successBg },
  { id: 'risk', icon: '📊', label: 'Risk Register', count: '12 Hazards', color: '#F57C00', bg: '#FFF3E0' },
];

const RECENT = [
  {
    id: '1', icon: '🚨', title: 'Chemical Spill — Zone B', sub: 'Reported by Worker W042',
    time: '2 hrs ago', status: 'OPEN', statusColor: Colors.critical, bg: Colors.criticalBg,
  },
  {
    id: '2', icon: '⚠️', title: 'Near Miss — Forklift Path', sub: 'Zone C, Loading Bay',
    time: '4 hrs ago', status: 'REVIEW', statusColor: Colors.warning, bg: Colors.warningBg,
  },
  {
    id: '3', icon: '👁️', title: 'Unsafe Act Observed', sub: 'No PPE — Maintenance crew, Zone A',
    time: '6 hrs ago', status: 'ACTION', statusColor: Colors.blue, bg: '#E3F2FD',
  },
  {
    id: '4', icon: '✅', title: 'CAPA Closed — TBT-002', sub: 'Corrective action verified and closed',
    time: '1 day ago', status: 'CLOSED', statusColor: Colors.success, bg: Colors.successBg,
  },
];

export function IncidentsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  const handleModule = (moduleId: string) => {
    Alert.alert('Coming Soon', `${moduleId} module will be available in the next update.`);
  };

  return (
    <ScreenLayout>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={styles.headerTitle}>Safety & Incidents</Text>
          <Text style={styles.headerSub}>Monitor and manage all safety events</Text>
        </View>
        <TouchableOpacity style={styles.alertBtn} onPress={() => Alert.alert('Notifications', 'Safety alerts coming soon')}>
          <Text style={{ fontSize: 22 }}>🔔</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Stats Row */}
        <View style={styles.statsRow}>
          {SAFETY_STATS.map(s => (
            <View key={s.label} style={[styles.statBox, { borderTopColor: s.color, backgroundColor: s.bg }]}>
              <Text style={[styles.statNum, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Safety Modules */}
        <Text style={styles.sectionTitle}>Safety Modules</Text>
        <View style={styles.modulesGrid}>
          {MODULES.map(m => (
            <TouchableOpacity
              key={m.id}
              style={[styles.moduleCard, { backgroundColor: m.bg }]}
              onPress={() => handleModule(m.label)}
              activeOpacity={0.82}
            >
              <Text style={styles.moduleIcon}>{m.icon}</Text>
              <Text style={[styles.moduleLabel, { color: m.color }]}>{m.label}</Text>
              <Text style={styles.moduleCount}>{m.count}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Activity */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {RECENT.map(item => (
          <Card key={item.id} style={styles.activityCard}>
            <View style={styles.activityRow}>
              <View style={[styles.activityIcon, { backgroundColor: item.bg }]}>
                <Text style={{ fontSize: 20 }}>{item.icon}</Text>
              </View>
              <View style={styles.activityInfo}>
                <View style={styles.activityTitleRow}>
                  <Text style={styles.activityTitle} numberOfLines={1}>{item.title}</Text>
                  <View style={[styles.statusPill, { backgroundColor: item.bg }]}>
                    <Text style={[styles.statusText, { color: item.statusColor }]}>{item.status}</Text>
                  </View>
                </View>
                <Text style={styles.activitySub}>{item.sub}</Text>
                <Text style={styles.activityTime}>{item.time}</Text>
              </View>
            </View>
          </Card>
        ))}

        <View style={{ height: 24 }} />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.critical,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.white },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.72)', marginTop: 2 },
  alertBtn: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 22,
    padding: 8,
  },
  scroll: { padding: 16 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statBox: {
    flex: 1,
    borderRadius: 12,
    padding: 10,
    borderTopWidth: 3,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  statNum: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 10, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textDark, marginBottom: 12 },
  modulesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  moduleCard: {
    width: '30.5%',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  moduleIcon: { fontSize: 28 },
  moduleLabel: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  moduleCount: { fontSize: 10, color: Colors.textMuted },
  activityCard: { marginBottom: 10, padding: 12 },
  activityRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  activityIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  activityInfo: { flex: 1 },
  activityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  activityTitle: { fontSize: 13, fontWeight: '600', color: Colors.textDark, flex: 1, marginRight: 8 },
  activitySub: { fontSize: 12, color: Colors.textMuted },
  activityTime: { fontSize: 11, color: Colors.textLight, marginTop: 4 },
  statusPill: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  statusText: { fontSize: 10, fontWeight: '700' },
});
