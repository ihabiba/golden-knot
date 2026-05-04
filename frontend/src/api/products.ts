import api from './client';
import type { Product, Category, PaginatedResponse } from '../types';

export const getProducts = (params?: Record<string, string | number>) =>
  api.get<PaginatedResponse<Product>>('/products/', { params });

export const getProduct = (idOrSlug: string | number) =>
  api.get<Product>(`/products/${idOrSlug}/`);

export const getCategories = () =>
  api.get<PaginatedResponse<Category>>('/products/categories/');

export const createProduct = (data: FormData) =>
  api.post<Product>('/products/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const updateProduct = (id: number, data: Partial<Product>) =>
  api.patch<Product>(`/products/${id}/`, data);

export const deleteProduct = (id: number) =>
  api.delete(`/products/${id}/`);
