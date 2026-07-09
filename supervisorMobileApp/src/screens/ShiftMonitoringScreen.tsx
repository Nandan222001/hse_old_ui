import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenLayout, AppHeader, AlertCard, TeamMemberCard, ProgressBar, LoadingScreen } from '../components';
import { Colors } from '../theme/colors';
import { useTeam } from '../hooks/useTeam';

interface Props {
  navigation: any;
}

const MOCK_ALERT = {
  id: '1',
  type: 'Missed Check-In',
  message: 'Robert Chen failed to report from',
  zone: 'Zone B (Tank Farm).',
  time_ago: '12m ago',
  worker_name: 'Robert Chen',
};

export function ShiftMonitoringScreen({ navigation }: Props) {
  const { members, shiftStatus, loading, forceIn } = useTeam();

  if (loading) return <LoadingScreen />;

  const loggedIn = shiftStatus?.logged_in ?? 14;
  const total = shiftStatus?.total ?? 16;
  const progress = total > 0 ? (loggedIn / total) * 100 : 0;

  return (
    <ScreenLayout>
      <AppHeader title="Shift Monitoring" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Active Shift Status */}
        <View style={styles.shiftCard}>
          <View style={styles.shiftHeader}>
            <Text style={styles.shiftLabel}>ACTIVE SHIFT STATUS</Text>
            <View style={styles.liveBadge}>
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
          <Text style={styles.shiftCount}>{loggedIn}/{total} Workers</Text>
          <ProgressBar progress={progress} color={Colors.blue} height={8} />
          <View style={styles.statRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>LOGGED IN</Text>
              <Text style={styles.statValue}>{loggedIn}</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: Colors.criticalBg }]}>
              <Text style={[styles.statLabel, { color: Colors.critical }]}>PENDING</Text>
              <Text style={[styles.statValue, { color: Colors.critical }]}>
                {total - loggedIn < 10 ? `0${total - loggedIn}` : total - loggedIn}
              </Text>
            </View>
          </View>
        </View>

        {/* Priority Alerts */}
        <View style={styles.sectionRow}>
          <Ionicons name="warning-outline" size={18} color={Colors.warning} />
          <Text style={styles.sectionTitle}>Priority Alerts</Text>
        </View>
        <AlertCard alert={MOCK_ALERT} />

        {/* Active Team */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Active Team</Text>
          <TouchableOpacity>
            <Text style={styles.filter}>
              <Ionicons name="filter-outline" size={14} color={Colors.blue} /> Filter
            </Text>
          </TouchableOpacity>
        </View>

        {members.map(m => (
          <TeamMemberCard
            key={m.id}
            member={m}
            onForceIn={() => forceIn(m.id)}
          />
        ))}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16 },
  shiftCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    gap: 12,
  },
  shiftHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  shiftLabel: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.5 },
  liveBadge: { backgroundColor: Colors.primary, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  liveText: { color: Colors.white, fontSize: 10, fontWeight: '700' },
  shiftCount: { fontSize: 26, fontWeight: '800', color: Colors.textDark },
  statRow: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, backgroundColor: Colors.divider, borderRadius: 10, padding: 12 },
  statLabel: { fontSize: 10, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.5, marginBottom: 4 },
  statValue: { fontSize: 24, fontWeight: '800', color: Colors.textDark },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  sectionTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: Colors.textDark },
  filter: { fontSize: 13, color: Colors.blue, fontWeight: '600' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: Colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});
