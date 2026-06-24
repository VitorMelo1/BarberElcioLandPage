import { useEffect, useState, type FormEvent } from "react";

import { useAuth } from "../../context/AuthContext";
import { useBooking } from "../../context/BookingContext";
import { getServices, type ApiService } from "../../services/catalogService";
import { createBooking, getSlots, type Booking } from "../../services/schedulingService";
import styles from "./BookingModal.module.css";

type Step = "services" | "auth" | "datetime" | "done";

const todayStr = () => new Date().toISOString().slice(0, 10);
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

export function BookingModal() {
  const { open, closeBooking } = useBooking();
  const { user, login, register, logout } = useAuth();

  const [step, setStep] = useState<Step>("services");
  const [services, setServices] = useState<ApiService[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [date, setDate] = useState(todayStr());
  const [slots, setSlots] = useState<string[]>([]);
  const [slot, setSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);

  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (open && services.length === 0) {
      getServices()
        .then(setServices)
        .catch(() => setError("Não consegui carregar os serviços. O servidor está no ar?"));
    }
  }, [open, services.length]);

  if (!open) return null;

  const chosen = services.filter((s) => selected.includes(s.id));
  const total = chosen.reduce((a, s) => a + Number(s.price), 0);
  const duration = chosen.reduce((a, s) => a + s.duration_min, 0);

  const reset = () => {
    setStep("services");
    setSelected([]);
    setSlot(null);
    setSlots([]);
    setError("");
    setBooking(null);
  };
  const close = () => {
    closeBooking();
    setTimeout(reset, 300);
  };

  const toggle = (id: number) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const goAfterServices = () => {
    if (selected.length === 0) return setError("Escolha ao menos um serviço.");
    setError("");
    setStep(user ? "datetime" : "auth");
  };

  const loadSlots = async (d: string) => {
    setDate(d);
    setSlot(null);
    setLoading(true);
    setError("");
    try {
      setSlots((await getSlots(d, selected)).slots);
    } catch {
      setError("Erro ao buscar horários.");
    } finally {
      setLoading(false);
    }
  };

  const submitAuth = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "login") await login(username, password);
      else await register({ username, password, phone });
      setStep("datetime");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao entrar.");
    } finally {
      setLoading(false);
    }
  };

  const confirm = async () => {
    if (!slot) return;
    setLoading(true);
    setError("");
    try {
      setBooking(await createBooking(selected, slot));
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao agendar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={close}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button className={styles.close} onClick={close} aria-label="Fechar">
          ×
        </button>
        <p className={styles.kicker}>Agendar no Studio</p>

        {error && <p className={styles.error}>{error}</p>}

        {step === "services" && (
          <>
            <h2 className={styles.title}>Escolha os serviços</h2>
            <div className={styles.list}>
              {services.map((s) => (
                <button
                  key={s.id}
                  className={`${styles.item} ${selected.includes(s.id) ? styles.itemOn : ""}`}
                  onClick={() => toggle(s.id)}
                >
                  <span>
                    {s.name}
                    <small>{s.duration_min} min</small>
                  </span>
                  <b>R$ {Number(s.price).toFixed(0)}</b>
                </button>
              ))}
            </div>
            <div className={styles.footer}>
              <span className={styles.total}>
                Total: <b>R$ {total.toFixed(0)}</b>
              </span>
              <button className={styles.cta} onClick={goAfterServices}>
                Continuar
              </button>
            </div>
          </>
        )}

        {step === "auth" && (
          <>
            <h2 className={styles.title}>Sua conta</h2>
            <div className={styles.tabs}>
              <button className={mode === "login" ? styles.tabOn : styles.tab} onClick={() => setMode("login")}>
                Entrar
              </button>
              <button
                className={mode === "register" ? styles.tabOn : styles.tab}
                onClick={() => setMode("register")}
              >
                Criar conta
              </button>
            </div>
            <form className={styles.form} onSubmit={submitAuth}>
              <input
                className={styles.input}
                placeholder="Usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
              {mode === "register" && (
                <input
                  className={styles.input}
                  placeholder="WhatsApp"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              )}
              <input
                className={styles.input}
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button className={styles.cta} disabled={loading}>
                {loading ? "..." : mode === "login" ? "Entrar" : "Criar e continuar"}
              </button>
            </form>
          </>
        )}

        {step === "datetime" && (
          <>
            <h2 className={styles.title}>Dia e horário</h2>
            <input
              className={styles.input}
              type="date"
              min={todayStr()}
              value={date}
              onChange={(e) => loadSlots(e.target.value)}
            />
            {loading && <p className={styles.muted}>Carregando horários…</p>}
            {!loading && slots.length === 0 && (
              <p className={styles.muted}>Escolha um dia pra ver os horários livres.</p>
            )}
            <div className={styles.slots}>
              {slots.map((s) => (
                <button
                  key={s}
                  className={`${styles.slot} ${slot === s ? styles.slotOn : ""}`}
                  onClick={() => setSlot(s)}
                >
                  {fmtTime(s)}
                </button>
              ))}
            </div>
            <div className={styles.footer}>
              <span className={styles.total}>
                R$ {total.toFixed(0)} · {duration} min
              </span>
              <button className={styles.cta} disabled={!slot || loading} onClick={confirm}>
                Confirmar
              </button>
            </div>
          </>
        )}

        {step === "done" && booking && (
          <div className={styles.done}>
            <div className={styles.check}>✓</div>
            <h2 className={styles.title}>Agendado!</h2>
            <p className={styles.muted}>
              {fmtDateTime(booking.start)} · R$ {Number(booking.total_price).toFixed(0)}
            </p>
            <p className={styles.note}>
              Falta só o <b>sinal de 50%</b> pra confirmar — o Elcio combina contigo. Até lá! ✂️
            </p>
            <button className={styles.cta} onClick={close}>
              Fechar
            </button>
          </div>
        )}

        {user && step !== "done" && (
          <button className={styles.logout} onClick={logout}>
            sair ({user.username})
          </button>
        )}
      </div>
    </div>
  );
}
