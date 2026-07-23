import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { teamProvisioningService, Department, TeamMember } from '../services/teamProvisioningService';

export default function AddWorkerScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [depts, setDepts] = useState<Department[]>([]);
  const [deptId, setDeptId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [members, setMembers] = useState<TeamMember[]>([]);

  const loadMembers = useCallback(() => {
    teamProvisioningService.members().then((r) => setMembers(r.items)).catch(() => {});
  }, []);

  useEffect(() => {
    teamProvisioningService.departments().then(setDepts).catch(() => {});
    loadMembers();
  }, [loadMembers]);

  const submit = async () => {
    if (!name.trim()) return Alert.alert('Missing', 'Enter the worker name.');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return Alert.alert('Missing', 'Enter a valid email.');
    try {
      setSubmitting(true);
      const res = await teamProvisioningService.addWorker({
        name: name.trim(), email: email.trim(), department_id: deptId ?? undefined,
      });
      Alert.alert(
        'Worker Added',
        `${res.name} can now log in.\n\nUsername: ${res.username}\nTemp password: ${res.temp_password}\n\n` +
        (res.email_sent ? 'An invite email was sent.' : 'Email could not be sent — share these credentials manually.'),
        [{ text: 'OK', onPress: () => { setName(''); setEmail(''); setDeptId(null); loadMembers(); } }],
      );
    } catch (e: any) {
      Alert.alert('Failed', e?.response?.data?.detail || 'Could not add the worker.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Worker</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput style={styles.input} placeholder="e.g. Alex Turing" placeholderTextColor="#94A3B8"
              value={name} onChangeText={setName} />

            <Text style={styles.label}>Email *</Text>
            <TextInput style={styles.input} placeholder="worker@company.com" placeholderTextColor="#94A3B8"
              value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

            <Text style={styles.label}>Department</Text>
            <View style={styles.chips}>
              {depts.map((d) => {
                const on = deptId === d.id;
                return (
                  <TouchableOpacity key={d.id} style={[styles.chip, on && styles.chipOn]} onPress={() => setDeptId(on ? null : d.id)}>
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{d.name}</Text>
                  </TouchableOpacity>
                );
              })}
              {depts.length === 0 && <Text style={styles.hint}>No departments found.</Text>}
            </View>

            <Text style={styles.note}>The worker gets an email invite with a temporary password to log in.</Text>

            <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.6 }]} onPress={submit} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Add Worker</Text>}
            </TouchableOpacity>
          </View>

          {members.length > 0 && (
            <>
              <Text style={styles.section}>My Workers ({members.length})</Text>
              <View style={styles.card}>
                {members.map((m, i) => (
                  <View key={m.id} style={[styles.memberRow, i === members.length - 1 && { borderBottomWidth: 0 }]}>
                    <View style={styles.avatar}><Text style={styles.avatarText}>{m.name.slice(0, 1).toUpperCase()}</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.memberName}>{m.name}</Text>
                      <Text style={styles.memberSub}>{m.email} · {m.username}</Text>
                    </View>
                    <View style={[styles.statusDot, { backgroundColor: m.active ? '#22C55E' : '#CBD5E1' }]} />
                  </View>
                ))}
              </View>
            </>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F6FA' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', paddingTop: 16, paddingBottom: 14, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  scroll: { padding: 16, paddingBottom: 60 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 12,
    paddingVertical: 11, fontSize: 14, color: '#0F172A',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  chipOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  chipTextOn: { color: '#fff' },
  hint: { fontSize: 12, color: '#94A3B8' },
  note: { fontSize: 12, color: '#64748B', marginTop: 14, lineHeight: 17 },
  submitBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 16 },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  section: { fontSize: 13, fontWeight: '800', color: '#334155', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.3 },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { fontSize: 15, fontWeight: '800', color: Colors.primary },
  memberName: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  memberSub: { fontSize: 11, color: '#64748B', marginTop: 1 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
});
