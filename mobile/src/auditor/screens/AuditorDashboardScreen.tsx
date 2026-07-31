import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar,
  SafeAreaView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { auditService, Audit } from '../services/auditService';

export function AuditorDashboardScreen({ navigation }: any) {
  const { user } = useAuth();
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setAudits(await auditService.listAssigned());
    } catch { /* keep whatever we had */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    load();
    return unsub;
  }, [navigation, load]);

  const total = audits.length;
  const completed = audits.filter((a) => a.status === 'completed').length;
  const pending = audits.filter((a) => a.status !== 'completed').length;
  const scores = audits.map((a) => a.compliance_score).filter((s): s is number => typeof s === 'number');
  const avg = scores.length ? Math.round(scores.reduce((x, y) => x + y, 0) / scores.length) : 0;

  const initials = (user?.name || 'Auditor').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>HSE Audit Pro</Text>
        <View style={styles.headerRight}>
          <Ionicons name="notifications-outline" size={22} color="#0F172A" />
          <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        <Text style={styles.hi}>Welcome back,</Text>
        <Text style={styles.name}>{user?.name || 'Auditor'}</Text>
        <Text style={styles.sub}>Here's your audit workload at a glance.</Text>

        {loading ? (
          <ActivityIndicator color="#2563EB" style={{ marginTop: 40 }} />
        ) : (
          <>
            <View style={styles.statsGrid}>
              <Stat label="Assigned" value={total} color="#2563EB" bg="#EFF6FF" icon="clipboard-outline" />
              <Stat label="Completed" value={completed} color="#16A34A" bg="#F0FDF4" icon="checkmark-done-outline" />
              <Stat label="Pending" value={pending} color="#F97316" bg="#FFF7ED" icon="time-outline" />
              <Stat label="Avg Score" value={`${avg}%`} color="#8B5CF6" bg="#F5F3FF" icon="trending-up-outline" />
            </View>

            <Text style={styles.section}>Quick Actions</Text>
            <View style={styles.actionsRow}>
              <Action label="Assigned Audits" icon="list-outline" onPress={() => navigation.navigate('Audits')} />
              <Action label="Audit Calendar" icon="calendar-outline" onPress={() => navigation.navigate('AuditCalendar')} />
            </View>
            <View style={styles.actionsRow}>
              <Action label="Verifications" icon="shield-checkmark-outline" onPress={() => navigation.navigate('Verifications')} />
              <Action label="Audit Trail" icon="time-outline" onPress={() => navigation.navigate('AuditTrail')} />
            </View>
            <View style={styles.actionsRow}>
              <Action label="Close-Out Review" icon="clipboard-outline" onPress={() => navigation.navigate('CloseOutReview')} />
              <View style={{ flex: 1 }} />
            </View>

            <Text style={styles.section}>Recent Audits</Text>
            {audits.slice(0, 4).map((a) => (
              <TouchableOpacity key={a.id} style={styles.recentCard} activeOpacity={0.85}
                onPress={() => navigation.navigate(a.status === 'completed' ? 'AuditDetail' : 'AuditChecklist', { audit: { ...a, checklist_type: a.checklist_type } })}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.recentTitle}>{a.title}</Text>
                  <Text style={styles.recentSub}>{a.site_name || '—'} · {a.checklist_type || 'Audit'}</Text>
                </View>
                <View style={[styles.recentBadge, a.status === 'completed' ? styles.badgeGreen : styles.badgeBlue]}>
                  <Text style={[styles.recentBadgeText, { color: a.status === 'completed' ? '#16A34A' : '#2563EB' }]}>
                    {a.status === 'completed' ? `${a.compliance_score ?? 0}%` : (a.status || 'scheduled')}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            {audits.length === 0 && <Text style={styles.empty}>No audits assigned yet.</Text>}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value, color, bg, icon }: any) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: bg }]}><Ionicons name={icon} size={18} color={color} /></View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Action({ label, icon, onPress }: any) {
  return (
    <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.actionIcon}><Ionicons name={icon} size={22} color="#2563EB" /></View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { height: 60, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderBottomWidth: 1.5, borderBottomColor: '#F1F5F9' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E3A8A' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  scroll: { padding: 16, paddingBottom: 40 },
  hi: { fontSize: 13, color: '#64748B', marginTop: 4 },
  name: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  sub: { fontSize: 13, color: '#64748B', marginTop: 2, marginBottom: 18 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { width: '47%', backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, flexGrow: 1 },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  statLabel: { fontSize: 12, color: '#64748B', fontWeight: '600', marginTop: 2 },
  section: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginTop: 24, marginBottom: 12 },
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 16, alignItems: 'center' },
  actionIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  actionLabel: { fontSize: 13, fontWeight: '700', color: '#0F172A', textAlign: 'center' },
  recentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginBottom: 10 },
  recentTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  recentSub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  recentBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  badgeGreen: { backgroundColor: '#DCFCE7' },
  badgeBlue: { backgroundColor: '#EFF6FF' },
  recentBadgeText: { fontSize: 11, fontWeight: '800', textTransform: 'capitalize' },
  empty: { textAlign: 'center', color: '#94A3B8', fontWeight: '600', paddingVertical: 20 },
});
