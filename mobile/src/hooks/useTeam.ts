import { useState, useCallback, useEffect } from 'react';
import { teamService } from '../services/teamService';
import type { TeamMember, ToolboxTalk, ShiftStatus, TeamStats } from '../types/team.types';

export function useTeam() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [shiftStatus, setShiftStatus] = useState<ShiftStatus | null>(null);
  const [toolboxTalk, setToolboxTalk] = useState<ToolboxTalk | null>(null);
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [mems, shift] = await Promise.all([
        teamService.getMembers(),
        teamService.getShiftStatus(),
      ]);
      setMembers(mems);
      setShiftStatus(shift);
    } catch {
      setError('Failed to load team data');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchToolboxTalk = useCallback(async () => {
    try {
      const talk = await teamService.getToolboxTalk();
      setToolboxTalk(talk);
    } catch {}
  }, []);

  const fetchAttendance = useCallback(async () => {
    try {
      const res = await teamService.getAttendance();
      setStats(res.stats);
      setMembers(res.members);
    } catch {}
  }, []);

  const submitToolboxLog = useCallback(async (data: {
    talk_id: string;
    attendees: { id: string; present: boolean }[];
    notes: string;
  }) => {
    await teamService.submitToolboxLog(data);
  }, []);

  const forceIn = useCallback(async (memberId: string) => {
    await teamService.forceIn(memberId);
    await fetchMembers();
  }, [fetchMembers]);

  useEffect(() => { fetchMembers(); }, []);

  return {
    members,
    shiftStatus,
    toolboxTalk,
    stats,
    loading,
    error,
    fetchMembers,
    fetchToolboxTalk,
    fetchAttendance,
    submitToolboxLog,
    forceIn,
  };
}
