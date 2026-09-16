import { api } from "./api";

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
  const data = await api<{ user: MeUser }>("/auth/login/", {
    method: "POST",
    body: { username, password },
  });
  return data.user;
}

export function register(data: RegisterData) {
  return api("/auth/register/", { method: "POST", body: data });
}

export function getMe(signal?: AbortSignal) {
  return api<MeUser>("/auth/me/", { signal });
}

export function logout() {
  return api<null>("/auth/logout/", { method: "POST" });
}

export function updateProfile(data: Pick<MeUser, "email" | "phone">) {
  return api<MeUser>("/auth/me/", { method: "PATCH", body: data });
}
