export interface CatalogApiResult<T> {
  data: T | null;
  error: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

async function parseResponse<T>(response: Response): Promise<CatalogApiResult<T>> {
  const body = (await response.json().catch(() => null)) as
    | { error?: string }
    | T
    | null;

  if (!response.ok) {
    const errorMessage =
      body && typeof body === 'object' && 'error' in body && body.error
        ? body.error
        : 'Request failed. Please try again.';

    return { data: null, error: errorMessage };
  }

  return { data: body as T, error: null };
}

export async function listCatalog<T>(resource: string) {
  const response = await fetch(`${API_BASE_URL}/${resource}`, {
    method: 'GET',
    credentials: 'include',
  });

  return parseResponse<T>(response);
}

export async function createCatalogItem<T>(resource: string, payload: unknown) {
  const response = await fetch(`${API_BASE_URL}/${resource}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  return parseResponse<T>(response);
}

export async function updateCatalogItem<T>(resource: string, id: string, payload: unknown) {
  const response = await fetch(`${API_BASE_URL}/${resource}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  return parseResponse<T>(response);
}
