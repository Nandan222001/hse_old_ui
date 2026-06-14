import axiosInstance from '../api/axiosInstance';
import type { Site, Zone, Shift, Camera, RFIDReader, EdgeDevice } from '../types';

// Backend response shape for sites
interface BackendSite {
  id: number;
  site_name: string;
  address: string;
  postcode: string;
  city: string;
  type: string;
  operational_status: string;
  capacity: number;
  primary_products: string;
  hazard_classification: string;
  created_at: string;
  updated_at: string;
}

function adaptSite(s: BackendSite): Site {
  return {
    Site_ID: String(s.id),
    Site_Name: s.site_name,
    Location: s.address ?? '',
    Country: '',
    Timezone: 'UTC',
    Status: s.operational_status ?? 'Active',
    Total_Zones: 0,
    Total_Workers: 0,
    Compliance_Rate: 0,
    Manager: '',
    Emergency_Contact: '',
    Established_Date: s.created_at?.split('T')[0] ?? '',
  } as unknown as Site;
}

export const getSites = () =>
  axiosInstance.get<BackendSite[]>('/sites/').then((r) => r.data.map(adaptSite));

export const getZones = (_siteId?: string): Promise<Zone[]> => Promise.resolve([]);

export const getShifts = () =>
  axiosInstance.get<Shift[]>('/shift-schedules/').then((r) => r.data);

export const getCameras = (_siteId?: string): Promise<Camera[]> => Promise.resolve([]);

export const getRFIDReaders = (): Promise<RFIDReader[]> => Promise.resolve([]);

export const getEdgeDevices = (): Promise<EdgeDevice[]> => Promise.resolve([]);

export type { Site, Zone, Shift, Camera, RFIDReader, EdgeDevice };
