import api from './client';
import type { Product, Category, ProductImage, PaginatedResponse } from '../types';

export const getProducts = (params?: Record<string, string | number | boolean>) =>
  api.get<PaginatedResponse<Product>>('/products/', { params });

export const getProduct = (idOrSlug: string | number) =>
  api.get<Product>(`/products/${idOrSlug}/`);

export const getCategories = () =>
  api.get<PaginatedResponse<Category>>('/products/categories/');

export const createProduct = (data: FormData | Record<string, string | number | boolean>) =>
  data instanceof FormData
    ? api.post<Product>('/products/', data, { headers: { 'Content-Type': 'multipart/form-data' } })
    : api.post<Product>('/products/', data);

export const updateProduct = (slug: string, data: Partial<Product> | FormData | Record<string, string | number | boolean>) =>
  api.patch<Product>(`/products/${slug}/`, data);

export const deleteProduct = (slug: string) =>
  api.delete(`/products/${slug}/`);

export const approveProduct = (slug: string) =>
  api.patch<{ detail: string; slug: string; is_approved: boolean }>(`/products/${slug}/approve/`);

export const rejectProduct = (slug: string) =>
  api.patch<{ detail: string; slug: string; is_approved: boolean }>(`/products/${slug}/reject/`);

export const uploadProductImage = (slug: string, file: File, isPrimary: boolean) => {
  const fd = new FormData();
  fd.append('image', file);
  fd.append('is_primary', isPrimary ? 'true' : 'false');
  return api.post<ProductImage>(`/products/${slug}/upload-image/`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const deleteProductImage = (slug: string, imageId: number) =>
  api.delete(`/products/${slug}/images/${imageId}/`);
