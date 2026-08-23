import React, { useEffect, useCallback, useState } from 'react';
import { Icon } from '../components/display/Icon';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { ScreenLayout } from '../components/layout/ScreenLayout';
import { WorkflowStageBar } from '../../components/workflow/WorkflowStageBar';
import { Colors } from '../theme/colors';
import { usePermits } from '../hooks/usePermits';

export default function PermitsScreen({ navigation }: any) {
  const { permits, isLoading, fetchPermits, acknowledgePermit } = usePermits();
  const [signed, setSigned] = useState(false);

  const activeList = permits.filter(p => p.status === 'active');
  const pendingList = permits.filter(p => p.status === 'pending_approval' || p.status === 'draft');

  useEffect(() => {
    fetchPermits();
  }, []);

  const onRefresh = useCallback(() => {
    fetchPermits();
  }, []);

  const handleAcknowledge = async (id: string) => {
    const ok = await acknowledgePermit(id);
    if (ok) {
      fetchPermits();
    }
  };

  const handleSign = () => {
    setSigned(true);
    Alert.alert('Digital Signature', 'Signed as Alex Safety.');
  };

  const handleSubmitSignature = () => {
    if (!signed) {
      Alert.alert('Signature Required', 'Please click on the signature area to sign.');
      return;
    }
    Alert.alert('Permit Finalized', 'Permit PTW-0042-24 has been submitted & finalized.');
  };

  return (
    <ScreenLayout bg="#F8FAFC">
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Icon emoji="☰" style={styles.headerIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Permits</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('Notifications')}>
          <Icon emoji="🔔" style={styles.headerIcon} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Stats Column */}
        <View style={styles.statsContainer}>
          {/* Card 1: Active Permits */}
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Active Permits</Text>
            <View style={styles.statValueRow}>
              <Text style={styles.statValue}>{activeList.length > 0 ? String(activeList.length).padStart(2, '0') : '03'}</Text>
              <View style={styles.statTrendRow}>
                <Icon name="trending-up" size={14} color="#22C55E" style={{ marginRight: 2 }} />
                <Text style={styles.statTrend}>+2</Text>
              </View>
            </View>
          </View>

          {/* Card 2: Pending Approval */}
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Pending Approval</Text>
            <View style={styles.statValueRow}>
              <Text style={[styles.statValue, { color: '#8B5CF6' }]}>
                {pendingList.length > 0 ? String(pendingList.length).padStart(2, '0') : '05'}
              </Text>
              <Text style={styles.statStatusUrgent}>Urgent</Text>
            </View>
          </View>

          {/* Card 3: Expiry Warning */}
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Expiry Warning</Text>
            <View style={styles.statValueRow}>
              <Text style={[styles.statValue, { color: '#EF4444' }]}>03</Text>
              <Text style={styles.statStatusNext}>Next 2hrs</Text>
            </View>
          </View>
        </View>

        {/* Active Permits Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Permits</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {/* Active Permits List */}
        <View style={styles.permitsList}>
          {activeList.length > 0 ? (
            activeList.map((permit) => (
              <View key={permit.id} style={styles.permitCard}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.badge, { backgroundColor: permit.permit_type === 'hot_work' ? '#FEE2E2' : '#E0F2FE' }]}>
                    <Text style={[styles.badgeText, { color: permit.permit_type === 'hot_work' ? '#EF4444' : '#0EA5E9' }]}>
                      {permit.permit_type.toUpperCase().replace('_', ' ')}
                    </Text>
                  </View>
                  <View style={styles.timerRow}>
                    <Icon name="clock" size={12} color="#EF4444" style={styles.timerIcon} />
                    <Text style={styles.timerText}>{permit.permit_ref}</Text>
                  </View>
                </View>
                <Text style={styles.permitTitle}>{permit.work_description || 'Safety Permit'}</Text>
                <View style={styles.permitLocRow}>
                  <Icon name="map-pin" size={12} color="#64748B" style={styles.timerIcon} />
                  <Text style={styles.permitLoc}>{permit.work_location}</Text>
                </View>
                {/* How far the permit has got. A worker raises one and then has
                    no way to see whether it has been acknowledged, approved or
                    verified — the same gap My Near Misses closed for reports. */}
                <WorkflowStageBar stage={permit} showCaption={false} />
                <View style={styles.permitActionRow}>
                  <TouchableOpacity style={styles.ackBtn} onPress={() => handleAcknowledge(permit.id)}>
                    <Text style={styles.ackBtnText}>Acknowledge</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.eyeBtn}>
                    <Icon emoji="👁️" style={styles.eyeIcon} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <>
              {/* Card 1 */}
              <View style={styles.permitCard}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.badge, { backgroundColor: '#FEE2E2' }]}>
                    <Text style={[styles.badgeText, { color: '#EF4444' }]}>Hot Work</Text>
                  </View>
                  <View style={styles.timerRow}>
                    <Icon name="clock" size={12} color="#EF4444" style={styles.timerIcon} />
                    <Text style={styles.timerText}>01:24:05</Text>
                  </View>
                </View>
                <Text style={styles.permitTitle}>Welding - Zone B</Text>
                <View style={styles.permitLocRow}>
                  <Icon name="map-pin" size={12} color="#64748B" style={styles.timerIcon} />
                  <Text style={styles.permitLoc}>Maintenance Bay 4, Site Alpha</Text>
                </View>
                <View style={styles.permitActionRow}>
                  <TouchableOpacity style={styles.ackBtn} onPress={() => handleAcknowledge('1')}>
                    <Text style={styles.ackBtnText}>Acknowledge</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.eyeBtn}>
                    <Icon emoji="👁️" style={styles.eyeIcon} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Card 2 */}
              <View style={styles.permitCard}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.badge, { backgroundColor: '#F3E5F5' }]}>
                    <Text style={[styles.badgeText, { color: '#8B5CF6' }]}>Confined Space</Text>
                  </View>
                  <View style={styles.timerRow}>
                    <Icon name="clock" size={12} color="#475569" style={styles.timerIcon} />
                    <Text style={[styles.timerText, { color: '#475569' }]}>04:12:18</Text>
                  </View>
                </View>
                <Text style={styles.permitTitle}>Tank Inspection - T02</Text>
                <View style={styles.permitLocRow}>
                  <Icon name="map-pin" size={12} color="#64748B" style={styles.timerIcon} />
                  <Text style={styles.permitLoc}>Storage Yard West</Text>
                </View>
                <View style={styles.permitActionRow}>
                  <TouchableOpacity style={styles.ackBtn} onPress={() => handleAcknowledge('2')}>
                    <Text style={styles.ackBtnText}>Acknowledge</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.eyeBtn}>
                    <Icon emoji="👁️" style={styles.eyeIcon} />
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Pending Approval Section */}
        <Text style={styles.sectionTitle}>Pending Approval</Text>
        <View style={styles.tableCard}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCol, { flex: 1.5 }]}>Type</Text>
            <Text style={styles.tableCol}>Requester</Text>
            <Text style={[styles.tableCol, { textAlign: 'right' }]}>Action</Text>
          </View>

          {pendingList.length > 0 ? (
            pendingList.map((permit) => (
              <TouchableOpacity key={permit.id} style={styles.tableRow} onPress={() => navigation.navigate('RaisePermit')}>
                <View style={{ flex: 1.5 }}>
                  <Text style={styles.courseName}>{permit.permit_type.replace('_', ' ').toUpperCase()}</Text>
                  <Text style={styles.courseCode}>#{permit.permit_ref}</Text>
                </View>
                <Text style={styles.tableCellText}>{permit.requested_by}</Text>
                <Icon emoji="❯" style={styles.arrowText} />
              </TouchableOpacity>
            ))
          ) : (
            <>
              {/* Row 1 */}
              <TouchableOpacity style={styles.tableRow} onPress={() => navigation.navigate('RaisePermit')}>
                <View style={{ flex: 1.5 }}>
                  <Text style={styles.courseName}>Cold Work</Text>
                  <Text style={styles.courseCode}>#PTW-8821</Text>
                </View>
                <Text style={styles.tableCellText}>John Doe</Text>
                <Icon emoji="❯" style={styles.arrowText} />
              </TouchableOpacity>

              {/* Row 2 */}
              <TouchableOpacity style={styles.tableRow} onPress={() => navigation.navigate('RaisePermit')}>
                <View style={{ flex: 1.5 }}>
                  <Text style={styles.courseName}>Electrical</Text>
                  <Text style={styles.courseCode}>#PTW-8824</Text>
                </View>
                <Text style={styles.tableCellText}>Sarah Miller</Text>
                <Icon emoji="❯" style={styles.arrowText} />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Details Welding - Zone B */}
        <View style={styles.detailSectionHeader}>
          <Text style={styles.sectionTitle}>Details: Welding - Zone B</Text>
          <Text style={styles.highRiskLabel}>HIGH RISK</Text>
        </View>

        <View style={styles.detailCard}>
          <View style={styles.detailCardHeader}>
            <View style={styles.iconBox}><Icon emoji="🔥" style={styles.iconFire} /></View>
            <View>
              <Text style={styles.detailCardTitle}>Permit ID: PTW-0042-24</Text>
              <Text style={styles.detailCardSub}>Hot Work Operations</Text>
            </View>
          </View>

          <Text style={styles.mandatoryTitle}>MANDATORY CONDITIONS</Text>
          <View style={styles.conditionsList}>
            <View style={styles.conditionItem}>
              <Icon emoji="✓" style={styles.checkIcon} />
              <Text style={styles.conditionText}>Fire watch established and extinguisher available at work area.</Text>
            </View>
            <View style={styles.conditionItem}>
              <Icon emoji="✓" style={styles.checkIcon} />
              <Text style={styles.conditionText}>Gas monitoring performed; LEL level is 0%.</Text>
            </View>
            <View style={styles.conditionItem}>
              <Icon emoji="⚠️" style={styles.warningIcon} />
              <Text style={styles.conditionText}>Shielding must be in place to prevent sparks reaching floor levels below.</Text>
            </View>
          </View>

          <Text style={styles.signatureTitle}>DIGITAL SIGNATURE</Text>
          <TouchableOpacity style={styles.signatureBox} onPress={handleSign}>
            {signed ? (
              <View style={styles.signedContainer}>
                <Text style={styles.signatureMockText}>Alex Safety</Text>
                <Text style={styles.signatureDate}>24 Oct 2023, 08:30</Text>
              </View>
            ) : (
              <View style={styles.signaturePlaceholder}>
                <Icon emoji="🖊️" style={styles.signaturePenIcon} />
                <Text style={styles.signaturePlaceholderText}>Click or draw to sign</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.signatureFooter}>
            <View>
              <Text style={styles.issuerName}>Alex Safety</Text>
              <Text style={styles.issuerTitle}>AUTHORIZED ISSUER • 24 OCT 2023, 08:30</Text>
            </View>
            <TouchableOpacity style={styles.submitSignatureBtn} onPress={handleSubmitSignature}>
              <Text style={styles.submitSignatureText}>Submit & Finalize</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('RaisePermit')}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  headerIcon: {
    fontSize: 22,
    color: '#0F172A',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: -0.5,
  },
  scroll: {
    flex: 1,
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2563EB',
  },
  statTrend: {
    fontSize: 14,
    color: '#22C55E',
    fontWeight: '800',
  },
  statStatusUrgent: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '700',
  },
  statStatusNext: {
    fontSize: 13,
    color: '#E2E8F0',
    backgroundColor: '#475569',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontWeight: '700',
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '700',
  },
  permitsList: {
    gap: 12,
    marginBottom: 20,
  },
  permitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerIcon: {
    marginRight: 4,
  },
  statTrendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444',
  },
  permitTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 10,
  },
  permitLocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  permitLoc: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  permitActionRow: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 8,
  },
  ackBtn: {
    flex: 1,
    height: 40,
    backgroundColor: '#2563EB',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ackBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  eyeBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeIcon: {
    fontSize: 16,
    color: '#475569',
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1.5,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 8,
    marginBottom: 8,
  },
  tableCol: {
    flex: 1,
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  courseName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  courseCode: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1,
  },
  tableCellText: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  arrowText: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '800',
  },
  detailSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  highRiskLabel: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  detailCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconFire: {
    fontSize: 20,
  },
  detailCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  detailCardSub: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  mandatoryTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  conditionsList: {
    gap: 12,
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 16,
  },
  conditionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 18,
  },
  warningIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FEF2F2',
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 18,
  },
  conditionText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    lineHeight: 16,
  },
  signatureTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  signatureBox: {
    height: 100,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  signaturePlaceholder: {
    alignItems: 'center',
    gap: 4,
  },
  signaturePenIcon: {
    fontSize: 18,
    color: '#64748B',
  },
  signaturePlaceholderText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  signedContainer: {
    alignItems: 'center',
  },
  signatureMockText: {
    fontSize: 22,
    fontFamily: Platform.OS === 'ios' ? 'Snell Roundhand' : 'cursive',
    color: '#1E3A8A',
    fontWeight: 'bold',
  },
  signatureDate: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '600',
  },
  signatureFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  issuerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  issuerTitle: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 2,
  },
  submitSignatureBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitSignatureText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#2563EB',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabIcon: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '500',
    marginTop: -2,
  },
});
