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

interface BackendWorkingStation {
  id: number;
  station_name: string;
  site_id: number;
  zone_classification: string | null;
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

function adaptZone(ws: BackendWorkingStation): Zone {
  return {
    Zone_ID: String(ws.id),
    Zone_Name: ws.station_name,
    Site_ID: String(ws.site_id),
    Zone_Type: ws.zone_classification ?? 'General',
  } as unknown as Zone;
}

export const getSites = () =>
  axiosInstance.get<BackendSite[]>('/sites/').then((r) => r.data.map(adaptSite));

export const getZones = (_siteId?: string): Promise<Zone[]> =>
  axiosInstance
    .get<BackendWorkingStation[]>('/working-stations/', { params: { limit: 200 } })
    .then((r) => r.data.map(adaptZone));

const STATIC_SHIFTS: Shift[] = [
  { Shift_ID: 'day',       Shift_Name: 'Day Shift',       Start_Time: '06:00', End_Time: '14:00', Sites: '', Active_Rules: 0, Status: 'Active' },
  { Shift_ID: 'afternoon', Shift_Name: 'Afternoon Shift', Start_Time: '14:00', End_Time: '22:00', Sites: '', Active_Rules: 0, Status: 'Active' },
  { Shift_ID: 'night',     Shift_Name: 'Night Shift',     Start_Time: '22:00', End_Time: '06:00', Sites: '', Active_Rules: 0, Status: 'Active' },
];

export const getShifts = (): Promise<Shift[]> => Promise.resolve(STATIC_SHIFTS);

export const getCameras = (_siteId?: string): Promise<Camera[]> => Promise.resolve([]);

export const getRFIDReaders = (): Promise<RFIDReader[]> => Promise.resolve([]);

export const getEdgeDevices = (): Promise<EdgeDevice[]> => Promise.resolve([]);

export type { Site, Zone, Shift, Camera, RFIDReader, EdgeDevice };
