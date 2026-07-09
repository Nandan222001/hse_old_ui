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
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
