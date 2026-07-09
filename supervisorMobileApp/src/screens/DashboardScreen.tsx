import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenLayout, Avatar, Card, ProgressBar } from '../components';
import { Colors } from '../theme/colors';
import { useAuth } from '../hooks/useAuth';
import { useDashboard } from '../hooks/useDashboard';

interface Props { navigation: any; }

function alertEmoji(type: string): string {
  if (type === 'resolved' || type === 'info') return '✅';
  if (type === 'critical') return '🚨';
  return '⚠️';
}

function alertColor(type: string): string {
  if (type === 'resolved' || type === 'info') return Colors.success;
  if (type === 'critical') return Colors.critical;
  return Colors.warning;
}

const QUICK_ACTIONS = [
  { label: 'Approve\nPermit', icon: '📋', bg: '#E3F2FD', color: Colors.blue, tab: 'Permits' },
  { label: 'Toolbox\nTalk', icon: '🎤', bg: '#FFF3E0', color: Colors.warning, tab: 'Operations' },
  { label: 'Inspection', icon: '🔍', bg: '#EDE7F6', color: '#5E35B1', tab: 'Incidents' },
  { label: 'Review\nObservation', icon: '👁️', bg: '#E8F5E9', color: Colors.success, tab: 'Incidents' },
  { label: 'Report\nIncident', icon: '🚨', bg: Colors.criticalBg, color: Colors.critical, tab: 'Incidents' },
  { label: 'Assign\nTask', icon: '📌', bg: '#FFF8E1', color: '#F9A825', tab: 'Operations' },
];

