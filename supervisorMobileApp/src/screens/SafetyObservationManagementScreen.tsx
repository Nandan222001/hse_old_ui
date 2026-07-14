import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function SafetyObservationManagementScreen({ navigation }: any) {
  const obs = [
    { id: '1', title: 'Unsecured Scaffolding', severity: 'High', reporter: 'Alex Curry', location: 'Platform 3' },
    { id: '2', title: 'Improper PPE usage', severity: 'Medium', reporter: 'David Miller', location: 'Gate 2 Entrance' }
  ];

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0B1C30" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Safety Observations</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {obs.map(o => (
          <View key={o.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.title}>{o.title}</Text>
              <View style={[styles.badge, { backgroundColor: o.severity === 'High' ? '#FEF2F2' : '#FFF7ED' }]}>
                <Text style={[styles.badgeText, { color: o.severity === 'High' ? '#EF4444' : '#F97316' }]}>{o.severity}</Text>
              </View>
            </View>
            <Text style={styles.meta}>Reporter: {o.reporter} · Site: {o.location}</Text>
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
  meta: { fontSize: 11, color: '#737686' }
});
