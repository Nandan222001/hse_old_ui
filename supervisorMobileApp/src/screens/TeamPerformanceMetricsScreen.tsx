import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function TeamPerformanceMetricsScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0B1C30" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Team Metrics</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Safety Compliance Index</Text>
          <Text style={styles.val}>96%</Text>
          <Text style={styles.desc}>Based on safety checklists and toolboxes completed.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Average PPE Compliance</Text>
          <Text style={styles.val}>98.5%</Text>
          <Text style={styles.desc}>Scanned automatically at terminal gates.</Text>
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
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.04 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#737686' },
  val: { fontSize: 32, fontWeight: '800', color: '#004AC6', marginTop: 12, marginBottom: 6 },
  desc: { fontSize: 12, color: '#434655', lineHeight: 18 }
});
