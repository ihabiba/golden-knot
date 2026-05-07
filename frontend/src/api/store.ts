import api from './client';
import type { SellerProfile, Payout, PaginatedResponse } from '../types';

export const getMySellerProfile = () =>
  api.get<SellerProfile>('/store/sellers/my-profile/');

export const getAllSellers = (params?: Record<string, string>) =>
  api.get<PaginatedResponse<SellerProfile>>('/store/sellers/', { params });

export const createSellerProfile = (data: Partial<SellerProfile>) =>
  api.post<SellerProfile>('/store/sellers/', data);

export const updateSellerProfile = (id: number, data: Partial<SellerProfile>) =>
  api.patch<SellerProfile>(`/store/sellers/${id}/`, data);

export const approveSellerProfile = (id: number) =>
  api.patch<{ detail: string; id: number; status: string }>(`/store/sellers/${id}/approve/`);

export const rejectSellerProfile = (id: number) =>
  api.patch<{ detail: string; id: number; status: string }>(`/store/sellers/${id}/reject/`);

export const getPayouts = () =>
  api.get<PaginatedResponse<Payout>>('/store/payouts/');

export const requestPayout = (amount: string) =>
  api.post<Payout>('/store/payouts/', { amount });
