import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useAuth } from '../hooks/useAuth';
import { useDashboard } from '../hooks/useDashboard';
import { Avatar } from '../components';

interface Props {
  navigation: any;
}

export function DashboardScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { stats, alerts, isLoading, refresh } = useDashboard();

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FF" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Avatar name={user?.name ?? 'Supervisor'} size={42} />
          <View style={styles.welcomeBox}>
            <Text style={styles.welcomeSub}>Welcome back,</Text>
            <Text style={styles.welcomeTitle}>{user?.name ?? 'Site Supervisor'}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('NotificationCenter')}
          style={styles.bellBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={24} color={Colors.textDark} />
          {alerts.length > 0 && <View style={styles.badge} />}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} colors={[Colors.primary]} />
        }
      >
        {/* Stats Row */}
        <View style={styles.statsRow}>
          {/* Attendance */}
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('TeamManagement')}
            activeOpacity={0.9}
          >
            <View style={[styles.statIconBox, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="people" size={20} color="#004AC6" />
            </View>
            <Text style={styles.statValue}>
              {stats?.attendance_pct ? `${stats.attendance_pct}%` : '85%'}
            </Text>
            <Text style={styles.statLabel}>Team Attendance</Text>
          </TouchableOpacity>

          {/* Active Permits */}
          <TouchableOpacity
            style={[styles.statCard, styles.statCardLarge]}
            onPress={() => navigation.navigate('Permits')}
            activeOpacity={0.9}
          >
            <View style={[styles.statIconBox, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="document-text" size={20} color="#16A34A" />
            </View>
            <View style={styles.permitStats}>
              <Text style={styles.statValue}>
                {stats?.active_permits ?? 3} Active
              </Text>
              {stats?.pending_permits ? (
                <Text style={styles.statSubValue}>
                  {stats.pending_permits} Pending approval
                </Text>
              ) : (
                <Text style={styles.statSubValue}>All permits approved</Text>
              )}
            </View>
          </TouchableOpacity>

          {/* Safety Compliance */}
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('SafetyObservationManagement')}
            activeOpacity={0.9}
          >
            <View style={[styles.statIconBox, { backgroundColor: '#FFF7ED' }]}>
              <Ionicons name="shield-checkmark" size={20} color="#F97316" />
            </View>
            <Text style={styles.statValue}>
              {stats?.safety_compliance_pct ? `${stats.safety_compliance_pct}%` : '98%'}
            </Text>
            <Text style={styles.statLabel}>Safety Score</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions Title */}
        <Text style={styles.sectionTitle}>Quick Management Actions</Text>

        {/* Quick Actions Grid */}
        <View style={styles.grid}>
          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => navigation.navigate('Permits')}
            activeOpacity={0.8}
          >
            <View style={[styles.gridIcon, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="create-outline" size={24} color="#004AC6" />
            </View>
            <Text style={styles.gridLabel}>Approve Permits</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => navigation.navigate('ToolboxTalkManagement')}
            activeOpacity={0.8}
          >
            <View style={[styles.gridIcon, { backgroundColor: '#FFF7ED' }]}>
              <Ionicons name="mic-outline" size={24} color="#F97316" />
            </View>
            <Text style={styles.gridLabel}>Toolbox Talks</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => navigation.navigate('InspectionManagement')}
            activeOpacity={0.8}
          >
            <View style={[styles.gridIcon, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="checkbox-outline" size={24} color="#16A34A" />
            </View>
            <Text style={styles.gridLabel}>Site Inspections</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => navigation.navigate('SafetyObservationManagement')}
            activeOpacity={0.8}
          >
            <View style={[styles.gridIcon, { backgroundColor: '#FDF2F8' }]}>
              <Ionicons name="eye-outline" size={24} color="#DB2777" />
            </View>
            <Text style={styles.gridLabel}>Safety Audits</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => navigation.navigate('Incidents')}
            activeOpacity={0.8}
          >
            <View style={[styles.gridIcon, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="alert-circle-outline" size={24} color="#EF4444" />
            </View>
            <Text style={styles.gridLabel}>Report Incident</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => navigation.navigate('SessionManagement')}
            activeOpacity={0.8}
          >
            <View style={[styles.gridIcon, { backgroundColor: '#FAF5FF' }]}>
              <Ionicons name="time-outline" size={24} color="#8B5CF6" />
            </View>
            <Text style={styles.gridLabel}>Shift Session</Text>
          </TouchableOpacity>
        </View>

        {/* AI Safety Insights Banner */}
        <TouchableOpacity
          style={styles.aiBanner}
          onPress={() => navigation.navigate('AISafetyInsights')}
          activeOpacity={0.85}
        >
          <View style={styles.aiLeft}>
            <View style={styles.aiIconBox}>
              <Ionicons name="sparkles" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.aiTextBox}>
              <Text style={styles.aiTitle}>AI Safety Insights</Text>
              <Text style={styles.aiDesc}>2 minor non-compliances flagged in Sector 4</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#FFFFFF" style={{ opacity: 0.8 }} />
        </TouchableOpacity>

        {/* Workforce Status Card */}
        <TouchableOpacity
          style={styles.workforceCard}
          onPress={() => navigation.navigate('TeamPerformanceMetrics')}
          activeOpacity={0.9}
        >
          <View style={styles.wfHeader}>
            <Text style={styles.wfTitle}>Workforce Status</Text>
            <Text style={styles.wfLive}>● Live</Text>
          </View>
          <View style={styles.wfRow}>
            <View style={styles.wfItem}>
              <Text style={styles.wfVal}>14</Text>
              <Text style={styles.wfLbl}>On Site Today</Text>
            </View>
            <View style={styles.wfItem}>
              <Text style={styles.wfVal}>12</Text>
              <Text style={styles.wfLbl}>Inducted</Text>
            </View>
            <View style={styles.wfItem}>
              <Text style={styles.wfVal}>2</Text>
              <Text style={[styles.wfVal, { color: '#EF4444' }]}>Pending ID</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Active Permits Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Permits</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Permits')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {/* Coded Permits List */}
        <View style={styles.permitsList}>
          <TouchableOpacity
            style={styles.permitItem}
            onPress={() => navigation.navigate('PermitRequestManagement')}
            activeOpacity={0.8}
          >
            <View style={styles.permitLeft}>
              <View style={[styles.permitIndicator, { backgroundColor: '#16A34A' }]} />
              <View>
                <Text style={styles.permitName}>Hot Work Permit</Text>
                <Text style={styles.permitSub}>Welding - Sector 4 · Exp. 17:00</Text>
              </View>
            </View>
            <View style={styles.permitRight}>
              <Text style={styles.permitStatusText}>Active</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.permitItem}
            onPress={() => navigation.navigate('PermitRequestManagement')}
            activeOpacity={0.8}
          >
            <View style={styles.permitLeft}>
              <View style={[styles.permitIndicator, { backgroundColor: '#16A34A' }]} />
              <View>
                <Text style={styles.permitName}>Confined Space Entry</Text>
                <Text style={styles.permitSub}>Tank 12 Cleaning · Exp. 18:30</Text>
              </View>
            </View>
            <View style={styles.permitRight}>
              <Text style={styles.permitStatusText}>Active</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8F9FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  welcomeBox: {
    justifyContent: 'center',
  },
  welcomeSub: {
    fontSize: 12,
    color: '#737686',
  },
  welcomeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0B1C30',
  },
  bellBtn: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  statCardLarge: {
    flex: 1.8,
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0B1C30',
  },
  statSubValue: {
    fontSize: 10,
    color: '#737686',
    marginTop: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#737686',
    marginTop: 4,
  },
  permitStats: {
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0B1C30',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  gridCard: {
    width: '31%',
    aspectRatio: 1.1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  gridIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#434655',
    textAlign: 'center',
  },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#004AC6',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  aiLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTextBox: {
    justifyContent: 'center',
  },
  aiTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  aiDesc: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  workforceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  wfHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  wfTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0B1C30',
  },
  wfLive: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
  wfRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  wfItem: {
    alignItems: 'center',
  },
  wfVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0B1C30',
  },
  wfLbl: {
    fontSize: 11,
    color: '#737686',
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#004AC6',
  },
  permitsList: {
    gap: 12,
  },
  permitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  permitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  permitIndicator: {
    width: 6,
    height: 36,
    borderRadius: 3,
  },
  permitName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0B1C30',
  },
  permitSub: {
    fontSize: 11,
    color: '#737686',
    marginTop: 2,
  },
  permitRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  permitStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },
});
