import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenLayout, Card } from '../components';
import { Colors } from '../theme/colors';
import { teamService } from '../services/teamService';
import type { ShiftStatus } from '../types/team.types';

interface Props { navigation: any; }

const TILES = [
  { label: 'Team\nAttendance', icon: '👥', screen: 'TeamAttendance', bg: '#E3F2FD', color: Colors.blue },
  { label: 'Shift\nMonitoring', icon: '🕐', screen: 'ShiftMonitoring', bg: '#E8F5E9', color: Colors.success },
  { label: 'Toolbox\nTalk', icon: '🎤', screen: 'ToolboxTalk', bg: '#FFF3E0', color: Colors.warning },
  { label: 'Safety\nCompliance', icon: '✅', screen: 'SafetyCompliance', bg: '#EDE7F6', color: '#5E35B1' },
];

const FOCUS_ITEMS = [
  { id: '1', icon: '🎤', title: 'Morning Toolbox Talk', sub: 'Conduct safety briefing at 08:00 AM', priority: 'HIGH', color: Colors.critical },
  { id: '2', icon: '📋', title: 'Permit Review Queue', sub: '3 permits pending supervisor review', priority: 'MED', color: Colors.warning },
  { id: '3', icon: '👥', title: 'Team Check-in Verification', sub: 'Confirm all workers are logged in', priority: 'MED', color: Colors.blue },
  { id: '4', icon: '🔍', title: 'Daily Safety Walkthrough', sub: 'Zone A + B inspection scheduled', priority: 'LOW', color: Colors.success },
];

export function OperationsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [shiftStatus, setShiftStatus] = useState<ShiftStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const s = await teamService.getShiftStatus();
      setShiftStatus(s);
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'short',
  });

  return (
    <ScreenLayout>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={styles.headerTitle}>Daily Operations</Text>
          <Text style={styles.headerSub}>{today}</Text>
        </View>
        <View style={styles.activeBadge}>
          <View style={styles.activeDot} />
          <Text style={styles.activeText}>Site Active</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.white} />
        }
      >
        {/* Shift Status */}
        <Card style={styles.shiftCard}>
          <View style={styles.shiftTitleRow}>
            <Text style={styles.shiftTitle}>Current Shift Status</Text>
            <View style={[
              styles.livePill,
              { backgroundColor: shiftStatus?.is_live ? Colors.successBg : Colors.divider },
            ]}>
              <View style={[
                styles.liveDot,
                { backgroundColor: shiftStatus?.is_live ? Colors.success : Colors.textLight },
              ]} />
              <Text style={[
                styles.liveText,
                { color: shiftStatus?.is_live ? Colors.success : Colors.textLight },
              ]}>
                {shiftStatus?.is_live ? 'LIVE' : 'IDLE'}
              </Text>
            </View>
          </View>

          {loading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginVertical: 12 }} />
          ) : (
            <View style={styles.shiftRow}>
              <View style={styles.shiftStat}>
                <Text style={[styles.shiftNum, { color: Colors.primary }]}>
                  {shiftStatus?.logged_in ?? 0}
                </Text>
                <Text style={styles.shiftLabel}>Logged In</Text>
              </View>
              <View style={styles.shiftDivider} />
              <View style={styles.shiftStat}>
                <Text style={[styles.shiftNum, { color: Colors.warning }]}>
                  {shiftStatus?.pending ?? 0}
                </Text>
                <Text style={styles.shiftLabel}>Pending</Text>
              </View>
              <View style={styles.shiftDivider} />
              <View style={styles.shiftStat}>
                <Text style={[styles.shiftNum, { color: Colors.textDark }]}>
                  {shiftStatus?.total ?? 0}
                </Text>
                <Text style={styles.shiftLabel}>Total Team</Text>
              </View>
            </View>
          )}
        </Card>

        {/* Quick Access */}
        <Text style={styles.sectionTitle}>Quick Access</Text>
        <View style={styles.tilesGrid}>
          {TILES.map(tile => (
            <TouchableOpacity
              key={tile.screen}
              style={[styles.tile, { backgroundColor: tile.bg }]}
              onPress={() => navigation.navigate(tile.screen)}
              activeOpacity={0.82}
            >
              <Text style={styles.tileIcon}>{tile.icon}</Text>
              <Text style={[styles.tileLabel, { color: tile.color }]}>{tile.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Today's Focus */}
        <Text style={styles.sectionTitle}>Today's Focus Areas</Text>
        {FOCUS_ITEMS.map(item => (
          <Card key={item.id} style={styles.focusCard}>
            <View style={styles.focusRow}>
              <View style={[styles.focusIconBox, { backgroundColor: item.color + '18' }]}>
                <Text style={{ fontSize: 20 }}>{item.icon}</Text>
              </View>
              <View style={styles.focusInfo}>
                <Text style={styles.focusTitle}>{item.title}</Text>
                <Text style={styles.focusSub}>{item.sub}</Text>
              </View>
              <View style={[styles.priorityPill, { backgroundColor: item.color + '18' }]}>
                <Text style={[styles.priorityText, { color: item.color }]}>{item.priority}</Text>
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
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.white },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  activeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#69F0AE' },
  activeText: { fontSize: 11, color: Colors.white, fontWeight: '600' },
  scroll: { padding: 16 },
  shiftCard: { marginBottom: 20 },
  shiftTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  shiftTitle: { fontSize: 14, fontWeight: '700', color: Colors.textDark },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  liveText: { fontSize: 11, fontWeight: '700' },
  shiftRow: { flexDirection: 'row', alignItems: 'center' },
  shiftStat: { flex: 1, alignItems: 'center' },
  shiftNum: { fontSize: 30, fontWeight: '800' },
  shiftLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  shiftDivider: { width: 1, height: 44, backgroundColor: Colors.border },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textDark, marginBottom: 12 },
  tilesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  tile: {
    width: '47%',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  tileIcon: { fontSize: 30 },
  tileLabel: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  focusCard: { marginBottom: 10, padding: 14 },
  focusRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  focusIconBox: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusInfo: { flex: 1 },
  focusTitle: { fontSize: 14, fontWeight: '600', color: Colors.textDark },
  focusSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  priorityPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  priorityText: { fontSize: 10, fontWeight: '700' },
});
