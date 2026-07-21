import { useState, useCallback, useEffect } from 'react';
import { complianceService } from '../services/complianceService';
import type {
  ComplianceMetrics,
  ComplianceException,
  GearCheckWorker,
  ExpiringPermit,
  DashboardStats,
} from '../types/compliance.types';

export function useCompliance() {
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [exceptions, setExceptions] = useState<ComplianceException[]>([]);
  const [gearCheck, setGearCheck] = useState<GearCheckWorker[]>([]);
  const [expiringPermits, setExpiringPermits] = useState<ExpiringPermit[]>([]);
  const [dashStats, setDashStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [m, ex, gc, ep, ds] = await Promise.all([
        complianceService.getMetrics(),
        complianceService.getExceptions(),
        complianceService.getGearCheck(),
        complianceService.getExpiringPermits(),
        complianceService.getDashboardStats(),
      ]);
      setMetrics(m);
      setExceptions(ex);
      setGearCheck(gc);
      setExpiringPermits(ep);
      setDashStats(ds);
    } catch {}
    finally { setLoading(false); }
  }, []);

  const remindWorker = useCallback(async (id: string) => {
    await complianceService.remindWorker(id);
  }, []);

  useEffect(() => { fetchAll(); }, []);

  return { metrics, exceptions, gearCheck, expiringPermits, dashStats, loading, fetchAll, remindWorker };
}
