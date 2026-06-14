import axiosInstance from '../api/axiosInstance';
import type { User, Worker, Contractor, AccessLog, SLAConfig } from '../types';

// Backend Employee shape
interface BackendEmployee {
  id: number;
  full_name: string;
  gender: string;
  employment_type: string;
  employment_start_date: string;
  role_id: number;
  department_id: number;
  shift_pattern: string;
  active_status: string;
  created_at: string;
  updated_at: string;
}

export const getUsers = () =>
  axiosInstance.get<BackendEmployee[]>('/employees/').then((r) =>
    r.data.map((e) => ({
      User_ID: String(e.id),
      Name: e.full_name,
      Email: '',
      Role: 'Worker',
      Site: '',
      Department: String(e.department_id ?? ''),
      Status: e.active_status ?? 'Active',
      Last_Login: '',
    } as unknown as User))
  );

export const getWorkers = (_contractor?: string) =>
  axiosInstance.get<BackendEmployee[]>('/employees/').then((r) =>
    r.data.map((e) => ({
      Worker_ID: String(e.id),
      Name: e.full_name,
      Contractor: '',
      Zone: '',
      PPE_Status: 'Compliant',
      Last_Entry: '',
      Status: e.active_status ?? 'Active',
    } as unknown as Worker))
  );

// These don't exist in backend yet — return empty arrays
export const getContractors = (): Promise<Contractor[]> => Promise.resolve([]);

export const getAccessLog = (): Promise<AccessLog[]> => Promise.resolve([]);

export const getSLAConfig = (): Promise<SLAConfig[]> => Promise.resolve([]);

export type { User, Worker, Contractor, AccessLog, SLAConfig };
