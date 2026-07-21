import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../components';

export function TeamManagementScreen({ navigation }: any) {
  const roster = [
    { id: '1', name: 'John Doe', role: 'Welder', status: 'Active', inducted: true },
    { id: '2', name: 'Alex Curry', role: 'Mechanical Tech', status: 'Active', inducted: true },
    { id: '3', name: 'Sarah Jenkins', role: 'Safety Inspector', status: 'On Break', inducted: true },
    { id: '4', name: 'David Miller', role: 'Electrician', status: 'Inactive', inducted: false }
  ];

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0B1C30" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Team Roster Management</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {roster.map(w => (
          <View key={w.id} style={styles.card}>
            <View style={styles.left}>
              <Avatar name={w.name} size={42} />
              <View style={styles.meta}>
                <Text style={styles.name}>{w.name}</Text>
                <Text style={styles.role}>{w.role}</Text>
              </View>
            </View>
            <View style={styles.right}>
              <View style={[styles.badge, { backgroundColor: w.status === 'Active' ? '#F0FDF4' : w.status === 'On Break' ? '#FFF7ED' : '#FEF2F2' }]}>
                <Text style={[styles.badgeText, { color: w.status === 'Active' ? '#16A34A' : w.status === 'On Break' ? '#F97316' : '#EF4444' }]}>{w.status}</Text>
              </View>
              {w.inducted && (
                <View style={styles.indBox}>
                  <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
                  <Text style={styles.indText}>Inducted</Text>
                </View>
              )}
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
  left: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  meta: { justifyContent: 'center' },
  name: { fontSize: 14, fontWeight: '700', color: '#0B1C30' },
  role: { fontSize: 11, color: '#737686', marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  indBox: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  indText: { fontSize: 10, color: '#16A34A', fontWeight: '600' }
});
