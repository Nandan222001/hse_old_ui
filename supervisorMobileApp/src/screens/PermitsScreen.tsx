import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenLayout, AppHeader, PermitCard, EmptyState, LoadingScreen } from '../components';
import { Colors } from '../theme/colors';
import { usePermits } from '../hooks/usePermits';

interface Props {
  navigation: any;
}

const FILTER_CHIPS = ['Pending (12)', 'Hot Work', 'Heights', 'Filter'];

export function PermitsScreen({ navigation }: Props) {
  const { permits, stats, loading, fetchPermits } = usePermits();
  const [search, setSearch] = useState('');
  const [activeChip, setActiveChip] = useState(0);

  useEffect(() => { fetchPermits(); }, []);

  const filtered = permits.filter(p =>
    p.permit_ref.toLowerCase().includes(search.toLowerCase()) ||
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingScreen />;

  return (
    <ScreenLayout>
      <AppHeader title="HSE Supervisor" showBell />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Permit ID or Zone..."
            placeholderTextColor={Colors.textLight}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
          {FILTER_CHIPS.map((chip, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setActiveChip(i)}
              style={[styles.chip, activeChip === i && styles.chipActive]}
            >
              {i === 0 && <Ionicons name="document-text-outline" size={12} color={activeChip === i ? Colors.white : Colors.textMid} />}
              {i === 1 && <Ionicons name="flash-outline" size={12} color={activeChip === i ? Colors.white : Colors.textMid} />}
              {i === 2 && <Ionicons name="arrow-up-outline" size={12} color={activeChip === i ? Colors.white : Colors.textMid} />}
              {i === 3 && <Ionicons name="options-outline" size={12} color={activeChip === i ? Colors.white : Colors.textMid} />}
              <Text style={[styles.chipText, activeChip === i && styles.chipTextActive]}>{chip}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Today's Activity */}
        <Text style={styles.sectionTitle}>Today's Activity</Text>
        <View style={styles.activityRow}>
          <View style={[styles.activityBox, { backgroundColor: Colors.blue }]}>
            <Ionicons name="checkmark-circle-outline" size={22} color={Colors.white} style={styles.actIcon} />
            <Text style={styles.actNum}>{stats?.approved_today ?? 24}</Text>
            <Text style={styles.actLabel}>PERMITS APPROVED</Text>
          </View>
          <View style={[styles.activityBox, { backgroundColor: '#5C6BC0' }]}>
            <Ionicons name="warning-outline" size={22} color={Colors.white} style={styles.actIcon} />
            <Text style={styles.actNum}>{stats?.risk_flags ?? '03'}</Text>
            <Text style={styles.actLabel}>RISK FLAGS RAISED</Text>
          </View>
        </View>

        {/* Pending Validation */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Pending Validation</Text>
          <View style={styles.locationChips}>
            {['North', 'Sector', 'Depot'].map(l => (
              <TouchableOpacity key={l} style={styles.locChip}>
                <Text style={styles.locChipText}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.approveBtn}>
          <Ionicons name="shield-checkmark-outline" size={16} color={Colors.white} />
          <Text style={styles.approveBtnText}>Approve & Validate</Text>
        </TouchableOpacity>

        {filtered.length === 0 ? (
          <EmptyState icon="document-text-outline" title="No permits found" subtitle="Try adjusting your filters" />
        ) : (
          filtered.map(permit => (
            <PermitCard
              key={permit.id}
              permit={permit}
              onPress={() => navigation.navigate('AcknowledgePermit', { permitId: permit.id })}
            />
          ))
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textDark, paddingVertical: 12 },
  chipsScroll: { marginBottom: 16 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 12, fontWeight: '600', color: Colors.textMid },
  chipTextActive: { color: Colors.white },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textDark, marginBottom: 10 },
  activityRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  activityBox: { flex: 1, borderRadius: 12, padding: 14 },
  actIcon: { marginBottom: 8 },
  actNum: { fontSize: 28, fontWeight: '800', color: Colors.white },
  actLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.8)', letterSpacing: 0.5, marginTop: 4 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  locationChips: { flexDirection: 'row', gap: 6, marginLeft: 'auto' },
  locChip: { backgroundColor: Colors.divider, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  locChipText: { fontSize: 11, color: Colors.textMid, fontWeight: '600' },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignSelf: 'flex-start',
    marginBottom: 14,
  },
  approveBtnText: { color: Colors.white, fontWeight: '600' },
});
