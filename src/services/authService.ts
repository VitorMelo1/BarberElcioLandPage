import { api, clearTokens, setTokens } from "./api";

export interface RegisterData {
  username: string;
  email?: string;
  phone?: string;
  password: string;
}

export interface MeUser {
  id: number;
  username: string;
  email: string;
  phone: string;
  role: string;
  date_joined: string;
}

export async function login(username: string, password: string) {
  const data = await api<{ access: string; refresh: string }>("/auth/token/", {
    method: "POST",
    body: { username, password },
  });
  setTokens(data.access, data.refresh);
}

export function register(data: RegisterData) {
  return api("/auth/register/", { method: "POST", body: data });
}

export function getMe() {
  return api<MeUser>("/auth/me/", { auth: true });
}

export function logout() {
  clearTokens();
}
