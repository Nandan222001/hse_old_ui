import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function SiteMonitoringOverviewScreen({ navigation }: any) {
  const sectors = [
    { id: '1', name: 'Sector 4 - Tank Farm', workers: 6, hazard: 'Medium' },
    { id: '2', name: 'Sector 3 - High Rise scaffolding', workers: 4, hazard: 'High' }
  ];

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0B1C30" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Site Monitoring</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {sectors.map(s => (
          <View key={s.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.title}>{s.name}</Text>
              <View style={[styles.badge, { backgroundColor: s.hazard === 'High' ? '#FEF2F2' : '#FFF7ED' }]}>
                <Text style={[styles.badgeText, { color: s.hazard === 'High' ? '#EF4444' : '#F97316' }]}>{s.hazard} Risk</Text>
              </View>
            </View>
            <Text style={styles.sub}>Active Personnel: {s.workers} workers on site</Text>
          </View>
        ))}
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
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.04 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 14, fontWeight: '700', color: '#0B1C30' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  sub: { fontSize: 11, color: '#737686' }
});
