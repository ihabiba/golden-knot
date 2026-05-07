import api from './client';
import type { PromoValidation, PromoCode, PaginatedResponse } from '../types';

export const validatePromoCode = (code: string, subtotal: string) =>
  api.post<PromoValidation>('/promotions/validate/', { code, subtotal });

export const getPromoCodes = (params?: Record<string, string | number>) =>
  api.get<PaginatedResponse<PromoCode>>('/promotions/', { params });

export const createPromoCode = (data: Omit<PromoCode, 'id' | 'uses_count'>) =>
  api.post<PromoCode>('/promotions/', data);

export const updatePromoCode = (id: number, data: Partial<PromoCode>) =>
  api.patch<PromoCode>(`/promotions/${id}/`, data);

export const deletePromoCode = (id: number) =>
  api.delete(`/promotions/${id}/`);
