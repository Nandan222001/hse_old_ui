import axiosInstance from '../api/axiosInstance';

export interface OrganisationInvite {
  id: number;
  organisation_name: string;
  admin_name: string;
  admin_email: string;
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
  updated_at: string;
}

export interface InviteListResponse {
  total: number;
  items: OrganisationInvite[];
}

export interface OrganisationSummary {
  id: number;
  organisation_name: string;
  country: string | null;
  industry_sector: string | null;
  number_of_employees: number | null;
  invite_status: 'pending' | 'accepted' | 'expired' | 'no_invite';
  created_at: string;
}

export interface OrganisationSummaryList {
  total: number;
  items: OrganisationSummary[];
}

export interface InviteOrganisationPayload {
  organisation_name: string;
  admin_name: string;
  admin_email: string;
}

export const inviteOrganisation = (payload: InviteOrganisationPayload) =>
  axiosInstance
    .post<OrganisationInvite>('/superadmin/invite-organisation', payload)
    .then((r) => r.data);

export const listInvites = (skip = 0, limit = 100) =>
  axiosInstance
    .get<InviteListResponse>('/superadmin/invites', { params: { skip, limit } })
    .then((r) => r.data);

export const listOrganisationsSummary = () =>
  axiosInstance
    .get<OrganisationSummaryList>('/superadmin/organisations')
    .then((r) => r.data);

export const updateInviteStatus = (
  inviteId: number,
  newStatus: 'pending' | 'accepted' | 'expired',
) =>
  axiosInstance
    .patch<OrganisationInvite>(
      `/superadmin/invites/${inviteId}/status`,
      null,
      { params: { new_status: newStatus } },
    )
    .then((r) => r.data);
