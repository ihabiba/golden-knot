import api from './client';
import type { Order, PaginatedResponse } from '../types';

export const getOrders = () =>
  api.get<PaginatedResponse<Order>>('/orders/');

export const getOrder = (id: number) =>
  api.get<Order>(`/orders/${id}/`);

export const createOrder = (data: Partial<Order>) =>
  api.post<Order>('/orders/', data);

export const updateOrderStatus = (id: number, status: string) =>
  api.patch<Order>(`/orders/${id}/`, { status });
