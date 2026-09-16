import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { getWorkingHours, saveWorkingHours, type WorkingHour } from "../../services/schedulingService";
import styles from "./BarberApp.module.css";
export function WeeklyHours({ onSaved, onError }: { onSaved: () => void; onError: (m: string) => void }) {
  const [days, setDays] = useState<WorkingHour[] | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setError("");
    let active = true;
    getWorkingHours()
      .then((data) => { if (active) setDays(data); })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : "Erro ao carregar horários."); });
    return () => { active = false; };
  }, [retry]);

  function patch(weekday: number, change: Partial<WorkingHour>) {
    setDays((prev) => prev?.map((d) => (d.weekday === weekday ? { ...d, ...change } : d)) ?? prev);
  }

  async function save() {
    if (!days) return;
    setSaving(true);
    try {
      await saveWorkingHours(
        days.map((d) => ({
          weekday: d.weekday,
          is_open: d.is_open,
          opens_at: d.opens_at.slice(0, 5),
          closes_at: d.closes_at.slice(0, 5),
        })),
      );
      onSaved();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Erro ao salvar horários.");
    } finally {
      setSaving(false);
    }
  }

  if (error) return <div role="alert">{error}<button className={styles.btnGhost} onClick={() => setRetry(v => v + 1)}>Tentar novamente</button></div>;
  if (!days) return <p role="status">Carregando expediente…</p>;

  return (
    <section className={styles.panel}>
      <div className={styles.weekList}>
        {days.map((d) => (
          <div key={d.weekday} className={d.is_open ? styles.weekRow : styles.weekRowOff}>
            <button
              className={d.is_open ? styles.dayToggleOn : styles.dayToggle}
              onClick={() => patch(d.weekday, { is_open: !d.is_open })}
              aria-pressed={d.is_open}
              aria-label={`${d.weekday_label}: ${d.is_open ? "aberto" : "fechado"}`}
            >
              {d.is_open ? <Check size={14} /> : <X size={14} />}
              {d.weekday_label}
            </button>
            {d.is_open ? (
              <div className={styles.weekTimes}>
                <input
                  type="time"
                  value={d.opens_at.slice(0, 5)}
                  onChange={(e) => patch(d.weekday, { opens_at: e.target.value })}
                  aria-label={`Abre ${d.weekday_label}`}
                />
                <span>às</span>
                <input
                  type="time"
                  value={d.closes_at.slice(0, 5)}
                  onChange={(e) => patch(d.weekday, { closes_at: e.target.value })}
                  aria-label={`Fecha ${d.weekday_label}`}
                />
              </div>
            ) : (
              <span className={styles.weekClosed}>Fechado</span>
            )}
          </div>
        ))}
      </div>
      <button className={styles.btn} onClick={() => void save()} disabled={saving}>
        {saving ? "Salvando…" : "Salvar horários"}
      </button>
    </section>
  );
}

