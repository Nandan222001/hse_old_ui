import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
  RefreshControl, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../api/client';
import { changeLogService } from '../services/hseiqService';

interface Topic { id: string; title: string; description: string; minutes: number; }

/**
 * Toolbox Talks — browse topics AND record that one was delivered.
 *
 * The delivery record is the point. AI Function 7 (Communication & Leadership)
 * is blocked on "toolbox talk capture", and the Organisational & System Health
 * domain of the Safety Performance Score reads `supervisor_interactions` to
 * measure supervisor safety engagement. A screen that only lists topics
 * generates no evidence that any of them were ever given, so the domain scores
 * as if nothing happened.
 */
export function ToolboxTalkManagementScreen({ navigation }: any) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState<string | null>(null);
  const [attendees, setAttendees] = useState('');
  const [notes, setNotes] = useState('');
  const [delivered, setDelivered] = useState<string[]>([]);

  const load = useCallback(() => {
    setLoading(true);
    apiClient.get('/worker/training')
      .then((res: any) => {
        const items = res?.data?.items ?? [];
        setTopics(items.map((t: any) => ({
          id: String(t.id),
          title: t.title,
          description: t.description || '',
          minutes: t.estimated_minutes || 15,
        })));
      })
      .catch(() => setTopics([]))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const record = useCallback((topic: Topic) => {
    const detail = [
      topic.title,
      attendees.trim() ? `${attendees.trim()} attended` : null,
      notes.trim() || null,
    ].filter(Boolean).join(' — ');

    changeLogService
      .logInteraction({ interaction_type: 'toolbox_talk', detail })
      .then(() => {
        setDelivered(prev => [...prev, topic.id]);
        setRecording(null);
        setAttendees('');
        setNotes('');
        Alert.alert(
          'Talk recorded',
          'This counts toward supervisor engagement in the site Safety Performance Score.',
        );
      })
      .catch((err: any) =>
        Alert.alert('Could not record', err?.response?.data?.detail ?? 'Please try again.'),
      );
  }, [attendees, notes]);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0B1C30" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Toolbox Talks</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} colors={['#004AC6']} />}
      >
        {delivered.length > 0 ? (
          <View style={styles.deliveredBanner}>
            <Text style={styles.deliveredText}>
              {delivered.length} talk{delivered.length > 1 ? 's' : ''} recorded this session.
            </Text>
          </View>
        ) : null}

        {loading && topics.length === 0 ? (
          <ActivityIndicator color="#004AC6" style={{ marginTop: 30 }} />
        ) : topics.length === 0 ? (
          <Text style={styles.empty}>No toolbox talk topics available.</Text>
        ) : (
          topics.map((t) => (
            <View key={t.id} style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.iconBox}>
                  <Ionicons name="megaphone-outline" size={20} color="#F97316" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title} numberOfLines={2}>{t.title}</Text>
                  {!!t.description && <Text style={styles.sub} numberOfLines={1}>{t.description}</Text>}
                  <Text style={styles.dur}>Approx. {t.minutes} mins</Text>
                </View>
              </View>

              {delivered.includes(t.id) ? (
                <Text style={styles.done}>Recorded</Text>
              ) : recording === t.id ? (
                <View style={styles.form}>
                  <TextInput
                    style={styles.input}
                    value={attendees}
                    onChangeText={setAttendees}
                    keyboardType="numeric"
                    placeholder="How many attended?"
                    placeholderTextColor="#94A3B8"
                  />
                  <TextInput
                    style={[styles.input, styles.multiline]}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    placeholder="Points raised, actions agreed (optional)"
                    placeholderTextColor="#94A3B8"
                  />
                  <View style={styles.formActions}>
                    <TouchableOpacity onPress={() => setRecording(null)}>
                      <Text style={styles.cancel}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => record(t)}>
                      <Text style={styles.save}>Save delivery</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity onPress={() => setRecording(t.id)}>
                  <Text style={styles.action}>Record that this was delivered</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FF' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0B1C30', marginLeft: 12 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  empty: { textAlign: 'center', color: '#737686', marginTop: 30 },

  deliveredBanner: {
    backgroundColor: '#ECFDF5', borderRadius: 10, padding: 10, marginBottom: 12,
    borderLeftWidth: 3, borderLeftColor: '#10B981',
  },
  deliveredText: { fontSize: 12, color: '#065F46', fontWeight: '600' },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.04,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFF7ED',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 14, fontWeight: '700', color: '#0B1C30' },
  sub: { fontSize: 11, color: '#737686', marginTop: 2 },
  dur: { fontSize: 11, color: '#F97316', fontWeight: '600', marginTop: 4 },

  action: { fontSize: 12, color: '#004AC6', fontWeight: '700', marginTop: 12 },
  done: { fontSize: 12, color: '#10B981', fontWeight: '700', marginTop: 12 },

  form: { marginTop: 12, gap: 8 },
  input: {
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, color: '#0B1C30',
  },
  multiline: { minHeight: 56, textAlignVertical: 'top' },
  formActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  cancel: { fontSize: 12, color: '#737686', fontWeight: '600' },
  save: { fontSize: 12, color: '#004AC6', fontWeight: '800' },
});
