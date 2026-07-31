import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity,
} from 'react-native';
import { MapPin, AlertTriangle, Zap, Wrench, ShieldAlert, FileText, ChevronRight } from 'lucide-react-native';
import type { ScreenProps } from '../types';
import { apiClient } from '../../../api/client';

function cellColor(v: number, max: number) {
  if (max <= 0) return '#DBEAFE';
  const r = v / max;
  if (r >= 0.66) return '#DC2626';
  if (r >= 0.33) return '#F97316';
  if (r > 0) return '#2563EB';
  return '#E2E8F0';
}

export function MgrRisk({ setCurrentScreen }: ScreenProps) {
  const [zones, setZones] = useState<{ zone: string; value: number }[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    apiClient.get('/analytics/risk-summary')
      .then((r: any) => { setZones(r.data?.zone_risk ?? []); setTasks(r.data?.task_rows ?? []); })
      .catch(() => { setZones([]); setTasks([]); })
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const max = Math.max(1, ...zones.map((z) => z.value));
  // Cell width adapts to how many zones exist so it never looks like a broken grid.
  const cellWidth = zones.length <= 1 ? '100%' : zones.length === 2 ? '48%' : '31.5%';

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} colors={['#0B3D91']} />}
    >
      <Text style={styles.title}>Risk Heatmap</Text>
      <View style={styles.subRow}>
        <Text style={styles.sub}>Live Site Overview</Text>
        <View style={styles.locRow}><MapPin size={13} color="#0B3D91" /><Text style={styles.loc}>Site Zones</Text></View>
      </View>

      {/* Manager-owned registers */}
      <View style={styles.navRow}>
        <TouchableOpacity style={styles.navCard} onPress={() => setCurrentScreen('hazard_register')}>
          <ShieldAlert size={18} color="#0B3D91" />
          <Text style={styles.navText}>Hazard Register</Text>
          <ChevronRight size={16} color="#94A3B8" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navCard} onPress={() => setCurrentScreen('policy_management')}>
          <FileText size={18} color="#0B3D91" />
          <Text style={styles.navText}>Policies</Text>
          <ChevronRight size={16} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* Heatmap grid */}
      {loading && zones.length === 0 ? (
        <ActivityIndicator color="#0B3D91" style={{ marginVertical: 30 }} />
      ) : (
        <>
          {zones.length === 0 ? (
            <View style={styles.noHeat}><Text style={styles.noHeatText}>No zone risk data available.</Text></View>
          ) : (
            <View style={styles.heatGrid}>
              {zones.map((z, i) => (
                <View key={i} style={[styles.heatCell, { width: cellWidth, backgroundColor: cellColor(z.value, max) }]}>
                  <Text style={styles.heatZone} numberOfLines={2}>{z.zone}</Text>
                  <Text style={styles.heatVal}>{z.value}</Text>
                  <Text style={styles.heatUnit}>incidents</Text>
                </View>
              ))}
            </View>
          )}
          <View style={styles.legend}>
            <View style={styles.legItem}><View style={[styles.dot, { backgroundColor: '#DC2626' }]} /><Text style={styles.legText}>High risk</Text></View>
            <View style={styles.legItem}><View style={[styles.dot, { backgroundColor: '#F97316' }]} /><Text style={styles.legText}>Medium</Text></View>
            <View style={styles.legItem}><View style={[styles.dot, { backgroundColor: '#2563EB' }]} /><Text style={styles.legText}>Low</Text></View>
          </View>

          {/* Critical activities */}
          <View style={styles.critHead}>
            <Text style={styles.section}>Critical Activities</Text>
            {tasks.length > 0 && (
              <View style={styles.critBadge}><Text style={styles.critBadgeText}>{tasks.length} High Alert</Text></View>
            )}
          </View>
          {tasks.length === 0 ? (
            <Text style={styles.empty}>No open risk tasks.</Text>
          ) : (
            tasks.slice(0, 6).map((t, i) => {
              const st = String(t.status || '').toLowerCase();
              const crit = st.includes('red') || st.includes('critical') || st.includes('overdue');
              const amber = st.includes('amber') || st.includes('progress');
              const color = crit ? '#DC2626' : amber ? '#F97316' : '#16A34A';
              const bg = crit ? '#FEE2E2' : amber ? '#FFEDD5' : '#DCFCE7';
              return (
                <View key={t.id || i} style={styles.actCard}>
                  <View style={[styles.actIcon, { backgroundColor: bg }]}>
                    {crit ? <AlertTriangle size={18} color={color} /> : amber ? <Zap size={18} color={color} /> : <Wrench size={18} color={color} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.actTitle} numberOfLines={1}>{t.desc || `Task ${t.id}`}</Text>
                    <Text style={styles.actSub} numberOfLines={1}>{[t.owner, t.due].filter(Boolean).join(' · ')}</Text>
                  </View>
                  <View style={[styles.actTag, { backgroundColor: bg }]}>
                    <Text style={[styles.actTagText, { color }]}>{crit ? 'CRITICAL' : amber ? 'MODERATE' : 'LOW'}</Text>
                  </View>
                </View>
              );
            })
          )}
        </>
      )}
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  navRow: { gap: 10, marginBottom: 18 },
  navCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  navText: { flex: 1, fontSize: 14, fontWeight: '700', color: '#0B3D91' },
  scroll: { padding: 20, paddingBottom: 30 },
  title: { fontSize: 22, fontWeight: '800', color: '#0B3D91', marginBottom: 4 },
  subRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sub: { fontSize: 13, color: '#737686' },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  loc: { fontSize: 13, fontWeight: '700', color: '#0B3D91' },
  heatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  heatCell: { minHeight: 96, borderRadius: 12, padding: 12, justifyContent: 'space-between' },
  heatZone: { color: 'rgba(255,255,255,0.95)', fontWeight: '700', fontSize: 12 },
  heatVal: { color: '#FFFFFF', fontWeight: '800', fontSize: 26 },
  heatUnit: { color: 'rgba(255,255,255,0.8)', fontSize: 10, marginTop: -2 },
  noHeat: { backgroundColor: '#EAF0FB', borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 12 },
  noHeatText: { color: '#63739B', fontSize: 13 },
  legend: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  legItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legText: { fontSize: 12, color: '#737686' },
  section: { fontSize: 16, fontWeight: '800', color: '#0B1C30', marginBottom: 12, marginTop: 4 },
  zoneRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#EEF2F7' },
  zoneName: { fontSize: 13, color: '#0B1C30', fontWeight: '600', flex: 1, marginRight: 8 },
  zoneVal: { fontSize: 14, fontWeight: '800' },
  critHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  critBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  critBadgeText: { fontSize: 11, fontWeight: '800', color: '#DC2626' },
  empty: { color: '#737686', textAlign: 'center', marginTop: 12 },
  actCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#EEF2F7' },
  actIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actTitle: { fontSize: 14, fontWeight: '700', color: '#0B1C30' },
  actSub: { fontSize: 12, color: '#737686', marginTop: 2 },
  actTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  actTagText: { fontSize: 10, fontWeight: '800' },
});
