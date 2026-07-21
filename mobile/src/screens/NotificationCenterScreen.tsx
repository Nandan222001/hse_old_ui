import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

export function NotificationCenterScreen({ navigation }: any) {
  const list = [
    { id: '1', title: 'Permit Expiring Soon', body: 'Hot Work Permit for welding in Sector 4 will expire in 30 minutes.', type: 'warning', time: '10 mins ago' },
    { id: '2', title: 'New Safety Observation', body: 'Worker Alex Curry reported missing safety harness near Platform B.', type: 'critical', time: '35 mins ago' },
    { id: '3', title: 'Shift Started Successfully', body: 'Day Shift A has been initialized with 14 active personnel.', type: 'info', time: '5h ago' }
  ];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0B1C30" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {list.map(item => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.titleRow}>
                <Ionicons 
                  name={item.type === 'critical' ? 'alert-circle' : item.type === 'warning' ? 'warning' : 'information-circle'} 
                  size={18} 
                  color={item.type === 'critical' ? '#EF4444' : item.type === 'warning' ? '#F97316' : '#004AC6'} 
                />
                <Text style={styles.cardTitle}>{item.title}</Text>
              </View>
              <Text style={styles.time}>{item.time}</Text>
            </View>
            <Text style={styles.body}>{item.body}</Text>
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
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0B1C30', marginLeft: 12 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#0B1C30' },
  time: { fontSize: 11, color: '#A8AFBF' },
  body: { fontSize: 13, color: '#434655', lineHeight: 18 }
});
