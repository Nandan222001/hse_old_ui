import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { Input, PINInput, LoadingOverlay } from '../components';
import { Colors } from '../theme/colors';

const LOGO_IMAGE = require('../../assets/icon.png');

export function LoginScreen() {
  const { login, isLoading, error, clearError } = useAuth();
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');

  const handleEmployeeId = (text: string) => {
    setEmployeeId(text);
    if (error) clearError();
  };

  const handlePassword = (text: string) => {
    setPassword(text);
    if (error) clearError();
  };

  const handleLogin = () => {
    if (!employeeId.trim() || !password.trim()) return;
    login({ employee_id: employeeId.trim(), password });
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <LoadingOverlay visible={isLoading} message="Signing in..." />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Image source={LOGO_IMAGE} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.appName}>SafetyCore HSE</Text>
          <Text style={styles.tagline}>Enterprise Site Management</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Supervisor Portal Login</Text>

          <Input
            label="Employee ID"
            placeholder="e.g. ENG-0442-TX"
            value={employeeId}
            onChangeText={handleEmployeeId}
            autoCapitalize="characters"
            autoCorrect={false}
          />

          <PINInput
            label="PIN or Password"
            placeholder="Enter your PIN or password"
            value={password}
            onChangeText={handlePassword}
            keyboardType="default"
          />

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={handleLogin}
            style={[
              styles.loginBtn,
              (!employeeId || !password || isLoading) && styles.loginBtnDisabled,
            ]}
            disabled={!employeeId || !password || isLoading}
            activeOpacity={0.85}
          >
            <Text style={styles.loginBtnText}>🔐  Log In to Site</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerTop}>🔒  SECURE SUPERVISOR ACCESS PROTOCOL</Text>
          <Text style={styles.footerBottom}>Site: Houston Refinery · Terminal 4</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 14,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.criticalBg,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  errorIcon: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 13,
    color: Colors.critical,
    flex: 1,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 8,
    marginBottom: 4,
  },
  loginBtnDisabled: {
    opacity: 0.55,
  },
  loginBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
  },
  footerTop: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  footerBottom: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
  },
});
