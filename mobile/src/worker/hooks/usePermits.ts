import { useState, useCallback } from 'react';
import { permitService } from '../services/permitService';
import { Permit, PermitListResponse, PermitRequest } from '../types';

export function usePermits() {
  const [permits, setPermits] = useState<Permit[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPermits = useCallback(async (params?: { status?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await permitService.getPermits(params);
      setPermits(res.items);
    } catch (err: any) {
      setError(err?.message || 'Failed to load permits');
    } finally {
      setLoading(false);
    }
  }, []);

  const createPermit = useCallback(async (payload: PermitRequest): Promise<Permit | null> => {
    setLoading(true);
    setError(null);
    try {
      const permit = await permitService.createPermit(payload);
      setPermits(prev => [permit, ...prev]);
      return permit;
    } catch (err: any) {
      setError(err?.message || 'Failed to submit permit');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const acknowledgePermit = useCallback(async (id: string): Promise<boolean> => {
    try {
      const updated = await permitService.acknowledgePermit(id);
      setPermits(prev => prev.map(p => p.id === id ? updated : p));
      return true;
    } catch {
      return false;
    }
  }, []);

  return { permits, isLoading, error, fetchPermits, createPermit, acknowledgePermit };
}
