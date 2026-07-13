import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { Colors } from '../theme/colors';
import { useAuthStore } from '../store/authStore';

// ── Screens ───────────────────────────────────────────────────────────────────
import LoginScreen from '../screens/LoginScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import DashboardScreen from '../screens/DashboardScreen';
import TasksScreen from '../screens/TasksScreen';
import ReportsScreen from '../screens/ReportsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PerformTaskScreen from '../screens/PerformTaskScreen';
import RaisePermitScreen from '../screens/RaisePermitScreen';
import ReportNearMissScreen from '../screens/ReportNearMissScreen';
import ReportUnsafeActScreen from '../screens/ReportUnsafeActScreen';
import ReportIncidentScreen from '../screens/ReportIncidentScreen';
import SafetyChecklistScreen from '../screens/SafetyChecklistScreen';
import SafetyTrainingScreen from '../screens/SafetyTrainingScreen';
import PermitsScreen from '../screens/PermitsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SafetyTrainingDetailScreen from '../screens/SafetyTrainingDetailScreen';

// ── Role type ─────────────────────────────────────────────────────────────────
export type AppRole = 'Worker' | 'Supervisor' | 'HSE Manager' | 'Auditor';

function normaliseRole(raw: string | undefined): AppRole {
  if (!raw) return 'Worker';
  const r = raw.toLowerCase();
  if (r.includes('hse') || r.includes('manager') || r.includes('safety manager')) return 'HSE Manager';
  if (r.includes('supervisor') || r.includes('inspector') || r.includes('engineer')) return 'Supervisor';
  if (r.includes('auditor') || r.includes('viewer') || r.includes('contractor')) return 'Auditor';
  return 'Worker';
}

// ── Role colour map ───────────────────────────────────────────────────────────
const ROLE_COLOR: Record<AppRole, string> = {
  'Worker':      '#1D4ED8',
  'Supervisor':  '#15803D',
  'HSE Manager': '#7C3AED',
  'Auditor':     '#B45309',
};

const ROLE_ICON: Record<AppRole, string> = {
  'Worker':      '👷',
  'Supervisor':  '🦺',
  'HSE Manager': '🛡️',
  'Auditor':     '🔍',
};

// ── Tab config per role ───────────────────────────────────────────────────────
type TabConfig = { name: string; icon: string; component: React.ComponentType<any> };

function getTabsForRole(role: AppRole): TabConfig[] {
  const base: TabConfig[] = [
    { name: 'Dashboard', icon: '🏠', component: DashboardScreen },
    { name: 'Profile',   icon: '👤', component: ProfileScreen },
  ];

  switch (role) {
    case 'HSE Manager':
      return [
        { name: 'Dashboard',  icon: '🏠', component: DashboardScreen },
        { name: 'Permits',    icon: '📋', component: PermitsScreen },
        { name: 'Incidents',  icon: '⚠️', component: ReportsScreen },
        { name: 'Checklist',  icon: '✅', component: SafetyChecklistScreen },
        { name: 'Profile',    icon: '👤', component: ProfileScreen },
      ];

    case 'Supervisor':
      return [
        { name: 'Dashboard', icon: '🏠', component: DashboardScreen },
        { name: 'Tasks',     icon: '📋', component: TasksScreen },
        { name: 'Checklist', icon: '✅', component: SafetyChecklistScreen },
        { name: 'Reports',   icon: '📊', component: ReportsScreen },
        { name: 'Profile',   icon: '👤', component: ProfileScreen },
      ];

    case 'Auditor':
      return [
        { name: 'Dashboard', icon: '🏠', component: DashboardScreen },
        { name: 'Reports',   icon: '📊', component: ReportsScreen },
        { name: 'Profile',   icon: '👤', component: ProfileScreen },
      ];

    case 'Worker':
    default:
      return [
        { name: 'Dashboard', icon: '🏠', component: DashboardScreen },
        { name: 'Tasks',     icon: '📋', component: TasksScreen },
        { name: 'Training',  icon: '📚', component: SafetyTrainingScreen },
        { name: 'Profile',   icon: '👤', component: ProfileScreen },
      ];
  }
}

