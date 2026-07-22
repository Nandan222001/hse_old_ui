import { useCallback, useMemo, useState } from 'react';
import type { ReportType } from '../api/endpoints';
import {
  reportWorkflowService,
  type ClosePayload,
  type InvestigatePayload,
  type ReportListItem,
} from '../services/reportWorkflowService';

/**
 * Queue state + workflow actions for one report type.
 *
 * `queue` is what the signed-in role should act on: supervisors get
 * /pending-review, managers get /manager-queue. Every action refreshes afterwards
 * so an item disappears from the list once it moves to the next stage.
 */
export function useReportWorkflow(type: ReportType, stage: 'supervisor' | 'manager' = 'supervisor') {
  const service = useMemo(() => reportWorkflowService(type), [type]);

  const [queue, setQueue] = useState<ReportListItem[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const rows =
        stage === 'manager' ? await service.getManagerQueue() : await service.getPendingReview();
      setQueue(rows);
      setError(null);
    } catch (e: any) {
      // 403 means this role has no business in this queue — say so rather than
      // leaving an empty list that looks like "nothing to review".
      setError(
        e?.response?.status === 403
          ? 'You are not authorized to view this queue.'
          : 'Could not load reports. Pull to retry.',
      );
    } finally {
      setLoading(false);
    }
  }, [service, stage]);

  /** Run a workflow action, then refresh so the item moves out of this queue. */
  const run = useCallback(
    async (id: number, action: () => Promise<unknown>) => {
      setBusyId(id);
      try {
        await action();
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

    // Supervisor
    acknowledge: (id: number, notes?: string) => run(id, () => service.acknowledge(id, notes)),
    investigate: (id: number, payload: InvestigatePayload) =>
      run(id, () => service.investigate(id, payload)),
    escalate: (id: number, reason: string) => run(id, () => service.escalate(id, reason)),

    // Manager
    approve: (id: number, approved = true) => run(id, () => service.approveInvestigation(id, approved)),
    close: (id: number, payload: ClosePayload) => run(id, () => service.close(id, payload)),
  };
}
