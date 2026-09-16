import { useEffect, useRef, useState } from "react";
import { Check, Copy, RefreshCw } from "lucide-react";
import { useResource } from "../../hooks/useResource";
import { getBookingPaymentStatus, getBookingPix, type PaymentStatus } from "../../services/financeService";
import { ApiError } from "../../services/api";
import { money } from "../../utils/format";
import styles from "./ClientApp.module.css";

const INVALID_PAYMENTS = ["cancelled", "rejected", "refunded", "charged_back"];
const TERMINAL_BOOKINGS = ["cancelled", "completed", "noshow"];
function needsContact(status: PaymentStatus) {
  return Boolean(status.requires_review || TERMINAL_BOOKINGS.includes(status.status) || INVALID_PAYMENTS.includes(status.payment_status || ""));
}
function isExpiredHoldError(cause: unknown) {
  return cause instanceof ApiError && cause.status === 400 && cause.fields.code === "booking_hold_expired";
}
async function loadPayment(bookingId: number, signal: AbortSignal) {
  try { return await getBookingPix(bookingId, signal); }
  catch (cause) {
    // An expired attempt must be reconciled before the backend allows another emission.
    if (!(cause instanceof ApiError) || cause.status !== 400) throw cause;
    if (isExpiredHoldError(cause)) throw cause;
    const status = await getBookingPaymentStatus(bookingId, signal);
    if (status.deposit_paid || needsContact(status)) return { ...status, brcode: "", amount: "0", requires_review: needsContact(status) };
    if (status.payment_status === "expired") return getBookingPix(bookingId, signal);
    throw cause;
  }
}

