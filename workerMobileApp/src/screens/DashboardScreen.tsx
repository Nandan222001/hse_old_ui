import React, { useCallback } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity,
  StyleSheet, RefreshControl, ActivityIndicator,
} from 'react-native';
import { ScreenLayout } from '../components/layout';
import { Card } from '../components/cards/Card';
import { TaskCard } from '../components/cards/TaskCard';
import { ProgressBar } from '../components/display/ProgressBar';
import { Avatar } from '../components/display/Avatar';
import { Colors } from '../theme/colors';
import { useTasks } from '../hooks/useTasks';
import { useAuthStore } from '../store/authStore';
import { formatDueDate } from '../utils/formatters';

const QUICK_ACTIONS = [
  { icon: '⚠️', label: 'Near Miss',  bg: Colors.warningBg,  color: Colors.warning,  screen: 'ReportNearMiss' },
  { icon: '🚨', label: 'Incident',   bg: Colors.criticalBg, color: Colors.critical, screen: 'ReportIncident' },
  { icon: '✅', label: 'Checklist',  bg: Colors.successBg,  color: Colors.success,  screen: 'SafetyChecklist' },
  { icon: '👁️', label: 'Unsafe Act', bg: '#E3F2FD',         color: Colors.blue,     screen: 'ReportUnsafeAct' },
];

export default function DashboardScreen({ navigation }: any) {
  const { tasks, shiftSummary, isLoading, refetch } = useTasks();
  const user = useAuthStore(s => s.user);

  const onRefresh = useCallback(() => { refetch(); }, [refetch]);

  const total     = shiftSummary?.total_tasks     ?? 0;
  const completed = shiftSummary?.completed_tasks ?? 0;
  const progress  = shiftSummary?.progress_pct    ?? 0;

  const displayName = user?.name ?? 'Worker';
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <ScreenLayout darkHeader>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>{greeting} 👋</Text>
          <Text style={styles.site}>{user?.site || 'HSE Platform'}</Text>
        </View>
        <Avatar name={displayName} size={40} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Shift Overview */}
        <Card style={styles.shiftCard} elevation={2}>
          <View style={styles.shiftHeader}>
            <Text style={styles.shiftTitle}>Shift Overview</Text>
            {shiftSummary?.shift_start ? (
              <Text style={styles.shiftTime}>
                {shiftSummary.shift_start} – {shiftSummary.shift_end}
              </Text>
            ) : (
              <Text style={styles.shiftTime}>Today's Shift</Text>
            )}
          </View>

          {isLoading && !shiftSummary ? (
            <ActivityIndicator color={Colors.primary} style={{ marginVertical: 16 }} />
          ) : (
            <>
              <View style={styles.statsRow}>
                {[
                  { num: String(total),              label: 'Total Tasks', color: Colors.textDark },
                  { num: String(completed),           label: 'Completed',   color: Colors.success  },
                  { num: `${Math.round(progress)}%`, label: 'Progress',    color: Colors.blue     },
                ].map((s, i) => (
                  <View key={i} style={[styles.stat, i > 0 && styles.statBorder]}>
                    <Text style={[styles.statNum, { color: s.color }]}>{s.num}</Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>
              <ProgressBar progress={progress} height={8} style={{ marginTop: 4 }} />
            </>
          )}
        </Card>

        {/* Active Tasks */}
        <Text style={styles.sectionTitle}>Active Tasks</Text>
        {isLoading && tasks.length === 0 ? (
          <ActivityIndicator color={Colors.primary} style={{ marginVertical: 24 }} />
        ) : tasks.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No tasks assigned</Text>
            <Text style={styles.emptySubtitle}>Pull down to refresh</Text>
          </Card>
        ) : (
          tasks.slice(0, 5).map(t => (
            <TaskCard
              key={t.id}
              title={t.title}
              location={t.location}
              priority={t.priority}
              type={t.type}
              due={t.due_at ? formatDueDate(t.due_at) : 'Scheduled'}
              onPress={() => navigation.navigate('PerformTask', { task: t })}
            />
          ))
        )}

        {tasks.length > 5 && (
          <TouchableOpacity
            style={styles.seeAllBtn}
            onPress={() => navigation.navigate('Tasks')}
          >
            <Text style={styles.seeAllText}>See all {tasks.length} tasks →</Text>
          </TouchableOpacity>
        )}

        {/* Quick Report */}
        <Text style={styles.sectionTitle}>Quick Report</Text>
        <View style={styles.quickGrid}>
          {QUICK_ACTIONS.map(a => (
            <TouchableOpacity
              key={a.screen}
              style={[styles.quickCard, { backgroundColor: a.bg }]}
              onPress={() => navigation.navigate(a.screen)}
              activeOpacity={0.8}
            >
              <Text style={styles.quickIcon}>{a.icon}</Text>
              <Text style={[styles.quickLabel, { color: a.color }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.primary, paddingHorizontal: 20, paddingTop: 52, paddingBottom: 20,
  },
  greeting: { color: Colors.white, fontSize: 18, fontWeight: '700' },
  site:     { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },

  scroll: { padding: 16, paddingBottom: 32 },

  shiftCard:   { marginBottom: 14 },
  shiftHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  shiftTitle:  { fontWeight: '700', fontSize: 15, color: Colors.textDark },
  shiftTime:   { fontSize: 13, color: Colors.textMuted },
  statsRow:    { flexDirection: 'row', marginBottom: 14 },
  stat:        { flex: 1, alignItems: 'center' },
  statBorder:  { borderLeftWidth: 1, borderRightWidth: 1, borderColor: Colors.border },
  statNum:     { fontSize: 26, fontWeight: '800' },
  statLabel:   { fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textDark, marginBottom: 12, marginTop: 4 },

  emptyCard:     { alignItems: 'center', paddingVertical: 28, marginBottom: 16 },
  emptyIcon:     { fontSize: 32, marginBottom: 8 },
  emptyTitle:    { fontSize: 15, fontWeight: '700', color: Colors.textDark },
  emptySubtitle: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },

  seeAllBtn:  { alignItems: 'center', paddingVertical: 12, marginBottom: 8 },
  seeAllText: { color: Colors.blue, fontWeight: '600', fontSize: 14 },

  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickCard: { width: '47%', borderRadius: 14, padding: 16, alignItems: 'center' },
  quickIcon: { fontSize: 26, marginBottom: 6 },
  quickLabel: { fontSize: 12, fontWeight: '700' },
});
