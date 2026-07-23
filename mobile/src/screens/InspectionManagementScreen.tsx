import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../api/client';

interface Inspection {
  id: string;
  title: string;
  date: string;
  rating: number;
  followUp: boolean;
}

function ratingMeta(rating: number, followUp: boolean) {
  if (rating >= 4 && !followUp) return { label: 'Passed', color: '#16A34A', bg: '#F0FDF4' };
  if (rating >= 3) return { label: 'Needs Follow-up', color: '#F97316', bg: '#FFF7ED' };
  return { label: 'Failed', color: '#EF4444', bg: '#FEF2F2' };
}

export function InspectionManagementScreen({ navigation }: any) {
  const [list, setList] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    apiClient.get('/safety-walks/')
      .then((res: any) => {
        const rows = Array.isArray(res.data) ? res.data : (res.data?.items ?? []);
        const mapped: Inspection[] = rows.map((r: any) => ({
          id: String(r.id),
          title: `${r.inspection_type || 'Safety'} Inspection`,
          date: r.inspection_date_time ? new Date(r.inspection_date_time).toLocaleDateString() : '—',
          rating: Number(r.compliance_rating) || 0,
          followUp: String(r.follow_up_required).toLowerCase() === 'yes',
        }));
        mapped.sort((a, b) => (a.date < b.date ? 1 : -1));
        setList(mapped.slice(0, 40));
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0B1C30" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inspections</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} colors={['#004AC6']} />}
      >
        {loading && list.length === 0 ? (
          <ActivityIndicator color="#004AC6" style={{ marginTop: 30 }} />
        ) : list.length === 0 ? (
          <Text style={styles.empty}>No inspections recorded yet.</Text>
        ) : (
          list.map((i) => {
            const meta = ratingMeta(i.rating, i.followUp);
            return (
              <View key={i.id} style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{i.title}</Text>
                  <Text style={styles.sub}>{i.date} · Compliance {i.rating}/5</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: meta.bg }]}>
                  <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
                </View>
              </View>
            );
          })
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
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.04 },
  title: { fontSize: 14, fontWeight: '700', color: '#0B1C30' },
  sub: { fontSize: 11, color: '#737686', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '700' },
});
