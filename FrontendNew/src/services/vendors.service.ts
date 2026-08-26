import axiosInstance from '../api/axiosInstance';

export interface ComplianceSegment {
  name: string;
  value: number;
  color: string;
}

export interface ExposureMonth {
  month: string;
  hours: number;
}

export interface Certification {
  label: string;
  pct: number;
}

export interface ContractorRisk {
  name: string;
  risk: number;
}

export interface PermitViolation {
  name: string;
  desc: string;
  time: string;
}

export interface RepeatBreach {
  name: string;
  breach: string;
}

export interface CapaItem {
  label: string;
  status: 'Closed' | 'In Progress';
}

export interface OpenAction {
  label: string;
  due: 'Due Today' | 'Due This Week' | 'Due Next Week' | 'Overdue' | 'No Due Date' | string;
}

export interface VendorSummary {
  risk_score: {
    value: number;
    delta: number | null;
    up: boolean | null;
    // Same High/Medium/Low/No Contractors thresholds the dashboard's
    // contractor_risk_label uses — one severity vocabulary for both screens.
    label: string;
    has_contractors?: boolean;
  };
  total_contractors: number;
  compliance: ComplianceSegment[];
  exposure_hours: ExposureMonth[];
  threshold: number;
  certifications: Certification[];
  high_risk: ContractorRisk[];
  permit_violations: PermitViolation[];
  repeat_breaches: RepeatBreach[];
  watchlist: ContractorRisk[];
  capa_items: CapaItem[];
  open_actions: OpenAction[];
}

export const getVendorSummary = () =>
  axiosInstance.get<VendorSummary>('/vendors/summary').then(r => r.data);
