const BASE = (import.meta.env.VITE_API_URL as string) || "http://127.0.0.1:8000/api";

interface ApiOpts {
  method?: string;
  body?: unknown;
}

/* Endpoints em que um 401 é resposta final — não adianta renovar o token. */
const NO_REFRESH = ["/auth/login/", "/auth/register/", "/auth/refresh/", "/auth/logout/"];

/* Uma renovação por vez: chamadas concorrentes com 401 compartilham a mesma promise. */
let refreshing: Promise<boolean> | null = null;

function tryRefresh(): Promise<boolean> {
  refreshing ??= fetch(`${BASE}/auth/refresh/`, { method: "POST", credentials: "include" })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

export async function api<T = unknown>(path: string, opts: ApiOpts = {}, retried = false): Promise<T> {
  const { method = "GET", body } = opts;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const headers: Record<string, string> = isFormData ? {} : { "Content-Type": "application/json" };
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      credentials: "include",
      body: body !== undefined ? (isFormData ? body : JSON.stringify(body)) : undefined,
    });
  } catch {
    // Rede fora ou servidor caído — mensagem legível em vez de "Failed to fetch".
    throw new Error("Sem conexão com o servidor. Tenta de novo em instantes.");
  }
  if (res.status === 401 && !retried && !NO_REFRESH.some((p) => path.startsWith(p))) {
    // Access expirou (60 min): renova via cookie de refresh e repete a chamada uma vez.
    if (await tryRefresh()) return api<T>(path, opts, true);
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const msg =
      (data && (data.detail || data.username?.[0] || data.password?.[0])) || `Erro ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}
