import { apiClient } from '../api/client';
import { HAZARD_REGISTER } from '../api/endpoints';

/**
 * Drives the Hazard register workflow (flow 5):
 *   Worker/Supervisor logs → Supervisor/Manager reviews (open → under_review →
 *   controlled → closed) → Auditor verifies it is being managed on site.
 *
 * Writes to the shared `hazards` register; the website's catalog reads are untouched.
 */
export interface HazardRegisterItem {
  id: number;
  hazard_name: string | null;
  category_id: number | null;
  description: string | null;
  severity: string | null;
  probability: string | null;
  register_status: string | null;
  location_station_id: number | null;
  controls: string | null;
  logged_by: number | null;
  logged_at: string | null;
  reviewed_by: number | null;
  reviewed_at: string | null;
  review_notes: string | null;
  auditor_verified_by: number | null;
  auditor_verified_at: string | null;
  verification_notes: string | null;
}

export interface HazardLogPayload {
  hazard_name: string;
  category_id?: number;
  description?: string;
  severity?: string;
  probability?: string;
  location?: string;
  location_station_id?: number;
  controls?: string;
  gps_latitude?: string;
  gps_longitude?: string;
}

export interface HazardReviewPayload {
  register_status?: 'open' | 'under_review' | 'controlled' | 'closed';
  review_notes?: string;
  controls?: string;
  severity?: string;
}

export const hazardRegisterService = {
  // ── Log (worker / supervisor) ─────────────────────────────────────────────────
  async log(payload: HazardLogPayload): Promise<HazardRegisterItem> {
    const { data } = await apiClient.post(HAZARD_REGISTER.LOG, payload);
    return data;
  },
  async myLogs(): Promise<HazardRegisterItem[]> {
    const { data } = await apiClient.get(HAZARD_REGISTER.MY_LOGS);
    return data ?? [];
  },
  async list(registerStatus?: string): Promise<HazardRegisterItem[]> {
    const { data } = await apiClient.get(HAZARD_REGISTER.LIST, {
      params: registerStatus ? { register_status: registerStatus } : undefined,
    });
    return data ?? [];
  },

  // ── Review (supervisor / manager) ─────────────────────────────────────────────
  async review(id: number, payload: HazardReviewPayload): Promise<HazardRegisterItem> {
    const { data } = await apiClient.post(HAZARD_REGISTER.REVIEW(id), payload);
    return data;
  },

  // ── Auditor ───────────────────────────────────────────────────────────────────
  async auditList(): Promise<HazardRegisterItem[]> {
    const { data } = await apiClient.get(HAZARD_REGISTER.AUDIT_LIST);
    return data ?? [];
  },
  async verify(id: number, notes?: string): Promise<HazardRegisterItem> {
    const { data } = await apiClient.post(HAZARD_REGISTER.VERIFY(id), { verification_notes: notes });
    return data;
  },

  async stats() {
    const { data } = await apiClient.get(HAZARD_REGISTER.STATS);
    return data;
  },
};
