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

export const fetchCurrentUser = () =>
  api.get<User>('/users/me/');

export const googleLogin = (access_token: string) =>
  api.post<AuthTokens>('/auth/google/', { access_token });

export const forgotPassword = (email: string) =>
  api.post<{ detail: string }>('/users/password-reset/', { email });

export const resetPassword = (uid: string, token: string, new_password: string) =>
  api.post<{ detail: string }>('/users/password-reset/confirm/', { uid, token, new_password });
