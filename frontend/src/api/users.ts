import api from './client';
import type { User, PaginatedResponse } from '../types';

export const getUsers = (params?: Record<string, string | number>) =>
  api.get<PaginatedResponse<User>>('/users/', { params });

export const updateUser = (id: number, data: FormData | Partial<User>) =>
  api.patch<User>(`/users/${id}/`, data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  });

export const changePassword = (id: number, data: { old_password: string; password: string }) =>
  api.patch<{ detail: string }>(`/users/${id}/change-password/`, data);

export const deactivateUser = (id: number, password?: string) =>
  api.patch<User>(`/users/${id}/deactivate/`, password ? { password } : {});

export const activateUser = (id: number) =>
  api.patch<User>(`/users/${id}/activate/`);
