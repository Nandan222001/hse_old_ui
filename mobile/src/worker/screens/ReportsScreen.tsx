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

const REPORT_TYPES = [
  { id: 'near_miss',  icon: '⚠️', title: 'Near Miss',       desc: 'Report a near miss event',      color: Colors.warning,  bg: Colors.warningBg,  screen: 'ReportNearMiss'  },
  { id: 'incident',   icon: '🚨', title: 'Incident',         desc: 'Report a safety incident',      color: Colors.critical, bg: Colors.criticalBg, screen: 'ReportIncident'  },
  { id: 'unsafe_act', icon: '👁️', title: 'Unsafe Act',       desc: 'Report an unsafe behaviour',   color: Colors.blue,     bg: '#E3F2FD',         screen: 'ReportUnsafeAct' },
  { id: 'risk',       icon: '🛡️', title: 'Hazard',           desc: 'Report a hazard or unsafe condition', color: '#7C3AED',    bg: '#F3E8FF',         screen: 'ReportRisk'      },
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
        {/* New Report grid */}
        <Text style={styles.sectionTitle}>New Report</Text>
        <View style={styles.reportGrid}>
          {REPORT_TYPES.map(rt => (
            <TouchableOpacity
              key={rt.id}
              style={[styles.reportCard, { backgroundColor: rt.bg }]}
              onPress={() => navigation.navigate(rt.screen)}
              activeOpacity={0.8}
            >
              <Icon emoji={rt.icon} style={styles.reportIcon} color={rt.color} />
              <Text style={[styles.reportTitle, { color: rt.color }]}>{rt.title}</Text>
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

  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textDark, marginBottom: 12, marginTop: 4 },

  reportGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  reportCard: { width: '47%', borderRadius: 16, padding: 18 },
  reportIcon: { fontSize: 30, marginBottom: 10 },
  reportTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  reportDesc: { fontSize: 12, color: Colors.textMuted },

  recentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 4 },
  recentCount: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },

  recentCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  recentLeft: { flex: 1, marginRight: 10 },
  recentType: { fontSize: 10, fontWeight: '800', color: Colors.textMuted, letterSpacing: 0.5, marginBottom: 3 },
  recentTitle: { fontSize: 14, fontWeight: '600', color: Colors.textDark, marginBottom: 3, lineHeight: 19 },
  recentDate: { fontSize: 12, color: Colors.textMuted },
});
