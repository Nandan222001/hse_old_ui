import React, { useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { ScreenLayout } from '../components/layout/ScreenLayout';
import { Icon } from '../components/display/Icon';
import { Card } from '../components/cards/Card';
import { StatusBadge } from '../components/display/Badge';
import { EmptyState } from '../components/feedback/EmptyState';
import { Colors } from '../theme/colors';
import { useIncidents } from '../hooks/useIncidents';
import { Incident, IncidentType, SeverityLevel } from '../types';
import { formatDate } from '../utils/formatters';

/**
 * The five things a worker can report.
 *
 * `tint` is the icon chip's background and `ink` the icon drawn on it. The card
 * itself stays white — colour identifies the report type at a glance and does
 * nothing else.
 *
 * It used to wash the whole card in the tint and set the title in `ink` to
 * match, which put five saturated blocks side by side and made most of the text
 * hard to read. Measured against the old values: the "Near Miss" title was
 * amber #F59E0B on amber #FEF3C7, a contrast ratio of 1.93:1 where 4.5 is the
 * minimum for text — and every description line failed too, because a muted
 * grey that works on white does not work on a tint. Near Miss and Hazard
 * Register also shared #FEF3C7 outright, so two of the five were the same
 * colour.
 *
 * Every pair below clears 3.9:1 on its chip, and all five tints are distinct —
 * Hazard Register moved to teal, which also suits it: a register is standing
 * reference data, not an event that just happened.
 */
const REPORT_TYPES = [
  { id: 'near_miss',  icon: 'alert-triangle', title: 'Near Miss',       desc: 'Report a near miss event',            ink: '#B45309', tint: '#FEF3C7', screen: 'ReportNearMiss'  },
  { id: 'incident',   icon: 'alert-octagon',  title: 'Incident',        desc: 'Report a safety incident',            ink: '#DC2626', tint: '#FEE2E2', screen: 'ReportIncident'  },
  { id: 'unsafe_act', icon: 'eye',            title: 'Unsafe Act',      desc: 'Report an unsafe behaviour',          ink: '#1D4ED8', tint: '#DBEAFE', screen: 'ReportUnsafeAct' },
  { id: 'risk',       icon: 'shield',         title: 'Risk Observation', desc: 'One-off unsafe condition you saw',   ink: '#6D28D9', tint: '#EDE9FE', screen: 'ReportRisk'      },
  // Flow 5. Kept apart from the risk observation above: a register entry is a
  // standing condition that runs all eight stages, and the worker can follow it.
  { id: 'hazard',     icon: 'tool',           title: 'Hazard Register', desc: 'Log a hazard that needs controlling', ink: '#0F766E', tint: '#CCFBF1', screen: 'LogHazard'       },
];

const INCIDENT_TYPE_LABEL: Record<IncidentType, string> = {
  'Injury':               'Injury',
  'Dangerous Occurrence': 'Dangerous Occurrence',
  'Property Damage':      'Property Damage',
  'Environmental':        'Environmental',
};

const SEVERITY_ACCENT: Record<SeverityLevel, string> = {
  'Fatal':     Colors.critical,
  'Lost Time': Colors.critical,
  'Severe':    Colors.warning,
  'Moderate':  Colors.blue,
  'Minor':     Colors.success,
};

function incidentStatusLabel(status: string): string {
  return status.replace(/_/g, ' ');
}

function showIncidentDetail(incident: Incident) {
  const typeLabel = INCIDENT_TYPE_LABEL[incident.incident_type] ?? incident.incident_type;
  const lines = [
    `Ref: ${incident.incident_ref || incident.id.slice(0, 8)}`,
    `Type: ${typeLabel}`,
    `Severity: ${incident.severity?.toUpperCase() ?? '—'}`,
    `Location: ${incident.location || '—'}`,
    `Date: ${incident.date || (incident.created_at ? formatDate(incident.created_at) : '—')}`,
    `Status: ${incidentStatusLabel(incident.status)}`,
    incident.description ? `\n${incident.description}` : '',
  ].filter(Boolean).join('\n');

  Alert.alert(typeLabel, lines);
}

export default function ReportsScreen({ navigation }: any) {
  const { incidents, isLoading, fetchIncidents } = useIncidents();

  useEffect(() => {
    fetchIncidents({ mine: true });

    const unsubscribe = navigation.addListener('focus', () => {
      fetchIncidents({ mine: true });
    });

    const interval = setInterval(() => {
      fetchIncidents({ mine: true });
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [navigation]);

  const onRefresh = useCallback(() => { fetchIncidents({ mine: true }); }, []);

  return (
    <ScreenLayout>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reports</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Flow 5 · the standing register the worker can follow to closure.
            Recent Submissions below lists incidents, so hazards need their
            own way in rather than a filter on that list. */}
        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => navigation.navigate('MyHazards')}
          activeOpacity={0.8}
        >
          <View style={[styles.registerChip, { backgroundColor: '#CCFBF1' }]}>
            <Icon name="list" style={styles.registerIcon} color="#0F766E" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.registerTitle}>My Hazards</Text>
            <Text style={styles.registerDesc}>Track the hazards you logged through all eight stages</Text>
          </View>
          <Icon name="chevron-right" style={styles.registerChevron} color={Colors.textMuted} />
        </TouchableOpacity>

        {/* Near misses run the same eight stages and, like hazards, are not in
            Recent Submissions below — that list is incidents. A reporter who
            never sees an outcome stops reporting, which is the one thing a near
            miss programme cannot afford. */}
        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => navigation.navigate('MyNearMisses')}
          activeOpacity={0.8}
        >
          <View style={[styles.registerChip, { backgroundColor: '#FEF3C7' }]}>
            <Icon name="alert-triangle" style={styles.registerIcon} color="#B45309" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.registerTitle}>My Near Misses</Text>
            <Text style={styles.registerDesc}>Follow what you reported from triage to closure</Text>
          </View>
          <Icon name="chevron-right" style={styles.registerChevron} color={Colors.textMuted} />
        </TouchableOpacity>

        {/* The last family with a form and no way back to it. A risk observation
            is usually about something still standing on site, so whether anyone
            acted on it is a question the reporter has a live interest in.
            Separate from My Hazards above: that is the standing register. */}
        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => navigation.navigate('MyRiskReports')}
          activeOpacity={0.8}
        >
          <View style={[styles.registerChip, { backgroundColor: '#EDE9FE' }]}>
            <Icon name="shield" style={styles.registerIcon} color="#6D28D9" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.registerTitle}>My Risk Reports</Text>
            <Text style={styles.registerDesc}>See how each risk you raised was rated and controlled</Text>
          </View>
          <Icon name="chevron-right" style={styles.registerChevron} color={Colors.textMuted} />
        </TouchableOpacity>

        {/* New Report grid */}
        <Text style={styles.sectionTitle}>New Report</Text>
        <View style={styles.reportGrid}>
          {REPORT_TYPES.map(rt => (
            <TouchableOpacity
              key={rt.id}
              style={styles.reportCard}
              onPress={() => navigation.navigate(rt.screen)}
              activeOpacity={0.8}
            >
              <View style={[styles.reportChip, { backgroundColor: rt.tint }]}>
                <Icon name={rt.icon} style={styles.reportIcon} color={rt.ink} />
              </View>
              <Text style={styles.reportTitle}>{rt.title}</Text>
              <Text style={styles.reportDesc}>{rt.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Submissions — real data */}
        <View style={styles.recentHeader}>
          <Text style={styles.sectionTitle}>Recent Submissions</Text>
          {incidents.length > 0 && (
            <Text style={styles.recentCount}>{incidents.length} total</Text>
          )}
        </View>

        {isLoading && incidents.length === 0 ? (
          <ActivityIndicator color={Colors.primary} style={{ marginVertical: 24 }} />
        ) : incidents.length === 0 ? (
          <EmptyState
            icon="📝"
            title="No Submissions Yet"
            subtitle="Your reported incidents and observations will appear here."
          />
        ) : (
          incidents.slice(0, 20).map(incident => {
            const typeLabel  = INCIDENT_TYPE_LABEL[incident.incident_type] ?? incident.incident_type;
            const accent     = SEVERITY_ACCENT[incident.severity] ?? Colors.textLight;
            const dateStr    = incident.date || (incident.created_at ? formatDate(incident.created_at) : '—');
            const statusStr  = incidentStatusLabel(incident.status);

            return (
              <TouchableOpacity
                key={incident.id}
                onPress={() => showIncidentDetail(incident)}
                activeOpacity={0.75}
              >
                <Card style={styles.recentCard} accentColor={accent} elevation={1}>
                  <View style={styles.recentLeft}>
                    <Text style={styles.recentType}>{typeLabel.toUpperCase()}</Text>
                    <Text style={styles.recentTitle} numberOfLines={2}>
                      {incident.description || `${typeLabel} — ${incident.location || 'No location'}`}
                    </Text>
                    <Text style={styles.recentDate}>
                      {incident.incident_ref ? `${incident.incident_ref}  •  ` : ''}{dateStr}
                    </Text>
                  </View>
                  <StatusBadge status={statusStr} />
                </Card>
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 24 }} />
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

  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textDark, marginBottom: 12, marginTop: 14 },

  // All three "My ..." rows used to be solid amber, whatever they linked to —
  // three identical blocks stacked above a grid of five more. They are white
  // cards now and the chip carries the colour, so the row that leads to hazards
  // is recognisably the hazard one.
  registerLink: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 14, padding: 14, marginBottom: 10,
  },
  registerChip: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  registerIcon: { fontSize: 19 },
  registerTitle: { fontSize: 14.5, fontWeight: '700', color: Colors.textDark, marginBottom: 2 },
  registerDesc: { fontSize: 12, color: Colors.textMuted, lineHeight: 16 },
  registerChevron: { fontSize: 18 },

  reportGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  // White card, hairline border, colour confined to the chip. Matches the
  // register rows above so the whole screen reads as one surface.
  reportCard: {
    width: '47%', borderRadius: 14, padding: 16,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
  },
  reportChip: {
    width: 40, height: 40, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  reportIcon: { fontSize: 20 },
  reportTitle: { fontSize: 14.5, fontWeight: '700', color: Colors.textDark, marginBottom: 4 },
  reportDesc: { fontSize: 12, color: Colors.textMuted, lineHeight: 16 },

  recentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 4 },
  recentCount: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },

  recentCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  recentLeft: { flex: 1, marginRight: 10 },
  recentType: { fontSize: 10, fontWeight: '800', color: Colors.textMuted, letterSpacing: 0.5, marginBottom: 3 },
  recentTitle: { fontSize: 14, fontWeight: '600', color: Colors.textDark, marginBottom: 3, lineHeight: 19 },
  recentDate: { fontSize: 12, color: Colors.textMuted },
});
