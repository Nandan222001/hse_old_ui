import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { ScreenLayout } from '../components/layout/ScreenLayout';
import { Card } from '../components/cards/Card';
import { Avatar } from '../components/display/Avatar';
import { Colors } from '../theme/colors';
import { useAuth } from '../hooks/useAuth';
import { sosService } from '../services/sosService';

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const [sosLoading, setSosLoading] = useState(false);

  const handleSOS = () => {
    Alert.alert(
      '🚨 Emergency SOS',
      'This will immediately alert your supervisors and the safety team.\n\nOnly use in a genuine emergency.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'SEND SOS NOW',
          style: 'destructive',
          onPress: async () => {
            setSosLoading(true);
            try {
              const res = await sosService.triggerSOS({ message: 'Emergency assistance required' });
              Alert.alert(
                '✅ SOS Dispatched',
                `Your emergency alert has been sent.\nRef: ${res.sos_ref}\n\nStay calm — help is on the way.`,
              );
            } catch {
              Alert.alert('Failed to Send', 'Could not reach the server. Please call emergency services directly.');
            } finally {
              setSosLoading(false);
            }
          },
        },
      ],
    );
  };
  const name       = user?.name       || 'Worker';
  const empId      = user?.employee_id || '—';
  const role       = user?.role        || 'Worker';
  const site       = user?.site        || '';
  const department = user?.department  || '';

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.replace('Login');
        },
      },
    ]);
  };

  const MENU = [
    {
      icon: '🎓',
      label: 'Safety Training',
      sublabel: 'View assigned courses',
      onPress: () => navigation.navigate('SafetyTraining'),
    },
    {
      icon: '📋',
      label: 'My Permits',
      sublabel: 'Active & past work permits',
      onPress: () => navigation.navigate('Permits'),
    },
    {
      icon: '🔔',
      label: 'Notifications',
      sublabel: 'Safety alerts & updates',
      onPress: () => navigation.navigate('Notifications'),
    },
    {
      icon: '🔑',
      label: 'Change Password',
      sublabel: 'Update your login PIN',
      onPress: () => navigation.navigate('ChangePassword'),
    },
    {
      icon: '⚙️',
      label: 'Settings',
      sublabel: 'App preferences',
      onPress: () => Alert.alert('Coming Soon', 'App settings will be available in a future update.'),
    },
  ];

  return (
    <ScreenLayout>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Avatar name={name} size={80} />
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.empId}>Employee ID: {empId}</Text>
          <Text style={styles.role}>{role}</Text>
          {(site || department) ? (
            <View style={styles.siteTag}>
              <Text style={styles.siteTagText}>📍 {[site, department].filter(Boolean).join(' • ')}</Text>
            </View>
          ) : null}
        </View>

        {/* Menu */}
        <Card style={styles.menuCard} elevation={1}>
          {MENU.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.menuRow, i < MENU.length - 1 && styles.menuDivider]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <View style={styles.menuTextGroup}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuSublabel}>{item.sublabel}</Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </Card>

        {/* Emergency SOS */}
        <TouchableOpacity
          style={[styles.sosCard, sosLoading && { opacity: 0.7 }]}
          onPress={handleSOS}
          activeOpacity={0.85}
          disabled={sosLoading}
        >
          <View style={styles.sosLeft}>
            <Text style={styles.sosIcon}>🆘</Text>
            <View>
              <Text style={styles.sosTitle}>Emergency SOS</Text>
              <Text style={styles.sosSub}>Alert supervisors immediately</Text>
            </View>
          </View>
          {sosLoading
            ? <ActivityIndicator color={Colors.white} />
            : <Text style={styles.sosArrow}>›</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20,
    backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.textDark },
  scroll: { flex: 1, padding: 16 },

  profileCard: {
    backgroundColor: Colors.primary, borderRadius: 20, padding: 24,
    alignItems: 'center', marginBottom: 16,
  },
  name: { fontSize: 20, fontWeight: '800', color: Colors.white, marginTop: 14, marginBottom: 4 },
  empId: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 4 },
  role: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '500', marginBottom: 12 },
  siteTag: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  siteTagText: { color: Colors.white, fontSize: 12 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  menuCard: { padding: 0, overflow: 'hidden', marginBottom: 16 },
  menuRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  menuDivider: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  menuIcon: { fontSize: 22, width: 32 },
  menuTextGroup: { flex: 1 },
  menuLabel: { fontSize: 15, color: Colors.textDark, fontWeight: '600' },
  menuSublabel: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  menuArrow: { fontSize: 22, color: Colors.textLight },

  sosCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.critical, borderRadius: 14,
    paddingVertical: 16, paddingHorizontal: 18, marginBottom: 12,
    elevation: 3, shadowColor: Colors.critical, shadowOpacity: 0.35, shadowRadius: 6,
  },
  sosLeft:  { flexDirection: 'row', alignItems: 'center', gap: 14 },
  sosIcon:  { fontSize: 28 },
  sosTitle: { color: Colors.white, fontWeight: '800', fontSize: 15 },
  sosSub:   { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 },
  sosArrow: { color: Colors.white, fontSize: 26, fontWeight: '300' },

  logoutBtn: {
    borderWidth: 2, borderColor: Colors.critical, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  logoutText: { color: Colors.critical, fontWeight: '700', fontSize: 15 },
});
