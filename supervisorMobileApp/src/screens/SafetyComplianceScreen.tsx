import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenLayout, AppHeader, Card, CircularProgress, Avatar, Badge, LoadingScreen } from '../components';
import { Colors } from '../theme/colors';
import { useCompliance } from '../hooks/useCompliance';

interface Props {
  navigation: any;
}

export function SafetyComplianceScreen({ navigation }: Props) {
  const { metrics, exceptions, gearCheck, expiringPermits, loading, remindWorker } = useCompliance();

  if (loading) return <LoadingScreen />;

  const overall = metrics?.overall_pct ?? 94;
  const ppe = metrics?.ppe_pct ?? 98;
  const training = metrics?.training_pct ?? 89;
  const risks = metrics?.active_risks ?? 3;

  return (
    <ScreenLayout>
      <AppHeader title="Safety Compliance" showBell />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Team Health */}
        <Card>
          <View style={styles.healthRow}>
            <View style={styles.healthInfo}>
              <Text style={styles.healthTitle}>Team Health</Text>
              <Text style={styles.healthSub}>
                Aggregate safety compliance across {metrics?.active_personnel ?? 24} active personnel.
              </Text>
              <View style={styles.badgeRow}>
                <Badge label={metrics?.site ?? 'Operational'} variant="primary" />
                <Badge label={metrics?.region ?? 'Region-04'} variant="muted" />
              </View>
            </View>
            <CircularProgress value={overall} size={90} strokeWidth={9} color={Colors.primary} />
          </View>
        </Card>

        {/* Metrics Row */}
        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>PPE</Text>
            <Text style={styles.metricValue}>{ppe}%</Text>
            <View style={styles.metricBar}>
              <View style={[styles.metricFill, { width: `${ppe}%`, backgroundColor: Colors.blue }]} />
            </View>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>TRAIN</Text>
            <Text style={styles.metricValue}>{training}%</Text>
            <View style={styles.metricBar}>
              <View style={[styles.metricFill, { width: `${training}%`, backgroundColor: Colors.blue }]} />
            </View>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>RISKS</Text>
            <Text style={[styles.metricValue, { color: Colors.critical }]}>{risks < 10 ? `0${risks}` : risks}</Text>
            <View style={styles.riskFlag}>
              <Ionicons name="flag" size={10} color={Colors.critical} />
              <Text style={styles.riskFlagText}>Active</Text>
            </View>
          </View>
        </View>

        {/* Compliance Exceptions */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Compliance Exceptions</Text>
          <Text style={styles.actionsRequired}>2 ACTIONS REQUIRED</Text>
        </View>

        {(exceptions.length > 0 ? exceptions : [
          { id: '1', worker_name: 'Marcus Thorne', issue: 'Confined Space Cert Expired', severity: 'high' as const },
          { id: '2', worker_name: 'Elena Rodriguez', issue: 'Missing LOTO morning log', severity: 'medium' as const },
        ]).map(ex => (
          <View key={ex.id} style={[styles.exceptionCard, ex.severity === 'high' && styles.exceptionHigh]}>
            <Avatar name={ex.worker_name} size={42} />
            <View style={styles.exInfo}>
              <Text style={styles.exName}>{ex.worker_name}</Text>
              <Text style={styles.exIssue}>{ex.issue}</Text>
            </View>
            {ex.severity === 'high' ? (
              <Ionicons name="alarm-outline" size={22} color={Colors.critical} />
            ) : (
              <TouchableOpacity
                onPress={() => remindWorker(ex.id)}
                style={styles.remindBtn}
              >
                <Text style={styles.remindText}>Remind</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        {/* Daily Gear Check */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Daily Gear Check</Text>
          <View style={styles.gearStatus}>
            <View style={styles.gearDot} />
            <Text style={styles.gearStatusText}>
              {gearCheck.filter(w => w.passed).length}/{gearCheck.length || 24} Passed
            </Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gearScroll}>
          {(gearCheck.length > 0 ? gearCheck : [
            { id: '1', name: 'David L.', passed: true },
            { id: '2', name: 'Sarah K.', passed: true },
            { id: '3', name: 'James T.', passed: true },
            { id: '4', name: 'Alex M.', passed: false },
            { id: '5', name: 'Janice', passed: false },
          ]).map(w => (
            <View key={w.id} style={styles.gearItem}>
              <View style={styles.gearAvatarWrap}>
                <Avatar name={w.name} size={52} />
                {w.passed && (
                  <View style={styles.gearCheck}>
                    <Ionicons name="checkmark" size={10} color={Colors.white} />
                  </View>
                )}
              </View>
              <Text style={[styles.gearName, !w.passed && styles.gearNamePending]}>{w.name}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Expiring Permits */}
        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Expiring Permits (30 Days)</Text>
        <Card>
          {(expiringPermits.length > 0 ? expiringPermits : [
            { id: '1', title: 'High-Voltage Electrical', workers: 4, expiry_date: 'Oct 12' },
            { id: '2', title: 'Forklift Operation', workers: 1, expiry_date: 'Oct 18' },
            { id: '3', title: 'First Aid Refresher', workers: 8, expiry_date: 'Nov 02' },
          ]).map((ep, i, arr) => (
            <View key={ep.id}>
              <View style={styles.expiringRow}>
                <View style={styles.expiringInfo}>
                  <Text style={styles.expiringTitle}>{ep.title}</Text>
                  <Text style={styles.expiringSub}>{ep.workers} Worker{ep.workers !== 1 ? 's' : ''} · Expiry: {ep.expiry_date}</Text>
                </View>
                <TouchableOpacity>
                  <Text style={styles.scheduleText}>Schedule</Text>
                </TouchableOpacity>
              </View>
              {i < arr.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </Card>

        <View style={{ height: 20 }} />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16 },
  healthRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  healthInfo: { flex: 1, gap: 6 },
  healthTitle: { fontSize: 16, fontWeight: '700', color: Colors.textDark },
  healthSub: { fontSize: 12, color: Colors.textMuted, lineHeight: 18 },
  badgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  metricBox: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    gap: 6,
    elevation: 1,
  },
  metricLabel: { fontSize: 10, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.5 },
  metricValue: { fontSize: 20, fontWeight: '800', color: Colors.textDark },
  metricBar: { height: 4, backgroundColor: Colors.border, borderRadius: 99, overflow: 'hidden' },
  metricFill: { height: 4, borderRadius: 99 },
  riskFlag: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  riskFlagText: { fontSize: 10, color: Colors.critical, fontWeight: '600' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textDark, marginBottom: 10 },
  actionsRequired: { fontSize: 11, fontWeight: '700', color: Colors.critical },
  exceptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
    elevation: 1,
  },
  exceptionHigh: { borderLeftWidth: 4, borderLeftColor: Colors.critical },
  exInfo: { flex: 1 },
  exName: { fontSize: 14, fontWeight: '600', color: Colors.textDark },
  exIssue: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  remindBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  remindText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  gearScroll: { marginBottom: 20 },
  gearItem: { alignItems: 'center', marginRight: 14, gap: 6 },
  gearAvatarWrap: { position: 'relative' },
  gearCheck: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  gearName: { fontSize: 11, color: Colors.textMid, fontWeight: '500' },
  gearNamePending: { color: Colors.textLight },
  gearStatus: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  gearDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.blue },
  gearStatusText: { fontSize: 12, color: Colors.textMid, fontWeight: '600' },
  expiringRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  expiringInfo: { flex: 1 },
  expiringTitle: { fontSize: 14, fontWeight: '700', color: Colors.textDark },
  expiringSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  scheduleText: { fontSize: 13, color: Colors.blue, fontWeight: '600' },
  divider: { height: 1, backgroundColor: Colors.divider },
});
