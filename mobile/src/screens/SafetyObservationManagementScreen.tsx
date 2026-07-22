import React from 'react';
import { ReportWorkflowList } from '../components/workflow/ReportWorkflowList';

/**
 * Supervisor review queue for worker-submitted unsafe acts.
 *
 * "Safety observation" is the wording the supervisor UI uses; the backend records
 * these in unsafe_acts — a behaviour seen before anything went wrong.
 */
export function SafetyObservationManagementScreen({ navigation }: any) {
  return (
    <ReportWorkflowList
      navigation={navigation}
      reportType="unsafe_act"
      title="Safety Observations"
      emptyTitle="No safety observations to review"
      emptyIcon="eye-outline"
    />
  );
}
