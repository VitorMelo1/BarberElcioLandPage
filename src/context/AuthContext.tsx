import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import * as authService from "../services/authService";
import type { MeUser, RegisterData } from "../services/authService";

interface AuthCtx {
  user: MeUser | null;
  ready: boolean;
  login: (username: string, password: string) => Promise<MeUser>;
  register: (data: RegisterData) => Promise<MeUser>;
  logout: () => Promise<void>;
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
      try {
        setUser(await authService.getMe());
      } catch {
        setUser(null);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const login = async (username: string, password: string) => {
    const nextUser = await authService.login(username, password);
    setUser(nextUser);
    return nextUser;
  };

  const register = async (data: RegisterData) => {
    await authService.register(data);
    return login(data.username, data.password);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  };

  return <Ctx.Provider value={{ user, ready, login, register, logout }}>{children}</Ctx.Provider>;
}
