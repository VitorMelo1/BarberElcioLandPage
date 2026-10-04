import { useState } from "react";
import { useResource } from "../../hooks/useResource";
import { getMyRescheduleSlots, rescheduleMyBooking } from "../../services/schedulingService";
import { appointmentDate, time } from "../../utils/format";
import { DatePicker } from "./DatePicker";
import { MorningContact, isOnlineSlot } from "./MorningContact";
import styles from "./ClientApp.module.css";

export function ReschedulePanel({ bookingId, duration, currentStart, currentEnd, onSaved }: { bookingId: number; duration?: number; currentStart?: string; currentEnd?: string; onSaved: () => void }) {
  const [day, setDay] = useState("");
  const [slot, setSlot] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const slots = useResource(signal => day ? getMyRescheduleSlots(bookingId, day, signal) : Promise.resolve({ date: "", slots: [] as string[] }), [bookingId, day]);
  const onlineSlots = slots.data?.slots.filter(isOnlineSlot) ?? [];
  async function save() {
    if (!slot || saving || !onlineSlots.includes(slot)) return;
    setSaving(true); setError("");
    try { await rescheduleMyBooking(bookingId, slot); onSaved(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível remarcar."); setSlot(""); slots.reload(); }
    finally { setSaving(false); }
  }
  return <fieldset className={styles.reBox} disabled={saving}><legend>Escolha o novo dia e horário</legend>
    {currentStart && currentEnd && <p>Horário atual: {appointmentDate(currentStart)} até {time(currentEnd)}.</p>}
    {duration && <p className={styles.muted}>Serão mantidos os {duration} minutos reservados. Horário de Brasília.</p>}
    <DatePicker id={`reschedule-${bookingId}`} value={day} onChange={date => { setDay(date); setSlot(""); }} />
    <MorningContact subject="meu atendimento" day={day} />
    {(error || slots.error) && <p role="alert" className={styles.error}>{error || slots.error}</p>}
    {slots.error && <button className={styles.secondary} onClick={slots.reload}>Tentar novamente</button>}
    {day && (slots.loading ? <p role="status">Buscando horários…</p> : !slots.error && !onlineSlots.length ? <p>Sem horário online nesse dia. Consulte a manhã pelo WhatsApp ou escolha outra data.</p> : <div className={styles.slots}>{onlineSlots.map(value => <button key={value} className={slot === value ? styles.slotOn : styles.slot} aria-pressed={slot === value} onClick={() => setSlot(value)}>{time(value)}</button>)}</div>)}
    {slot && <><p>Novo horário: <strong>{appointmentDate(slot)}{duration ? ` até ${time(new Date(Date.parse(slot) + duration * 60_000).toISOString())}` : ""}</strong></p><button className={styles.cta} onClick={() => void save()} disabled={saving || slots.loading}>{saving ? "Remarcando…" : "Confirmar novo horário"}</button></>}
  </fieldset>;
}
