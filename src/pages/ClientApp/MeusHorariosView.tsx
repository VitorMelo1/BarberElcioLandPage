import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CalendarPlus, QrCode, RotateCcw, X } from "lucide-react";
import { useResource } from "../../hooks/useResource";
import { cancelMyBooking, getMyBookings, type Booking } from "../../services/schedulingService";
import { appointmentDate, money, time } from "../../utils/format";
import { ProposalPanel } from "./ProposalPanel";
import { PaymentPanel } from "./PaymentPanel";
import { ReschedulePanel } from "./ReschedulePanel";
import styles from "./ClientApp.module.css";

const STATUS: Record<string, string> = { quote: "Avaliação marcada", pending: "Aguardando confirmação", confirmed: "Confirmado", completed: "Concluído", cancelled: "Cancelado", noshow: "Não compareceu" };
const ACTIVE = ["quote", "pending", "confirmed"];

function serverDeadline(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function BookingCard({ booking: b, initiallyPay, onChanged }: { booking: Booking; initiallyPay: boolean; onChanged: (message?: string) => void }) {
  const [panel, setPanel] = useState<"payment" | "reschedule" | "cancel" | null>(initiallyPay && ["pending", "confirmed"].includes(b.status) && !b.deposit_paid ? "payment" : null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const active = ACTIVE.includes(b.status);
  const consultation = b.kind === "consultation" || b.status === "quote";
  const duration = b.duration_min ?? Math.round((Date.parse(b.end) - Date.parse(b.start)) / 60_000);
  const canChange = active && Boolean(b.can_client_change);
  const names = (b.services_snapshot?.length ? b.services_snapshot : b.services || []).map(s => s.name).join(" + ") || "Atendimento";
  const holdSeconds = typeof b.hold_expires_in_seconds === "number" ? Math.max(0, b.hold_expires_in_seconds) : null;
  const pendingHold = !consultation && b.status === "pending" && !b.deposit_paid && holdSeconds !== null;
  useEffect(() => {
    if (!pendingHold) return;
    const refresh = () => onChanged();
    const timer = setTimeout(refresh, Math.min(holdSeconds! * 1_000, 2_147_483_647));
    document.addEventListener("visibilitychange", refresh);
    return () => { clearTimeout(timer); document.removeEventListener("visibilitychange", refresh); };
  }, [holdSeconds, onChanged, pendingHold]);
  const toggle = (next: typeof panel) => { setPanel(panel === next ? null : next); setError(""); };
  async function cancel() {
    if (saving) return;
    setSaving(true); setError("");
    try { await cancelMyBooking(b.id, "Cancelado pelo cliente"); onChanged(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível cancelar."); }
    finally { setSaving(false); }
  }
  return <article className={styles.bookingWrap}>
    <div className={styles.booking}><div className={styles.bookingInfo}><h3>{appointmentDate(b.start)} até {time(b.end)}</h3><p>{names}</p><p className={styles.muted}>{consultation ? "Duração da avaliação" : "Tempo reservado"}: {duration} min{b.source_consultation ? " · Procedimento após avaliação" : ""}</p><p className={styles.muted}>{consultation ? "Avaliação · procedimento orçado separadamente" : money(b.total_price)}{b.deposit_paid ? " • Sinal recebido" : ""}</p></div><span className={styles.badge} data-status={b.status}>{consultation && b.status === "completed" ? "Avaliação concluída" : STATUS[b.status] || "Em atualização"}</span></div>
    {b.notes && <p className={styles.planNote}><strong>Observações:</strong> {b.notes}</p>}
    {b.agreed_duration_min != null && b.agreed_duration_min !== duration && <p className={styles.planNote}>Tempo acordado no orçamento: {b.agreed_duration_min} min. A reserva atual foi ajustada para {duration} min.</p>}
    {b.status === "quote" && <p className={styles.quoteWait}>O valor e o plano do procedimento serão combinados na avaliação.</p>}
    {pendingHold && b.hold_expires_at && <p className={styles.muted}>Pague o sinal até {serverDeadline(b.hold_expires_at)}.</p>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <div className={styles.bookingActions}>
      {!consultation && ["pending", "confirmed"].includes(b.status) && !b.deposit_paid && <button className={styles.cta} aria-expanded={panel === "payment"} onClick={() => toggle("payment")}><QrCode size={17} />Pagar sinal</button>}
      {canChange && <><button className={styles.secondary} aria-expanded={panel === "reschedule"} onClick={() => toggle("reschedule")}><RotateCcw size={16} />Reagendar</button><button className={styles.cancelBtn} disabled={saving} aria-expanded={panel === "cancel"} onClick={() => toggle("cancel")}><X size={16} />Cancelar</button></>}
      {!active && Boolean(b.services?.length) && <Link className={styles.secondary} to={`/app?servicos=${b.services?.map(s => s.id).join(",")}`}><CalendarPlus size={16} />Agendar novamente</Link>}
    </div>
    {active && !canChange && <p className={styles.muted}>Para alterações com menos de 24 horas, <a className={styles.textLink} href="https://wa.me/5562993397680" target="_blank" rel="noreferrer">fale com o studio</a>.</p>}
    {panel === "cancel" && <div className={styles.confirmBox} role="group" aria-label="Confirmar cancelamento"><h4>Cancelar este agendamento?</h4><p>O horário ficará disponível para outra pessoa.{b.deposit_paid ? " Combine com o studio como será tratado o sinal já pago." : ""}</p><div className={styles.bookingActions}><button className={styles.danger} disabled={saving} onClick={() => void cancel()}>{saving ? "Cancelando…" : "Confirmar cancelamento"}</button><button className={styles.secondary} disabled={saving} onClick={() => setPanel(null)}>Manter horário</button></div></div>}
    {panel === "reschedule" && <ReschedulePanel bookingId={b.id} duration={duration} currentStart={b.start} currentEnd={b.end} onSaved={onChanged} />}
    {panel === "payment" && <PaymentPanel bookingId={b.id} holdExpiresAt={b.hold_expires_at ?? undefined} holdExpiresInSeconds={holdSeconds ?? undefined} onPaid={onChanged} onExpired={() => onChanged("A retenção do sinal venceu; o horário foi liberado.")} />}
    {b.proposals?.[0] && <ProposalPanel key={`${b.proposals[0].id}-${b.proposals[0].version}`} proposal={b.proposals[0]} consultationStatus={b.status} onChanged={onChanged} />}
    {b.proposals && b.proposals.length > 1 && <details><summary>Orçamentos anteriores</summary>{b.proposals.slice(1).map(p => <ProposalPanel key={p.id} proposal={p} consultationStatus={b.status} onChanged={onChanged} />)}</details>}
  </article>;
}

export function MeusHorariosView() {
  const bookings = useResource(signal => getMyBookings(signal), []);
  const [params, setParams] = useSearchParams();
  const [paymentTarget, setPaymentTarget] = useState(params.get("pagamento"));
  useEffect(() => {
    if (!bookings.data || !paymentTarget) return;
    setPaymentTarget(null);
    setParams(previous => { const next = new URLSearchParams(previous); next.delete("pagamento"); return next; }, { replace: true });
  }, [bookings.data, paymentTarget, setParams]);
  const [message, setMessage] = useState("");
  const changed = useCallback((message = "Agendamento atualizado.") => { setMessage(message); bookings.reload(); }, [bookings.reload]);
  const items = [...(bookings.data || [])].sort((a, b) => {
    const aActive = ACTIVE.includes(a.status), bActive = ACTIVE.includes(b.status);
    if (aActive !== bActive) return aActive ? -1 : 1;
    return aActive ? Date.parse(a.start) - Date.parse(b.start) : Date.parse(b.start) - Date.parse(a.start);
  });
  return <div className={styles.view}>
    <div className={styles.viewHeading}><div><h2>Seus horários</h2><p>Acompanhe o próximo encontro e os atendimentos anteriores.</p></div></div>
    {message && <p role="status" className={styles.successMini}>{message}</p>}
    {bookings.loading ? <p role="status" className={styles.muted}>Carregando agendamentos…</p> : bookings.error ? <div role="alert" className={styles.error}><p>{bookings.error}</p><button className={styles.secondary} onClick={bookings.reload}>Tentar novamente</button></div> : !items.length ? <div className={styles.empty}><CalendarPlus size={32} /><h3>Você ainda não tem agendamentos.</h3><p>Escolha um serviço e encontre um horário para você.</p><Link className={styles.cta} to="/app">Agendar meu horário</Link></div> : <div className={styles.list}>{items.map(booking => <BookingCard key={booking.id} booking={booking} initiallyPay={paymentTarget === String(booking.id)} onChanged={changed} />)}</div>}
  </div>;
}
