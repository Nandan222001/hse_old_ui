import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { EmptyState } from '../feedback/EmptyState';
import { InvestigationFormModal } from './InvestigationFormModal';
import { useReportWorkflow } from '../../hooks/useReportWorkflow';
import type { ReportType } from '../../api/endpoints';
import type { InvestigatePayload, ReportListItem } from '../../services/reportWorkflowService';

/**
 * The supervisor's review queue for one report type.
 *
 * Near miss, unsafe act and risk share this because the backend gives all three the
 * identical verbs — only the title and the worker's wording differ. Incidents keep
 * their own screen: they carry CAPA and days-away fields these three do not have.
 */

interface Props {
  navigation: any;
  reportType: ReportType;
  title: string;
  /** Shown when the queue is empty — worded for the report type. */
  emptyTitle: string;
  emptyIcon?: string;
}

const SEVERITY_STYLE: Record<string, { bg: string; fg: string }> = {
  low: { bg: Colors.successBg, fg: Colors.success },
  medium: { bg: Colors.warningBg, fg: Colors.warning },
  high: { bg: Colors.criticalBg, fg: Colors.critical },
  critical: { bg: Colors.criticalBg, fg: Colors.critical },
};

/** What the supervisor can do next, given where the report currently sits.
 *
 * `under_investigation` used to read "sent back by manager — redo" because a
 * manager rejection was the only thing that could produce it. Starting an
 * investigation now sets it too, so the label describes the state rather than
 * guessing how the record got there. */
const STATUS_LABEL: Record<string, string> = {
  reported: 'New — needs acknowledgement',
  acknowledged: 'Acknowledged — investigate next',
  under_investigation: 'Under investigation',
  pending_approval: 'Investigation submitted — with the manager',
  escalated: 'Escalated to the manager',
  capa_open: 'Corrective action outstanding',
  pending_verification: 'Awaiting effectiveness verification',
  approved: 'Verified — awaiting closure',
  closed: 'Closed',
};

function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function ReportWorkflowList({
  navigation,
  reportType,
  title,
  emptyTitle,
  emptyIcon = 'shield-checkmark-outline',
}: Props) {
  const { queue, isLoading, busyId, error, refresh, acknowledge, startInvestigation, investigate, escalate } =
    useReportWorkflow(reportType, 'supervisor');
  const [expandedId, setExpanded] = useState<number | null>(null);
  const [investigating, setInvestigating] = useState<ReportListItem | null>(null);

  useEffect(() => {
    refresh();
    const unsubscribe = navigation.addListener('focus', refresh);
    return unsubscribe;
  }, [navigation, refresh]);

  const submitInvestigation = async (payload: InvestigatePayload) => {
    if (!investigating) return;
    const item = investigating;
    setInvestigating(null);
    await investigate(item.id, payload);
  };

  const confirmEscalate = (item: ReportListItem) => {
    Alert.alert('Escalate to manager?', 'The manager will take this over.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Escalate',
        style: 'destructive',
        onPress: () => escalate(item.id, 'Escalated by supervisor for manager review'),
      },
    ]);
  };

  const renderCard = (item: ReportListItem) => {
    const sev = (item.severity ?? 'medium').toLowerCase();
    const sevStyle = SEVERITY_STYLE[sev] ?? SEVERITY_STYLE.medium;
    const status = item.workflow_status ?? 'reported';
    const isBusy = busyId === item.id;
    const isOpen = expandedId === item.id;

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => setExpanded(isOpen ? null : item.id)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.title} numberOfLines={isOpen ? undefined : 2}>
            {item.description || 'No description provided'}
          </Text>
          <View style={[styles.badge, { backgroundColor: sevStyle.bg }]}>
            <Text style={[styles.badgeText, { color: sevStyle.fg }]}>{sev}</Text>
          </View>
        </View>

        <Text style={styles.sub}>
          #{item.id} · {STATUS_LABEL[status] ?? status} · {timeAgo(item.reported_at ?? item.created_at)}
        </Text>


        {isBusy ? (
          <ActivityIndicator style={styles.busy} color={Colors.primary} />
        ) : (
          <View style={styles.actions}>
            {status === 'reported' && (
              <TouchableOpacity
                style={[styles.btn, styles.btnPrimary]}
                onPress={() => acknowledge(item.id)}
              >
                <Ionicons name="checkmark-circle-outline" size={16} color={Colors.white} />
                <Text style={styles.btnPrimaryText}>Acknowledge</Text>
              </TouchableOpacity>
            )}

            {/* Stage 03 -> 04. Distinct from completing the investigation:
                opening it is what puts the record visibly in INVESTIGATE while
                the work is happening. */}
            {status === 'acknowledged' && (
              <TouchableOpacity
                style={[styles.btn, styles.btnPrimary]}
                onPress={() => startInvestigation(item.id)}
              >
                <Ionicons name="play-circle-outline" size={16} color={Colors.white} />
                <Text style={styles.btnPrimaryText}>Start investigation</Text>
              </TouchableOpacity>
            )}

            {status === 'under_investigation' && (
              <TouchableOpacity
                style={[styles.btn, styles.btnPrimary]}
                onPress={() => setInvestigating(item)}
              >
                <Ionicons name="search-outline" size={16} color={Colors.white} />
                <Text style={styles.btnPrimaryText}>Complete investigation</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={() => confirmEscalate(item)}>
              <Ionicons name="arrow-up-circle-outline" size={16} color={Colors.critical} />
              <Text style={styles.btnGhostText}>Escalate</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, queue.length === 0 && styles.scrollEmpty]}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} />}
      >
        {error && <Text style={styles.error}>{error}</Text>}

        {queue.length === 0 && !isLoading && !error ? (
          <EmptyState
            icon={emptyIcon}
            title={emptyTitle}
            subtitle="New worker submissions will appear here for your review."
          />
        ) : (
          queue.map(renderCard)
        )}
      </ScrollView>

      <InvestigationFormModal
        visible={investigating !== null}
        initialSeverity={investigating?.severity}
        reportLabel={`#${investigating?.id ?? ''} · ${investigating?.description ?? ''}`}
        isSubmitting={busyId !== null && busyId === investigating?.id}
        onCancel={() => setInvestigating(null)}
        onSubmit={submitInvestigation}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.textDark, marginLeft: 12 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  scrollEmpty: { flexGrow: 1 },
  error: { color: Colors.critical, fontSize: 13, marginBottom: 12, textAlign: 'center' },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 12,
  },
  title: { fontSize: 14, fontWeight: '700', color: Colors.textDark, flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  sub: { fontSize: 11, color: Colors.textMuted },
  busy: { marginTop: 12, alignSelf: 'flex-start' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  btnPrimary: { backgroundColor: Colors.primary },
  btnPrimaryText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  btnGhost: { backgroundColor: Colors.criticalBg },
  btnGhostText: { color: Colors.critical, fontSize: 12, fontWeight: '700' },
});