// ── Tab navigator (role-aware) ────────────────────────────────────────────────
const Tab = createBottomTabNavigator();

function RoleTabNavigator({ role }: { role: AppRole }) {
  const tabs = getTabsForRole(role);
  const activeColor = ROLE_COLOR[role];

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: Colors.navInactive,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused }) => {
          const tab = tabs.find((t) => t.name === route.name);
          return (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.45 }}>
              {tab?.icon ?? '•'}
            </Text>
          );
        },
      })}
    >
      {tabs.map((tab) => (
        <Tab.Screen key={tab.name} name={tab.name} component={tab.component} />
      ))}
    </Tab.Navigator>
  );
}

// ── Role badge (shown in tab bar header area) ─────────────────────────────────
function RoleBadge({ role }: { role: AppRole }) {
  return (
    <View style={[styles.roleBadge, { backgroundColor: ROLE_COLOR[role] + '18', borderColor: ROLE_COLOR[role] + '40' }]}>
      <Text style={styles.roleBadgeIcon}>{ROLE_ICON[role]}</Text>
      <Text style={[styles.roleBadgeText, { color: ROLE_COLOR[role] }]}>{role}</Text>
    </View>
  );
}

// ── Main navigator wrapper ────────────────────────────────────────────────────
const Stack = createStackNavigator();

function MainStack({ role }: { role: AppRole }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs">
        {() => <RoleTabNavigator role={role} />}
      </Stack.Screen>
      <Stack.Screen name="PerformTask"          component={PerformTaskScreen}          options={{ presentation: 'card' }} />
      <Stack.Screen name="RaisePermit"          component={RaisePermitScreen}          options={{ presentation: 'modal' }} />
      <Stack.Screen name="ReportNearMiss"       component={ReportNearMissScreen}       options={{ presentation: 'modal' }} />
      <Stack.Screen name="ReportUnsafeAct"      component={ReportUnsafeActScreen}      options={{ presentation: 'modal' }} />
      <Stack.Screen name="ReportIncident"       component={ReportIncidentScreen}       options={{ presentation: 'modal' }} />
      <Stack.Screen name="SafetyChecklist"      component={SafetyChecklistScreen}      options={{ presentation: 'card' }} />
      <Stack.Screen name="SafetyTraining"       component={SafetyTrainingScreen}       options={{ presentation: 'card' }} />
      <Stack.Screen name="SafetyTrainingDetail" component={SafetyTrainingDetailScreen} options={{ presentation: 'card' }} />
      <Stack.Screen name="Permits"              component={PermitsScreen}              options={{ presentation: 'card' }} />
      <Stack.Screen name="Notifications"        component={NotificationsScreen}        options={{ presentation: 'card' }} />
    </Stack.Navigator>
  );
}

// ── Splash screen ─────────────────────────────────────────────────────────────
function SplashScreen() {
  return (
    <View style={styles.splash}>
      <Text style={styles.splashIcon}>🛡️</Text>
      <ActivityIndicator color={Colors.blue} size="large" style={{ marginTop: 20 }} />
    </View>
  );
}

// ── Root navigator ────────────────────────────────────────────────────────────
const RootStack = createStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated, isLoading, restoreSession, user } = useAuthStore();

  useEffect(() => {
    restoreSession();
  }, []);

  if (isLoading) return <SplashScreen />;

  const role = normaliseRole(user?.role);

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <RootStack.Screen name="Login" component={LoginScreen} />
            <RootStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
          </>
        ) : (
          <RootStack.Screen name="Main">
            {() => (
              <View style={{ flex: 1 }}>
                <RoleBadge role={role} />
                <MainStack role={role} />
              </View>
            )}
          </RootStack.Screen>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.card,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    paddingTop: 8,
    paddingBottom: 12,
    height: 70,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  tabLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  splash: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashIcon: { fontSize: 64 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginRight: 12,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  roleBadgeIcon: { fontSize: 13 },
  roleBadgeText: { fontSize: 12, fontWeight: '700' },
});
