import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function DocumentManagementScreen({ navigation }: any) {
  const docs = [
    { id: '1', title: 'HSE Safety Guidelines Manual 2026.pdf', size: '4.2 MB' },
    { id: '2', title: 'Emergency evacuation procedures map.pdf', size: '1.8 MB' },
    { id: '3', title: 'Crane operating safety regulations.pdf', size: '2.5 MB' }
  ];

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0B1C30" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Document Library</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {docs.map(d => (
          <View key={d.id} style={styles.card}>
            <View style={styles.docLeft}>
              <Ionicons name="document-attach" size={24} color="#004AC6" />
              <View>
                <Text style={styles.title}>{d.title}</Text>
                <Text style={styles.size}>{d.size}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.dlBtn}>
              <Ionicons name="cloud-download-outline" size={18} color="#004AC6" />
            </TouchableOpacity>
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
  docLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  title: { fontSize: 13, fontWeight: '700', color: '#0B1C30', marginRight: 16 },
  size: { fontSize: 11, color: '#737686', marginTop: 2 },
  dlBtn: { padding: 8, backgroundColor: '#EEF2FF', borderRadius: 8 }
});
