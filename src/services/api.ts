const BASE = (import.meta.env.VITE_API_URL as string) || "http://127.0.0.1:8000/api";

export function getToken() {
  return localStorage.getItem("barder_access");
}
export function setTokens(access: string, refresh?: string) {
  localStorage.setItem("barder_access", access);
  if (refresh) localStorage.setItem("barder_refresh", refresh);
}
export function clearTokens() {
  localStorage.removeItem("barder_access");
  localStorage.removeItem("barder_refresh");
}

interface ApiOpts {
  method?: string;
  body?: unknown;
  auth?: boolean;
}

export async function api<T = unknown>(path: string, opts: ApiOpts = {}): Promise<T> {
  const { method = "GET", body, auth = false } = opts;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) {
    const t = getToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const msg =
      (data && (data.detail || data.username?.[0] || data.password?.[0])) || `Erro ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}
