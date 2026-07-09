import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import { Colors } from '../theme/colors';
import { useAuthStore } from '../store/authStore';

import LoginScreen from '../screens/LoginScreen';
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
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import PermitsScreen from '../screens/PermitsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SafetyTrainingDetailScreen from '../screens/SafetyTrainingDetailScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, string> = {
  Dashboard: '🏠',
  Tasks: '📋',
  Reports: '📊',
  Profile: '👤',
};

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.navActive,
        tabBarInactiveTintColor: Colors.navInactive,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>
            {TAB_ICONS[route.name] ?? '•'}
          </Text>
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Tasks" component={TasksScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function SplashScreen() {
  return (
    <View style={styles.splash}>
      <Text style={styles.splashIcon}>🛡️</Text>
      <ActivityIndicator color={Colors.blue} size="large" style={{ marginTop: 20 }} />
    </View>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, isLoading, restoreSession } = useAuthStore();

  useEffect(() => {
    restoreSession();
  }, []);

  if (isLoading) return <SplashScreen />;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={isAuthenticated ? 'Main' : 'Login'}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen name="PerformTask" component={PerformTaskScreen} options={{ presentation: 'card' }} />
        <Stack.Screen name="RaisePermit" component={RaisePermitScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="ReportNearMiss" component={ReportNearMissScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="ReportUnsafeAct" component={ReportUnsafeActScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="ReportIncident" component={ReportIncidentScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="SafetyChecklist" component={SafetyChecklistScreen} options={{ presentation: 'card' }} />
        <Stack.Screen name="SafetyTraining" component={SafetyTrainingScreen} options={{ presentation: 'card' }} />
        <Stack.Screen name="Permits" component={PermitsScreen} options={{ presentation: 'card' }} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ presentation: 'card' }} />
        <Stack.Screen name="SafetyTrainingDetail" component={SafetyTrainingDetailScreen} options={{ presentation: 'card' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

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
  splash: { flex: 1, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  splashIcon: { fontSize: 64 },
});
