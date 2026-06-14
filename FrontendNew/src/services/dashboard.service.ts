import axiosInstance from '../api/axiosInstance';

export interface DashboardStats {
  total_incidents: number;
  open_capa_actions: number;
  active_permits: number;
  total_employees: number;
  total_sites: number;
  near_misses_count: number;
  safety_walks_count: number;
}

export const getDashboardStats = () =>
  axiosInstance.get<DashboardStats>('/dashboard/stats').then((r) => r.data);
