import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { acknowledgeNotification, getMyNotifications, type RescheduleNotice } from "../../services/schedulingService";
import { appointmentDate, time } from "../../utils/format";
import styles from "./ClientApp.module.css";

export function NotificationCenter() {
  const [notices, setNotices] = useState<RescheduleNotice[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<number | null>(null);
  const [history, setHistory] = useState(false);
  const request = useRef<AbortController | null>(null);
  const busy = useRef(false);
  const refresh = useCallback(async () => {
    if (document.visibilityState === "hidden" || busy.current) return;
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    try { const items = await getMyNotifications(controller.signal); if (!controller.signal.aborted) { setNotices(items); setError(""); } }
    catch (cause) { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Não foi possível consultar os avisos."); }
  }, []);
  useEffect(() => {
    void refresh();
    const update = () => void refresh();
    const timer = window.setInterval(update, 90_000);
    window.addEventListener("focus", update); document.addEventListener("visibilitychange", update);
    return () => { request.current?.abort(); window.clearInterval(timer); window.removeEventListener("focus", update); document.removeEventListener("visibilitychange", update); };
  }, [refresh]);
  async function acknowledge(id: number) {
    if (busy.current) return;
    busy.current = true; request.current?.abort(); setPending(id); setError("");
    try { const updated = await acknowledgeNotification(id); setNotices(items => items.map(item => item.id === id ? updated : item)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível registrar sua ciência. Tente novamente."); }
    finally { busy.current = false; setPending(null); }
  }
  if (!notices.length && !error) return null;
  const latestByBooking = new Map<number, RescheduleNotice>();
  for (const notice of notices) {
    const latest = latestByBooking.get(notice.booking);
    const created = Date.parse(notice.created_at);
    const latestCreated = latest ? Date.parse(latest.created_at) : 0;
    if (!latest || created > latestCreated || (created === latestCreated && notice.id > latest.id)) {
      latestByBooking.set(notice.booking, notice);
    }
  }
  const waiting = notices.filter(n => !n.acknowledged_at);
  const shown = history ? notices : waiting;
  return <section className={styles.notifications} aria-label="Avisos sobre seus horários">
    {error && <div className={styles.error} role="alert"><p>Não foi possível atualizar seus avisos. {error}</p><button className={styles.secondary} onClick={() => void refresh()}>Atualizar avisos</button></div>}
    {shown.map(n => {
      const previous = latestByBooking.get(n.booking)?.id !== n.id;
      return <article key={n.id} className={styles.changeNotice}>
      <h2>{previous ? "Alteração anterior" : n.acknowledged_at ? "Alteração de horário" : "Seu horário mudou"}</h2>
      <p><strong>Antes:</strong> {appointmentDate(n.old_start)} até {time(n.old_end)}</p>
      <p><strong>{previous ? "Alterado para:" : "Agora:"}</strong> {appointmentDate(n.new_start)} até {time(n.new_end)}</p>
      {previous && <p className={styles.muted}>Houve uma nova mudança nesta reserva. Consulte o horário atual em Meus horários.</p>}
      <p className={styles.planNote}>{n.reason}</p>
      <p className={styles.muted}>Alterado por {n.changed_by_name || "studio"}. Horário de Brasília.</p>
      <div className={styles.bookingActions}>{n.acknowledged_at ? <p className={styles.successMini} role="status">Ciência registrada em {appointmentDate(n.acknowledged_at)}.</p> : <button className={styles.cta} disabled={pending !== null} onClick={() => { setHistory(true); void acknowledge(n.id); }}>{pending === n.id ? "Registrando…" : "Estou ciente"}</button>}<Link className={styles.secondary} to="/app?aba=historico">Ver meus horários</Link></div>
      {!n.acknowledged_at && <p className={styles.muted}>“Estou ciente” registra que você viu a mudança. Não confirma pagamento nem comparecimento.</p>}
    </article>; })}
    {notices.length > waiting.length && <button className={styles.textLink} onClick={() => setHistory(v => !v)}>{history ? "Ocultar alterações já vistas" : "Ver alterações já vistas"}</button>}
  </section>;
}
