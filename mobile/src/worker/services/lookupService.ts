import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

export interface WorkingStation {
  id: number;
  station_name: string;
}

export interface HazardOption {
  id: number;
  hazard_name: string;
}

export interface EmployeeOption {
  id: number;
  full_name: string;
}

/**
 * Reference data for the FK pickers on the report forms. Report screens used to
 * post station *names* as free text, which meant location_station_id was always
 * resolved by string match (and silently fell back to station 1 on a miss).
 */
export const lookupService = {
  async workingStations(): Promise<WorkingStation[]> {
    const { data } = await apiClient.get<WorkingStation[]>(ENDPOINTS.LOOKUPS.WORKING_STATIONS);
    return Array.isArray(data) ? data : [];
  },

  async hazards(): Promise<HazardOption[]> {
    const { data } = await apiClient.get<HazardOption[]>(ENDPOINTS.HAZARDS.LIST);
    return Array.isArray(data) ? data : [];
  },

  async employees(): Promise<EmployeeOption[]> {
    const { data } = await apiClient.get<EmployeeOption[]>(ENDPOINTS.LOOKUPS.EMPLOYEES);
    return Array.isArray(data) ? data : [];
  },
};
