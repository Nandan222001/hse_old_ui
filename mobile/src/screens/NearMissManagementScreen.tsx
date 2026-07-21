import React from 'react';
import { ReportWorkflowList } from '../components/workflow/ReportWorkflowList';

/** Supervisor review queue for worker-submitted near misses. */
export function NearMissManagementScreen({ navigation }: any) {
  return (
    <ReportWorkflowList
      navigation={navigation}
      reportType="near_miss"
      title="Near Miss Reports"
      emptyTitle="No near misses to review"
      emptyIcon="warning-outline"
    />
  );
}
