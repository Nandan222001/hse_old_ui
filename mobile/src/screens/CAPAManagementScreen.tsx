import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function CAPAManagementScreen({ navigation }: any) {
  const tasks = [
    { id: '1', action: 'Install guardrails on scaffolding Platform 3', priority: 'High', deadline: 'Today, 18:00' },
    { id: '2', action: 'Replace faulty gas sensor in Terminal Tank Farm', priority: 'High', deadline: 'Tomorrow' }
  ];

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0B1C30" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Corrective Actions (CAPA)</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {tasks.map(t => (
          <View key={t.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.title}>{t.action}</Text>
              <View style={styles.pBadge}>
                <Text style={styles.pBadgeText}>{t.priority}</Text>
              </View>
            </View>
            <Text style={styles.sub}>Deadline: {t.deadline}</Text>
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 12 },
  title: { fontSize: 13, fontWeight: '700', color: '#0B1C30', flex: 1 },
  pBadge: { backgroundColor: '#FEF2F2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  pBadgeText: { fontSize: 10, fontWeight: '700', color: '#EF4444' },
  sub: { fontSize: 11, color: '#737686' }
});
