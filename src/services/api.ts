const BASE = ((import.meta.env.VITE_API_URL as string) || "/api").replace(/\/$/, "");
const NO_REFRESH = ["/auth/login/", "/auth/register/", "/auth/refresh/", "/auth/logout/", "/auth/csrf/"];
const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);

export interface ApiOpts { method?: string; body?: unknown; signal?: AbortSignal; }
export class ApiError extends Error {
  constructor(message: string, public status: number, public fields: Record<string, unknown> = {}) {
    super(message);
    this.name = "ApiError";
  }
}
function errorFrom(status: number, data: unknown): ApiError {
  const fields = data && typeof data === "object" && !Array.isArray(data) ? data as Record<string, unknown> : {};
  const details = Object.entries(fields).filter(([key]) => key !== "code").map(([key, value]) => {
    const text = Array.isArray(value) ? value.filter(v => typeof v === "string").join(" ") : typeof value === "string" ? value : "";
    return text ? ["detail", "non_field_errors"].includes(key) ? text : `${key}: ${text}` : "";
  }).filter(Boolean).join(" ");
  const fallback = status >= 500 ? "O servidor está indisponível. Tente novamente em instantes."
    : status === 401 ? "Sua sessão terminou. Entre novamente."
    : status === 403 ? "Esta ação não está disponível para sua conta."
    : status === 429 ? "Muitas tentativas. Aguarde um pouco e tente novamente."
    : "Não foi possível concluir. Confira os dados e tente novamente.";
  return new ApiError(details || fallback, status, fields);
}
function csrfCookie(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)barder_csrf=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}
async function request(path: string, init: RequestInit = {}) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (init.signal?.aborted) controller.abort();
  init.signal?.addEventListener("abort", abort, { once: true });
  let timedOut = false;
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 20_000);
  try {
    const response = await fetch(`${BASE}${path}`, { ...init, credentials: "include", signal: controller.signal });
    const data: unknown = response.status === 204 ? null : await response.json().catch((error: unknown) => {
      if ((error as { name?: string } | null)?.name === "AbortError") throw error;
      return null;
    });
    return { response, data };
  } catch (error) {
    if (timedOut) throw new ApiError("O servidor demorou para responder. Tente novamente.", 0);
    if ((error as { name?: string } | null)?.name === "AbortError") throw error;
    throw new ApiError("Sem conexão com o servidor. Verifique sua conexão e tente novamente.", 0);
  } finally {
    clearTimeout(timeout);
    init.signal?.removeEventListener("abort", abort);
  }
}
let csrfBootstrap: Promise<string> | null = null;
async function csrfToken(): Promise<string> {
  const cookie = csrfCookie();
  if (cookie) return cookie;
  csrfBootstrap ??= request("/auth/csrf/").then(({ response, data }) => {
    if (!response.ok) throw errorFrom(response.status, data);
    const token = (data as { csrfToken?: string } | null)?.csrfToken || csrfCookie();
    if (!token) throw new ApiError("Não foi possível preparar sua sessão. Recarregue a página.", 0);
    return token;
  }).finally(() => { csrfBootstrap = null; });
  return csrfBootstrap;
}
let refreshing: Promise<boolean> | null = null;
function tryRefresh(): Promise<boolean> {
  refreshing ??= (async () => {
    const token = await csrfToken();
    const { response, data } = await request("/auth/refresh/", { method: "POST", headers: { "X-Barder-CSRF": token } });
    if (!response.ok && response.status !== 401 && response.status !== 403) throw errorFrom(response.status, data);
    return response.ok;
  })().finally(() => { refreshing = null; });
  return refreshing;
}
export async function api<T = unknown>(path: string, opts: ApiOpts = {}, retried = false): Promise<T> {
  const method = (opts.method || "GET").toUpperCase();
  const isFormData = typeof FormData !== "undefined" && opts.body instanceof FormData;
  const headers: Record<string, string> = isFormData ? {} : { "Content-Type": "application/json" };
  if (!SAFE.has(method)) headers["X-Barder-CSRF"] = await csrfToken();
  opts.signal?.throwIfAborted();
  const { response, data } = await request(path, {
    method, headers, signal: opts.signal,
    body: opts.body === undefined ? undefined : isFormData ? opts.body as FormData : JSON.stringify(opts.body),
  });
  if (response.status === 401 && !retried && !NO_REFRESH.some(p => path.startsWith(p))) {
    if (await tryRefresh()) return api<T>(path, opts, true);
  }
  if (!response.ok) {
    if (response.status === 401 && !NO_REFRESH.some(p => path.startsWith(p)) && typeof window !== "undefined") window.dispatchEvent(new Event("barder:session-expired"));
    throw errorFrom(response.status, data);
  }
  return data as T;
}
