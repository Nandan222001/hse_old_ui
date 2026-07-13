import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { useAuth } from '../hooks/useAuth';

const ROLE_INFO = [
  { role: 'Worker',      icon: '👷', color: '#1D4ED8', desc: 'Report incidents, near misses, view training' },
  { role: 'Supervisor',  icon: '🦺', color: '#15803D', desc: 'Tasks, checklists, shift reports' },
  { role: 'HSE Manager', icon: '🛡️', color: '#7C3AED', desc: 'Permits, compliance, full oversight' },
  { role: 'Auditor',     icon: '🔍', color: '#B45309', desc: 'Read-only reports and compliance view' },
];

export default function LoginScreen({ navigation }: any) {
  const [employeeId, setEmployeeId] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const { login, isLoading, error, isAuthenticated, mustChangePassword, clearError } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigation.replace(mustChangePassword ? 'ChangePassword' : 'Main', mustChangePassword ? { forced: true } : undefined);
    }
  }, [isAuthenticated, mustChangePassword]);

  useEffect(() => {
    if (error) Alert.alert('Login Failed', error, [{ text: 'OK', onPress: clearError }]);
  }, [error]);

  const handleLogin = async () => {
    if (!employeeId.trim() || !pin.trim()) {
      Alert.alert('Required', 'Please enter both Employee ID and PIN.');
      return;
    }
    await login({ employee_id: employeeId.trim(), pin: pin.trim() });
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoIcon}>🛡️</Text>
          </View>
          <Text style={styles.appName}>SafetyCore HSE</Text>
          <Text style={styles.tagline}>Enterprise Site Management</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Site Access Login</Text>

          <Input
            label="Employee ID"
            placeholder="e.g. 8842-TX"
            value={employeeId}
            onChangeText={setEmployeeId}
            autoCapitalize="characters"
            autoCorrect={false}
          />

          <Input
            label="PIN or Password"
            placeholder="Enter your PIN or password"
            value={pin}
            onChangeText={setPin}
            secureTextEntry={!showPin}
            rightIcon={showPin ? '🙈' : '👁️'}
            onRightIconPress={() => setShowPin(v => !v)}
          />

          <Button
            title="Log In to Site"
            onPress={handleLogin}
            isLoading={isLoading}
            style={{ marginTop: 8 }}
          />

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>YOUR ROLE DETERMINES YOUR ACCESS</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Role access guide */}
          <View style={styles.roleGrid}>
            {ROLE_INFO.map((r) => (
              <View key={r.role} style={[styles.roleCard, { borderColor: r.color + '30' }]}>
                <Text style={styles.roleCardIcon}>{r.icon}</Text>
                <Text style={[styles.roleCardTitle, { color: r.color }]}>{r.role}</Text>
                <Text style={styles.roleCardDesc}>{r.desc}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity>
            <Text style={styles.forgotLink}>Forgot access credentials?</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerTop}>🔒 SECURE GROUND ACCESS PROTOCOL</Text>
          <Text style={styles.footerBottom}>Role is assigned automatically by your credentials</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.primary },
  scroll: { flexGrow: 1, justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 40 },

  header: { alignItems: 'center', marginBottom: 32 },
  logoBox: {
    width: 72, height: 72, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  logoIcon: { fontSize: 36 },
  appName: { fontSize: 28, fontWeight: '800', color: Colors.white, letterSpacing: 0.5 },
  tagline: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4 },

  card: {
    backgroundColor: Colors.card, borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, elevation: 6,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: Colors.textDark, marginBottom: 20 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: 10, color: Colors.textMuted, marginHorizontal: 8, fontWeight: '700', textAlign: 'center', flex: 2 },
  forgotLink: { textAlign: 'center', color: Colors.blue, fontWeight: '600', fontSize: 14, marginTop: 16 },

  // Role access guide
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roleCard: {
    width: '47%', borderRadius: 12, borderWidth: 1.5,
    padding: 10, backgroundColor: '#FAFAFA',
  },
  roleCardIcon: { fontSize: 20, marginBottom: 4 },
  roleCardTitle: { fontSize: 12, fontWeight: '800', marginBottom: 2 },
  roleCardDesc: { fontSize: 10, color: '#6B7280', lineHeight: 14 },

  footer: { alignItems: 'center', marginTop: 32 },
  footerTop: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.55)', letterSpacing: 1 },
  footerBottom: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 4 },
});
