import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Check, Clock, Palette, Scissors } from "lucide-react";
import { useResource } from "../../hooks/useResource";
import { getServices, type ApiService } from "../../services/catalogService";
import { createBooking, getSlots, type Booking } from "../../services/schedulingService";
import { appointmentDate, depositAmount, money, time } from "../../utils/format";
import { DatePicker } from "./DatePicker";
import { MorningContact, isOnlineSlot } from "./MorningContact";
import { PaymentPanel } from "./PaymentPanel";
import styles from "./ClientApp.module.css";

export function AgendarView() {
  const catalog = useResource(() => getServices(), []);
  const [params] = useSearchParams();
  const [selected, setSelected] = useState<number[]>([]);
  const [day, setDay] = useState("");
  const [slot, setSlot] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<Booking | null>(null);
  const [paid, setPaid] = useState(false);
  const services = catalog.data?.filter(s => s.active) ?? [];
  const chosen = services.filter(s => selected.includes(s.id));
  const isQuote = chosen.some(s => s.price_type === "quote");
  const total = chosen.reduce((sum, s) => sum + Math.round(Number(s.price) * 100), 0) / 100;
  const duration = chosen.reduce((sum, s) => sum + s.duration_min, 0);
  const selectionKey = chosen.map(s => s.id).join(",");
  const slots = useResource(signal => day && selectionKey ? getSlots(day, chosen.map(s => s.id), signal) : Promise.resolve({ date: "", duration_min: 0, slots: [] as string[], reason: "" }), [day, selectionKey]);
  const onlineSlots = slots.data?.slots.filter(isOnlineSlot) ?? [];
  const repeatServices = params.get("servicos");
  useEffect(() => {
    if (!repeatServices || !catalog.data) return;
    const ids = repeatServices.split(",").map(Number);
    const active = catalog.data.filter(s => s.active && ids.includes(s.id));
    setSelected(active.some(s => s.price_type === "quote") ? active.filter(s => s.price_type === "quote").slice(0, 1).map(s => s.id) : active.map(s => s.id));
    setDone(null); setSlot("");
  }, [repeatServices, catalog.data]);

  function toggle(service: ApiService) {
    setSlot(""); setError("");
    setSelected(previous => {
      if (service.price_type === "quote") return previous.includes(service.id) ? [] : [service.id];
      const fixed = previous.filter(id => services.find(s => s.id === id)?.price_type !== "quote");
      return fixed.includes(service.id) ? fixed.filter(id => id !== service.id) : [...fixed, service.id];
    });
  }
  async function confirm() {
    if (!slot || saving || !onlineSlots.includes(slot)) return;
    setSaving(true); setError("");
    try { setDone(await createBooking(chosen.map(s => s.id), slot, note)); }
    catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível agendar.");
      setSlot(""); slots.reload();
    } finally { setSaving(false); }
  }
  function reset() { setDone(null); setSelected([]); setDay(""); setSlot(""); setNote(""); setError(""); setPaid(false); }
  const onPaid = useCallback(() => setPaid(true), []);

  if (done) return <div className={styles.success} role="status">
    <span className={styles.check}><Check size={30} /></span>
    <h2>{done.status === "quote" ? "Avaliação marcada!" : "Horário reservado"}</h2>
    <p className={styles.successDate}>{appointmentDate(done.start)}</p>
    <p>{chosen.map(s => s.name).join(" + ")}</p>
    <p className={styles.muted}>{done.status === "quote" ? "No encontro, o Elcio avalia seu cabelo e combina o valor e a duração do procedimento com você. Depois, aceite o orçamento e escolha outro horário para realizar a arte." : paid ? "Sinal identificado. Seu horário está confirmado." : `O horário fica reservado por 15 minutos enquanto você paga o sinal de ${money(done.deposit_amount ?? depositAmount(done.total_price))}.`}</p>
    {done.status !== "quote" && !paid && <PaymentPanel bookingId={done.id} holdExpiresAt={done.hold_expires_at ?? undefined} holdExpiresInSeconds={done.hold_expires_in_seconds ?? undefined} onPaid={onPaid} />}
    <div className={styles.bookingActions}>
      <Link className={styles.secondary} to="/app?aba=historico">Ver meus horários</Link>
      <button className={styles.secondary} onClick={reset}>Marcar outro</button>
    </div>
  </div>;

  return <div className={styles.view}>
    <div className={styles.viewHeading}><div><h2>Seu próximo cuidado</h2><p>Escolha os serviços e encontre um horário com o Elcio.</p></div><Scissors aria-hidden size={32} /></div>
    <ol className={styles.progress} aria-label="Etapas do agendamento"><li aria-current={chosen.length ? undefined : "step"}>1. Serviços</li><li aria-current={chosen.length ? "step" : undefined}>2. Dia e hora</li></ol>
    {error && <p className={styles.error} role="alert">{error}</p>}
    {catalog.loading && <p role="status" className={styles.muted}>Carregando serviços…</p>}
    {catalog.error && <div className={styles.error} role="alert"><p>{catalog.error}</p><button className={styles.secondary} onClick={catalog.reload}>Tentar novamente</button></div>}
    {!catalog.loading && !catalog.error && !services.length && <p className={styles.empty}>Ainda não há serviços disponíveis para agendamento.</p>}
    <fieldset className={styles.bookingFields} disabled={saving}>
      <legend className={styles.step}>O que você quer fazer?</legend>
      <div className={styles.svcGridBook}>
        {services.map(service => <button key={service.id} type="button" aria-pressed={selected.includes(service.id)} className={selected.includes(service.id) ? styles.svcCardOn : styles.svcCardBook} onClick={() => toggle(service)}>
          <span className={styles.svcCardIcon}>{service.price_type === "quote" ? <Palette size={21} /> : <Scissors size={21} />}</span>
          <span className={styles.svcCardName}>{service.name}</span>
          <span className={styles.svcDescription}>{service.description}</span>
          <span className={styles.svcCardMeta}><b>{service.price_type === "quote" ? "Sob consulta" : money(service.price)}</b><small>{service.price_type === "quote" ? "Avaliação: " : ""}{service.duration_min} min</small></span>
          {selected.includes(service.id) && <span className={styles.svcCheck}><Check size={14} /></span>}
        </button>)}
      </div>
      {chosen.length > 0 && <>
        {isQuote && <p className={styles.quoteNote}><Palette size={20} /> Você está marcando uma avaliação, separada do procedimento. O valor e a duração da arte serão combinados depois.</p>}
        {!isQuote && <p className={styles.selectionTotal}><strong>Total: {money(total)}</strong><span>Sinal de 50%: {money(depositAmount(total))}</span><small>Serviços com preço definido ficam retidos por 15 minutos e só são confirmados após o sinal.</small></p>}
        <h3 className={styles.step}>Escolha o dia</h3>
        <DatePicker value={day} onChange={value => { setDay(value); setSlot(""); }} />
        <MorningContact subject={chosen.map(s => s.name).join(" + ")} day={day} />
        {day && <><h3 className={styles.step}>Escolha o horário <small>Horário de Brasília</small></h3>
          {slots.loading ? <p className={styles.muted} role="status">Buscando horários…</p> : slots.error ? <div className={styles.error} role="alert"><p>{slots.error}</p><button type="button" className={styles.secondary} onClick={slots.reload}>Tentar novamente</button></div> : !onlineSlots.length ? <p className={styles.empty}>{slots.data?.reason || "Sem horário online nesse dia. Você pode consultar a manhã pelo WhatsApp ou escolher outra data."}</p> : <div className={styles.slots}>{onlineSlots.map(value => <button type="button" key={value} aria-pressed={slot === value} className={slot === value ? styles.slotOn : styles.slot} onClick={() => setSlot(value)}>{time(value)}</button>)}</div>}
        </>}
        {slot && <div className={styles.bookingDetails}>
          <p><strong>{chosen.map(s => s.name).join(" + ")}</strong></p><p><Clock size={16} /> {appointmentDate(slot)} • {isQuote ? "Duração da avaliação: " : ""}{duration} min</p>
          <label htmlFor="booking-note">Observações (opcional)</label><textarea id="booking-note" className={styles.noteField} value={note} onChange={e => setNote(e.target.value)} rows={2} maxLength={2000} placeholder={isQuote ? "Conte qual cor ou resultado você procura" : "Alguma preferência para o atendimento?"} />
          <p className={styles.muted}>Você pode cancelar ou remarcar com pelo menos 24 horas de antecedência.</p>
        </div>}
      </>}
    </fieldset>
    {slot && <div className={styles.bottomBar}><div className={styles.total}>{isQuote ? <><span>Avaliação</span><b>Valor sob consulta</b></> : <><span>Total {money(total)}</span><b>Sinal: {money(depositAmount(total))}</b><small>O PIX abre logo após reservar.</small></>}</div><button className={styles.cta} disabled={saving || slots.loading || !onlineSlots.includes(slot)} onClick={() => void confirm()}>{saving ? "Reservando…" : isQuote ? "Agendar avaliação" : "Reservar e gerar PIX"}</button></div>}
  </div>;
}
