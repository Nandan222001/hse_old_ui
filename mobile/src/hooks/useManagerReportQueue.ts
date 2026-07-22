import { useCallback, useState } from 'react';
import type { ReportType } from '../api/endpoints';
import {
  reportWorkflowService,
  type ClosePayload,
  type ReportListItem,
} from '../services/reportWorkflowService';

/**
 * The manager's combined queue across near miss, unsafe act and risk.
 *
 * Incidents are deliberately excluded — ManagerAppRoot already loads those into its
 * own incident registry with CAPA/5-Whys screens attached. This covers the three
 * types that previously had no manager step at all.
 */
const MANAGED_TYPES: ReportType[] = ['near_miss', 'unsafe_act', 'risk'];

export interface ManagerQueueItem extends ReportListItem {
  report_type: ReportType;
}

export function useManagerReportQueue() {
  const [queue, setQueue] = useState<ManagerQueueItem[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      // One type failing (e.g. a 403) should not blank out the other two.
      const results = await Promise.allSettled(
        MANAGED_TYPES.map((t) => reportWorkflowService(t).getManagerQueue()),
      );

      const rows: ManagerQueueItem[] = [];
      results.forEach((res, i) => {
        if (res.status === 'fulfilled') {
          // The API stamps report_type, but fall back to the type we asked for.
          rows.push(
            ...res.value.map((r) => ({ ...r, report_type: r.report_type ?? MANAGED_TYPES[i] })),
          );
        }
      });

      rows.sort((a, b) => {
        const at = new Date(a.reported_at ?? a.created_at ?? 0).getTime();
        const bt = new Date(b.reported_at ?? b.created_at ?? 0).getTime();
        return bt - at; // newest first
      });

      setQueue(rows);
      setError(results.every((r) => r.status === 'rejected') ? 'Could not load the queue.' : null);
    } finally {
      setLoading(false);
    }
  }, []);

  const run = useCallback(
    async (item: ManagerQueueItem, action: (svc: ReturnType<typeof reportWorkflowService>) => Promise<unknown>) => {
      const key = `${item.report_type}:${item.id}`;
      setBusyId(key);
      try {
        await action(reportWorkflowService(item.report_type));
        await refresh();
        return true;
      } catch {
        setError('Action failed. Please try again.');
        return false;
      } finally {
        setBusyId(null);
      }
    },
    [refresh],
  );

  return {
    queue,
    isLoading,
    busyId,
    error,
    refresh,
    /** Approve the supervisor's investigation, or send it back for redo. */
    approve: (item: ManagerQueueItem, approved = true) =>
      run(item, (svc) => svc.approveInvestigation(item.id, approved)),
    close: (item: ManagerQueueItem, payload: ClosePayload) =>
      run(item, (svc) => svc.close(item.id, payload)),
  };
}
