import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarPlus, Clock, Crown, LayoutDashboard, LogOut } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { AgendarView } from "./AgendarView";
import { DashboardView } from "./DashboardView";
import { MeusHorariosView } from "./MeusHorariosView";
import { PlanosView } from "./PlanosView";
import styles from "./ClientApp.module.css";

type Tab = "inicio" | "agendar" | "planos" | "historico";

const NAV = [
  { id: "inicio", label: "Início", icon: LayoutDashboard },
  { id: "agendar", label: "Agendar", icon: CalendarPlus },
  { id: "planos", label: "Planos", icon: Crown },
  { id: "historico", label: "Histórico", icon: Clock },
] as const;

export function ClientApp() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("inicio");
  const initials = (user?.username || "?").slice(0, 2).toUpperCase();

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link to="/" className={styles.logoLink}>
          <img src="/images/logo.png" alt="Studio do Bruxo dos Cabelos" className={styles.logo} />
        </Link>
        <nav className={styles.nav}>
          {NAV.map((n) => (
            <button
              key={n.id}
              className={tab === n.id ? styles.navItemOn : styles.navItem}
              onClick={() => setTab(n.id)}
            >
              <n.icon size={18} />
              <span>{n.label}</span>
            </button>
          ))}
        </nav>
        <p className={styles.sideQuote}>
          “Estilo é feitiço.
          <br />
          Confiança é poder.”
        </p>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.welcomeBox}>
            <h1 className={styles.welcome}>Bem-vindo de volta, {user?.username} ✦</h1>
            <p className={styles.welcomeSub}>Pronto pra transformar seu estilo?</p>
          </div>
          <div className={styles.userChip}>
            <span className={styles.avatar}>{initials}</span>
            <div className={styles.userInfo}>
              <b>{user?.username}</b>
              <small>Cliente</small>
            </div>
            <button className={styles.logoutBtn} onClick={() => void logout()} aria-label="Sair">
              <LogOut size={16} />
            </button>
          </div>
        </header>

        <div className={styles.content}>
          {tab === "inicio" && (
            <DashboardView onAgendar={() => setTab("agendar")} onHistorico={() => setTab("historico")} />
          )}
          {tab === "agendar" && <AgendarView />}
          {tab === "planos" && <PlanosView />}
          {tab === "historico" && <MeusHorariosView />}
        </div>
      </div>
    </div>
  );
}
