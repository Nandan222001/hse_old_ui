import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenLayout, AppHeader, Card, Badge, TextArea, Avatar, LoadingScreen } from '../components';
import { Colors } from '../theme/colors';
import { useTeam } from '../hooks/useTeam';

interface Props {
  navigation: any;
}

export function ToolboxTalkScreen({ navigation }: Props) {
  const { toolboxTalk, loading, fetchToolboxTalk, submitToolboxLog } = useTeam();
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchToolboxTalk(); }, []);

  useEffect(() => {
    if (toolboxTalk) {
      const init: Record<string, boolean> = {};
      toolboxTalk.attendees.forEach(a => { init[a.id] = a.present; });
      setAttendance(init);
    }
  }, [toolboxTalk]);

  const toggleAttendance = (id: string) => {
    setAttendance(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmit = async () => {
    if (!toolboxTalk) return;
    setSubmitting(true);
    try {
      await submitToolboxLog({
        talk_id: toolboxTalk.id,
        attendees: toolboxTalk.attendees.map(a => ({ id: a.id, present: attendance[a.id] ?? false })),
        notes,
      });
      Alert.alert('Success', 'Toolbox talk log submitted');
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to submit log');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !toolboxTalk) return <LoadingScreen />;

  const presentCount = Object.values(attendance).filter(Boolean).length;

  return (
    <ScreenLayout>
      <AppHeader
        title="Toolbox Talk"
        onBack={() => navigation.goBack()}
        showBell
      />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Date & Priority */}
        <View style={styles.metaRow}>
          <Text style={styles.date}>Oct 24, 2023 07:30 AM</Text>
          <Badge label="High Priority Session" variant="critical" />
        </View>

        {/* Topic Card */}
        <Card>
          <Text style={styles.topicLabel}>Current Topic</Text>
          <Text style={styles.topicTitle}>{toolboxTalk.title}</Text>
          <Text style={styles.topicDesc}>{toolboxTalk.description}</Text>
          <View style={styles.points}>
            {toolboxTalk.key_points.map((pt, i) => (
              <View key={i} style={styles.pointRow}>
                <View style={styles.pointBullet} />
                <Text style={styles.pointText}>{pt}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Attendance */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Attendance Log</Text>
          <Text style={styles.attendanceCount}>{presentCount}/{toolboxTalk.attendees.length} Present</Text>
        </View>

        {toolboxTalk.attendees.map(member => (
          <TouchableOpacity
            key={member.id}
            style={styles.memberRow}
            onPress={() => toggleAttendance(member.id)}
          >
            <Avatar name={member.name} size={42} />
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{member.name}</Text>
              <Text style={styles.memberRole}>{member.role}</Text>
            </View>
            <View style={[
              styles.checkbox,
              attendance[member.id] && styles.checkboxChecked,
            ]}>
              {attendance[member.id] && (
                <Ionicons name="checkmark" size={14} color={Colors.white} />
              )}
            </View>
          </TouchableOpacity>
        ))}

        {/* Field Notes */}
        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Field Notes</Text>
        <TextArea
          placeholder="Add observations, issues, or special instructions..."
          value={notes}
          onChangeText={setNotes}
          minHeight={100}
        />

        {/* Submit */}
        <TouchableOpacity
          onPress={handleSubmit}
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          disabled={submitting}
        >
          <Text style={styles.submitText}>{submitting ? 'Submitting...' : 'Submit Log'}</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  date: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
  topicLabel: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.5, marginBottom: 4 },
  topicTitle: { fontSize: 18, fontWeight: '800', color: Colors.textDark, marginBottom: 8 },
  topicDesc: { fontSize: 14, color: Colors.textMid, lineHeight: 20, marginBottom: 12 },
  points: { gap: 8 },
  pointRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  pointBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.blue, marginTop: 6 },
  pointText: { flex: 1, fontSize: 14, color: Colors.textMid, lineHeight: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textDark, marginBottom: 10 },
  attendanceCount: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
    elevation: 1,
  },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 14, fontWeight: '600', color: Colors.textDark },
  memberRole: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: Colors.success, borderColor: Colors.success },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
