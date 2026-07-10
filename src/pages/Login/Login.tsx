import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarCheck,
  Eye,
  EyeOff,
  Lock,
  Palette,
  Phone,
  Scissors,
  User,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import styles from "./Login.module.css";

const VALUES = [
  { icon: Scissors, title: "Freestyle & cortes", text: "Desenhos, fades e estilos que viram assinatura." },
  { icon: Palette, title: "Colorimetria", text: "Do platinado ao fantasy, sem agredir o fio." },
  { icon: CalendarCheck, title: "Agende em segundos", text: "Veja os horários livres e marque na hora." },
];

export function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const nextUser =
        mode === "login"
          ? await login(username, password)
          : await register({ username, password, phone });
      navigate(nextUser.role === "barber" ? "/barber" : "/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao entrar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* ── Lado da marca (cinematográfico, mesmo vídeo da hero) ── */}
      <aside className={styles.aside}>
        <video
          className={styles.asideVideo}
          autoPlay
          muted
          loop
          playsInline
          poster="/images/hero-poster.jpg"
        >
          <source src="/videos/hero.mp4" type="video/mp4" />
          <source src="/videos/hero.webm" type="video/webm" />
        </video>
        <div className={styles.asideOverlay} aria-hidden />

        <div className={styles.asideTop}>
          <img src="/images/emblema.png" alt="" className={styles.asideEmblem} />
          <span className={styles.asideStudio}>Studio · Anápolis-GO</span>
        </div>

        <div className={styles.asideMid}>
          <h1 className={styles.asideTitle}>
            Bruxo
            <br />
            dos Cabelos
          </h1>
          <p className={styles.asideTagline}>A tesoura é pincel. O cabelo é tela.</p>
          <ul className={styles.values}>
            {VALUES.map((v) => (
              <li key={v.title} className={styles.value}>
                <span className={styles.valueIcon}>
                  <v.icon size={18} />
                </span>
                <div>
                  <b>{v.title}</b>
                  <small>{v.text}</small>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className={styles.quote}>“Estilo é feitiço. Confiança é poder.”</p>
      </aside>

      {/* ── Lado do formulário ── */}
      <main className={styles.formSide}>
        <div className={styles.card}>
          <span className={styles.edge} aria-hidden />
          <Link to="/" className={styles.back}>
            <ArrowLeft size={15} /> voltar ao site
          </Link>
          <img src="/images/emblema.png" alt="" className={styles.cardEmblem} />
          <h2 className={styles.cardTitle}>
            {mode === "login" ? "Bem-vindo de volta" : "Crie sua conta"}
          </h2>
          <p className={styles.cardSub}>
            {mode === "login"
              ? "Entre pra ver seus horários e agendar."
              : "Leva 10 segundos — depois é só marcar."}
          </p>

          <div className={styles.tabs}>
            <button
              type="button"
              className={mode === "login" ? styles.tabOn : styles.tab}
              onClick={() => setMode("login")}
            >
              Entrar
            </button>
            <button
              type="button"
              className={mode === "register" ? styles.tabOn : styles.tab}
              onClick={() => setMode("register")}
            >
              Criar conta
            </button>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <form className={styles.form} onSubmit={submit}>
            <div className={styles.field}>
              <User size={17} className={styles.fieldIcon} />
              <input
                className={styles.input}
                placeholder="Usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
            {mode === "register" && (
              <div className={styles.field}>
                <Phone size={17} className={styles.fieldIcon} />
                <input
                  className={styles.input}
                  placeholder="WhatsApp"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            )}
            <div className={styles.field}>
              <Lock size={17} className={styles.fieldIcon} />
              <input
                className={styles.input}
                type={show ? "text" : "password"}
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
              />
              <button
                type="button"
                className={styles.eye}
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Ocultar senha" : "Mostrar senha"}
              >
                {show ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            <button className={styles.cta} disabled={loading}>
              {loading ? "..." : mode === "login" ? "Entrar" : "Criar conta"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
