import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../api/client';

interface Topic { id: string; title: string; description: string; minutes: number; }

export function ToolboxTalkManagementScreen({ navigation }: any) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

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
        {loading && topics.length === 0 ? (
          <ActivityIndicator color="#004AC6" style={{ marginTop: 30 }} />
        ) : topics.length === 0 ? (
          <Text style={styles.empty}>No toolbox talk topics available.</Text>
        ) : (
          topics.map((t) => (
            <View key={t.id} style={styles.card}>
              <View style={styles.iconBox}>
                <Ionicons name="megaphone-outline" size={20} color="#F97316" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={2}>{t.title}</Text>
                {!!t.description && <Text style={styles.sub} numberOfLines={1}>{t.description}</Text>}
                <Text style={styles.dur}>Approx. {t.minutes} mins</Text>
              </View>
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
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.04 },
  iconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 14, fontWeight: '700', color: '#0B1C30' },
  sub: { fontSize: 11, color: '#737686', marginTop: 2 },
  dur: { fontSize: 11, color: '#F97316', fontWeight: '600', marginTop: 4 },
});
