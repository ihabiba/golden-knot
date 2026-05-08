import api from './client';
import type { Address, PaginatedResponse } from '../types';

export const getAddresses = () =>
  api.get<PaginatedResponse<Address>>('/addresses/');

export const createAddress = (data: Omit<Address, 'id' | 'created_at'>) =>
  api.post<Address>('/addresses/', data);

export const updateAddress = (id: number, data: Partial<Omit<Address, 'id' | 'created_at'>>) =>
  api.patch<Address>(`/addresses/${id}/`, data);

export const deleteAddress = (id: number) =>
  api.delete(`/addresses/${id}/`);

export const setDefaultAddress = (id: number) =>
  api.patch<Address>(`/addresses/${id}/set-default/`);
