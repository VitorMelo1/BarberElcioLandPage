import { useEffect, useState } from "react";

import { getServices, type ApiService } from "../../services/catalogService";
import { createBooking, getSlots } from "../../services/schedulingService";
import styles from "./ClientApp.module.css";

const todayStr = () => new Date().toISOString().slice(0, 10);
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

export function AgendarView() {
  const [services, setServices] = useState<ApiService[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [slot, setSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    getServices()
      .then(setServices)
      .catch(() => setError("Erro ao carregar serviços."));
  }, []);

  const chosen = services.filter((s) => selected.includes(s.id));
  const total = chosen.reduce((a, s) => a + Number(s.price), 0);
  const toggle = (id: number) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const onDate = async (d: string) => {
    setDate(d);
    setSlot(null);
    if (selected.length === 0) {
      setError("Escolha um serviço primeiro.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      setSlots((await getSlots(d, selected)).slots);
    } catch {
      setError("Erro ao buscar horários.");
    } finally {
      setLoading(false);
    }
  };

  const confirm = async () => {
    if (!slot) return;
    setLoading(true);
    setError("");
    try {
      const b = await createBooking(selected, slot);
      setDone(b.start);
      setSelected([]);
      setDate("");
      setSlots([]);
      setSlot(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao agendar.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className={styles.success}>
        <div className={styles.check}>✓</div>
        <h2 className={styles.successTitle}>Agendado!</h2>
        <p className={styles.successDate}>
          {new Date(done).toLocaleString("pt-BR", {
            weekday: "long",
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        <p className={styles.muted}>Falta o sinal de 50% — o Elcio combina contigo. ✂️</p>
        <button className={styles.cta} onClick={() => setDone(null)}>
          Agendar outro
        </button>
      </div>
    );
  }

  return (
    <div className={styles.view}>
      {error && <p className={styles.error}>{error}</p>}

      <h3 className={styles.step}>1 · Escolha os serviços</h3>
      <div className={styles.cards}>
        {services.map((s) => (
          <button
            key={s.id}
            className={`${styles.svc} ${selected.includes(s.id) ? styles.svcOn : ""}`}
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

      <h3 className={styles.step}>2 · Escolha o dia</h3>
      <input
        className={styles.input}
        type="date"
        min={todayStr()}
        value={date}
        onChange={(e) => onDate(e.target.value)}
      />

      {date && (
        <>
          <h3 className={styles.step}>3 · Horário</h3>
          {loading ? (
            <p className={styles.muted}>Carregando horários…</p>
          ) : slots.length === 0 ? (
            <p className={styles.muted}>Sem horários livres nesse dia. Tente outro.</p>
          ) : (
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
          )}
        </>
      )}

      <div className={styles.bottom}>
        <span className={styles.total}>
          Total: <b>R$ {total.toFixed(0)}</b>
        </span>
        <button className={styles.cta} disabled={!slot || loading} onClick={confirm}>
          Confirmar
        </button>
      </div>
    </div>
  );
}
