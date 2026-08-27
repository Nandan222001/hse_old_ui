import axiosInstance from '../api/axiosInstance';

export interface ExposureMonth {
  month: string;
  hours: number;
}

export interface ContractorKpi {
  value: number | null;
  note: string;
}

export interface AtRiskWorker {
  full_name: string;
  company_name: string;
  badge_no: string | null;
  induction_valid_until: string | null;
  status: 'Expired' | 'Expiring Soon';
}

export interface ContractorRegisterRow {
  id: number;
  company_name: string;
  service_type: string | null;
  prequalification_status: string;
  iso_45001_certified: boolean;
  active: boolean;
  contract_start_date: string | null;
  contract_end_date: string | null;
  last_safety_audit_date: string | null;
  safety_score: number | null;
}

export interface VendorSummary {
  total_contractors: number;
  kpis: {
    contractor_trir: ContractorKpi & { contractor_injuries: number; contractor_hours: number };
    induction_compliance_pct: ContractorKpi & { valid: number; total: number };
    incident_contribution_pct: ContractorKpi & { contractor_injuries: number; total_site_injuries: number };
    safety_score: ContractorKpi & { company_count: number };
  };
  exposure_hours: ExposureMonth[];
  expiring_soon_count: number;
  at_risk_workers: AtRiskWorker[];
  register: ContractorRegisterRow[];
}

export const getVendorSummary = () =>
  axiosInstance.get<VendorSummary>('/vendors/summary').then(r => r.data);
