import api from './client';
import type { Cart } from '../types';

export const getCart = () => api.get<Cart>('/cart/');

export const addToCart = (product: number, quantity = 1) =>
  api.post<Cart>('/cart/', { product, quantity });

export const removeCartItem = (itemId: number) =>
  api.delete(`/cart/items/${itemId}/`);
