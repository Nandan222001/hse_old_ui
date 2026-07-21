import apiClient, { uploadClient } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { Permit, PermitRequest, PermitListResponse } from '../types';

export const permitService = {
  async getPermits(params?: { status?: string }): Promise<PermitListResponse> {
    const { data } = await apiClient.get<PermitListResponse>(ENDPOINTS.PERMITS.LIST, { params });
    return data;
  },

  async getPermit(id: string): Promise<Permit> {
    const { data } = await apiClient.get<Permit>(ENDPOINTS.PERMITS.DETAIL(id));
    return data;
  },

  async createPermit(payload: PermitRequest): Promise<Permit> {
    const { data } = await apiClient.post<Permit>(ENDPOINTS.PERMITS.CREATE, payload);
    return data;
  },

  async createPermitWithFile(payload: PermitRequest, riskAssessmentFile?: { uri: string; name: string; type: string }): Promise<Permit> {
    if (!riskAssessmentFile) {
      return this.createPermit(payload);
    }
    const form = new FormData();
    form.append('data', JSON.stringify(payload));
    form.append('risk_assessment_file', {
      uri: riskAssessmentFile.uri,
      name: riskAssessmentFile.name,
      type: riskAssessmentFile.type,
    } as any);
    const { data } = await uploadClient.post<Permit>(ENDPOINTS.PERMITS.CREATE, form);
    return data;
  },

  async acknowledgePermit(id: string): Promise<Permit> {
    const { data } = await apiClient.post<Permit>(ENDPOINTS.PERMITS.ACKNOWLEDGE(id));
    return data;
  },
};
