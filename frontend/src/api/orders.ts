import api from './client';
import type { Order, PaginatedResponse, ShippingAddress } from '../types';

export const getOrders = () =>
  api.get<PaginatedResponse<Order>>('/orders/');

export const getOrder = (id: number) =>
  api.get<Order>(`/orders/${id}/`);

export const createOrderFromCart = (data: {
  shipping_address: ShippingAddress;
  promo_code?: number | null;
  discount_amount?: string;
}) => api.post<Order>('/orders/from-cart/', data);

export const updateOrderStatus = (id: number, status: string) =>
  api.patch<Order>(`/orders/${id}/`, { status });
