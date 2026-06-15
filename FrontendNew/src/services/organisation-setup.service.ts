import axiosInstance from '../api/axiosInstance';

export interface SetupCheckResponse {
  needs_setup: boolean;
  organisation_name?: string;
  admin_name?: string;
  invite_id?: number;
}

export interface SheetResult {
  [table: string]: number;
}

export interface UploadResult {
  success: boolean;
  message: string;
  total_rows: number;
  sheets: SheetResult;
}

export const checkOrgSetupRequired = (email: string) =>
  axiosInstance
    .get<SetupCheckResponse>('/organisation/setup/check', { params: { email } })
    .then((r) => r.data)
    .catch(() => ({ needs_setup: false } as SetupCheckResponse));

export const uploadOrganisationExcel = (
  email: string,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<UploadResult> => {
  const form = new FormData();
  form.append('file', file);

  return axiosInstance
    .post<UploadResult>(`/organisation/setup/upload?email=${encodeURIComponent(email)}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (evt) => {
        if (onProgress && evt.total) {
          onProgress(Math.round((evt.loaded / evt.total) * 100));
        }
      },
    })
    .then((r) => r.data);
};
