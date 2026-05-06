import api from './client';
import type { Cart } from '../types';

export const getCart = () => api.get<Cart>('/cart/');

export const addToCart = (product: number, quantity = 1) =>
  api.post<Cart>('/cart/', { product, quantity });

export const updateCartItem = (itemId: number, quantity: number) =>
  api.patch<Cart>(`/cart/items/${itemId}/`, { quantity });

export const removeCartItem = (itemId: number) =>
  api.delete<Cart>(`/cart/items/${itemId}/`);
