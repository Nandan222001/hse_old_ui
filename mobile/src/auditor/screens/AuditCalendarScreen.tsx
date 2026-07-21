import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Audit {
  id: string;
  title: string;
  site: string;
  zone: string;
  time: string;
  status: 'Scheduled' | 'Ongoing' | 'Pending';
  color: string;
  avatars?: string[];
  avatarText?: string;
  disabled?: boolean;
}

const MOCK_CALENDAR_AUDITS: Audit[] = [
  {
    id: 'AUD-201',
    title: 'Rig Floor Safety Inspection',
    site: 'Deepwater Horizon',
    zone: 'Zone A',
    time: '09:00 AM',
    status: 'Scheduled',
    color: '#3B82F6',
    avatars: ['MS', 'ER'],
    avatarText: '+2',
  },
  {
    id: 'AUD-202',
    title: 'Equipment Calibration Check',
    site: 'Central Maintenance',
    zone: 'Hub',
    time: '01:30 PM',
    status: 'Ongoing',
    color: '#8B5CF6',
    avatars: ['MH'],
  },
  {
    id: 'AUD-203',
    title: 'Warehouse Logistics Audit',
    site: 'South Logistics Park',
    zone: 'Zone B',
    time: '04:00 PM',
    status: 'Pending',
    color: '#64748B',
    avatars: ['AN'],
    disabled: true,
  },
];

