import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CalendarPlus, Clock, Crown, LogOut, ArrowUpRight, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { AgendarView } from "./AgendarView";
import { MeusHorariosView } from "./MeusHorariosView";
import { PlanosView } from "./PlanosView";
import { ProfileView } from "./ProfileView";
import { NotificationCenter } from "./NotificationCenter";
import styles from "./ClientApp.module.css";

const NAV = [{ id: "inicio", label: "Agendar", icon: CalendarPlus }, { id: "historico", label: "Meus horários", icon: Clock }, { id: "planos", label: "Planos", icon: Crown }, { id: "conta", label: "Conta", icon: User }] as const;
export function ClientApp() {
  const { user, logout } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = ["historico", "planos", "conta"].includes(params.get("aba") || "") ? params.get("aba") : "inicio";
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState("");
  async function leave() {
    setLeaving(true); setError("");
    try { await logout(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível sair. Tente novamente."); }
    finally { setLeaving(false); }
  }
  return <div className={styles.shell} data-app-shell>
    <a className="skipLink" href="#client-content">Pular para o conteúdo</a>
    <aside className={styles.sidebar}>
      <Link to="/" className={styles.logoLink}><img src="/images/emblema.png" alt="" /><span>Studio do Bruxo<small>Seu estilo. Seu tempo.</small></span></Link>
      <nav className={styles.nav} aria-label="Área do cliente">{NAV.map(item => <button key={item.id} className={tab === item.id ? styles.navItemOn : styles.navItem} aria-current={tab === item.id ? "page" : undefined} onClick={() => setParams(item.id === "inicio" ? {} : { aba: item.id })}><item.icon size={21} /><span>{item.label}</span></button>)}</nav>
      <div className={styles.sidebarFoot}><p>Precisa de ajuda com<br />seu atendimento?</p><a href="https://wa.me/5562993397680" target="_blank" rel="noreferrer">Fale com o studio <ArrowUpRight size={16} /></a><Link to="/">Visitar o site</Link></div>
    </aside>
    <div className={styles.main}>
      <header className={styles.topbar}><div><Link to="/" className={styles.mobileBrand}>Studio do Bruxo</Link><h1>Olá, {user?.username}.</h1><p>Bom te ver por aqui.</p></div><div className={styles.userChip}><span className={styles.avatar} aria-hidden>{(user?.username || "?").slice(0, 2).toUpperCase()}</span><button className={styles.logoutBtn} disabled={leaving} onClick={() => void leave()} aria-label="Sair"><LogOut size={19} /><span>{leaving ? "Saindo…" : "Sair"}</span></button></div></header>
      <main id="client-content" className={styles.content}>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <NotificationCenter />
        <div hidden={tab !== "inicio"}><AgendarView /></div>
        {tab === "planos" && <PlanosView />}
        {tab === "historico" && <MeusHorariosView />}
        {tab === "conta" && <ProfileView />}
      </main>
    </div>
  </div>;
}
