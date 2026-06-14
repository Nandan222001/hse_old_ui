import axiosInstance from '../api/axiosInstance';
import type {
  DashboardStats,
  PPEComplianceData,
  ZoneRiskData,
  NearMiss,
  NearMissFilters,
  RootCauseAnalysis,
  RCAFilters,
  EquipmentCertification,
  EquipmentCertFilters,
} from '../types';

export const getDashboardStats = () =>
  axiosInstance.get<DashboardStats>('/dashboard/stats').then((r) => r.data);

export const getPPECompliance = () =>
  axiosInstance.get<PPEComplianceData[]>('/analytics/ppe-compliance').then((r) => r.data);

export const getZoneRisk = () =>
  axiosInstance.get<ZoneRiskData[]>('/analytics/zone-risk').then((r) => r.data);

export const getNearMiss = (filters?: NearMissFilters) => {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
  }
  const query = params.toString();
  return axiosInstance
    .get<NearMiss[]>(`/near-miss${query ? `?${query}` : ''}`)
    .then((r) => r.data);
};

export const getNearMissDetail = (id: string) =>
  axiosInstance.get<NearMiss>(`/near-miss/${id}`).then((r) => r.data);

export const getRootCauseAnalysis = (filters?: RCAFilters) => {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
  }
  const query = params.toString();
  return axiosInstance
    .get<RootCauseAnalysis[]>(`/root-cause-analysis${query ? `?${query}` : ''}`)
    .then((r) => r.data);
};

export const getEquipmentCertifications = (filters?: EquipmentCertFilters) => {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
  }
  const query = params.toString();
  return axiosInstance
    .get<EquipmentCertification[]>(`/equipment-certification${query ? `?${query}` : ''}`)
    .then((r) => r.data);
};

export type {
  DashboardStats,
  PPEComplianceData,
  ZoneRiskData,
  NearMiss,
  NearMissFilters,
  RootCauseAnalysis,
  RCAFilters,
  EquipmentCertification,
  EquipmentCertFilters,
};
