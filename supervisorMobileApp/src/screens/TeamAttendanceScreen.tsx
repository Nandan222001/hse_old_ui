import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenLayout, AppHeader, StatBox, TeamMemberCard, Avatar, LoadingScreen } from '../components';
import { Colors } from '../theme/colors';
import { useTeam } from '../hooks/useTeam';

interface Props {
  navigation: any;
}

export function TeamAttendanceScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { members, stats, loading, fetchAttendance, forceIn } = useTeam();

  useEffect(() => { fetchAttendance(); }, []);

  if (loading) return <LoadingScreen />;

  const totalWorkforce = stats?.total_workforce ?? 124;
  const present = stats?.present ?? 98;
  const offSite = stats?.off_site ?? 14;
  const pending = stats?.pending ?? 12;
  const activeZones = stats?.active_zones ?? 6;

  return (
    <ScreenLayout>
      <AppHeader title="Team Attendance" rightNode={
        <TouchableOpacity>
          <Ionicons name="people-circle-outline" size={26} color={Colors.textDark} />
        </TouchableOpacity>
      } />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Total Workforce */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Workforce</Text>
          <Text style={styles.totalValue}>{totalWorkforce}</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatBox
            label="Present"
            value={present}
            style={styles.statGreen}
            valueColor={Colors.success}
          />
          <StatBox
            label="Off-site"
            value={offSite}
            style={styles.statBlue}
            valueColor={Colors.blue}
          />
        </View>
        <View style={[styles.statsGrid, { marginTop: 8 }]}>
          <StatBox
            label="Pending"
            value={pending}
            style={styles.statOrange}
            valueColor={Colors.warning}
          />
          <StatBox
            label="Active Zones"
            value={activeZones}
            valueColor={Colors.textDark}
          />
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Find worker or role..."
            placeholderTextColor={Colors.textLight}
          />
          <TouchableOpacity>
            <Ionicons name="options-outline" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Live Site Map Placeholder */}
        <View style={styles.mapCard}>
          <View style={styles.mapPlaceholder}>
            <View style={styles.zonesTag}>
              <Text style={styles.zonesText}>{activeZones} ACTIVE ZONES</Text>
            </View>
            <Ionicons name="map-outline" size={40} color={Colors.textLight} />
            <Text style={styles.mapLabel}>Live Site Map</Text>
          </View>
        </View>

        {/* Staff on Duty */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Staff on Duty</Text>
          <TouchableOpacity>
            <Text style={styles.exportText}>Export List</Text>
          </TouchableOpacity>
        </View>

        {members.map(m => (
          <TeamMemberCard
            key={m.id}
            member={m}
            onForceIn={() => forceIn(m.id)}
            onContact={() => {}}
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
  totalCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
  },
  totalLabel: { fontSize: 13, color: Colors.textMuted, fontWeight: '600', marginBottom: 4 },
  totalValue: { fontSize: 36, fontWeight: '800', color: Colors.textDark },
  statsGrid: { flexDirection: 'row', gap: 8 },
  statGreen: {},
  statBlue: {},
  statOrange: {},
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    marginTop: 12,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textDark, paddingVertical: 10 },
  mapCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 1,
  },
  mapPlaceholder: {
    height: 160,
    backgroundColor: '#E8EEF6',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    position: 'relative',
  },
  zonesTag: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: Colors.blue,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  zonesText: { color: Colors.white, fontSize: 10, fontWeight: '700' },
  mapLabel: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textDark },
  exportText: { fontSize: 13, color: Colors.blue, fontWeight: '600' },
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
