import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { getToken } from "../services/api";
import * as authService from "../services/authService";
import type { MeUser, RegisterData } from "../services/authService";

interface AuthCtx {
  user: MeUser | null;
  ready: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
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

  useEffect(() => {
    (async () => {
      if (getToken()) {
        try {
          setUser(await authService.getMe());
        } catch {
          authService.logout();
        }
      }
      setReady(true);
    })();
  }, []);

  const login = async (username: string, password: string) => {
    await authService.login(username, password);
    setUser(await authService.getMe());
  };

  const register = async (data: RegisterData) => {
    await authService.register(data);
    await login(data.username, data.password);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return <Ctx.Provider value={{ user, ready, login, register, logout }}>{children}</Ctx.Provider>;
}
