import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function ToolboxTalkManagementScreen({ navigation }: any) {
  const topics = [
    { id: '1', title: 'Height safety & harness checks', duration: '15 mins', completed: true },
    { id: '2', title: 'Welding hot work gas levels', duration: '10 mins', completed: true },
    { id: '3', title: 'Emergency evacuation assembly points', duration: '20 mins', completed: false }
  ];

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0B1C30" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Toolbox Talks</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {topics.map(t => (
          <View key={t.id} style={styles.card}>
            <View>
              <Text style={styles.title}>{t.title}</Text>
              <Text style={styles.sub}>Required duration: {t.duration}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: t.completed ? '#F0FDF4' : '#FFF7ED' }]}>
              <Text style={[styles.badgeText, { color: t.completed ? '#16A34A' : '#F97316' }]}>
                {t.completed ? 'Completed' : 'Pending'}
              </Text>
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
