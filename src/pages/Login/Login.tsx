import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { clientDestination } from "../../utils/authDestination";
import { ArrowLeft, Eye, EyeOff, CalendarCheck, Scissors } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import styles from "./Login.module.css";
export function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const destination = clientDestination(params.get("next"));
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault(); if (loading) return;
    setLoading(true); setError("");
    try {
      const user = mode === "login" ? await login(username, password) : await register({ username, password, phone, email });
      navigate(user.role === "barber" ? "/barber" : destination, { replace: true });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível entrar."); }
    finally { setLoading(false); }
  }
  return <div className={styles.page}>
    <aside className={styles.aside}>
      <img className={styles.scene} src="/images/hero-poster.jpg" alt="" />
      <Link to="/" className={styles.brand}><img src="/images/emblema.png" alt="" /><span>Studio do Bruxo</span></Link>
      <div className={styles.asideCopy}><Scissors size={36} /><h1>Seu estilo<br />tem lugar aqui.</h1><p>Cortes, freestyle e colorimetria<br />com o cuidado do Elcio.</p><span><CalendarCheck size={19} />Anápolis, Goiás</span></div>
      <p className={styles.signature}>Bruxo dos Cabelos</p>
    </aside>
    <main className={styles.formSide}><div className={styles.card}>
      <Link to="/" className={styles.back}><ArrowLeft size={17} />Voltar ao site</Link>
      <img src="/images/emblema.png" alt="Studio do Bruxo" className={styles.cardEmblem} />
      <h2>{mode === "login" ? "Bem-vindo de volta" : "Crie sua conta"}</h2>
      <p className={styles.subtitle}>{mode === "login" ? "Entre para agendar e acompanhar seus horários." : "Seus próximos encontros com o studio começam aqui."}</p>
      <div className={styles.tabs} aria-label="Acesso"><button type="button" className={mode === "login" ? styles.tabOn : styles.tab} aria-pressed={mode === "login"} disabled={loading} onClick={() => { setMode("login"); setError(""); }}>Entrar</button><button type="button" className={mode === "register" ? styles.tabOn : styles.tab} aria-pressed={mode === "register"} disabled={loading} onClick={() => { setMode("register"); setError(""); }}>Criar conta</button></div>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <form onSubmit={submit}><fieldset className={styles.form} disabled={loading}>
        <label htmlFor="username">Usuário<input id="username" name="username" placeholder="Usuário" value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" autoCapitalize="none" spellCheck={false} required /></label>
        {mode === "register" && <><label htmlFor="email">E-mail<input id="email" name="email" type="email" placeholder="voce@exemplo.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" /></label><label htmlFor="phone">WhatsApp (opcional)<input id="phone" name="phone" type="tel" placeholder="(62) 99999-9999" value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" /></label></>}
        <label htmlFor="password">Senha<span className={styles.password}><input id="password" name="password" type={show ? "text" : "password"} placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "register" ? 8 : undefined} required /><button className={styles.eye} type="button" aria-label={show ? "Ocultar senha" : "Mostrar senha"} aria-pressed={show} onClick={() => setShow(v => !v)}>{show ? <EyeOff size={19} /> : <Eye size={19} />}</button></span></label>
        {mode === "register" && <p className={styles.hint}>Use pelo menos 8 caracteres. Evite uma senha comum ou somente números.</p>}
        <button className={styles.cta} disabled={loading}>{loading ? "Aguarde…" : mode === "login" ? "Entrar" : "Criar conta"}</button>
      </fieldset></form>
      <a className={styles.help} href="https://wa.me/5562993397680" target="_blank" rel="noreferrer">Precisa de ajuda para acessar? Fale com o studio</a>
      <p className={styles.legal}>Confira nossos <Link to="/termos">termos de uso</Link> e a <Link to="/privacidade">política de privacidade</Link>.</p>
    </div></main>
  </div>;
}
