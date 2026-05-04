import api from './client';
import type { Review, PaginatedResponse } from '../types';

export const getReviews = (productId: number) =>
  api.get<PaginatedResponse<Review>>('/reviews/', { params: { product: productId } });

export const createReview = (data: { product: number; rating: number; comment?: string }) =>
  api.post<Review>('/reviews/', data);