export function AuditCalendarScreen({ navigation }: any) {
  const [viewMode, setViewMode] = useState<'monthly' | 'weekly'>('monthly');
  const [selectedDay, setSelectedDay] = useState(13); // October 13, 2024

  // Visual grid representing October 2024 (starts on Tuesday 1st)
  // Shaded days of previous month: 29, 30
  // Shaded days of next month: 1, 2
  const calendarWeeks = [
    [
      { day: 29, currentMonth: false },
      { day: 30, currentMonth: false },
      { day: 1, currentMonth: true },
      { day: 2, currentMonth: true },
      { day: 3, currentMonth: true, dot: 'blue' },
      { day: 4, currentMonth: true },
      { day: 5, currentMonth: true },
    ],
    [
      { day: 6, currentMonth: true },
      { day: 7, currentMonth: true },
      { day: 8, currentMonth: true, dot: 'purple' },
      { day: 9, currentMonth: true },
      { day: 10, currentMonth: true },
      { day: 11, currentMonth: true },
      { day: 12, currentMonth: true },
    ],
    [
      { day: 13, currentMonth: true, active: true },
      { day: 14, currentMonth: true },
      { day: 15, currentMonth: true },
      { day: 16, currentMonth: true },
      { day: 17, currentMonth: true, dot: 'red' },
      { day: 18, currentMonth: true },
      { day: 19, currentMonth: true },
    ],
    [
      { day: 20, currentMonth: true },
      { day: 21, currentMonth: true },
      { day: 22, currentMonth: true },
      { day: 23, currentMonth: true },
      { day: 24, currentMonth: true, dot: 'blue' },
      { day: 25, currentMonth: true },
      { day: 26, currentMonth: true },
    ],
    [
      { day: 27, currentMonth: true },
      { day: 28, currentMonth: true },
      { day: 29, currentMonth: true },
      { day: 30, currentMonth: true },
      { day: 31, currentMonth: true },
      { day: 1, currentMonth: false },
      { day: 2, currentMonth: false },
    ],
  ];

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
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Audit Calendar</Text>
          <Text style={styles.subtitle}>Schedule and monitor safety inspections</Text>
        </View>

        {/* View Switcher */}
        <View style={styles.switchRow}>
          <TouchableOpacity
            style={[styles.switchBtn, viewMode === 'monthly' && styles.switchBtnActive]}
            onPress={() => setViewMode('monthly')}
          >
            <Text style={[styles.switchBtnText, viewMode === 'monthly' && styles.switchBtnTextActive]}>
              Monthly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.switchBtn, viewMode === 'weekly' && styles.switchBtnActive]}
            onPress={() => setViewMode('weekly')}
          >
            <Text style={[styles.switchBtnText, viewMode === 'weekly' && styles.switchBtnTextActive]}>
              Weekly
            </Text>
          </TouchableOpacity>
        </View>

        {/* Calendar Card */}
        <View style={styles.calendarCard}>
          <View style={styles.calHeader}>
            <View style={styles.calMonthRow}>
              <Text style={styles.calMonthText}>October 2024</Text>
              <View style={styles.calNavRow}>
                <TouchableOpacity><Ionicons name="chevron-back" size={18} color="#0F172A" /></TouchableOpacity>
                <TouchableOpacity><Ionicons name="chevron-forward" size={18} color="#0F172A" /></TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity style={styles.todayBtn}>
              <Ionicons name="calendar-outline" size={14} color="#2563EB" />
              <Text style={styles.todayText}>Today</Text>
            </TouchableOpacity>
          </View>

          {/* Days of Week */}
          <View style={styles.weekDaysRow}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
              <Text key={idx} style={styles.weekDayText}>{day}</Text>
            ))}
          </View>

          {/* Grid */}
          <View style={styles.calendarGrid}>
            {calendarWeeks.map((week, weekIdx) => (
              <View key={weekIdx} style={styles.gridWeekRow}>
                {week.map((cell, cellIdx) => {
                  const isSelected = selectedDay === cell.day && cell.currentMonth;
                  return (
                    <TouchableOpacity
                      key={cellIdx}
                      style={[
                        styles.gridCell,
                        isSelected && styles.gridCellActive,
                      ]}
                      onPress={() => cell.currentMonth && setSelectedDay(cell.day)}
                      disabled={!cell.currentMonth}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.cellText,
                          !cell.currentMonth && styles.cellTextShaded,
                          isSelected && styles.cellTextActive,
                        ]}
                      >
                        {cell.day}
                      </Text>
                      {cell.dot && !isSelected && (
                        <View
                          style={[
                            styles.dotIndicator,
                            cell.dot === 'blue' && styles.dotBlue,
                            cell.dot === 'purple' && styles.dotPurple,
                            cell.dot === 'red' && styles.dotRed,
                          ]}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          {/* Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.dotBlue]} />
              <Text style={styles.legendText}>Standard Audit</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.dotPurple]} />
              <Text style={styles.legendText}>External Review</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.dotRed]} />
              <Text style={styles.legendText}>Overdue</Text>
            </View>
          </View>
        </View>

        {/* Scheduled Audits Header */}
        <View style={styles.scheduledHeader}>
          <Text style={styles.scheduledTitle}>Scheduled Audits</Text>
          <View style={styles.dateBadge}>
            <Text style={styles.dateBadgeText}>Oct 13, 2024</Text>
          </View>
        </View>

        {/* Scheduled List */}
        <View style={styles.scheduledList}>
          {MOCK_CALENDAR_AUDITS.map((item) => {
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.auditCard,
                  { borderLeftColor: item.color },
                  item.disabled && styles.auditCardDisabled,
                ]}
                onPress={() => !item.disabled && navigation.navigate('AuditDetail', { audit: item })}
              >
                <View style={styles.auditHeader}>
                  <Text style={[styles.auditTitleText, item.disabled && styles.disabledText]}>{item.title}</Text>
                  <View style={[styles.timeBadge, item.disabled && styles.timeBadgeDisabled]}>
                    <Text style={[styles.timeBadgeText, item.disabled && styles.disabledText]}>{item.time}</Text>
                  </View>
                </View>

                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={14} color="#64748B" />
                  <Text style={[styles.locationText, item.disabled && styles.disabledText]}>
                    {item.site} - {item.zone}
                  </Text>
                </View>

                <View style={styles.auditFooter}>
                  {/* Avatars */}
                  <View style={styles.avatarsRow}>
                    {item.avatars?.map((av, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.smallAvatar,
                          idx > 0 && { marginLeft: -8 },
                          av === 'MH' && { backgroundColor: '#F59E0B' },
                          av === 'AN' && { backgroundColor: '#10B981' },
                        ]}
                      >
                        <Text style={styles.smallAvatarText}>{av}</Text>
                      </View>
                    ))}
                    {item.avatarText && (
                      <View style={[styles.smallAvatar, styles.avatarMore]}>
                        <Text style={styles.avatarMoreText}>{item.avatarText}</Text>
                      </View>
                    )}
                  </View>

                  {/* Status */}
                  <View style={styles.statusBox}>
                    <Ionicons
                      name={item.status === 'Ongoing' ? 'sync' : item.status === 'Pending' ? 'refresh-outline' : 'calendar-outline'}
                      size={12}
                      color={item.color}
                    />
                    <Text style={[styles.statusValText, { color: item.color }]}>{item.status}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Schedule Button */}
        <TouchableOpacity style={styles.scheduleAuditBtn}>
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.scheduleAuditBtnText}>Schedule Audit</Text>
        </TouchableOpacity>
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
  },
  bellBtn: {
    padding: 2,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  titleSection: {
    marginTop: 16,
    marginBottom: 14,
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
  switchRow: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
    width: 200,
  },
  switchBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  switchBtnActive: {
    backgroundColor: '#2563EB',
  },
  switchBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  switchBtnTextActive: {
    color: '#FFFFFF',
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 20,
  },
  calHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  calMonthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  calMonthText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  calNavRow: {
    flexDirection: 'row',
    gap: 10,
  },
  todayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  todayText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  weekDayText: {
    width: 40,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
  },
  calendarGrid: {
    gap: 6,
    marginBottom: 14,
  },
  gridWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridCell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridCellActive: {
    backgroundColor: '#2563EB',
  },
  cellText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  cellTextShaded: {
    color: '#CBD5E1',
  },
  cellTextActive: {
    color: '#FFFFFF',
  },
  dotIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: 4,
  },
  dotBlue: {
    backgroundColor: '#3B82F6',
  },
  dotPurple: {
    backgroundColor: '#8B5CF6',
  },
  dotRed: {
    backgroundColor: '#EF4444',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    marginTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  scheduledHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  scheduledTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  dateBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dateBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  scheduledList: {
    gap: 12,
    marginBottom: 20,
  },
  auditCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 14,
    borderLeftWidth: 5,
  },
  auditCardDisabled: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#94A3B8',
  },
  auditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  auditTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    flex: 1,
  },
  timeBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  timeBadgeDisabled: {
    backgroundColor: '#F1F5F9',
  },
  timeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  auditFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  smallAvatarText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  avatarMore: {
    backgroundColor: '#EFF6FF',
    borderColor: '#FFFFFF',
    borderWidth: 1,
    marginLeft: -8,
  },
  avatarMoreText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#2563EB',
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusValText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  scheduleAuditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 10,
    marginBottom: 30,
    elevation: 3,
    shadowColor: '#2563EB',
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  scheduleAuditBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
