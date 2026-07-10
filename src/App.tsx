import type { ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { Splash } from "./components/Splash/Splash";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { BarberApp } from "./pages/BarberApp/BarberApp";
import { ClientApp } from "./pages/ClientApp/ClientApp";
import { Landing } from "./pages/Landing/Landing";
import { Privacidade, Termos } from "./pages/Legal/Legal";
import { Login } from "./pages/Login/Login";

/* Área do cliente: barbeiro logado é levado direto pro comando da cadeira. */
function ClientOnly({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  if (!ready) return <Splash />;
  if (!user) return <Navigate to="/entrar" replace />;
  if (user.role === "barber") return <Navigate to="/barber" replace />;
  return <>{children}</>;
}

/* Painel do barbeiro: cliente logado volta pra área dele, sem tela de erro. */
function BarberOnly({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  if (!ready) return <Splash />;
  if (!user) return <Navigate to="/entrar" replace />;
  if (user.role !== "barber") return <Navigate to="/app" replace />;
  return <>{children}</>;
}

/* Login: quem já está logado nem vê o formulário — cai direto no painel. */
function GuestOnly({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  if (!ready) return <Splash />;
  if (user) return <Navigate to={user.role === "barber" ? "/barber" : "/app"} replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/privacidade" element={<Privacidade />} />
          <Route path="/termos" element={<Termos />} />
          <Route
            path="/entrar"
            element={
              <GuestOnly>
                <Login />
              </GuestOnly>
            }
          />
          <Route
            path="/app"
            element={
              <ClientOnly>
                <ClientApp />
              </ClientOnly>
            }
          />
          <Route
            path="/barber"
            element={
              <BarberOnly>
                <BarberApp />
              </BarberOnly>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