export function PaymentPanel({ bookingId, holdExpiresAt, holdExpiresInSeconds, onPaid, onExpired }: { bookingId: number; holdExpiresAt?: string; holdExpiresInSeconds?: number; onPaid: () => void; onExpired?: () => void }) {
  const [now, setNow] = useState(Date.now);
  const holdSeconds = typeof holdExpiresInSeconds === "number" ? Math.max(0, holdExpiresInSeconds) : null;
  const holdRefreshPending = holdSeconds === 0;
  const [holdRejected, setHoldRejected] = useState(false);
  const payment = useResource(async signal => {
    if (holdRefreshPending) return null;
    try { return await loadPayment(bookingId, signal); }
    catch (cause) {
      if (isExpiredHoldError(cause)) { setHoldRejected(true); onExpired?.(); return null; }
      throw cause;
    }
  }, [bookingId, holdExpiresAt, holdSeconds, holdRefreshPending, onExpired]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [paid, setPaid] = useState(false);
  const [checking, setChecking] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [checkRevision, setCheckRevision] = useState(0);
  const [latest, setLatest] = useState<PaymentStatus | null>(null);
  const renewal = useRef<AbortController | null>(null);
  const pix = payment.data;
  const blocked = Boolean(pix?.requires_review || INVALID_PAYMENTS.includes(pix?.payment_status || "") || latest && needsContact(latest));
  const expiresAt = latest?.expires_at ?? pix?.expires_at;
  const expired = latest?.payment_status === "expired" || (holdSeconds === null && Boolean(expiresAt && Date.parse(expiresAt) <= now));
  useEffect(() => {
    if (holdSeconds !== null) {
      const timer = setTimeout(() => onExpired?.(), Math.min(holdSeconds * 1_000, 2_147_483_647));
      const refresh = () => onExpired?.();
      document.addEventListener("visibilitychange", refresh);
      return () => { clearTimeout(timer); document.removeEventListener("visibilitychange", refresh); };
    }
    const update = () => setNow(Date.now());
    update();
    const remaining = expiresAt ? Date.parse(expiresAt) - Date.now() : NaN;
    const timer = Number.isFinite(remaining) && remaining >= 0 ? setTimeout(update, Math.min(remaining + 1, 2_147_483_647)) : undefined;
    document.addEventListener("visibilitychange", update);
    return () => { clearTimeout(timer); document.removeEventListener("visibilitychange", update); };
  }, [expiresAt, holdSeconds, onExpired]);
  useEffect(() => () => renewal.current?.abort(), [bookingId]);
  useEffect(() => {
    if (!payment.data?.auto || payment.data.deposit_paid || paid || blocked || expired) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let attempts = 0;
    async function check() {
      if (controller.signal.aborted) return;
      if (document.visibilityState === "hidden") { timer = setTimeout(check, 10_000); return; }
      setChecking(true);
      try {
        const result = await getBookingPaymentStatus(bookingId, controller.signal);
        if (controller.signal.aborted) return;
        setLatest(result);
        setError("");
        if (needsContact(result)) { setStopped(true); return; }
        if (result.deposit_paid) { setPaid(true); onPaid(); return; }
        if (result.payment_status === "expired") { setStopped(true); return; }
        if (++attempts >= 30) { setStopped(true); return; }
        timer = setTimeout(check, 10_000);
      } catch (cause) {
        if (!controller.signal.aborted) { setError(cause instanceof Error ? cause.message : "Não foi possível conferir o pagamento."); setStopped(true); }
      } finally { if (!controller.signal.aborted) setChecking(false); }
    }
    setStopped(false);
    timer = setTimeout(check, checkRevision ? 0 : 10_000);
    return () => { controller.abort(); clearTimeout(timer); setChecking(false); };
  }, [bookingId, payment.data, checkRevision, onPaid, blocked, expired, paid]);
  async function renew() {
    if (checking || renewal.current || holdRefreshPending) return;
    const controller = new AbortController();
    renewal.current = controller;
    setChecking(true); setError("");
    try {
      const result = await getBookingPaymentStatus(bookingId, controller.signal);
      if (controller.signal.aborted) return;
      setLatest(result);
      if (needsContact(result)) return;
      if (result.deposit_paid) { setPaid(true); onPaid(); return; }
      if (result.payment_status !== "expired") {
        setError("A cobrança anterior ainda está em conferência. Aguarde e consulte novamente antes de pagar."); return;
      }
      setCopied(false); setLatest(null); payment.reload();
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Não foi possível consultar a cobrança.");
    } finally {
      renewal.current = null;
      if (!controller.signal.aborted) setChecking(false);
    }
  }
  async function copy() {
    if (blocked || expired || !pix?.brcode || holdSeconds === null && expiresAt && Date.parse(expiresAt) <= Date.now()) { setNow(Date.now()); return; }
    try { await navigator.clipboard.writeText(payment.data?.brcode || ""); setCopied(true); }
    catch { setError("Selecione o código abaixo e copie manualmente."); }
  }
  return <div className={styles.pixBox} aria-label="Pagamento do sinal">
    {holdExpiresAt && <p className={styles.muted}>Retenção do horário até {new Date(holdExpiresAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}.</p>}
    {(holdRefreshPending || holdRejected) ? <p role="status">A retenção deste horário venceu. A vaga será liberada após a atualização da reserva.</p> : payment.loading && <p role="status">Preparando seu pagamento…</p>}
    {(payment.error || error) && <p className={styles.error} role="alert">{payment.error || error}</p>}
    {payment.error && <><button className={styles.secondary} onClick={payment.reload}>Tentar novamente</button><a className={styles.textLink} href="https://wa.me/5562993397680" target="_blank" rel="noreferrer">Falar com o studio</a></>}
    {!holdRefreshPending && !holdRejected && pix && !blocked && (paid || pix.deposit_paid) ? <p className={styles.successMini} role="status"><Check size={20} /> Sinal recebido. Confira o estado atualizado do seu horário.</p> : !holdRefreshPending && !holdRejected && pix && <>
      {blocked ? <p role="status">A cobrança precisa ser conferida com o studio. Evite pagar novamente.</p> : pix.configured === false || !pix.brcode ? <p>O pagamento online ainda não está disponível. Fale com o studio para combinar o sinal.</p> : expired ? <><p>Este código expirou. Consulte o estado do pagamento antes de emitir outro.</p><button className={styles.secondary} disabled={checking} onClick={() => void renew()}>{checking ? "Consultando…" : "Consultar nova cobrança"}</button></> : <>
        <h3>Sinal de {money(pix.amount)}</h3><p>Copie o código e pague pelo aplicativo do seu banco.</p>
        {pix.qr_code_base64 && <img className={styles.pixQr} src={`data:image/png;base64,${pix.qr_code_base64}`} alt="QR code do PIX deste agendamento" />}
        <code className={styles.pixCode}>{pix.brcode}</code>
        <button className={styles.cta} onClick={() => void copy()}>{copied ? <Check size={18} /> : <Copy size={18} />}{copied ? "Copiado!" : "Copiar código PIX"}</button>
        <p className={styles.muted}>{pix.auto ? "A confirmação aparece aqui após a identificação do pagamento." : `Recebedor: ${pix.holder || "Studio do Bruxo"}. O studio confere o comprovante antes de confirmar o sinal.`}</p>
        {pix.expires_at && <p className={styles.muted}>Validade do código: {new Date(pix.expires_at).toLocaleString("pt-BR")}</p>}
        {pix.auto && <button className={styles.secondary} disabled={checking} onClick={() => setCheckRevision(v => v + 1)}><RefreshCw size={16} />{checking ? "Conferindo…" : stopped ? "Consultar pagamento novamente" : "Já paguei, consultar"}</button>}
      </>}
      <a className={styles.textLink} href="https://wa.me/5562993397680" target="_blank" rel="noreferrer">Falar com o studio</a>
    </>}
  </div>;
}
