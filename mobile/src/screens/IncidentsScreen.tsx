import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useDashboard } from '../hooks/useDashboard';
import { apiClient } from '../api/client';
import { reportWorkflowService } from '../services/reportWorkflowService';

interface Props {
  navigation: any;
}

export function IncidentsScreen({ navigation }: Props) {
  const { alerts, refresh, isLoading } = useDashboard();
  const [nearMissCount, setNearMissCount] = useState(0);
  const [openCapaCount, setOpenCapaCount] = useState(0);

  const loadCounts = React.useCallback(async () => {
    try {
      const stats = await reportWorkflowService('near_miss').getStats();
      setNearMissCount(stats?.pending_supervisor ?? 0);
    } catch {}
    try {
      const { data } = await apiClient.get('capa-actions/');
      const list = Array.isArray(data) ? data : [];
      setOpenCapaCount(
        list.filter((c: any) => !['completed', 'closed'].includes(String(c.status ?? '').toLowerCase())).length,
      );
    } catch {}
  }, []);

  useEffect(() => {
    refresh();
    loadCounts();

    const unsubscribe = navigation.addListener('focus', () => {
      refresh();
      loadCounts();
    });

    const interval = setInterval(() => {
      refresh();
      loadCounts();
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [navigation, refresh, loadCounts]);

  const pad2 = (n: number) => String(n).padStart(2, '0');
  // Real supervisor safety feed (from useDashboard); empty state shown when none.
  const incidentsList = alerts;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FF" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Safety & Incident Center</Text>
        <Text style={styles.headerSubtitle}>Monitor safety alerts, audits and CAPA actions</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Top Stats Cards */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={[styles.statCard, { borderLeftColor: '#EF4444' }]}
            onPress={() => navigation.navigate('NearMissManagement')}
            activeOpacity={0.85}
          >
            <Text style={styles.statVal}>{pad2(nearMissCount)}</Text>
            <Text style={styles.statLbl}>Near Misses</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, { borderLeftColor: '#004AC6' }]}
            onPress={() => navigation.navigate('CAPAManagement')}
            activeOpacity={0.85}
          >
            <Text style={styles.statVal}>{pad2(openCapaCount)}</Text>
            <Text style={styles.statLbl}>Open CAPA</Text>
          </TouchableOpacity>
        </View>

        {/* Modules Grid Section */}
        <Text style={styles.sectionTitle}>Safety Management Modules</Text>

        <View style={styles.grid}>
          {/* Tile 1 */}
          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => navigation.navigate('CAPAManagement')}
            activeOpacity={0.8}
          >
            <View style={[styles.gridIcon, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="alert-circle-outline" size={22} color="#EF4444" />
            </View>
            <Text style={styles.gridLabel}>Incidents</Text>
          </TouchableOpacity>

          {/* Tile 2 */}
          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => navigation.navigate('NearMissManagement')}
            activeOpacity={0.8}
          >
            <View style={[styles.gridIcon, { backgroundColor: '#FFF7ED' }]}>
              <Ionicons name="warning-outline" size={22} color="#F97316" />
            </View>
            <Text style={styles.gridLabel}>Near Miss</Text>
          </TouchableOpacity>

          {/* Tile 3 */}
          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => navigation.navigate('SafetyObservationManagement')}
            activeOpacity={0.8}
          >
            <View style={[styles.gridIcon, { backgroundColor: '#FDF2F8' }]}>
              <Ionicons name="eye-outline" size={22} color="#DB2777" />
            </View>
            <Text style={styles.gridLabel}>Observations</Text>
          </TouchableOpacity>

          {/* Tile 4 */}
          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => navigation.navigate('InspectionManagement')}
            activeOpacity={0.8}
          >
            <View style={[styles.gridIcon, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="checkbox-outline" size={22} color="#16A34A" />
            </View>
            <Text style={styles.gridLabel}>Inspections</Text>
          </TouchableOpacity>

          {/* Tile 5 */}
          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => navigation.navigate('CAPAManagement')}
            activeOpacity={0.8}
          >
            <View style={[styles.gridIcon, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="hammer-outline" size={22} color="#004AC6" />
            </View>
            <Text style={styles.gridLabel}>CAPA Logs</Text>
          </TouchableOpacity>

          {/* Tile 6 */}
          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => navigation.navigate('RiskManagement')}
            activeOpacity={0.8}
          >
            <View style={[styles.gridIcon, { backgroundColor: '#FAF5FF' }]}>
              <Ionicons name="analytics-outline" size={22} color="#8B5CF6" />
            </View>
            <Text style={styles.gridLabel}>Hazard Register</Text>
          </TouchableOpacity>
        </View>

        {/* Safety Feed List */}
        <Text style={styles.sectionTitle}>Safety Feed & Alerts</Text>

        <View style={styles.feedList}>
          {!isLoading && incidentsList.length === 0 && (
            <Text style={styles.feedReporter}>No active safety alerts right now.</Text>
          )}
          {incidentsList.map((item) => {
            const isCritical = item.type === 'critical';
            const isWarning = item.type === 'warning';
            const alertColor = isCritical ? '#EF4444' : isWarning ? '#F97316' : '#16A34A';
            const alertBg = isCritical ? '#FEF2F2' : isWarning ? '#FFF7ED' : '#F0FDF4';
            const alertIcon = isCritical ? 'flame-outline' : isWarning ? 'warning-outline' : 'checkmark-circle-outline';

            return (
              <View key={item.id} style={styles.feedCard}>
                <View style={styles.feedHeader}>
                  <View style={[styles.feedBadge, { backgroundColor: alertBg }]}>
                    <Ionicons name={alertIcon} size={14} color={alertColor} />
                    <Text style={[styles.feedBadgeText, { color: alertColor }]}>
                      {item.type.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.feedTime}>{item.time_ago}</Text>
                </View>

                <Text style={styles.feedMsg}>{item.message}</Text>
                <Text style={styles.feedZone}>{item.zone}</Text>

                <View style={styles.feedFooter}>
                  <Text style={styles.feedReporter}>Reported by: {item.worker_name}</Text>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => navigation.navigate('CAPAManagement', { incidentId: item.id })}
                  >
                    <Text style={styles.actionBtnText}>Resolve</Text>
                    <Ionicons name="chevron-forward" size={14} color="#004AC6" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8F9FF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0B1C30',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#737686',
    marginTop: 2,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  statVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0B1C30',
  },
  statLbl: {
    fontSize: 11,
    color: '#737686',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0B1C30',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  gridCard: {
    width: '31%',
    aspectRatio: 1.1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  gridIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#434655',
    textAlign: 'center',
  },
  feedList: {
    gap: 12,
  },
  feedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  feedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  feedBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  feedTime: {
    fontSize: 11,
    color: '#737686',
  },
  feedMsg: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0B1C30',
    marginBottom: 4,
  },
  feedZone: {
    fontSize: 11,
    color: '#737686',
    marginBottom: 12,
  },
  feedFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
    paddingTop: 12,
  },
  feedReporter: {
    fontSize: 11,
    color: '#434655',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#004AC6',
  },
});
