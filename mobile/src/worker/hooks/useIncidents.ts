import { useState, useCallback } from 'react';
import { incidentService } from '../services/incidentService';
import { Incident, ReportIncidentRequest, ReportNearMissRequest, ReportUnsafeActRequest } from '../types';

export function useIncidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIncidents = useCallback(async (params?: { type?: string; status?: string }) => {
    setLoading(true);
    try {
      const res = await incidentService.getIncidents(params);
      setIncidents(res.items);
    } catch (err: any) {
      setError(err?.message || 'Failed to load incidents');
    } finally {
      setLoading(false);
    }
  }, []);

  const reportIncident = useCallback(async (payload: ReportIncidentRequest): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const incident = await incidentService.reportIncident(payload);
      setIncidents(prev => [incident, ...prev]);
      return true;
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to submit report');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const reportNearMiss = useCallback(async (payload: ReportNearMissRequest): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const incident = await incidentService.reportNearMiss(payload);
      setIncidents(prev => [incident, ...prev]);
      return true;
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to submit near miss');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const reportUnsafeAct = useCallback(async (payload: ReportUnsafeActRequest): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const incident = await incidentService.reportUnsafeAct(payload);
      setIncidents(prev => [incident, ...prev]);
      return true;
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to submit observation');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { incidents, isLoading, error, fetchIncidents, reportIncident, reportNearMiss, reportUnsafeAct };
}
