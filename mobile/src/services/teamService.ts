import { apiClient } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import type { TeamMember, ToolboxTalk, ShiftStatus, TeamStats } from '../types/team.types';

export const teamService = {
  async getMembers(): Promise<TeamMember[]> {
    const res = await apiClient.get<TeamMember[]>(ENDPOINTS.TEAM.MEMBERS);
    return res.data;
  },

  async getShiftStatus(): Promise<ShiftStatus> {
    const res = await apiClient.get<ShiftStatus>(ENDPOINTS.TEAM.SHIFT_STATUS);
    return res.data;
  },

  async getToolboxTalk(): Promise<ToolboxTalk> {
    const res = await apiClient.get<ToolboxTalk>(ENDPOINTS.TEAM.TOOLBOX_TALK);
    return res.data;
  },

  async submitToolboxLog(data: {
    talk_id: string;
    attendees: { id: string; present: boolean }[];
    notes: string;
  }): Promise<void> {
    await apiClient.post(ENDPOINTS.TEAM.SUBMIT_TOOLBOX, data);
  },

  async getAttendance(): Promise<{ stats: TeamStats; members: TeamMember[] }> {
    const res = await apiClient.get<{ stats: TeamStats; members: TeamMember[] }>(
      ENDPOINTS.TEAM.ATTENDANCE
    );
    return res.data;
  },

  async forceIn(memberId: string): Promise<void> {
    await apiClient.post(ENDPOINTS.TEAM.FORCE_IN(memberId));
  },
};
