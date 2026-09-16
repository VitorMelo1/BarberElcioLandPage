import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import * as authService from "../services/authService";
import type { MeUser, RegisterData } from "../services/authService";
import { ApiError } from "../services/api";

interface AuthCtx {
  user: MeUser | null;
  ready: boolean;
  error: string;
  retry: () => void;
  login: (username: string, password: string) => Promise<MeUser>;
  register: (data: RegisterData) => Promise<MeUser>;
  logout: () => Promise<void>;
  updateProfile: (data: Pick<MeUser, "email" | "phone">) => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MeUser | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const expired = () => { setUser(null); setError(""); };
    window.addEventListener("barder:session-expired", expired);
    return () => window.removeEventListener("barder:session-expired", expired);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setReady(false);
    setError("");
    (async () => {
      try {
        const next = await authService.getMe(controller.signal);
        if (!controller.signal.aborted) setUser(next);
      } catch (cause) {
        if (!controller.signal.aborted) {
          if (cause instanceof ApiError && cause.status === 401) setUser(null);
          else setError(cause instanceof Error ? cause.message : "Não foi possível verificar sua sessão.");
        }
      } finally {
        if (!controller.signal.aborted) setReady(true);
      }
    })();
    return () => controller.abort();
  }, [revision]);

  const login = async (username: string, password: string) => {
    const nextUser = await authService.login(username, password);
    setUser(nextUser);
    setError("");
    return nextUser;
  };

  const register = async (data: RegisterData) => {
    await authService.register(data);
    return login(data.username, data.password);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setError("");
  };

  const updateProfile = async (data: Pick<MeUser, "email" | "phone">) => {
    setUser(await authService.updateProfile(data));
  };
  return <Ctx.Provider value={{ user, ready, error, retry: () => setRevision(v => v + 1), login, register, logout, updateProfile }}>{children}</Ctx.Provider>;
}
