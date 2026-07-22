import React from 'react';
import { ReportWorkflowList } from '../components/workflow/ReportWorkflowList';

/**
 * Supervisor review queue for worker-submitted risk reports.
 *
 * Reads risk_reports (field observations), not the hazards catalog — only the
 * workflow table carries a supervisor queue.
 */
export function RiskManagementScreen({ navigation }: any) {
  return (
    <ReportWorkflowList
      navigation={navigation}
      reportType="risk"
      title="Hazard Management"
      emptyTitle="No hazard reports to review"
      emptyIcon="alert-circle-outline"
    />
  );
}
