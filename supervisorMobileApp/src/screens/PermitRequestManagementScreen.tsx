import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function PermitRequestManagementScreen({ navigation }: any) {
  const handleAction = (act: string) => {
    Alert.alert("Permits", `Permit request has been ${act} successfully.`);
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0B1C30" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Permit Request</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.title}>Scaffolding Height Permit</Text>
          <Text style={styles.meta}>Zone: Structure C · Roof</Text>
          <Text style={styles.meta}>Worker: Sarah Jenkins</Text>
          <Text style={styles.meta}>Shift: Day Operations</Text>
          
          <Text style={styles.desc}>This permit covers mounting platform rails on Sector C roof area. High-altitude harness check has been completed.</Text>
        </View>

        <View style={styles.btnRow}>
          <TouchableOpacity style={[styles.btn, styles.rejectBtn]} onPress={() => handleAction('Rejected')}>
            <Text style={styles.rejectBtnText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.approveBtn]} onPress={() => handleAction('Approved')}>
            <Text style={styles.approveBtnText}>Approve & Sign</Text>
          </TouchableOpacity>
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
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.04 },
  title: { fontSize: 16, fontWeight: '800', color: '#0B1C30', marginBottom: 12 },
  meta: { fontSize: 12, color: '#737686', marginBottom: 6 },
  desc: { fontSize: 13, color: '#434655', lineHeight: 18, marginTop: 12, borderTopWidth: 1, borderColor: '#F1F5F9', paddingTop: 12 },
  btnRow: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  rejectBtn: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FCA5A5' },
  rejectBtnText: { color: '#EF4444', fontWeight: '700' },
  approveBtn: { backgroundColor: '#004AC6' },
  approveBtnText: { color: '#FFFFFF', fontWeight: '700' }
});
