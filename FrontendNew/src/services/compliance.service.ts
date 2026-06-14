import axiosInstance from '../api/axiosInstance';
import type { ComplianceStandard, AuditTrail } from '../types';

export const getComplianceStandards = () =>
  axiosInstance.get<ComplianceStandard[]>('/compliance-standards').then((r) => r.data);

export const getAuditTrail = () =>
  axiosInstance.get<AuditTrail[]>('/audit-trail').then((r) => r.data);

export type { ComplianceStandard, AuditTrail };
