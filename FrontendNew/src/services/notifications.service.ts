import axiosInstance from '../api/axiosInstance';

export interface NotificationItem {
  id: number;
  organisation_id: number | null;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'maintenance' | 'announcement';
  target_type: 'all' | 'specific';
  status: string;
  is_read: boolean;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export const getNotifications = (skip = 0, limit = 50) =>
  axiosInstance.get<NotificationItem[]>('/notifications/', { params: { skip, limit } }).then(r => r.data);

export const getUnreadCount = () =>
  axiosInstance.get<{ count: number }>('/notifications/unread-count').then(r => r.data.count);

export const markNotificationRead = (id: number) =>
  axiosInstance.post(`/notifications/${id}/read`);

export const markAllNotificationsRead = () =>
  axiosInstance.post('/notifications/read-all');
