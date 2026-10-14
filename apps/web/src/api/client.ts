export const API_BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1').replace(/\/$/, '');

// Centralized request wrapper; future auth can attach Authorization here.
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { Accept: 'application/json', ...init?.headers },
    });
  } catch {
    throw new Error(`Could not reach the API at ${API_BASE_URL}`);
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error?.message ?? 'Something went wrong. Please try again.');
  }
  return response.json() as Promise<T>;
}

export const api = {
  listSoftware(params: { q: string; sort: string; page: number; limit?: number; category?: string[]; pricing?: string[]; platform?: string[]; tag?: string[] }) {
    const query = new URLSearchParams({
      q: params.q,
      sort: params.sort,
      page: String(params.page),
      limit: String(params.limit ?? 12),
    });
    for (const filter of ['category', 'pricing', 'platform', 'tag'] as const) {
      if (params[filter]?.length) query.set(filter, params[filter]!.join(','));
    }
    return request<import('../types/software').SoftwareList>(`/software?${query}`);
  },
  getSoftware(slug: string) {
    return request<import('../types/software').Software>(`/software/${encodeURIComponent(slug)}`);
  },
  listCategories() {
    return request<import('../types/software').Category[]>('/categories');
  },
  getCategory(slug: string) {
    return request<import('../types/software').Category>(`/categories/${encodeURIComponent(slug)}`);
  },
  compare(slugs: string[]) {
    const query = new URLSearchParams({ apps: slugs.join(',') });
    return request<import('../types/software').Comparison>(`/compare?${query}`);
  },
  suggestSoftware(q: string) {
    const query = new URLSearchParams({ q });
    return request<import('../types/software').SoftwareSuggestion[]>(`/software/suggest?${query}`);
  },
};
