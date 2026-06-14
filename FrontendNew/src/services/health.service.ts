import axiosInstance from '../api/axiosInstance';

export const healthCheck = () =>
  axiosInstance.get<{ status: string; timestamp: string }>('/health').then((r) => r.data);
