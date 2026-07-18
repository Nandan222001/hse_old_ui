import React, { useState, useEffect } from 'react';
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
import { Ionicons } from '@expo/vector-icons';

const LOGO_IMAGE = require('../../assets/icon.png');

export function LoginScreen() {
  const { login, isLoading, error, clearError, selectedRole, setSelectedRole } = useAuth();
  const [employeeId, setEmployeeId] = useState('ENG-0442-TX');
  const [password, setPassword] = useState('password');

  // Initialize with supervisor if none is selected
  useEffect(() => {
    if (!selectedRole) {
      setSelectedRole('supervisor');
    }
  }, [selectedRole, setSelectedRole]);

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
    login({
      employee_id: employeeId.trim(),
      password: password,
      pin: password, // Send both pin and password for simplicity
    });
  };

  const currentRole = selectedRole || 'supervisor';

  if (currentRole === 'auditor') {
    return (
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
        <LoadingOverlay visible={isLoading} message="Authorizing Entry..." />

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.auditorLogoWrap}>
              <Ionicons name="menu" size={28} color="#FFFFFF" />
              <View style={styles.searchBadge}>
                <Ionicons name="search" size={14} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.auditorTitle}>Site Audit</Text>
            <Text style={styles.auditorTagline}>regulatory Compliance & verification portal</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {/* Choose Login Access */}
            <View style={styles.roleContainer}>
              <Text style={styles.roleLabel}>Choose Login Access</Text>
              <View style={styles.roleTabRow}>
                {(['manager', 'supervisor', 'worker', 'auditor'] as const).map((role) => {
                  const active = currentRole === role;
                  return (
                    <TouchableOpacity
                      key={role}
                      style={[styles.roleTab, active && styles.roleTabActive]}
                      onPress={() => {
                        setSelectedRole(role);
                        clearError();
                        if (role === 'manager') {
                          setEmployeeId('8842-TX');
                          setPassword('password');
                        } else if (role === 'supervisor') {
                          setEmployeeId('ENG-0442-TX');
                          setPassword('password');
                        } else if (role === 'auditor') {
                          setEmployeeId('auditor01');
                          setPassword('password');
                        } else {
                          setEmployeeId('8842-TX');
                          setPassword('1234');
                        }
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.roleTabText, active && styles.roleTabTextActive]}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Inputs */}
            <Input
              label="EMPLOYEE ID"
              placeholder="HSE-000000"
              value={employeeId}
              onChangeText={handleEmployeeId}
              autoCapitalize="characters"
              autoCorrect={false}
            />

            <View style={styles.passLabelRow}>
              <Text style={styles.inputLabelText}>PASSWORD</Text>
              <TouchableOpacity><Text style={styles.forgotLink}>Forgot Password?</Text></TouchableOpacity>
            </View>
            <PINInput
              label=""
              placeholder="••••••••"
              value={password}
              onChangeText={handlePassword}
              secureTextEntry
            />

            {/* MFA Verification */}
            <View style={styles.mfaCard}>
              <View style={styles.mfaHeader}>
                <Ionicons name="shield" size={16} color="#2563EB" />
                <Text style={styles.mfaTitle}>MFA Verification</Text>
              </View>
              <Text style={styles.mfaDesc}>
                Enter the 6-digit code from your authenticator app.
              </Text>
              <View style={styles.mfaInputsRow}>
                <View style={styles.mfaBox}><Text style={styles.mfaTextVal}>1</Text></View>
                <View style={styles.mfaBox}><Text style={styles.mfaTextVal}>2</Text></View>
                <View style={styles.mfaBox}><Text style={styles.mfaTextVal}>3</Text></View>
                <Text style={styles.mfaDash}>-</Text>
                <View style={styles.mfaBox}><Text style={styles.mfaTextVal}>4</Text></View>
                <View style={styles.mfaBox}><Text style={styles.mfaTextVal}>5</Text></View>
                <View style={styles.mfaBox}><Text style={styles.mfaTextVal}>6</Text></View>
              </View>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Authorize Entry */}
            <TouchableOpacity
              onPress={handleLogin}
              style={[
                styles.authorizeBtn,
                (!employeeId || !password || isLoading) && styles.authorizeBtnDisabled,
              ]}
              disabled={!employeeId || !password || isLoading}
              activeOpacity={0.85}
            >
              <Text style={styles.authorizeBtnText}>Authorize Entry</Text>
              <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.orDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* QR Login */}
            <TouchableOpacity style={styles.qrBtn} activeOpacity={0.8}>
              <Ionicons name="qr-code-outline" size={16} color="#2563EB" />
              <Text style={styles.qrBtnText}>QR Login</Text>
            </TouchableOpacity>
          </View>

          {/* Disclaimer Alert */}
          <View style={styles.disclaimerBox}>
            <Ionicons name="information-circle-outline" size={18} color="#475569" style={{ marginTop: 2 }} />
            <Text style={styles.disclaimerText}>
              This is a restricted federal information system. Unauthorized access is prohibited. All activity is logged and monitored for compliance.
            </Text>
          </View>

          {/* Footer Links */}
          <View style={styles.auditorFooterLinks}>
            <TouchableOpacity style={styles.footerLinkItem}>
              <Ionicons name="help-circle-outline" size={14} color="#475569" />
              <Text style={styles.footerLinkText}>Auditor Support</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.footerLinkItem}>
              <Ionicons name="shield-checkmark-outline" size={14} color="#475569" />
              <Text style={styles.footerLinkText}>Security Policy</Text>
            </TouchableOpacity>
          </View>

          {/* System status */}
          <View style={styles.systemStatusRow}>
            <View style={styles.statusLeft}>
              <View style={styles.statusGreenDot} />
              <Text style={styles.statusSystemText}>System Status: Optimal</Text>
            </View>
            <View style={styles.statusRight}>
              <Text style={styles.statusVersion}>v4.8.2-PRO</Text>
              <Text style={styles.statusCopyright}>© 2024 Industrial Integrity Systems</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

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
          <Text style={styles.tagline}>Unified Enterprise Safety Portal</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign In to Portal</Text>

          {/* Role Selection Tabs */}
          <View style={styles.roleContainer}>
            <Text style={styles.roleLabel}>Choose Login Access</Text>
            <View style={styles.roleTabRow}>
              {(['manager', 'supervisor', 'worker', 'auditor'] as const).map((role) => {
                const active = currentRole === role;
                return (
                  <TouchableOpacity
                    key={role}
                    style={[styles.roleTab, active && styles.roleTabActive]}
                    onPress={() => {
                      setSelectedRole(role);
                      clearError();
                      // Pre-fill credentials based on selection for fast testing
                      if (role === 'manager') {
                        setEmployeeId('8842-TX');
                        setPassword('password');
                      } else if (role === 'supervisor') {
                        setEmployeeId('ENG-0442-TX');
                        setPassword('password');
                      } else if (role === 'auditor') {
                        setEmployeeId('auditor01');
                        setPassword('password');
                      } else {
                        setEmployeeId('8842-TX');
                        setPassword('1234');
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.roleTabText, active && styles.roleTabTextActive]}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <Input
            label="Employee ID"
            placeholder={
              currentRole === 'manager'
                ? 'e.g. 8842-TX'
                : currentRole === 'supervisor'
                ? 'e.g. ENG-0442-TX'
                : 'e.g. 8842-TX'
            }
            value={employeeId}
            onChangeText={handleEmployeeId}
            autoCapitalize="characters"
            autoCorrect={false}
          />

          <PINInput
            label={currentRole === 'worker' ? 'PIN Code' : 'PIN or Password'}
            placeholder={
              currentRole === 'worker' ? 'Enter your 4-digit PIN' : 'Enter your password'
            }
            value={password}
            onChangeText={handlePassword}
            keyboardType={currentRole === 'worker' ? 'numeric' : 'default'}
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
            <Ionicons name="lock-closed" size={16} color={Colors.white} />
            <Text style={styles.loginBtnText}>Log In as {currentRole.toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <Ionicons name="lock-closed-outline" size={11} color={Colors.textMuted} style={{ marginRight: 5 }} />
            <Text style={styles.footerTop}>SECURE ACCESS SECURITY PROTOCOL</Text>
          </View>
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
    marginBottom: 24,
  },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
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
    marginBottom: 16,
    textAlign: 'center',
  },
  roleContainer: {
    marginBottom: 20,
  },
  roleLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  roleTabRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  roleTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  roleTabActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  roleTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  roleTabTextActive: {
    color: '#FFFFFF',
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
    fontSize: 15,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerTop: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  footerBottom: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 4,
  },
  auditorLogoWrap: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    elevation: 3,
  },
  searchBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  auditorTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2563EB',
  },
  auditorTagline: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  passLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: -6,
  },
  inputLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  forgotLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  mfaCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 16,
    marginTop: 14,
    marginBottom: 14,
  },
  mfaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  mfaTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  mfaDesc: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    lineHeight: 16,
    marginBottom: 14,
  },
  mfaInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mfaBox: {
    width: 32,
    height: 38,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mfaTextVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  mfaDash: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
  },
  authorizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 14,
  },
  authorizeBtnDisabled: {
    opacity: 0.55,
  },
  authorizeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  orText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
  },
  qrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
    borderRadius: 12,
    paddingVertical: 12,
  },
  qrBtnText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '800',
  },
  disclaimerBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 12,
    padding: 12,
    marginTop: 20,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
    lineHeight: 16,
  },
  auditorFooterLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 20,
    marginBottom: 20,
  },
  footerLinkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  systemStatusRow: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 16,
    marginTop: 10,
    alignItems: 'center',
    gap: 8,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusSystemText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  statusRight: {
    alignItems: 'center',
    gap: 4,
  },
  statusVersion: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  statusCopyright: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
});
