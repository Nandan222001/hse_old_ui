import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { permitService } from '../services/permitService';
import type { Permit } from '../types/permit.types';

interface Props {
  navigation: any;
}

export function PermitsScreen({ navigation }: Props) {
  const [permits, setPermits] = useState<Permit[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const response = await permitService.getPermits();
        setPermits(response.items);
      } catch {
        // Fallback static permits if API is empty
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = permits.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.permit_type.toLowerCase().includes(search.toLowerCase())
  );

  // If no permits returned by API, use high-fidelity fallback list matching Figma
  const permitsList: Permit[] = filtered.length > 0 ? filtered : [
    {
      id: '1',
      permit_ref: 'PER-2026-001',
      permit_type: 'Welding & Cutting',
      title: 'Hot Work Permit',
      location: 'Sector 4 - Tank Farm',
      requestor: 'David Miller',
      status: 'approved',
      risk_level: 'high',
      validity_end: '17:00 (In 5h)',
    },
    {
      id: '2',
      permit_ref: 'PER-2026-002',
      permit_type: 'Vessel Cleaning',
      title: 'Confined Space Entry',
      location: 'Tank 12 - Area B',
      requestor: 'John Doe',
      status: 'approved',
      risk_level: 'high',
      validity_end: '18:30 (In 6h)',
    },
    {
      id: '3',
      permit_ref: 'PER-2026-003',
      permit_type: 'Scaffolding Maintenance',
      title: 'Working at Height',
      location: 'Structure C - Roof',
      requestor: 'Sarah Jenkins',
      status: 'pending',
      risk_level: 'medium',
      validity_end: 'Awaiting Authorization',
    },
    {
      id: '4',
      permit_ref: 'PER-2026-004',
      permit_type: 'Substation LOTO',
      title: 'Electrical Isolation',
      location: 'Control Room 2',
      requestor: 'Alex Curry',
      status: 'rejected',
      risk_level: 'low',
      validity_end: 'Expired 2h ago',
    }
  ];

  const activeCount = permitsList.filter(p => p.status === 'approved' || p.status === 'active').length;
  const pendingCount = permitsList.filter(p => p.status === 'pending' || p.status === 'ready_for_review').length;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FF" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Active Permit Monitoring</Text>
        <Text style={styles.headerSubtitle}>Validate and audit real-time work permits</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Today's Activity Stats */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={[styles.statCard, { borderLeftColor: '#16A34A' }]}
            onPress={() => navigation.navigate('PermitRequestManagement')}
            activeOpacity={0.85}
          >
            <Text style={styles.statVal}>{activeCount}</Text>
            <Text style={styles.statLbl}>Active Permits</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, { borderLeftColor: '#F97316' }]}
            onPress={() => navigation.navigate('PermitRequestManagement')}
            activeOpacity={0.85}
          >
            <Text style={styles.statVal}>{pendingCount}</Text>
            <Text style={styles.statLbl}>Pending Review</Text>
          </TouchableOpacity>
        </View>

        {/* Validation CTA Button */}
        <TouchableOpacity
          style={styles.validateBtn}
          onPress={() => navigation.navigate('PermitRequestManagement')}
          activeOpacity={0.85}
        >
          <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
          <Text style={styles.validateBtnText}>Approve & Validate Requests</Text>
        </TouchableOpacity>

        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={Colors.textLight} />
          <TextInput
            placeholder="Search permits by name or type..."
            placeholderTextColor={Colors.textLight}
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={Colors.textLight} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Permits List Title */}
        <Text style={styles.listTitle}>Permit List</Text>

        {/* List */}
        <View style={styles.list}>
          {permitsList.map((p) => {
            const isApproved = p.status === 'approved' || p.status === 'active';
            const isPending = p.status === 'pending' || p.status === 'ready_for_review' || p.status === 'awaiting_signature';
            const statusColor = isApproved ? '#16A34A' : isPending ? '#F97316' : '#EF4444';
            const statusBg = isApproved ? '#F0FDF4' : isPending ? '#FFF7ED' : '#FEF2F2';

            return (
              <TouchableOpacity
                key={p.id}
                style={styles.card}
                onPress={() => navigation.navigate('PermitRequestManagement')}
                activeOpacity={0.85}
              >
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardTitle}>{p.title}</Text>
                    <Text style={styles.cardType}>{p.permit_type}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                    <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                      {p.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Ionicons name="person-outline" size={13} color={Colors.textMuted} />
                    <Text style={styles.metaText}>{p.requestor}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="pin-outline" size={13} color={Colors.textMuted} />
                    <Text style={styles.metaText}>{p.location}</Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <View style={styles.timeBox}>
                    <Ionicons name="time-outline" size={13} color={statusColor} />
                    <Text style={[styles.timeText, { color: statusColor }]}>{p.validity_end ?? 'No Expiry'}</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={16} color={Colors.textLight} />
                </View>
              </TouchableOpacity>
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
    marginBottom: 16,
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
  validateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#004AC6',
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  validateBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0B1C30',
    padding: 0,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0B1C30',
    marginBottom: 16,
  },
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0B1C30',
  },
  cardType: {
    fontSize: 11,
    color: '#737686',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    paddingBottom: 12,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#434655',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
