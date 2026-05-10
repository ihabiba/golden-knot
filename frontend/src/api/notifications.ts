import api from './client';
import type { Notification, PaginatedResponse } from '../types';

export const getNotifications = () =>
  api.get<PaginatedResponse<Notification>>('/notifications/');

export const markAllRead = () =>
  api.patch('/notifications/mark_all_read/');

export const markOneRead = (id: number) =>
  api.patch(`/notifications/${id}/`, { is_read: true });

export const deleteNotification = (id: number) =>
  api.delete(`/notifications/${id}/`);
