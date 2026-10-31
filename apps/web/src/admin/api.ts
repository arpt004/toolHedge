import { API_BASE_URL } from '../api/client';
import {
  AdminCategory,
  AdminDashboardStats,
  AdminFeatureOption,
  AdminFilterDefinition,
  AdminProductDetail,
  AdminProductFormOptions,
  AdminProductListResult,
  AdminUser,
  ApiErrorPayload,
} from './types';

export class AdminApiError extends Error {
  constructor(public code: string, message: string, public details?: unknown, public status?: number) {
    super(message);
    this.name = 'AdminApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/admin${path}`, {
      ...init,
      credentials: 'include',
      headers: { Accept: 'application/json', ...init?.headers },
    });
  } catch {
    throw new AdminApiError('NETWORK_ERROR', `Could not reach the API at ${API_BASE_URL}`);
  }
  if (response.status === 204) return undefined as T;
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const err = (payload as ApiErrorPayload | null)?.error;
    throw new AdminApiError(err?.code ?? 'UNKNOWN_ERROR', err?.message ?? 'Something went wrong.', err?.details, response.status);
  }
  return payload as T;
}

function jsonInit(method: string, body?: unknown): RequestInit {
  return { method, headers: { 'Content-Type': 'application/json' }, body: body !== undefined ? JSON.stringify(body) : undefined };
}

export const adminApi = {
  login(email: string, password: string) {
    return request<{ admin: AdminUser }>('/auth/login', jsonInit('POST', { email, password }));
  },
  logout() {
    return request<void>('/auth/logout', jsonInit('POST'));
  },
  me() {
    return request<{ admin: AdminUser | null }>('/auth/me');
  },

  listProducts(params: Record<string, string | number | undefined>) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') query.set(key, String(value));
    }
    return request<AdminProductListResult>(`/products?${query}`);
  },
  getProduct(id: number) {
    return request<AdminProductDetail>(`/products/${id}`);
  },
  getProductFormOptions() {
    return request<AdminProductFormOptions>('/products/form-options');
  },
  createProduct(body: Record<string, unknown>) {
    return request<AdminProductDetail>('/products', jsonInit('POST', body));
  },
  updateProduct(id: number, body: Record<string, unknown>) {
    return request<AdminProductDetail>(`/products/${id}`, jsonInit('PATCH', body));
  },
  archiveProduct(id: number) {
    return request<void>(`/products/${id}`, jsonInit('DELETE'));
  },
  deleteProductPermanently(id: number) {
    return request<void>(`/products/${id}/permanent?confirm=true`, jsonInit('DELETE'));
  },

  listCategories(params: Record<string, string | number | undefined> = {}) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') query.set(key, String(value));
    }
    return request<{ items: AdminCategory[]; page: number; limit: number; total: number }>(`/categories?${query}`);
  },
  createCategory(body: { slug: string; name: string; description: string; icon: string }) {
    return request<AdminCategory>('/categories', jsonInit('POST', body));
  },
  updateCategory(id: number, body: Partial<{ slug: string; name: string; description: string; icon: string }>) {
    return request<AdminCategory>(`/categories/${id}`, jsonInit('PATCH', body));
  },
  deleteCategory(id: number, force = false) {
    return request<void>(`/categories/${id}${force ? '?force=true' : ''}`, jsonInit('DELETE'));
  },

  listFilters() {
    return request<AdminFilterDefinition[]>('/filters');
  },
  listFeatureOptions() {
    return request<AdminFeatureOption[]>('/filters/feature-options');
  },
  createFilter(body: Record<string, unknown>) {
    return request<AdminFilterDefinition>('/filters', jsonInit('POST', body));
  },
  updateFilter(id: number, body: Record<string, unknown>) {
    return request<AdminFilterDefinition>(`/filters/${id}`, jsonInit('PATCH', body));
  },
  setFilterEnabled(id: number, isEnabled: boolean) {
    return request<AdminFilterDefinition>(`/filters/${id}/enabled`, jsonInit('PATCH', { isEnabled }));
  },
  deleteFilter(id: number) {
    return request<void>(`/filters/${id}`, jsonInit('DELETE'));
  },
  reorderFilters(order: number[]) {
    return request<void>('/filters/reorder', jsonInit('POST', { order }));
  },

  getColumnPreferences(tableKey: string) {
    return request<{ columns: string[] | null }>(`/preferences/columns/${tableKey}`);
  },
  saveColumnPreferences(tableKey: string, columns: string[]) {
    return request<{ columns: string[] }>(`/preferences/columns/${tableKey}`, jsonInit('PUT', { columns }));
  },
  resetColumnPreferences(tableKey: string) {
    return request<void>(`/preferences/columns/${tableKey}`, jsonInit('DELETE'));
  },

  getDashboardStats() {
    return request<AdminDashboardStats>('/dashboard/stats');
  },
};
