import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function AuditDetailScreen({ route, navigation }: any) {
  const { audit } = route.params || {};

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Breadcrumb */}
        <Text style={styles.breadcrumbs}>
          Dashboard &gt; Audits &gt; <Text style={styles.activeBreadcrumb}>{audit?.id || 'Audit #88219'}</Text>
        </Text>

        {/* Main Header Block */}
        <Text style={styles.mainTitle}>{audit?.title || 'Annual Structural Safety Inspection'}</Text>
        
        <View style={styles.metaRow}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>Scheduled</Text>
          </View>
          <View style={styles.dateBox}>
            <Ionicons name="calendar-outline" size={14} color="#64748B" />
            <Text style={styles.dateText}>Oct 24, 2023 - Oct 26, 2023</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.editBtn}>
            <Ionicons name="create-outline" size={18} color="#2563EB" />
            <Text style={styles.editBtnText}>Edit Details</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.conductBtn}
            onPress={() => navigation.navigate('AuditChecklist', { audit })}
          >
            <Ionicons name="play" size={16} color="#FFFFFF" />
            <Text style={styles.conductBtnText}>Conduct Audit</Text>
          </TouchableOpacity>
        </View>

        {/* Card 1: Audit Overview */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.blueIndicator} />
            <Text style={styles.cardTitle}>Audit Overview</Text>
          </View>

          <Text style={styles.sectionHeading}>Audit Scope</Text>
          <Text style={styles.scopeBody}>
            Comprehensive assessment of structural integrity and safety protocols for the North Wing manufacturing facility. The audit covers load-bearing structures, emergency egress routes, fire suppression readiness, and heavy machinery anchoring compliance. Special attention is directed toward recent retrofitting in Sector 4B.
          </Text>

          <Text style={styles.sectionHeading}>Audit Criteria</Text>
          <View style={styles.criteriaRow}>
            <View style={styles.criteriaBadge}><Text style={styles.criteriaText}>ISO 45001:2018</Text></View>
            <View style={styles.criteriaBadge}><Text style={styles.criteriaText}>OSHA 1910 Subpart D</Text></View>
            <View style={styles.criteriaBadge}><Text style={styles.criteriaText}>NFPA 101 Life Safety</Text></View>
            <View style={styles.criteriaBadge}><Text style={styles.criteriaText}>Structural Integrity Standards V3</Text></View>
          </View>
        </View>

        {/* Card 2: Timeline */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar-outline" size={20} color="#2563EB" />
            <Text style={styles.cardTitle}>Timeline</Text>
          </View>

          <View style={styles.timeline}>
            {/* Step 1 */}
            <View style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View style={[styles.timelineDot, styles.timelineDotDone]}>
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                </View>
                <View style={[styles.timelineLine, styles.timelineLineDone]} />
              </View>
              <View style={styles.timelineRight}>
                <Text style={styles.timelineStepTitle}>Planning Phase</Text>
                <Text style={styles.timelineStepMeta}>Completed • Oct 10</Text>
              </View>
            </View>

            {/* Step 2 */}
            <View style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View style={[styles.timelineDot, styles.timelineDotCurrent]}>
                  <Ionicons name="time" size={12} color="#FFFFFF" />
                </View>
                <View style={styles.timelineLine} />
              </View>
              <View style={styles.timelineRight}>
                <Text style={[styles.timelineStepTitle, styles.timelineStepTitleActive]}>On-Site Field Audit</Text>
                <Text style={styles.timelineStepMeta}>Upcoming • Oct 24 - 26</Text>
              </View>
            </View>

            {/* Step 3 */}
            <View style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineLine} />
              </View>
              <View style={styles.timelineRight}>
                <Text style={styles.timelineStepTitleNotActive}>Review & Findings</Text>
                <Text style={styles.timelineStepMeta}>Scheduled • Oct 28</Text>
              </View>
            </View>

            {/* Step 4 */}
            <View style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View style={styles.timelineDot} />
              </View>
              <View style={styles.timelineRight}>
                <Text style={styles.timelineStepTitleNotActive}>Final Report</Text>
                <Text style={styles.timelineStepMeta}>Target • Nov 02</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Card 3: Site Details */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="location-outline" size={20} color="#2563EB" />
            <Text style={styles.cardTitle}>Site Details</Text>
          </View>

          {/* Photo Placeholder */}
          <View style={styles.sitePhotoBox}>
            <View style={styles.sitePhotoOverlay}>
              <Text style={styles.sitePhotoText}>North Wing Facility</Text>
            </View>
          </View>

          <Text style={styles.colLabel}>ADDRESS</Text>
          <Text style={styles.addressText}>882 Industrial Pkwy, Building B, Chicago, IL 60609</Text>

          <Text style={styles.colLabel}>SITE CONTACT</Text>
          <View style={styles.contactRow}>
            <View style={styles.contactIcon}>
              <Ionicons name="person-outline" size={16} color="#2563EB" />
            </View>
            <View>
              <Text style={styles.contactName}>Robert Vance</Text>
              <Text style={styles.contactRole}>Facility Manager • (555) 012-3344</Text>
            </View>
          </View>
        </View>

        {/* Card 4: Assigned Team */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="people-outline" size={20} color="#2563EB" />
            <Text style={styles.cardTitle}>Assigned Team</Text>
          </View>

          <View style={styles.teamList}>
            <View style={styles.memberCard}>
              <View style={styles.memberAvatar}>
                <Text style={styles.avatarText}>MS</Text>
              </View>
              <View>
                <Text style={styles.memberName}>Marcus Sterling</Text>
                <Text style={styles.memberRole}>Lead Auditor</Text>
              </View>
            </View>

            <View style={styles.memberCard}>
              <View style={[styles.memberAvatar, { backgroundColor: '#8B5CF6' }]}>
                <Text style={styles.avatarText}>ER</Text>
              </View>
              <View>
                <Text style={styles.memberName}>Elena Rodriguez</Text>
                <Text style={styles.memberRole}>Structural Specialist</Text>
              </View>
            </View>

            <View style={styles.memberCard}>
              <View style={[styles.memberAvatar, { backgroundColor: '#F59E0B' }]}>
                <Text style={styles.avatarText}>JT</Text>
              </View>
              <View>
                <Text style={styles.memberName}>James Thorne</Text>
                <Text style={styles.memberRole}>Environmental Auditor</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.assignBtn}>
              <Ionicons name="person-add-outline" size={16} color="#2563EB" />
              <Text style={styles.assignBtnText}>Assign Member</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Card 5: Documentation */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="folder-open-outline" size={20} color="#2563EB" />
            <Text style={styles.cardTitle}>Documentation</Text>
          </View>

          <View style={styles.docList}>
            <View style={styles.docItem}>
              <Ionicons name="document-text" size={22} color="#EF4444" />
              <View style={styles.docInfo}>
                <Text style={styles.docName}>Prev_Audit_2022.pdf</Text>
                <Text style={styles.docMeta}>2.4 MB • PDF</Text>
              </View>
              <TouchableOpacity><Ionicons name="download-outline" size={18} color="#64748B" /></TouchableOpacity>
            </View>

            <View style={styles.docItem}>
              <Ionicons name="document-text" size={22} color="#3B82F6" />
              <View style={styles.docInfo}>
                <Text style={styles.docName}>Safety_Procedures.docx</Text>
                <Text style={styles.docMeta}>1.1 MB • DOCX</Text>
              </View>
              <TouchableOpacity><Ionicons name="download-outline" size={18} color="#64748B" /></TouchableOpacity>
            </View>

            <View style={styles.docItem}>
              <Ionicons name="archive" size={22} color="#F59E0B" />
              <View style={styles.docInfo}>
                <Text style={styles.docName}>Site_Blueprints_4B.zip</Text>
                <Text style={styles.docMeta}>45.8 MB • ZIP</Text>
              </View>
              <TouchableOpacity><Ionicons name="download-outline" size={18} color="#64748B" /></TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
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
    paddingHorizontal: 16,
    borderBottomWidth: 1.5,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    padding: 2,
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
    paddingBottom: 40,
  },
  breadcrumbs: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 16,
  },
  activeBreadcrumb: {
    color: '#2563EB',
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
    marginBottom: 16,
  },
  statusBadge: {
    backgroundColor: '#8B5CF6',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  dateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    backgroundColor: '#FFFFFF',
    height: 44,
  },
  editBtnText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '700',
  },
  conductBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    height: 44,
  },
  conductBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  blueIndicator: {
    width: 4,
    height: 16,
    backgroundColor: '#2563EB',
    borderRadius: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 6,
  },
  scopeBody: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    fontWeight: '500',
    marginBottom: 16,
  },
  criteriaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  criteriaBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  criteriaText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 20,
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotDone: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  timelineDotCurrent: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  timelineLine: {
    width: 2,
    height: 40,
    backgroundColor: '#E2E8F0',
  },
  timelineLineDone: {
    backgroundColor: '#2563EB',
  },
  timelineRight: {
    flex: 1,
    paddingBottom: 24,
  },
  timelineStepTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  timelineStepTitleActive: {
    color: '#2563EB',
  },
  timelineStepTitleNotActive: {
    color: '#94A3B8',
    fontWeight: '700',
  },
  timelineStepMeta: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  sitePhotoBox: {
    height: 150,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  sitePhotoOverlay: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 12,
  },
  sitePhotoText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  colLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    lineHeight: 18,
    marginBottom: 10,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  contactIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  contactRole: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  teamList: {
    gap: 10,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  memberRole: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  assignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 6,
  },
  assignBtnText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '700',
  },
  docList: {
    gap: 12,
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  docInfo: {
    flex: 1,
  },
  docName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  docMeta: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 2,
  },
});
