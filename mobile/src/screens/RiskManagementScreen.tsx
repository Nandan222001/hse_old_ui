import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function RiskManagementScreen({ navigation }: any) {
  const risks = [
    { id: '1', hazard: 'High voltage lines - Crane movement safety', riskLevel: 'High', mitigation: 'Assigned spotter for crane, lines visually marked.' },
    { id: '2', hazard: 'Slip hazards on Platform C walkways', riskLevel: 'Medium', mitigation: 'Applied anti-slip compound, cleared water leakage.' }
  ];

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0B1C30" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Risk Management</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {risks.map(r => (
          <View key={r.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.hazardTitle}>{r.hazard}</Text>
              <View style={[styles.badge, { backgroundColor: r.riskLevel === 'High' ? '#FEF2F2' : '#FFF7ED' }]}>
                <Text style={[styles.badgeText, { color: r.riskLevel === 'High' ? '#EF4444' : '#F97316' }]}>{r.riskLevel}</Text>
              </View>
            </View>
            <Text style={styles.mitTitle}>Mitigation Measures:</Text>
            <Text style={styles.mitText}>{r.mitigation}</Text>
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 12 },
  hazardTitle: { fontSize: 13, fontWeight: '700', color: '#0B1C30', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  mitTitle: { fontSize: 11, fontWeight: '700', color: '#737686', marginTop: 4 },
  mitText: { fontSize: 12, color: '#434655', lineHeight: 18, marginTop: 2 }
});
