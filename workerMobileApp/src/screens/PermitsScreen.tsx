import React, { useEffect, useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, ActivityIndicator,
} from 'react-native';
import { ScreenLayout } from '../components/layout/ScreenLayout';
import { Card } from '../components/cards/Card';
import { EmptyState } from '../components/feedback/EmptyState';
import { Colors } from '../theme/colors';
import { usePermits } from '../hooks/usePermits';
import { Permit, PermitStatus } from '../types';

const STATUS_STYLE: Record<PermitStatus, { bg: string; text: string; label: string }> = {
  active:           { bg: Colors.successBg,  text: Colors.success,  label: 'Active' },
  approved:         { bg: Colors.successBg,  text: Colors.success,  label: 'Approved' },
  pending_approval: { bg: Colors.warningBg,  text: Colors.warning,  label: 'Pending' },
  draft:            { bg: '#F3F4F6',          text: Colors.textMuted, label: 'Draft' },
  closed:           { bg: '#F3F4F6',          text: Colors.textMuted, label: 'Closed' },
  rejected:         { bg: Colors.criticalBg, text: Colors.critical,  label: 'Rejected' },
};

const PERMIT_ICONS: Record<string, string> = {
  hot_work:          '🔥',
  confined_space:    '⬜',
  working_at_height: '🧗',
  electrical:        '⚡',
  excavation:        '⛏️',
};

const FILTERS: { label: string; value: string | null }[] = [
  { label: 'All',     value: null },
  { label: 'Active',  value: 'active' },
  { label: 'Pending', value: 'pending_approval' },
  { label: 'Closed',  value: 'closed' },
];

function PermitCard({ permit, onAcknowledge }: { permit: Permit; onAcknowledge: (id: string) => void }) {
  const st = STATUS_STYLE[permit.status] ?? STATUS_STYLE.draft;
  const icon = PERMIT_ICONS[permit.permit_type] ?? '📄';
  const typeLabel = permit.permit_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <Card style={styles.permitCard} accentColor={st.text} elevation={1}>
      <View style={styles.permitHeader}>
        <Text style={styles.permitIcon}>{icon}</Text>
        <View style={styles.permitMeta}>
          <Text style={styles.permitRef}>{permit.permit_ref || `Permit #${permit.id.slice(0, 8)}`}</Text>
          <Text style={styles.permitType}>{typeLabel}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
          <Text style={[styles.statusText, { color: st.text }]}>{st.label}</Text>
        </View>
      </View>

      {permit.work_location ? (
        <Text style={styles.location}>📍 {permit.work_location}</Text>
      ) : null}

      {permit.work_description ? (
        <Text style={styles.description} numberOfLines={2}>{permit.work_description}</Text>
      ) : null}

      {(permit.start_datetime || permit.end_datetime) ? (
        <Text style={styles.dates}>
          🕐 {permit.start_datetime ? permit.start_datetime.slice(0, 16).replace('T', ' ') : '—'}
          {' → '}
          {permit.end_datetime ? permit.end_datetime.slice(0, 16).replace('T', ' ') : '—'}
        </Text>
      ) : null}

      {permit.status === 'active' && (
        <TouchableOpacity
          style={styles.ackBtn}
          onPress={() => onAcknowledge(permit.id)}
          activeOpacity={0.8}
        >
          <Text style={styles.ackBtnText}>✓ Acknowledge</Text>
        </TouchableOpacity>
      )}
    </Card>
  );
}

export default function PermitsScreen({ navigation }: any) {
  const { permits, isLoading, fetchPermits, acknowledgePermit } = usePermits();
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  useEffect(() => {
    fetchPermits(activeFilter ? { status: activeFilter } : undefined);
  }, [activeFilter]);

  const onRefresh = useCallback(() => {
    fetchPermits(activeFilter ? { status: activeFilter } : undefined);
  }, [activeFilter]);

  const handleAcknowledge = async (id: string) => {
    const ok = await acknowledgePermit(id);
    if (ok) {
      onRefresh();
    }
  };

  return (
    <ScreenLayout>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Permits</Text>
        {permits.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{permits.length}</Text>
          </View>
        )}
      </View>

      {/* Filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterContent}
      >
        {FILTERS.map(f => (
          <TouchableOpacity
            key={String(f.value)}
            style={[styles.filterPill, activeFilter === f.value && styles.filterPillActive]}
            onPress={() => setActiveFilter(f.value)}
          >
            <Text style={[styles.filterText, activeFilter === f.value && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      {isLoading && permits.length === 0 ? (
        <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 60 }} />
      ) : permits.length === 0 ? (
        <EmptyState
          icon="📄"
          title="No Permits"
          subtitle="You have no permits yet. Tap below to raise a new one."
        />
      ) : (
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
        >
          {permits.map(p => (
            <PermitCard key={p.id} permit={p} onAcknowledge={handleAcknowledge} />
          ))}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* Raise new permit FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('RaisePermit')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+ Raise Permit</Text>
      </TouchableOpacity>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingTop: 52, paddingBottom: 14, paddingHorizontal: 20,
    backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn:     { marginRight: 4 },
  backIcon:    { fontSize: 28, color: Colors.primary, lineHeight: 30 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.textDark, flex: 1 },
  badge:       { backgroundColor: Colors.blue, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText:   { color: Colors.white, fontWeight: '700', fontSize: 13 },

  filterBar:     { maxHeight: 52, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  filterContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  filterPill:       { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.card },
  filterPillActive: { borderColor: Colors.blue, backgroundColor: '#EFF5FF' },
  filterText:       { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  filterTextActive: { color: Colors.blue },

  scroll: { flex: 1, padding: 16 },

  permitCard:   { marginBottom: 12 },
  permitHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  permitIcon:   { fontSize: 28, marginRight: 12 },
  permitMeta:   { flex: 1 },
  permitRef:    { fontSize: 14, fontWeight: '700', color: Colors.textDark },
  permitType:   { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  statusBadge:  { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText:   { fontSize: 11, fontWeight: '700' },
  location:     { fontSize: 13, color: Colors.textMuted, marginBottom: 4 },
  description:  { fontSize: 13, color: Colors.textMid, marginBottom: 6, lineHeight: 18 },
  dates:        { fontSize: 12, color: Colors.textMuted, marginBottom: 8 },
  ackBtn:       { backgroundColor: Colors.primary, borderRadius: 8, paddingVertical: 9, alignItems: 'center', marginTop: 4 },
  ackBtnText:   { color: Colors.white, fontWeight: '700', fontSize: 13 },

  fab: {
    position: 'absolute', bottom: 24, left: 24, right: 24,
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
    elevation: 6, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8,
  },
  fabText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
});
