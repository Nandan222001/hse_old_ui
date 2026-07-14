import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function InspectionManagementScreen({ navigation }: any) {
  const list = [
    { id: '1', title: 'Sector 4 Crane Hydraulics', date: 'Today, 08:30 AM', status: 'Passed' },
    { id: '2', title: 'Tank Farm Gas Detectors', date: 'Yesterday', status: 'Failed' }
  ];

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0B1C30" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inspections</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {list.map(i => (
          <View key={i.id} style={styles.card}>
            <View>
              <Text style={styles.title}>{i.title}</Text>
              <Text style={styles.sub}>{i.date}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: i.status === 'Passed' ? '#F0FDF4' : '#FEF2F2' }]}>
              <Text style={[styles.badgeText, { color: i.status === 'Passed' ? '#16A34A' : '#EF4444' }]}>{i.status}</Text>
            </View>
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
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.04 },
  title: { fontSize: 14, fontWeight: '700', color: '#0B1C30' },
  sub: { fontSize: 11, color: '#737686', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '700' }
});
