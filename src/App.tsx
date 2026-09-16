import { Component, lazy, Suspense, type ReactNode } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { clientDestination } from "./utils/authDestination";
import { Splash } from "./components/Splash/Splash";
import { AuthProvider, useAuth } from "./context/AuthContext";

const ClientApp = lazy(() => import("./pages/ClientApp/ClientApp").then(m => ({ default: m.ClientApp })));
const BarberApp = lazy(() => import("./pages/BarberApp/BarberApp").then(m => ({ default: m.BarberApp })));
const Landing = lazy(() => import("./pages/Landing/Landing").then(m => ({ default: m.Landing })));
const Login = lazy(() => import("./pages/Login/Login").then(m => ({ default: m.Login })));
const Privacidade = lazy(() => import("./pages/Legal/Legal").then(m => ({ default: m.Privacidade })));
const Termos = lazy(() => import("./pages/Legal/Legal").then(m => ({ default: m.Termos })));

function SessionGate({ audience, children }: { audience: "client" | "barber" | "guest"; children: ReactNode }) {
  const { user, ready, error, retry } = useAuth();
  const location = useLocation();
  const destination = clientDestination(audience === "guest" ? new URLSearchParams(location.search).get("next") : location.pathname + location.search);
  if (!ready) return <Splash />;
  if (error) return <main className="recovery"><h1>Não foi possível abrir sua área</h1><p role="alert">{error}</p><button onClick={retry}>Tentar novamente</button><Link to="/">Voltar ao site</Link></main>;
  if (!user) return audience === "guest" ? <>{children}</> : <Navigate to={`/entrar?next=${encodeURIComponent(destination)}`} replace />;
  if (audience === "guest" || (audience === "barber") !== (user.role === "barber")) return <Navigate to={user.role === "barber" ? "/barber" : destination} replace />;
  return <>{children}</>;
}
class PageBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <main className="recovery"><h1>Esta página não carregou</h1><p>Recarregue para tentar novamente. Os agendamentos já confirmados ficam salvos.</p><button onClick={() => window.location.reload()}>Recarregar página</button><a href="/">Voltar ao site</a></main>;
    return this.props.children;
  }
}
export default function App() {
  return <PageBoundary><AuthProvider><BrowserRouter><Suspense fallback={<Splash />}><Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/privacidade" element={<Privacidade />} />
    <Route path="/termos" element={<Termos />} />
    <Route path="/entrar" element={<SessionGate audience="guest"><Login /></SessionGate>} />
    <Route path="/app" element={<SessionGate audience="client"><ClientApp /></SessionGate>} />
    <Route path="/barber" element={<SessionGate audience="barber"><BarberApp /></SessionGate>} />
    <Route path="*" element={<main className="recovery"><h1>Página não encontrada</h1><p>O endereço pode ter mudado.</p><Link to="/app">Ir para minha área</Link><Link to="/">Voltar ao site</Link></main>} />
  </Routes></Suspense></BrowserRouter></AuthProvider></PageBoundary>;
}
