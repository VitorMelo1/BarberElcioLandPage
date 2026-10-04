import { useEffect, useRef, useState } from 'react';
import { Check, RotateCcw, XCircle } from 'lucide-react';
import type { Booking } from '../../services/schedulingService';
import { ApiError } from '../../services/api';
import { acceptBarberProposal, cancelBarberBooking, completeBarberBooking, confirmBarberBooking, markBarberNoShow, confirmBarberDeposit, quoteBarberBooking, getBarberRescheduleSlots, rescheduleBarberBooking, getBarberBookings } from '../../services/barberService';
import { appointmentDate } from '../../utils/format';
import { localDate, timeLabel, money, statusLabel } from './formatters';
import styles from './BarberApp.module.css';

type BarberBooking = Booking & {deposit_amount?:string};
export function BookingCard({booking:b, onChanged}: {booking:BarberBooking; onChanged:()=>void}) {
  const [action,setAction] = useState<'cancel'|'absence'|'move'|'quote'|'deposit'|'accept'|null>(null);
  const [pending,setPending] = useState(false);
  const [error,setError] = useState('');
  const [reason,setReason] = useState('');
  const [price,setPrice] = useState('');
  const [notes,setNotes] = useState('');
  const [procedureDuration,setProcedureDuration] = useState('');
  const [expiry,setExpiry] = useState('');
  const [procedureDate,setProcedureDate] = useState('');
  const [procedureTime,setProcedureTime] = useState('');
  const [consentNote,setConsentNote] = useState('');
  const bookedDuration = b.duration_min ?? Math.round((Date.parse(b.end) - Date.parse(b.start)) / 60_000);
  const [duration,setDuration] = useState(String(bookedDuration));
  const [date,setDate] = useState(localDate(new Date(b.start)) < localDate() ? localDate() : localDate(new Date(b.start)));
  const [slots,setSlots] = useState<string[]>([]);
  const [slot,setSlot] = useState('');
  const [slotLoading,setSlotLoading] = useState(false);
  const [slotError,setSlotError] = useState('');
  const [retry,setRetry] = useState(0);
  const [conflicts,setConflicts] = useState<{booking:number;client_name:string;start:string;end:string}[]>([]);
  const [dayBookings,setDayBookings] = useState<Booking[]>([]);
  const [dayError,setDayError] = useState('');
  const saving = useRef(false);
  const consultation = b.kind === 'consultation' || b.status === 'quote';
  const proposal = b.proposals?.[0];
  const paidMecha = b.kind === 'procedure' && b.status === 'completed' && b.deposit_paid === true && b.services?.length === 1 && b.services[0].slug === 'teste-de-mecha';
  const canQuote = (consultation && ['quote','completed'].includes(b.status) || paidMecha) && !b.proposals?.some(p=>p.status==='accepted');
  const canAccept = canQuote && proposal?.status === 'sent' && Date.parse(proposal.expires_at) > Date.now();
  const terminal = ['completed','cancelled','noshow','no_show'].includes(b.status);
  const now = Date.now();
  const canComplete = (b.status === 'confirmed' || (consultation && b.status === 'quote')) && new Date(b.start).getTime() <= now;
  const canNoShow = (b.status === 'confirmed' || (consultation && b.status === 'quote')) && new Date(b.end).getTime() <= now;
  const canDeposit = !consultation && ['pending','confirmed'].includes(b.status) && b.deposit_paid === false && new Date(b.start).getTime() > now;
  const canConfirm = ['pending','scheduled'].includes(b.status) && (consultation || b.deposit_paid === true);
  const expectedDeposit = b.deposit_amount ?? (Math.round(Number(b.total_price) * 100 / 2) / 100).toFixed(2);
  const services = b.services_snapshot?.length ? b.services_snapshot : b.services;
  useEffect(() => {
    if(action !== 'move' || !date || !Number.isInteger(Number(duration)) || Number(duration) < 5 || Number(duration) > 480) { setSlots([]); setSlot(''); return; }
    let active = true; setSlot(''); setSlots([]); setSlotLoading(true); setSlotError('');
    getBarberRescheduleSlots(b.id,date,Number(duration)).then(data => {if(active) setSlots(data.slots);})
      .catch(err => {if(active) setSlotError(err instanceof Error ? err.message : 'Falha ao buscar horários.');})
      .finally(() => {if(active) setSlotLoading(false);});
    return () => {active = false;};
  }, [action,date,duration,b.id,retry]);
  useEffect(() => {
    if(action !== 'move' || !date) return;
    let active = true; setDayBookings([]); setDayError('');
    getBarberBookings(date).then(items => { if(active) setDayBookings(Array.isArray(items) ? items : []); })
      .catch(() => { if(active) setDayError('Não foi possível consultar os outros atendimentos. Atualize os horários antes de salvar.'); });
    return () => { active = false; };
  }, [action,date,retry]);
  async function run(operation:()=>Promise<unknown>) {
    if(saving.current) return;
    saving.current=true; setPending(true); setError(''); setConflicts([]);
    try { await operation(); setAction(null); onChanged(); }
    catch(err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar. Tente novamente.');
      if(err instanceof ApiError && Array.isArray(err.fields.conflicts)) setConflicts(err.fields.conflicts as typeof conflicts);
      if(action === 'move') { setSlot(''); setRetry(v=>v+1); }
    }
    finally {saving.current=false; setPending(false);}
  }
  const pendingStart = slot ? Date.parse(slot) : NaN;
  const pendingEnd = pendingStart + Number(duration) * 60_000;
  const visibleConflicts = dayBookings.filter(item => item.id !== b.id && ['quote','pending','confirmed','scheduled'].includes(item.status) && Date.parse(item.start) < pendingEnd && Date.parse(item.end) > pendingStart);
  const latest = b.latest_change;
  const phoneDigits = (b.client_phone || '').replace(/\D/g, '');
  const whatsappPhone = /^\d{10,11}$/.test(phoneDigits) ? `55${phoneDigits}` : /^55\d{10,11}$/.test(phoneDigits) ? phoneDigits : '';
  const whatsappMessage = latest ? `Olá, ${b.client_username || 'cliente'}! Seu horário no Studio do Bruxo mudou. Antes: ${appointmentDate(latest.old_start)} até ${timeLabel(latest.old_end)}. Agora: ${appointmentDate(latest.new_start)} até ${timeLabel(latest.new_end)} (horário de Brasília). Motivo: ${latest.reason}. Confira seus horários em ${window.location.origin}/app?aba=historico e toque em “Estou ciente” após ver a alteração.` : '';
  const reminderMessage = `Olá, ${b.client_username || 'cliente'}! Passando para lembrar da sua ${consultation ? 'avaliação' : 'reserva'} no Studio do Bruxo em ${appointmentDate(b.start)} (horário de Brasília). Até lá!`;
  function prepareProposal() { setPrice(proposal?.price || ''); setProcedureDuration(proposal ? String(proposal.duration_min) : ''); setNotes(proposal?.notes || ''); setExpiry(''); setAction('quote'); setError(''); }
  return <article className={b.status === 'quote' ? styles.bookingCardQuote : styles.bookingCard} aria-busy={pending}>
    <div className={styles.bookingTime}><strong>{timeLabel(b.start)}</strong><span>até {timeLabel(b.end)}</span></div>
    <div className={styles.bookingInfo}>
      <h3>{b.client_username || 'Cliente'}</h3>
      <p className={styles.svcLine}>{services?.map(s=>s.name).join(' + ') || 'Serviço não informado'}</p>
      <p>{consultation ? 'Duração da avaliação' : 'Tempo reservado'}: {bookedDuration} min{b.source_consultation ? ' · Procedimento após avaliação' : ''}</p>
      {b.agreed_duration_min != null && b.agreed_duration_min !== bookedDuration && <p className={styles.wantNote}>Tempo acordado no orçamento: {b.agreed_duration_min} min. Reserva atual: {bookedDuration} min.</p>}
      {b.client_phone && <a href={`tel:${b.client_phone.replace(/[^+\d]/g,'')}`}>{b.client_phone}</a>}
      <div className={styles.bookingMeta}><span className={styles.pillLive}>{consultation && b.status === 'completed' ? 'Avaliação concluída' : statusLabel[b.status] || b.status}</span><strong>{consultation ? 'Procedimento orçado separadamente' : money(b.total_price)}</strong></div>
      {b.notes && <p className={styles.wantNote}>{b.notes}</p>}
      {b.cancel_reason && <p>Motivo: {b.cancel_reason}</p>}
      {typeof b.deposit_paid === 'boolean' && !consultation && <p>{b.deposit_paid ? `Sinal recebido: ${money(expectedDeposit)}` : `Sinal a conferir: ${money(expectedDeposit)}`}{b.deposit_paid && ` · Restante: ${money(Number(b.total_price) - Number(expectedDeposit))}`}</p>}
    </div>
    {latest && <div className={styles.rescheduleNotice}>
      <strong>{latest.acknowledged_at ? `Cliente ciente desde ${appointmentDate(latest.acknowledged_at)}` : 'Aguardando ciência do cliente'}</strong>
      <p>Antes: {appointmentDate(latest.old_start)} até {timeLabel(latest.old_end)}</p><p>Agora: {appointmentDate(latest.new_start)} até {timeLabel(latest.new_end)}</p><p>Motivo: {latest.reason}</p>
      {whatsappPhone ? <><a className={styles.btnGhost} href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappMessage)}`} target="_blank" rel="noreferrer">Abrir aviso no WhatsApp</a><small>A mensagem precisa ser enviada por você no WhatsApp. Abrir o aviso não comprova envio ou leitura.</small></> : <p>Cliente sem WhatsApp válido no cadastro. Combine a mudança por outro contato.</p>}
    </div>}
    {proposal && <div className={styles.proposalSummary}><strong>Orçamento v{proposal.version}: {money(proposal.price)} · {proposal.duration_min} min</strong><p>{({sent:'Aguardando aceite e escolha de horário pelo cliente',accepted:'Aceito · procedimento reservado separadamente',declined:'Cliente recusou o orçamento',expired:'Orçamento vencido',superseded:'Versão anterior'})[proposal.status]}</p><p>Validade: {appointmentDate(proposal.expires_at)}</p>{proposal.notes && <p>{proposal.notes}</p>}{proposal.consent_note && <p>Acordo registrado: {proposal.consent_note}</p>}</div>}
    {canQuote && <div className={styles.bookingActions}><button className={styles.btnSmall} disabled={pending} onClick={prepareProposal}>{proposal ? 'Revisar orçamento' : 'Preparar orçamento'}</button></div>}
    {canAccept && <div className={styles.bookingActions}><button className={styles.btnGhost} disabled={pending} onClick={()=>{setAction('accept');setError('');setConsentNote('');setProcedureDate('');setProcedureTime('');}}>Registrar aceite combinado</button></div>}
    {!terminal && <div className={styles.bookingActions}>
      {canConfirm && <button className={styles.btnSmall} disabled={pending} onClick={()=>void run(()=>confirmBarberBooking(b.id))}>Confirmar horário</button>}
      {canComplete && <button className={styles.btnSmall} disabled={pending} onClick={()=>void run(()=>completeBarberBooking(b.id))}><Check size={16}/> {consultation ? 'Avaliação realizada' : 'Finalizar'}</button>}
      <button className={styles.btnGhost} disabled={pending} onClick={()=>{setAction(action==='move'?null:'move');setReason('');setDuration(String(bookedDuration));setConflicts([]);setError('');}} aria-expanded={action==='move'}><RotateCcw size={16}/> Reagendar</button>
      {canDeposit && <button className={styles.btnGhost} disabled={pending} onClick={()=>setAction('deposit')}>Registrar sinal</button>}
      {canNoShow && <button className={styles.btnGhost} disabled={pending} onClick={()=>setAction('absence')}>Registrar falta</button>}
      <button className={styles.btnDanger} disabled={pending} onClick={()=>{setReason('');setAction('cancel');}}><XCircle size={16}/> Cancelar</button>
    </div>}
    {!terminal && ['quote','scheduled','confirmed'].includes(b.status) && new Date(b.start).getTime() > now && whatsappPhone && <div className={styles.reminderContact}><a className={styles.btnGhost} href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(reminderMessage)}`} target="_blank" rel="noreferrer">Preparar lembrete no WhatsApp</a><small>Envie você mesmo cerca de 1 hora antes. Abrir a mensagem não a envia automaticamente.</small></div>}
    {canConfirm && <p className={styles.actionHint}>Confirmar horário aprova a reserva elegível. Procedimentos exigem sinal registrado.</p>}
    {error && <div className={styles.toastErr} role="alert"><p>{error}</p>{conflicts.length > 0 && <><strong>Atendimentos no intervalo solicitado:</strong><ul>{conflicts.map(c=><li key={c.booking}>{c.client_name}: {appointmentDate(c.start)} até {timeLabel(c.end)}</li>)}</ul><p>Escolha outro início ou ajuste a duração. A reserva anterior foi mantida.</p></>}</div>}
    {action === 'cancel' && <form className={styles.inlineAction} onSubmit={e=>{e.preventDefault();void run(()=>cancelBarberBooking(b.id,reason));}}>
      <h4>Cancelar o horário de {b.client_username || 'cliente'} às {timeLabel(b.start)}?</h4>
      <p>A reserva será encerrada e o horário ficará disponível.</p>
      <label className={styles.fieldLabel}>Motivo do cancelamento (opcional)<input value={reason} onChange={e=>setReason(e.target.value)} maxLength={500}/></label>
      <div className={styles.pairActions}><button disabled={pending} className={styles.btnDanger}>{pending?'Salvando…':'Confirmar cancelamento'}</button><button type="button" disabled={pending} className={styles.btnGhost} onClick={()=>setAction(null)}>Manter reserva</button></div>
    </form>}
    {action === 'absence' && <div className={styles.inlineAction} role="group" aria-label="Confirmar falta"><h4>{b.client_username || 'Cliente'} não compareceu?</h4><p>O registro ficará no histórico desta {consultation ? 'avaliação' : 'reserva'}.</p><div className={styles.pairActions}><button className={styles.btnDanger} disabled={pending} onClick={()=>void run(()=>markBarberNoShow(b.id))}>{pending ? 'Registrando…' : 'Confirmar falta'}</button><button className={styles.btnGhost} disabled={pending} onClick={()=>setAction(null)}>Voltar</button></div></div>}
    {action === 'move' && <form className={styles.inlineAction} onSubmit={e=>{e.preventDefault();if(slot && reason.trim() && !visibleConflicts.length && Number(duration) >= 5 && Number(duration) <= 480) void run(()=>rescheduleBarberBooking(b.id,slot,reason,Number(duration)));}}>
      <h4>Reagendar {b.client_username || 'cliente'}</h4>
      <p>Atual: {appointmentDate(b.start)} até {timeLabel(b.end)} · {bookedDuration} minutos. A agenda precisa comportar o período completo.</p>
      <label className={styles.fieldLabel}>Tempo reservado (minutos)<input type="number" required min="5" max="480" step="1" value={duration} onChange={e=>{setDuration(e.target.value);setSlot('');}} disabled={pending}/></label>
      <label className={styles.fieldLabel}>Nova data<input type="date" required min={localDate()} value={date} onChange={e=>{setDate(e.target.value);setSlot('');}} disabled={pending}/></label>
      {slotLoading ? <p role="status">Buscando horários…</p> : slotError ? <p role="alert">{slotError}<button type="button" className={styles.btnGhost} onClick={()=>setRetry(v=>v+1)}>Tentar novamente</button></p> : slots.length ? <div className={styles.reSlots} role="group" aria-label="Horários disponíveis">{slots.map(value=><button type="button" key={value} className={slot===value?styles.reSlotOn:styles.reSlotChip} aria-pressed={slot===value} onClick={()=>setSlot(value)} disabled={pending}>{timeLabel(value)}</button>)}</div> : <p>Nenhum horário disponível nesta data. Escolha outro dia.</p>}
      <label className={styles.fieldLabel}>Ou informe o início desejado<input type="time" value={slot ? timeLabel(slot) : ''} disabled={pending} onChange={e=>setSlot(e.target.value ? `${date}T${e.target.value}:00-03:00` : '')}/></label>
      {slot && <p>Novo intervalo: <strong>{appointmentDate(slot)} até {timeLabel(new Date(pendingEnd).toISOString())}</strong> · {duration} min (Brasília)</p>}
      {dayError && <p role="alert">{dayError}</p>}
      {visibleConflicts.length > 0 && <div className={styles.toastErr} role="alert"><strong>Este período encontra outros atendimentos:</strong><ul>{visibleConflicts.map(c=><li key={c.id}>{c.client_username || 'Cliente'}: {timeLabel(c.start)} até {timeLabel(c.end)}</li>)}</ul><p>Escolha outro início ou ajuste a duração antes de salvar.</p></div>}
      <label className={styles.fieldLabel}>Motivo da alteração<input required value={reason} onChange={e=>setReason(e.target.value)} maxLength={240} disabled={pending} placeholder="Explique a mudança para o cliente"/></label>
      <p className={styles.actionHint}>O cliente verá o horário anterior, o novo intervalo e o motivo. A ciência ficará pendente até ele tocar em “Estou ciente”.</p>
      <div className={styles.pairActions}><button disabled={pending||slotLoading||!slot||!!slotError||!reason.trim()||visibleConflicts.length>0||!!dayError} className={styles.btn}>{pending?'Salvando…':'Confirmar novo horário'}</button><button type="button" disabled={pending} className={styles.btnGhost} onClick={()=>setAction(null)}>Voltar</button></div>
    </form>}
    {action === 'quote' && <form className={styles.inlineAction} onSubmit={e=>{e.preventDefault();if(Number.isInteger(Number(procedureDuration)) && Number(procedureDuration)>=5 && Number(procedureDuration)<=480) void run(()=>quoteBarberBooking(b.id,price,notes,Number(procedureDuration),expiry ? `${expiry}T23:59:59-03:00` : undefined));}}>
      <h4>{proposal ? 'Revisar orçamento do procedimento' : 'Preparar orçamento do procedimento'}</h4>
      <p>{paidMecha ? 'O teste de mecha mantém seu valor de R$ 35 e seu próprio horário. O procedimento terá preço e duração combinados separadamente.' : 'A avaliação mantém seu horário e suas observações. O cliente aceitará este orçamento e escolherá uma nova reserva.'}</p>
      <label className={styles.fieldLabel}>Valor combinado (R$)<input required type="number" min="0.01" step="0.01" value={price} onChange={e=>setPrice(e.target.value)}/></label>
      <label className={styles.fieldLabel}>Duração do procedimento (minutos)<input required type="number" min="5" max="480" step="1" value={procedureDuration} onChange={e=>setProcedureDuration(e.target.value)}/></label>
      <p className={styles.actionHint}>Inclua preparo, aplicação e finalização: todo esse período ficará reservado para este cliente.</p>
      <label className={styles.fieldLabel}>Plano visível ao cliente<textarea value={notes} onChange={e=>setNotes(e.target.value)} maxLength={2000} rows={3}/></label>
      <label className={styles.fieldLabel}>Válido até (opcional)<input type="date" min={localDate()} value={expiry} onChange={e=>setExpiry(e.target.value)}/></label>
      <p className={styles.actionHint}>Sem data escolhida, o orçamento vale por 14 dias. Disponibilizar aqui não envia uma mensagem no WhatsApp.</p>
      <div className={styles.pairActions}><button disabled={pending} className={styles.btn}>{pending?'Salvando…':'Disponibilizar orçamento'}</button><button type="button" disabled={pending} className={styles.btnGhost} onClick={()=>setAction(null)}>Voltar</button></div>
    </form>}
    {action === 'accept' && proposal && <form className={styles.inlineAction} onSubmit={e=>{e.preventDefault();if(procedureDate && procedureTime && consentNote.trim()) void run(()=>acceptBarberProposal(proposal.id,proposal.version,`${procedureDate}T${procedureTime}:00-03:00`,consentNote.trim()));}}>
      <h4>Registrar aceite combinado</h4>
      <p>Registre somente se o cliente confirmou preço, duração e horário. O procedimento aguardará sinal de {money(proposal.deposit_amount)} por até 15 minutos; depois disso o horário pode ser liberado.</p>
      <label className={styles.fieldLabel}>Data do procedimento<input required type="date" min={localDate(new Date(Math.max(Date.now(),Date.parse(b.end))))} value={procedureDate} onChange={e=>setProcedureDate(e.target.value)} disabled={pending}/></label>
      <label className={styles.fieldLabel}>Horário do procedimento<input required type="time" value={procedureTime} onChange={e=>setProcedureTime(e.target.value)} disabled={pending}/></label>
      <label className={styles.fieldLabel}>Como o cliente aceitou<textarea required rows={2} maxLength={240} value={consentNote} onChange={e=>setConsentNote(e.target.value)} placeholder="Ex.: cliente confirmou pelo WhatsApp em 16/09" disabled={pending}/></label>
      <p className={styles.actionHint}>O procedimento precisa caber integralmente na agenda. Este registro não envia mensagem nem cobra o sinal.</p>
      <div className={styles.pairActions}><button className={styles.btn} disabled={pending||!procedureDate||!procedureTime||!consentNote.trim()}>{pending?'Reservando…':'Reservar procedimento combinado'}</button><button type="button" className={styles.btnGhost} disabled={pending} onClick={()=>setAction(null)}>Voltar</button></div>
    </form>}
    {action === 'deposit' && <form className={styles.inlineAction} onSubmit={e=>{e.preventDefault();void run(()=>confirmBarberDeposit(b.id,expectedDeposit,reason));}}>
      <h4>Registrar sinal de {money(expectedDeposit)}</h4><p>Confira o recebimento na sua conta antes de registrar. Este registro não efetua cobrança.</p>
      <label className={styles.fieldLabel}>Referência do recebimento<input required maxLength={240} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Data e identificação do comprovante"/></label>
      <div className={styles.pairActions}><button disabled={pending||!reason.trim()} className={styles.btn}>{pending?'Registrando…':'Confirmar recebimento'}</button><button type="button" disabled={pending} className={styles.btnGhost} onClick={()=>setAction(null)}>Voltar</button></div>
    </form>}
  </article>;
}
