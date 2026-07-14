import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, Alert, Platform,
} from 'react-native';
import { ScreenLayout } from '../components/layout/ScreenLayout';
import { Colors } from '../theme/colors';

export default function SafetyTrainingDetailScreen({ route, navigation }: any) {
  const course = route.params?.course;

  const title = course?.title ?? 'Heat Stress Prevention';
  const desc = course?.description ?? 'Essential safety protocols for working in high-temperature environments. 15-minute scheduled talk.';

  const handleStartAssessment = () => {
    Alert.alert('Training Completed', 'You have acknowledged and completed this training module.');
  };

  return (
    <ScreenLayout bg="#F8FAFC">
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.headerIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SafeGuard HSE</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('Notifications')}>
          <Text style={styles.headerIcon}>🔔</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Breadcrumb Row */}
        <View style={styles.breadcrumbRow}>
          <Text style={styles.breadcrumbText}>Safety Portal  &gt;  Toolbox Talks</Text>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>In Progress</Text>
          </View>
        </View>

        {/* Title & Subtitle */}
        <Text style={styles.titleText}>{title}</Text>
        <Text style={styles.descText}>{desc}</Text>

        {/* Video Player Card */}
        <View style={styles.videoCard}>
          <View style={styles.videoThumbnailContainer}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=600' }}
              style={styles.videoThumbnail as any}
            />
            {/* Play Button Overlay */}
            <View style={styles.playBtn}>
              <Text style={styles.playIcon}>▶</Text>
            </View>
            {/* Control Bar Overlay */}
            <View style={styles.videoControlBar}>
              <Text style={styles.videoControlTitle}>Training Module 04: Heat Response</Text>
              <Text style={styles.videoControlTime}>08:42 / 12:00</Text>
            </View>
          </View>

          {/* Action Bar */}
          <View style={styles.videoActionBar}>
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.actionBtnIcon}>📥</Text>
              <Text style={styles.actionBtnText}>Download PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.actionBtnIcon}>💬</Text>
              <Text style={styles.actionBtnText}>Subtitles</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Key Topics Section */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.keyTopicsTitleIcon}>📖</Text>
            <Text style={styles.cardSectionTitle}>Key Topics</Text>
          </View>

          <View style={styles.topicsList}>
            {/* Topic 1 */}
            <View style={styles.topicItem}>
              <View style={styles.numberBox}><Text style={styles.numberText}>01</Text></View>
              <View style={styles.topicContent}>
                <Text style={styles.topicTitle}>Acclimatization</Text>
                <Text style={styles.topicDesc}>Gradually increasing exposure to hot environments over 7-14 days.</Text>
              </View>
            </View>

            {/* Topic 2 */}
            <View style={styles.topicItem}>
              <View style={styles.numberBox}><Text style={styles.numberText}>02</Text></View>
              <View style={styles.topicContent}>
                <Text style={styles.topicTitle}>Hydration Cycle</Text>
                <Text style={styles.topicDesc}>Drink 1 cup (8 oz) of water every 15-20 minutes, even if not thirsty.</Text>
              </View>
            </View>

            {/* Topic 3 */}
            <View style={styles.topicItem}>
              <View style={styles.numberBox}><Text style={styles.numberText}>03</Text></View>
              <View style={styles.topicContent}>
                <Text style={styles.topicTitle}>Warning Signs</Text>
                <Text style={styles.topicDesc}>Identify dizziness, heavy sweating, and elevated heart rate immediately.</Text>
              </View>
            </View>
          </View>

          {/* Urgent Care Alert */}
          <View style={styles.urgentCareCard}>
            <Text style={styles.urgentCareTitle}>* URGENT CARE</Text>
            <Text style={styles.urgentCareText}>If heat stroke is suspected, call site emergency Ext. 999 immediately.</Text>
          </View>
        </View>

        {/* Team Attendance Section */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardSectionTitle}>Team Attendance</Text>
              <Text style={styles.cardSectionSub}>12 of 14 team members present</Text>
            </View>
            <TouchableOpacity style={styles.addMemberBtn}>
              <Text style={styles.addMemberText}>Add Member</Text>
            </TouchableOpacity>
          </View>

          {/* Attendance Table */}
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCol, { flex: 1.5 }]}>Employee Name</Text>
              <Text style={styles.tableCol}>Role</Text>
              <Text style={[styles.tableCol, { textAlign: 'right' }]}>Verification</Text>
            </View>

            {/* Row 1 */}
            <View style={styles.tableRow}>
              <View style={[styles.tableCol, { flex: 1.5, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100' }}
                  style={styles.avatar as any}
                />
                <Text style={styles.empName}>Marco Rossi</Text>
              </View>
              <Text style={styles.tableCellText}>Pipefitter</Text>
              <Text style={[styles.verificationText, { color: '#15803D' }]}>Facial ID Confirmed</Text>
            </View>

            {/* Row 2 */}
            <View style={styles.tableRow}>
              <View style={[styles.tableCol, { flex: 1.5, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=100' }}
                  style={styles.avatar as any}
                />
                <Text style={styles.empName}>Elena Rodriguez</Text>
              </View>
              <Text style={styles.tableCellText}>Safety Tech</Text>
              <Text style={[styles.verificationText, { color: '#2563EB' }]}>Mobile Auth</Text>
            </View>

            {/* Row 3 */}
            <View style={styles.tableRow}>
              <View style={[styles.tableCol, { flex: 1.5, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100' }}
                  style={styles.avatar as any}
                />
                <Text style={styles.empName}>James Miller</Text>
              </View>
              <Text style={styles.tableCellText}>Electrician</Text>
              <Text style={[styles.verificationText, { color: '#64748B' }]}>—</Text>
            </View>
          </View>
        </View>

        {/* Complete Talk Button */}
        <TouchableOpacity style={styles.completeBtn} onPress={handleStartAssessment}>
          <Text style={styles.completeBtnText}>Acknowledge & Complete Talk</Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
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
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  breadcrumbText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#A855F7',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A855F7',
  },
  titleText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  descText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 20,
    fontWeight: '500',
  },
  videoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  videoThumbnailContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  playBtn: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 4,
  },
  playIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  videoControlBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  videoControlTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  videoControlTime: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  videoActionBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderRightWidth: 1,
    borderRightColor: '#F1F5F9',
  },
  actionBtnIcon: {
    fontSize: 14,
    color: '#2563EB',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  keyTopicsTitleIcon: {
    fontSize: 18,
    color: '#2563EB',
  },
  cardSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  topicsList: {
    gap: 14,
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  numberBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
  },
  topicContent: {
    flex: 1,
  },
  topicTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  topicDesc: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
    lineHeight: 16,
    fontWeight: '500',
  },
  urgentCareCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    padding: 14,
    marginTop: 18,
  },
  urgentCareTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EF4444',
  },
  urgentCareText: {
    fontSize: 12,
    color: '#7F1D1D',
    fontWeight: '600',
    marginTop: 2,
    lineHeight: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardSectionSub: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  addMemberBtn: {
    borderWidth: 1.5,
    borderColor: '#2563EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMemberText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '700',
  },
  table: {
    marginTop: 6,
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
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  empName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  tableCellText: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  verificationText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'right',
  },
  completeBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
