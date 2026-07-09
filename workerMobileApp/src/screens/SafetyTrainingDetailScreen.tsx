import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { ScreenLayout } from '../components/layout/ScreenLayout';
import { AppHeader } from '../components/layout/AppHeader';
import { Card } from '../components/cards/Card';
import { ProgressBar } from '../components/display/ProgressBar';
import { VideoPlayer } from '../components/display/VideoPlayer';
import { Colors } from '../theme/colors';
import { TrainingCourse } from '../types';
import { useTraining } from '../hooks/useTraining';

const DEFAULT_OBJECTIVES = [
  { icon: '📋', title: 'Compliance Standards',  description: 'Understand the relevant regulatory requirements.' },
  { icon: '🔧', title: 'Equipment Inspection',   description: 'Properly inspect and use safety equipment.' },
  { icon: '⭐', title: 'Emergency Response',      description: 'Follow the correct emergency response procedures.' },
];

export default function SafetyTrainingDetailScreen({ route, navigation }: any) {
  const course: TrainingCourse = route.params?.course;
  const { submitAssessment } = useTraining();

  if (!course) {
    navigation.goBack();
    return null;
  }

  const objectives = course.objectives?.length ? course.objectives : DEFAULT_OBJECTIVES;

  const handleStartAssessment = () => {
    Alert.alert(
      'Start Assessment',
      `You are about to take the assessment for:\n"${course.title}"\n\nYou can earn up to ${course.xp_reward} XP.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Begin',
          onPress: async () => {
            // Submit with empty answers — backend marks as passed for now
            const result = await submitAssessment({ course_id: course.id, answers: [] });
            if (result?.passed) {
              Alert.alert(
                '🎉 Assessment Passed!',
                `Score: ${result.score}%\nXP Earned: ${result.xp_earned}`,
                [{ text: 'Done', onPress: () => navigation.goBack() }],
              );
            } else {
              Alert.alert('Try Again', 'You did not pass this time. Review the material and try again.');
            }
          },
        },
      ],
    );
  };

  const durationLabel = course.video_duration_seconds > 0
    ? `${Math.ceil(course.video_duration_seconds / 60)} min video`
    : course.estimated_minutes > 0
    ? `${course.estimated_minutes} min`
    : null;

  return (
    <ScreenLayout>
      <AppHeader
        title="Training"
        onBack={() => navigation.goBack()}
        rightIcon={course.is_mandatory ? '⚠️' : '🎓'}
      />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Progress */}
        {course.progress_pct > 0 && (
          <ProgressBar
            progress={course.progress_pct}
            label="COURSE PROGRESS"
            showPct
            style={styles.progressBar}
          />
        )}

        {/* Video player */}
        <VideoPlayer uri={course.video_url} />

        {/* Course info */}
        <Text style={styles.title}>{course.title}</Text>
        {course.description ? (
          <Text style={styles.desc}>{course.description}</Text>
        ) : null}

        {/* Meta chips */}
        <View style={styles.metaRow}>
          {durationLabel && <Text style={styles.metaChip}>⏱ {durationLabel}</Text>}
          <Text style={styles.metaChip}>⭐ {course.xp_reward} XP reward</Text>
          {course.is_mandatory && (
            <View style={styles.mandatoryChip}>
              <Text style={styles.mandatoryText}>MANDATORY</Text>
            </View>
          )}
        </View>

        {/* Learning objectives */}
        <Text style={styles.sectionLabel}>LEARNING OBJECTIVES</Text>
        <Card style={styles.objectivesCard} elevation={1}>
          {objectives.map((obj, i) => (
            <View
              key={i}
              style={[styles.objRow, i < objectives.length - 1 && styles.objDivider]}
            >
              <View style={styles.objIconBox}>
                <Text style={{ fontSize: 20 }}>{obj.icon}</Text>
              </View>
              <View style={styles.objInfo}>
                <Text style={styles.objTitle}>{obj.title}</Text>
                <Text style={styles.objDesc}>{obj.description}</Text>
              </View>
            </View>
          ))}
        </Card>

        {/* Assessment button */}
        <TouchableOpacity
          style={[
            styles.assessBtn,
            course.status === 'completed' && styles.assessBtnDone,
          ]}
          onPress={handleStartAssessment}
          activeOpacity={0.85}
          disabled={course.status === 'completed'}
        >
          <Text style={styles.assessBtnText}>
            {course.status === 'completed' ? '✓ Assessment Completed' : 'Start Assessment →'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll:       { flex: 1, padding: 16 },
  progressBar:  { marginBottom: 16 },

  title: { fontSize: 22, fontWeight: '800', color: Colors.textDark, marginTop: 16, marginBottom: 8 },
  desc:  { fontSize: 14, color: Colors.textMid, lineHeight: 22, marginBottom: 16 },

  metaRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  metaChip:      { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
  mandatoryChip: { backgroundColor: Colors.criticalBg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  mandatoryText: { fontSize: 11, fontWeight: '800', color: Colors.critical, letterSpacing: 0.5 },

  sectionLabel: {
    fontSize: 11, fontWeight: '800', color: Colors.textMuted,
    letterSpacing: 0.8, marginBottom: 12,
  },

  objectivesCard: { marginBottom: 24, padding: 0, overflow: 'hidden' },
  objRow:         { flexDirection: 'row', alignItems: 'flex-start', padding: 16, gap: 12 },
  objDivider:     { borderBottomWidth: 1, borderBottomColor: Colors.border },
  objIconBox:     { width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  objInfo:        { flex: 1 },
  objTitle:       { fontSize: 14, fontWeight: '700', color: Colors.textDark, marginBottom: 4 },
  objDesc:        { fontSize: 13, color: Colors.textMuted, lineHeight: 18 },

  assessBtn:     { backgroundColor: Colors.blue,    borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  assessBtnDone: { backgroundColor: Colors.success },
  assessBtnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
});
