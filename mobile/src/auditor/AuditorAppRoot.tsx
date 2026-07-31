import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { AuditorDashboardScreen } from './screens/AuditorDashboardScreen';
import { AssignedAuditsScreen } from './screens/AssignedAuditsScreen';
import { FindingsScreen } from './screens/FindingsScreen';
import { AIInsightsScreen } from './screens/AIInsightsScreen';
import { AuditorProfileScreen } from './screens/AuditorProfileScreen';
import { AuditDetailScreen } from './screens/AuditDetailScreen';
import { AuditChecklistScreen } from './screens/AuditChecklistScreen';
import { AuditCalendarScreen } from './screens/AuditCalendarScreen';
import { VerificationsScreen } from './screens/VerificationsScreen';
import { AuditTrailScreen } from './screens/AuditTrailScreen';
import { CloseOutReviewScreen } from './screens/CloseOutReviewScreen';
import ChangePasswordScreen from '../worker/screens/ChangePasswordScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, string> = {
  Dashboard: 'grid-outline',
  Audits: 'checkbox-outline',
  Findings: 'flag-outline',
  'AI Insights': 'scan-outline',
  Profile: 'person-outline',
};

function AuditorTabBar({ state, descriptors, navigation }: any) {
  return (
    <View style={styles.bar}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel ?? options.title ?? route.name;
        const isFocused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
        };
        return (
          <TouchableOpacity key={route.key} style={styles.item} onPress={onPress} activeOpacity={0.8}>
            <Ionicons name={(TAB_ICONS[route.name] ?? 'ellipse-outline') as any} size={22} color={isFocused ? '#2563EB' : '#94A3B8'} />
            <Text style={[styles.label, isFocused && styles.labelActive]} numberOfLines={1}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function AuditorTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <AuditorTabBar {...props} />}>
      <Tab.Screen name="Dashboard" component={AuditorDashboardScreen} />
      <Tab.Screen name="Audits" component={AssignedAuditsScreen} />
      <Tab.Screen name="Findings" component={FindingsScreen} />
      <Tab.Screen name="AI Insights" component={AIInsightsScreen} />
      <Tab.Screen name="Profile" component={AuditorProfileScreen} />
    </Tab.Navigator>
  );
}

/** Auditor navigation root — five-tab app (matches the Auditor_ui mockups) with
 *  the audit detail/checklist/calendar screens pushed over the tabs. */
export function AuditorAppRoot() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="AuditorTabs">
      <Stack.Screen name="AuditorTabs" component={AuditorTabs} />
      <Stack.Screen name="AuditDetail" component={AuditDetailScreen} />
      <Stack.Screen name="AuditChecklist" component={AuditChecklistScreen} />
      <Stack.Screen name="AuditCalendar" component={AuditCalendarScreen} />
      <Stack.Screen name="Verifications" component={VerificationsScreen} />
      <Stack.Screen name="AuditTrail" component={AuditTrailScreen} />
      <Stack.Screen name="CloseOutReview" component={CloseOutReviewScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1.5,
    borderTopColor: '#E2E8F0',
    paddingBottom: 20,
    paddingTop: 10,
    alignItems: 'center',
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  label: { fontSize: 10, fontWeight: '700', color: '#94A3B8' },
  labelActive: { color: '#2563EB' },
});