export function DashboardScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { stats, alerts, shiftStatus, isLoading, refresh } = useDashboard();

  useEffect(() => { refresh(); }, [refresh]);

  const attendancePct  = stats?.attendance_pct        ?? 0;
  const compliancePct  = stats?.safety_compliance_pct ?? 0;
  const activePermits  = stats?.active_permits        ?? 0;
  const pendingPermits = stats?.pending_permits       ?? 0;
  const shiftLoggedIn  = shiftStatus?.logged_in       ?? 0;
  const shiftTotal     = shiftStatus?.total           ?? 0;

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short',
  });

  return (
    <ScreenLayout>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Avatar name={user?.name ?? 'Supervisor'} size={42} />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>Good morning, {(user?.name ?? 'Supervisor').split(' ')[0]}</Text>
          <Text style={styles.headerRole}>{today}  ·  Houston Refinery</Text>
        </View>
        <TouchableOpacity onPress={() => Alert.alert('Notifications', 'Coming soon')}>
          <Text style={{ fontSize: 24 }}>🔔</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={Colors.primary} />}
      >
        {isLoading && !stats && (
          <ActivityIndicator color={Colors.primary} style={{ marginVertical: 20 }} />
        )}

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderTopColor: Colors.blue }]}>
            <Text style={[styles.statNum, { color: Colors.blue }]}>{attendancePct}%</Text>
            <Text style={styles.statLabel}>Attendance</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: Colors.primary }]}>
            <Text style={[styles.statNum, { color: Colors.primary }]}>{activePermits}</Text>
            <Text style={styles.statLabel}>Active Permits</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: Colors.warning }]}>
            <Text style={[styles.statNum, { color: Colors.warning }]}>{pendingPermits}</Text>
            <Text style={styles.statLabel}>Pending Approval</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: Colors.success }]}>
            <Text style={[styles.statNum, { color: Colors.success }]}>{compliancePct}%</Text>
            <Text style={styles.statLabel}>Compliance</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map(action => (
            <TouchableOpacity
              key={action.label}
              style={[styles.actionBtn, { backgroundColor: action.bg }]}
              onPress={() => navigation.navigate(action.tab as never)}
              activeOpacity={0.82}
            >
              <Text style={styles.actionIcon}>{action.icon}</Text>
              <Text style={[styles.actionLabel, { color: action.color }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Workforce Status */}
        <Text style={styles.sectionTitle}>Workforce Status</Text>
        <Card>
          <View style={styles.workforceRow}>
            <View style={styles.workforceLeft}>
              <Text style={styles.workforceNum}>{shiftLoggedIn}</Text>
              <Text style={styles.workforceOf}>/ {shiftTotal}</Text>
              <Text style={styles.workforceLabel}> workers logged in</Text>
            </View>
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
          <View style={styles.complianceBars}>
            <View style={styles.barRow}>
              <Text style={styles.barLabel}>Attendance</Text>
              <ProgressBar progress={attendancePct} color={Colors.blue} height={5} />
              <Text style={styles.barPct}>{attendancePct}%</Text>
            </View>
            <View style={styles.barRow}>
              <Text style={styles.barLabel}>Safety Compliance</Text>
              <ProgressBar progress={compliancePct} color={Colors.success} height={5} />
              <Text style={styles.barPct}>{compliancePct}%</Text>
            </View>
          </View>
        </Card>

        {/* Permits Overview */}
        <Text style={styles.sectionTitle}>Permits & Clearances</Text>
        <Card>
          <View style={styles.permitsRow}>
            <View style={styles.permitStat}>
              <Text style={[styles.permitNum, { color: Colors.primary }]}>
                {String(activePermits).padStart(2, '0')}
              </Text>
              <Text style={styles.permitLabel}>Active</Text>
            </View>
            <View style={styles.permitDivider} />
            <View style={styles.permitStat}>
              <Text style={[styles.permitNum, { color: Colors.warning }]}>
                {String(pendingPermits).padStart(2, '0')}
              </Text>
              <Text style={styles.permitLabel}>Pending Approval</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={() => navigation.navigate('Permits' as never)}
          >
            <Text style={styles.viewAllText}>View All Permits  →</Text>
          </TouchableOpacity>
        </Card>

        {/* Recent Alerts */}
        <Text style={styles.sectionTitle}>Recent Alerts</Text>
        {alerts.length === 0 && !isLoading && (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>✅  No active alerts</Text>
          </Card>
        )}
        {alerts.map(a => (
          <Card key={a.id} style={styles.alertCard}>
            <View style={styles.alertRow}>
              <View style={[styles.alertIcon, { backgroundColor: alertColor(a.type) + '1A' }]}>
                <Text style={{ fontSize: 18 }}>{alertEmoji(a.type)}</Text>
              </View>
              <View style={styles.alertInfo}>
                <Text style={styles.alertTitle}>{a.message}</Text>
                <Text style={styles.alertSub}>
                  {a.zone ? `${a.zone}  ·  ` : ''}{a.time_ago}
                  {a.worker_name ? `  ·  ${a.worker_name}` : ''}
                </Text>
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
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 15, fontWeight: '700', color: Colors.white },
  headerRole: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  scroll: { padding: 16 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 10,
    borderTopWidth: 3,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  statNum: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 9, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textDark, marginBottom: 10 },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  actionBtn: {
    width: '30.8%',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  actionIcon: { fontSize: 26 },
  actionLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center' },

  workforceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  workforceLeft: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  workforceNum: { fontSize: 26, fontWeight: '800', color: Colors.primary },
  workforceOf: { fontSize: 16, fontWeight: '600', color: Colors.textMuted },
  workforceLabel: { fontSize: 13, color: Colors.textMuted },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  liveText: { fontSize: 11, fontWeight: '700' },
  complianceBars: { gap: 12 },
  barRow: { gap: 4 },
  barLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: '500' },
  barPct: { fontSize: 11, color: Colors.textLight, textAlign: 'right', marginTop: 2 },

  permitsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  permitStat: { flex: 1, alignItems: 'center' },
  permitNum: { fontSize: 30, fontWeight: '800' },
  permitLabel: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  permitDivider: { width: 1, height: 50, backgroundColor: Colors.divider },
  viewAllBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  viewAllText: { color: Colors.white, fontWeight: '600', fontSize: 13 },

  emptyCard: { marginBottom: 8 },
  emptyText: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', paddingVertical: 6 },
  alertCard: { marginBottom: 8, padding: 12 },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  alertIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  alertInfo: { flex: 1 },
  alertTitle: { fontSize: 13, fontWeight: '600', color: Colors.textDark },
  alertSub: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
});
