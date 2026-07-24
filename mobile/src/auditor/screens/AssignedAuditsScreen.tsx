import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  TextInput,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { auditService, Audit as ApiAudit } from '../services/auditService';

interface Audit {
  id: number;
  title: string;
  checklist_type: string;
  site: string;
  dept: string;
  dueDate: string;
  time: string;
  status: 'overdue' | 'in_progress' | 'scheduled' | 'completed';
  priority: 'High' | 'Med' | 'Low';
  progress?: number;
}

/** Map a backend audit record to the card shape this screen renders. */
function toCard(a: ApiAudit): Audit {
  const due = a.due_date ? new Date(a.due_date) : null;
  const pr = (a.priority || 'Med') as 'High' | 'Med' | 'Low';
  return {
    id: a.id,
    title: a.title,
    checklist_type: a.checklist_type || 'Audit',
    site: a.site_name || '—',
    dept: a.department || '—',
    dueDate: due ? due.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' }) : '—',
    time: due ? due.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '',
    status: (a.status as Audit['status']) || 'scheduled',
    priority: ['High', 'Med', 'Low'].includes(pr) ? pr : 'Med',
    progress: a.progress ?? undefined,
  };
}

export function AssignedAuditsScreen({ navigation }: any) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const rows = await auditService.listAssigned();
      setAudits(rows.map(toCard));
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Could not load audits.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    load();
    return unsub;
  }, [navigation, load]);

  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

  const visibleAudits = audits.filter((a) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return [a.title, a.site, a.dept, a.checklist_type].some((f) => (f || '').toLowerCase().includes(q));
  });
  
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'overdue':
        return { bg: '#FEE2E2', text: '#EF4444', icon: 'time-outline', label: 'Overdue' };
      case 'in_progress':
        return { bg: '#F5F3FF', text: '#8B5CF6', icon: 'sync-outline', label: 'In Progress' };
      default:
        return { bg: '#EFF6FF', text: '#3B82F6', icon: 'calendar-outline', label: 'Scheduled' };
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'High':
        return { bg: '#EFF6FF', text: '#2563EB', label: 'High Priority' };
      case 'Med':
        return { bg: '#EFF6FF', text: '#2563EB', label: 'Med Priority' };
      default:
        return { bg: '#EFF6FF', text: '#2563EB', label: 'Low Priority' };
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>HSE Audit Pro</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.bellBtn}>
            <Ionicons name="notifications-outline" size={22} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>LA</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search audits, sites, or departments..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filters */}
        <View style={styles.filtersWrapper}>
          <Text style={styles.filtersLabel}>FILTERS:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
            <TouchableOpacity style={[styles.filterBtn, styles.filterBtnActive]}>
              <Text style={[styles.filterBtnText, styles.filterBtnTextActive]}>Site</Text>
              <Ionicons name="chevron-down" size={12} color="#2563EB" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterBtn}>
              <Text style={styles.filterBtnText}>Department</Text>
              <Ionicons name="chevron-down" size={12} color="#64748B" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterBtn}>
              <Text style={styles.filterBtnText}>Type</Text>
              <Ionicons name="chevron-down" size={12} color="#64748B" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterBtn}>
              <Text style={styles.filterBtnText}>Priority</Text>
              <Ionicons name="chevron-down" size={12} color="#64748B" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.clearAllBtn}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Section Title */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Assigned Audits</Text>
          <Text style={styles.subtitle}>Manage and complete your scheduled safety inspections.</Text>
        </View>

        {/* Audit Cards List */}
        {loading && (
          <View style={{ paddingVertical: 40 }}>
            <ActivityIndicator color="#2563EB" />
          </View>
        )}
        {!loading && error && (
          <Text style={{ textAlign: 'center', color: '#EF4444', paddingVertical: 24, fontWeight: '600' }}>{error}</Text>
        )}
        {!loading && !error && visibleAudits.length === 0 && (
          <Text style={{ textAlign: 'center', color: '#64748B', paddingVertical: 24, fontWeight: '600' }}>
            No audits assigned yet.
          </Text>
        )}
        <View style={styles.cardsList}>
          {visibleAudits.map((item) => {
            const statusStyle = getStatusStyle(item.status);
            const priorityStyle = getPriorityStyle(item.priority);
            
            return (
              <View
                key={item.id}
                style={[
                  styles.card,
                  item.status === 'overdue' && styles.cardOverdue,
                  item.status === 'in_progress' && styles.cardInProgress,
                  item.status === 'scheduled' && styles.cardScheduled,
                ]}
              >
                {/* Card Header (Badges) */}
                <View style={styles.cardHeader}>
                  <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
                    <Ionicons name={statusStyle.icon as any} size={12} color={statusStyle.text} />
                    <Text style={[styles.badgeText, { color: statusStyle.text }]}>
                      {statusStyle.label}
                    </Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: priorityStyle.bg }]}>
                    <Text style={[styles.badgeText, { color: priorityStyle.text }]}>
                      {priorityStyle.label}
                    </Text>
                  </View>
                </View>

                {/* Audit Title */}
                <Text style={styles.cardTitleText}>{item.title}</Text>
                <Text style={styles.cardSubtitleText}>{item.checklist_type}</Text>

                {/* Columns */}
                <View style={styles.infoGrid}>
                  <View style={styles.infoCol}>
                    <Text style={styles.colLabel}>SITE</Text>
                    <Text style={styles.colVal}>{item.site}</Text>
                  </View>
                  <View style={styles.infoCol}>
                    <Text style={styles.colLabel}>DEPT</Text>
                    <Text style={styles.colVal}>{item.dept}</Text>
                  </View>
                </View>

                {/* Progress bar if in progress */}
                {item.status === 'in_progress' && item.progress !== undefined && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${item.progress}%` }]} />
                    </View>
                    <Text style={styles.progressText}>{item.progress}% Complete</Text>
                  </View>
                )}

                {/* Card Footer */}
                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.dueLabel}>DUE DATE</Text>
                    <Text style={[styles.dueDateText, item.status === 'overdue' && styles.dueDateTextOverdue]}>
                      {item.dueDate}
                    </Text>
                  </View>

                  {item.status === 'overdue' && (
                    <TouchableOpacity
                      style={styles.startBtn}
                      onPress={() => navigation.navigate('AuditDetail', { audit: item })}
                    >
                      <Text style={styles.startBtnText}>Start Audit</Text>
                    </TouchableOpacity>
                  )}
                  {item.status === 'in_progress' && (
                    <TouchableOpacity
                      style={[styles.startBtn, styles.resumeBtn]}
                      onPress={() => navigation.navigate('AuditChecklist', { audit: item })}
                    >
                      <Text style={styles.startBtnText}>Resume</Text>
                    </TouchableOpacity>
                  )}
                  {item.status === 'scheduled' && (
                    <TouchableOpacity
                      style={[styles.startBtn, styles.detailsBtn]}
                      onPress={() => navigation.navigate('AuditDetail', { audit: item })}
                    >
                      <Text style={styles.detailsBtnText}>Details</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* AI Smart Schedule Card */}
        <View style={styles.aiCard}>
          <View style={styles.aiHeader}>
            <View style={styles.aiIconBox}>
              <Ionicons name="analytics" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.aiTitle}>AI Smart Schedule</Text>
          </View>
          <Text style={styles.aiDesc}>
            Based on current incident trends, we recommend auditing the High-Pressure Unit next.
          </Text>
          <TouchableOpacity style={styles.aiBtn}>
            <Text style={styles.aiBtnText}>View Insights</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    height: 60,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1.5,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  bellBtn: {
    padding: 2,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    marginTop: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  filtersWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 8,
  },
  filtersLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    marginRight: 8,
  },
  filtersScroll: {
    flexGrow: 0,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  filterBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  filterBtnTextActive: {
    color: '#2563EB',
  },
  clearAllBtn: {
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  clearAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  titleSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 4,
  },
  cardsList: {
    gap: 16,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    borderLeftWidth: 5,
  },
  cardOverdue: {
    borderLeftColor: '#EF4444',
  },
  cardInProgress: {
    borderLeftColor: '#8B5CF6',
  },
  cardScheduled: {
    borderLeftColor: '#3B82F6',
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  cardSubtitleText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
    marginBottom: 14,
  },
  infoGrid: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  infoCol: {
    flex: 1,
  },
  colLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  colVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginTop: 2,
  },
  progressContainer: {
    marginBottom: 14,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 4,
    textAlign: 'right',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  dueLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
  },
  dueDateText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginTop: 2,
  },
  dueDateTextOverdue: {
    color: '#EF4444',
  },
  startBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resumeBtn: {
    backgroundColor: '#8B5CF6',
  },
  detailsBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  detailsBtnText: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '700',
  },
  aiCard: {
    backgroundColor: '#2563EB',
    borderRadius: 16,
    padding: 20,
    marginTop: 10,
    marginBottom: 30,
    elevation: 3,
    shadowColor: '#2563EB',
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  aiIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  aiDesc: {
    color: '#EFF6FF',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 16,
  },
  aiBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBtnText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '800',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#2563EB',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
});
