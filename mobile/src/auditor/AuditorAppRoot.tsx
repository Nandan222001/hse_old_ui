import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AssignedAuditsScreen } from './screens/AssignedAuditsScreen';
import { AuditDetailScreen } from './screens/AuditDetailScreen';
import { AuditChecklistScreen } from './screens/AuditChecklistScreen';
import { AuditCalendarScreen } from './screens/AuditCalendarScreen';

const Stack = createStackNavigator();

/** Navigation root for the Auditor role — mounted from AppNavigator when the
 *  signed-in user's role normalises to `auditor`. */
export function AuditorAppRoot() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="AssignedAudits">
      <Stack.Screen name="AssignedAudits" component={AssignedAuditsScreen} />
      <Stack.Screen name="AuditCalendar" component={AuditCalendarScreen} />
      <Stack.Screen name="AuditDetail" component={AuditDetailScreen} />
      <Stack.Screen name="AuditChecklist" component={AuditChecklistScreen} />
    </Stack.Navigator>
  );
}
