import apiClient, { uploadClient } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import {
  Incident, IncidentListResponse,
  ReportIncidentRequest, ReportNearMissRequest, ReportUnsafeActRequest,
  PhotoAttachment,
} from '../types';

function buildFormData(payload: Record<string, any>, photos?: PhotoAttachment[]): FormData {
  const form = new FormData();
  form.append('data', JSON.stringify(payload));
  photos?.forEach((photo, i) => {
    form.append(`photo_${i}`, { uri: photo.uri, name: photo.name, type: photo.type } as any);
  });
  return form;
}

export const incidentService = {
  async getIncidents(params?: { type?: string; status?: string }): Promise<IncidentListResponse> {
    const { data } = await apiClient.get<IncidentListResponse>(ENDPOINTS.INCIDENTS.LIST, { params });
    return data;
  },

  async getIncident(id: string): Promise<Incident> {
    const { data } = await apiClient.get<Incident>(ENDPOINTS.INCIDENTS.DETAIL(id));
    return data;
  },

  async reportIncident(payload: ReportIncidentRequest): Promise<Incident> {
    const hasPhotos = payload.photos && payload.photos.length > 0;
    if (hasPhotos) {
      const form = buildFormData({ ...payload, photos: undefined }, payload.photos);
      const { data } = await uploadClient.post<Incident>(ENDPOINTS.INCIDENTS.REPORT, form);
      return data;
    }
    const { data } = await apiClient.post<Incident>(ENDPOINTS.INCIDENTS.REPORT, payload);
    return data;
  },

  async reportNearMiss(payload: ReportNearMissRequest): Promise<Incident> {
    const hasPhotos = payload.photos && payload.photos.length > 0;
    if (hasPhotos) {
      const form = buildFormData({ ...payload, photos: undefined }, payload.photos);
      const { data } = await uploadClient.post<Incident>(ENDPOINTS.NEAR_MISS.REPORT, form);
      return data;
    }
    const { data } = await apiClient.post<Incident>(ENDPOINTS.NEAR_MISS.REPORT, payload);
    return data;
  },

  async reportUnsafeAct(payload: ReportUnsafeActRequest): Promise<Incident> {
    const hasPhotos = payload.photos && payload.photos.length > 0;
    if (hasPhotos) {
      const form = buildFormData({ ...payload, photos: undefined }, payload.photos);
      const { data } = await uploadClient.post<Incident>(ENDPOINTS.UNSAFE_ACT.REPORT, form);
      return data;
    }
    const { data } = await apiClient.post<Incident>(ENDPOINTS.UNSAFE_ACT.REPORT, payload);
    return data;
  },
};
