import { apiClient } from '../api/client';

export interface Department { id: number; name: string; }

export interface AddMemberResult {
  id: number;
  employee_id: number;
  username: string;
  email: string;
  name: string;
  role: string;
  temp_password: string;
  email_sent: boolean;
  login_url: string;
}

export interface TeamMember {
  id: number;
  name: string;
  email: string;
  username: string;
  active: boolean;
}

export const teamProvisioningService = {
  async departments(): Promise<Department[]> {
    const { data } = await apiClient.get('/team/departments');
    return Array.isArray(data) ? data : [];
  },

  async addSupervisor(p: { name: string; email: string; department_id?: number }): Promise<AddMemberResult> {
    const { data } = await apiClient.post('/team/add-supervisor', p);
    return data;
  },

  async addWorker(p: { name: string; email: string; department_id?: number }): Promise<AddMemberResult> {
    const { data } = await apiClient.post('/team/add-worker', p);
    return data;
  },

  async members(): Promise<{ role: string; items: TeamMember[] }> {
    const { data } = await apiClient.get('/team/members');
    return data ?? { role: 'member', items: [] };
  },
};
