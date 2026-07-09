import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenLayout, Card, Avatar } from '../components';
import { Colors } from '../theme/colors';
import { useAuth } from '../hooks/useAuth';

interface Props { navigation: any; }

export function ProfileScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ],
    );
  };

  const INFO_ROWS = [
    { icon: '🪪', label: 'Employee ID', value: user?.employee_id ?? '—' },
    { icon: '👤', label: 'Full Name', value: user?.name ?? '—' },
    { icon: '🎖️', label: 'Role', value: user?.role ?? 'HSE Supervisor' },
    { icon: '🏭', label: 'Site', value: user?.site ?? 'Houston Refinery' },
    { icon: '🏢', label: 'Department', value: user?.department ?? 'HSE' },
  ];

  const ACTION_ROWS = [
    {
      icon: '🔑', label: 'Change Password',
      onPress: () => Alert.alert('Change Password', 'This feature will be available soon.'),
    },
    {
      icon: '🔔', label: 'Notification Preferences',
      onPress: () => Alert.alert('Notifications', 'Notification settings coming soon.'),
    },
    {
      icon: '📊', label: 'My Reports',
      onPress: () => Alert.alert('Reports', 'Reports will be available soon.'),
    },
    {
      icon: '❓', label: 'Help & Support',
      onPress: () => Alert.alert('Help', 'Contact your system administrator for support.'),
    },
  ];

  return (
    <ScreenLayout>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar Card */}
        <View style={styles.avatarCard}>
          <Avatar name={user?.name ?? 'Supervisor'} size={76} />
          <Text style={styles.name}>{user?.name ?? 'Supervisor One'}</Text>
          <Text style={styles.roleText}>{user?.role ?? 'HSE Supervisor'}</Text>
          <View style={styles.activeBadge}>
            <View style={styles.activeDot} />
            <Text style={styles.activeText}>Active</Text>
          </View>
        </View>

        {/* Information */}
        <Text style={styles.sectionTitle}>Information</Text>
        <Card style={styles.infoCard}>
          {INFO_ROWS.map((row, i) => (
            <React.Fragment key={row.label}>
              <View style={styles.infoRow}>
                <Text style={styles.rowIcon}>{row.icon}</Text>
                <View style={styles.rowContent}>
                  <Text style={styles.rowLabel}>{row.label}</Text>
                  <Text style={styles.rowValue}>{row.value}</Text>
                </View>
              </View>
              {i < INFO_ROWS.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </Card>

        {/* Account Actions */}
        <Text style={styles.sectionTitle}>Account</Text>
        <Card style={styles.infoCard}>
          {ACTION_ROWS.map((row, i) => (
            <React.Fragment key={row.label}>
              <TouchableOpacity style={styles.actionRow} onPress={row.onPress} activeOpacity={0.72}>
                <Text style={styles.rowIcon}>{row.icon}</Text>
                <Text style={styles.actionLabel}>{row.label}</Text>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
              {i < ACTION_ROWS.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </Card>

        <Text style={styles.version}>SafetyCore HSE Supervisor  v1.0.0</Text>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Text style={{ fontSize: 20 }}>🚪</Text>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.white },
  scroll: { padding: 16 },
  avatarCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginBottom: 22,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  name: { fontSize: 22, fontWeight: '800', color: Colors.textDark, marginTop: 14 },
  roleText: { fontSize: 14, color: Colors.textMuted, marginTop: 4 },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.successBg,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginTop: 12,
  },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  activeText: { fontSize: 12, fontWeight: '600', color: Colors.success },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textDark, marginBottom: 10 },
  infoCard: { padding: 0, overflow: 'hidden', marginBottom: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  rowIcon: { fontSize: 20, width: 28 },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 11, color: Colors.textMuted },
  rowValue: { fontSize: 15, fontWeight: '600', color: Colors.textDark, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.divider, marginHorizontal: 14 },
  actionRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  actionLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: Colors.textDark },
  chevron: { fontSize: 22, color: Colors.textLight, fontWeight: '300' },
  version: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'center',
    marginVertical: 16,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.criticalBg,
    borderRadius: 14,
    paddingVertical: 14,
  },
  signOutText: { fontSize: 16, fontWeight: '700', color: Colors.critical },
});
