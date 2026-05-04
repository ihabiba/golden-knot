import api from './client';
import type { AuthTokens, User } from '../types';

export const login = (email: string, password: string) =>
  api.post<AuthTokens>('/auth/token/', { email, password });

export const register = (data: {
  email: string;
  username: string;
  password: string;
  role?: string;
  phone?: string;
}) => api.post<User>('/users/register/', data);

export const refreshToken = (refresh: string) =>
  api.post<{ access: string }>('/auth/token/refresh/', { refresh });
