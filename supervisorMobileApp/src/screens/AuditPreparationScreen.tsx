import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function AuditPreparationScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0B1C30" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Audit Preparation</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.title}>External Audit - Q3 2026</Text>
          <Text style={styles.sub}>Scheduled date: 15 Sep 2026</Text>
          
          <Text style={styles.progressHeader}>Document verification status (85% completed)</Text>
          <View style={styles.barWrap}>
            <View style={styles.bar} />
          </View>
        </View>
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
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.04 },
  title: { fontSize: 16, fontWeight: '700', color: '#0B1C30' },
  sub: { fontSize: 12, color: '#737686', marginTop: 4, marginBottom: 20 },
  progressHeader: { fontSize: 11, fontWeight: '600', color: '#737686', marginBottom: 8 },
  barWrap: { height: 8, backgroundColor: '#EEF2FF', borderRadius: 4, overflow: 'hidden' },
  bar: { width: '85%', height: '100%', backgroundColor: '#004AC6' }
});
