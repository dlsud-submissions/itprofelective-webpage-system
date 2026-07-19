import type { AuthUser } from '../AuthContext';

interface AuthApiResult<T> {
  data: T | null;
  error: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

async function parseResponse<T>(response: Response): Promise<AuthApiResult<T>> {
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

async function postJson<T>(path: string, body: unknown) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });

  return parseResponse<T>(response);
}

export async function register(payload: {
  name: string;
  email: string;
  password: string;
}) {
  return postJson<{ user: AuthUser }>('/register', payload);
}

export async function login(payload: { email: string; password: string }) {
  return postJson<{ user: AuthUser; token: string }>('/login', payload);
}

export async function logout() {
  const response = await fetch(`${API_BASE_URL}/logout`, {
    method: 'POST',
    credentials: 'include',
  });

  return parseResponse<{ message: string }>(response);
}

export async function me() {
  const response = await fetch(`${API_BASE_URL}/me`, {
    method: 'GET',
    credentials: 'include',
  });

  return parseResponse<{ user: AuthUser }>(response);
}
