import api from './client';
import type { PromoValidation } from '../types';

export const validatePromoCode = (code: string, subtotal: string) =>
  api.post<PromoValidation>('/promotions/validate/', { code, subtotal });
