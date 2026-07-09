import React, { useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { ScreenLayout } from '../components/layout/ScreenLayout';
import { TaskCard } from '../components/cards/TaskCard';
import { EmptyState } from '../components/feedback/EmptyState';
import { Colors } from '../theme/colors';
import { useTasks } from '../hooks/useTasks';
import { formatDueDate } from '../utils/formatters';

export default function TasksScreen({ navigation }: any) {
  const { tasks, isLoading, refetch } = useTasks();

  const onRefresh = useCallback(() => { refetch(); }, [refetch]);

  return (
    <ScreenLayout>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Tasks</Text>
        {tasks.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{tasks.length}</Text>
          </View>
        )}
      </View>

      {isLoading && tasks.length === 0 ? (
        <ActivityIndicator
          color={Colors.primary}
          size="large"
          style={{ marginTop: 60 }}
        />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No Tasks"
          subtitle="You have no tasks assigned for this shift. Pull down to refresh."
        />
      ) : (
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
        >
          {tasks.map(t => (
            <TaskCard
              key={t.id}
              title={t.title}
              location={t.location}
              priority={t.priority}
              type={t.type}
              due={t.due_at ? formatDueDate(t.due_at) : 'Scheduled'}
              onPress={() => navigation.navigate('PerformTask', { task: t })}
            />
          ))}
          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20,
    backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.textDark },
  badge: { backgroundColor: Colors.blue, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  scroll: { flex: 1, padding: 16 },
});
