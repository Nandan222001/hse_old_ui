import React, { useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, ActivityIndicator,
} from 'react-native';
import { ScreenLayout } from '../components/layout/ScreenLayout';
import { AppHeader } from '../components/layout/AppHeader';
import { Card } from '../components/cards/Card';
import { ProgressBar } from '../components/display/ProgressBar';
import { EmptyState } from '../components/feedback/EmptyState';
import { Colors } from '../theme/colors';
import { useTraining } from '../hooks/useTraining';
import { TrainingCourse, TrainingStatus } from '../types';

const STATUS_STYLE: Record<TrainingStatus, { bg: string; text: string; label: string }> = {
  not_started: { bg: '#F3F4F6',          text: Colors.textMuted, label: 'Not Started' },
  in_progress: { bg: Colors.warningBg,   text: Colors.warning,   label: 'In Progress' },
  completed:   { bg: Colors.successBg,   text: Colors.success,   label: 'Completed'   },
  expired:     { bg: Colors.criticalBg,  text: Colors.critical,  label: 'Expired'     },
};

function CourseCard({ course, onPress }: { course: TrainingCourse; onPress: () => void }) {
  const st = STATUS_STYLE[course.status] ?? STATUS_STYLE.not_started;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card style={styles.card} elevation={1}>
        {/* Title row */}
        <View style={styles.cardTop}>
          <View style={styles.cardTitleGroup}>
            {course.is_mandatory && (
              <View style={styles.mandatoryBadge}>
                <Text style={styles.mandatoryText}>MANDATORY</Text>
              </View>
            )}
            <Text style={styles.cardTitle} numberOfLines={2}>{course.title}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
            <Text style={[styles.statusText, { color: st.text }]}>{st.label}</Text>
          </View>
        </View>

        {/* Description */}
        {course.description ? (
          <Text style={styles.cardDesc} numberOfLines={2}>{course.description}</Text>
        ) : null}

        {/* Progress bar for in-progress courses */}
        {course.status === 'in_progress' && course.progress_pct > 0 && (
          <ProgressBar progress={course.progress_pct} height={5} style={styles.cardProgress} />
        )}

        {/* Meta row */}
        <View style={styles.cardMeta}>
          {course.estimated_minutes > 0 && (
            <Text style={styles.metaChip}>⏱ {course.estimated_minutes} min</Text>
          )}
          <Text style={styles.metaChip}>⭐ {course.xp_reward} XP</Text>
          {course.video_url ? (
            <Text style={styles.metaChip}>📹 Video</Text>
          ) : null}
          <View style={styles.cardArrow}>
            <Text style={styles.arrowIcon}>›</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

export default function SafetyTrainingScreen({ navigation }: any) {
  const { courses, isLoading, fetchCourses } = useTraining();

  useEffect(() => { fetchCourses(); }, []);
  const onRefresh = useCallback(() => { fetchCourses(); }, []);

  const mandatory  = courses.filter(c => c.is_mandatory);
  const optional   = courses.filter(c => !c.is_mandatory);

  return (
    <ScreenLayout>
      <AppHeader title="Safety Training" onBack={() => navigation.goBack()} rightIcon="🎓" />

      {isLoading && courses.length === 0 ? (
        <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 60 }} />
      ) : courses.length === 0 ? (
        <EmptyState
          icon="🎓"
          title="No Courses Assigned"
          subtitle="Your assigned training courses will appear here."
        />
      ) : (
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
        >
          {mandatory.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>MANDATORY</Text>
              {mandatory.map(c => (
                <CourseCard
                  key={c.id}
                  course={c}
                  onPress={() => navigation.navigate('SafetyTrainingDetail', { course: c })}
                />
              ))}
            </>
          )}

          {optional.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>OPTIONAL</Text>
              {optional.map(c => (
                <CourseCard
                  key={c.id}
                  course={c}
                  onPress={() => navigation.navigate('SafetyTrainingDetail', { course: c })}
                />
              ))}
            </>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, padding: 16 },
  sectionLabel: {
    fontSize: 11, fontWeight: '800', color: Colors.textMuted,
    letterSpacing: 0.8, marginBottom: 10, marginTop: 4,
  },
  card:          { marginBottom: 12 },
  cardTop:       { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  cardTitleGroup:{ flex: 1, marginRight: 10 },
  mandatoryBadge:{ backgroundColor: Colors.criticalBg, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 4 },
  mandatoryText: { fontSize: 9, fontWeight: '800', color: Colors.critical, letterSpacing: 0.5 },
  cardTitle:     { fontSize: 14, fontWeight: '700', color: Colors.textDark, lineHeight: 20 },
  statusBadge:   { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText:    { fontSize: 11, fontWeight: '700' },
  cardDesc:      { fontSize: 13, color: Colors.textMuted, lineHeight: 18, marginBottom: 8 },
  cardProgress:  { marginBottom: 10 },
  cardMeta:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaChip:      { fontSize: 12, color: Colors.textMuted, fontWeight: '500' },
  cardArrow:     { marginLeft: 'auto' },
  arrowIcon:     { fontSize: 22, color: Colors.textLight },
});
