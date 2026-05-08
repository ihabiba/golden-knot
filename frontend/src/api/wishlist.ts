import api from './client';
import type { WishlistItem, PaginatedResponse } from '../types';

export const getWishlist = () =>
  api.get<PaginatedResponse<WishlistItem>>('/wishlist/');

export const addToWishlist = (productId: number) =>
  api.post<WishlistItem>('/wishlist/', { product: productId });

export const removeFromWishlist = (id: number) =>
  api.delete(`/wishlist/${id}/`);
