import React, { useEffect } from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../hooks/useAuth';
import { Colors } from '../theme/colors';
import { LoadingScreen } from '../components';

import { LoginScreen } from '../screens/LoginScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { OperationsScreen } from '../screens/OperationsScreen';
import { TeamAttendanceScreen } from '../screens/TeamAttendanceScreen';
import { ShiftMonitoringScreen } from '../screens/ShiftMonitoringScreen';
import { ToolboxTalkScreen } from '../screens/ToolboxTalkScreen';
import { SafetyComplianceScreen } from '../screens/SafetyComplianceScreen';
import { PermitsScreen } from '../screens/PermitsScreen';
import { AcknowledgePermitScreen } from '../screens/AcknowledgePermitScreen';
import { IncidentsScreen } from '../screens/IncidentsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

// Figma detail screens
import { NotificationCenterScreen } from '../screens/NotificationCenterScreen';
import { TeamManagementScreen } from '../screens/TeamManagementScreen';
import { TeamPerformanceMetricsScreen } from '../screens/TeamPerformanceMetricsScreen';
import { SessionManagementScreen } from '../screens/SessionManagementScreen';
import { ToolboxTalkManagementScreen } from '../screens/ToolboxTalkManagementScreen';
import { SafetyObservationManagementScreen } from '../screens/SafetyObservationManagementScreen';
import { InspectionManagementScreen } from '../screens/InspectionManagementScreen';
import { AuditPreparationScreen } from '../screens/AuditPreparationScreen';
import { CAPAManagementScreen } from '../screens/CAPAManagementScreen';
import { NearMissManagementScreen } from '../screens/NearMissManagementScreen';
import { PermitRequestManagementScreen } from '../screens/PermitRequestManagementScreen';
import { RiskManagementScreen } from '../screens/RiskManagementScreen';
import { DocumentManagementScreen } from '../screens/DocumentManagementScreen';
import { AISafetyInsightsScreen } from '../screens/AISafetyInsightsScreen';
import { AppSettingsScreen } from '../screens/AppSettingsScreen';
import { ReportsAnalyticsScreen } from '../screens/ReportsAnalyticsScreen';
import { SiteMonitoringOverviewScreen } from '../screens/SiteMonitoringOverviewScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardHome" component={DashboardScreen} />
    </Stack.Navigator>
  );
}

function OperationsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OperationsHome" component={OperationsScreen} />
      <Stack.Screen name="TeamAttendance" component={TeamAttendanceScreen} />
      <Stack.Screen name="ShiftMonitoring" component={ShiftMonitoringScreen} />
      <Stack.Screen name="ToolboxTalk" component={ToolboxTalkScreen} />
      <Stack.Screen name="SafetyCompliance" component={SafetyComplianceScreen} />
    </Stack.Navigator>
  );
}

function PermitsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PermitsList" component={PermitsScreen} />
      <Stack.Screen name="AcknowledgePermit" component={AcknowledgePermitScreen} />
    </Stack.Navigator>
  );
}

function IncidentsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="IncidentsHome" component={IncidentsScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileHome" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

const TAB_ICONS: Record<string, string> = {
  Home: '🏠',
  Operations: '⚡',
  Permits: '📋',
  Incidents: '🚨',
  Profile: '👤',
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.navActive,
        tabBarInactiveTintColor: Colors.navInactive,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
          height: 64,
          paddingBottom: 10,
          paddingTop: 4,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>
            {TAB_ICONS[route.name] ?? '⚪'}
          </Text>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Operations" component={OperationsStack} />
      <Tab.Screen name="Permits" component={PermitsStack} />
      <Tab.Screen name="Incidents" component={IncidentsStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { isAuthenticated, isLoading, restoreSession } = useAuth();

  useEffect(() => { restoreSession(); }, []);

  if (isLoading) return <LoadingScreen />;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="NotificationCenter" component={NotificationCenterScreen} />
            <Stack.Screen name="TeamManagement" component={TeamManagementScreen} />
            <Stack.Screen name="TeamPerformanceMetrics" component={TeamPerformanceMetricsScreen} />
            <Stack.Screen name="SessionManagement" component={SessionManagementScreen} />
            <Stack.Screen name="ToolboxTalkManagement" component={ToolboxTalkManagementScreen} />
            <Stack.Screen name="SafetyObservationManagement" component={SafetyObservationManagementScreen} />
            <Stack.Screen name="InspectionManagement" component={InspectionManagementScreen} />
            <Stack.Screen name="AuditPreparation" component={AuditPreparationScreen} />
            <Stack.Screen name="CAPAManagement" component={CAPAManagementScreen} />
            <Stack.Screen name="NearMissManagement" component={NearMissManagementScreen} />
            <Stack.Screen name="PermitRequestManagement" component={PermitRequestManagementScreen} />
            <Stack.Screen name="RiskManagement" component={RiskManagementScreen} />
            <Stack.Screen name="DocumentManagement" component={DocumentManagementScreen} />
            <Stack.Screen name="AISafetyInsights" component={AISafetyInsightsScreen} />
            <Stack.Screen name="AppSettings" component={AppSettingsScreen} />
            <Stack.Screen name="ReportsAnalytics" component={ReportsAnalyticsScreen} />
            <Stack.Screen name="SiteMonitoringOverview" component={SiteMonitoringOverviewScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
