import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { getBarberBookings } from '../../services/barberService';
import { createBlackout, deleteBlackout, getBarberCalendar, getBlackouts, type Blackout, type Booking, type CalendarMonth } from '../../services/schedulingService';
import { BookingCard } from './BookingCard';
import { ManualBookingForm } from './ManualBookingForm';
import { WeeklyHours } from './WeeklyHours';
import { localDate, prettyDay, timeLabel } from './formatters';
import styles from './BarberApp.module.css';

export function AgendaCalendar() {
  const [date,setDate] = useState(localDate());
  const [,setClock] = useState(0);
  const [month,setMonth] = useState(localDate().slice(0,7));
  const [bookings,setBookings] = useState<Booking[]>([]);
  const [blackouts,setBlackouts] = useState<Blackout[]>([]);
  const [calendar,setCalendar] = useState<CalendarMonth|null>(null);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');
  const [monthError,setMonthError] = useState('');
  const [revision,setRevision] = useState(0);
  const [message,setMessage] = useState('');
  const [blocking,setBlocking] = useState(false);
  const [manualOpen,setManualOpen] = useState(false);
  const [hoursOpen,setHoursOpen] = useState(false);
  const [blockStart,setBlockStart] = useState('12:00');
  const [blockEnd,setBlockEnd] = useState('13:00');
  const [reason,setReason] = useState('');
  const [pending,setPending] = useState(false);
  const [blockError,setBlockError] = useState('');
  const previousToday=useRef(localDate());
  const mutation=useRef(false);
  useEffect(()=>{
    let active=true; setLoading(true);setError('');setBookings([]);setBlackouts([]);
    const end = new Date(`${date}T12:00:00`);end.setDate(end.getDate()+1);
    Promise.all([getBarberBookings(date),getBlackouts(date,localDate(end))]).then(([items,blocks])=>{
      if(active){setBookings(items.slice().sort((a,b)=>a.start.localeCompare(b.start)));setBlackouts(blocks);}
    }).catch(err=>{if(active)setError(err instanceof Error?err.message:'Falha ao carregar a agenda.');})
      .finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;};
  },[date,revision]);
  useEffect(()=>{
    let active=true; setCalendar(null);setMonthError('');
    const [year,number]=month.split('-').map(Number);
    getBarberCalendar(year,number).then(data=>{if(active)setCalendar(data);})
      .catch(err=>{if(active)setMonthError(err instanceof Error?err.message:'Falha ao carregar o calendário.');});
    return ()=>{active=false;};
  },[month,revision]);
  useEffect(()=>{
    const timer=window.setInterval(()=>{
      const next=localDate();
      const previous=previousToday.current;
      setClock(value=>value+1);
      if(next!==previous){
        setDate(current=>current===previous?next:current);
        setMonth(current=>current===previous.slice(0,7)?next.slice(0,7):current);
        previousToday.current=next;
      }
    },60000);
    return ()=>window.clearInterval(timer);
  },[]);
  function changeDate(next:string){if(!next)return;setDate(next);setMonth(next.slice(0,7));setBlocking(false);setManualOpen(false);setBlockError('');}
  function shiftDay(delta:number){const next=new Date(`${date}T12:00:00`);next.setDate(next.getDate()+delta);changeDate(localDate(next));}
  function changed(){setMessage('Agenda atualizada.');setRevision(v=>v+1);}
  async function mutate(action:()=>Promise<unknown>){
    if(mutation.current)return;mutation.current=true;setPending(true);setBlockError('');
    try{await action();setBlocking(false);setReason('');changed();}
    catch(err){setBlockError(err instanceof Error?err.message:'Não foi possível alterar o bloqueio.');}
    finally{mutation.current=false;setPending(false);}
  }
  const remaining=bookings.filter(b=>['pending','scheduled','confirmed','quote'].includes(b.status));
  const next=remaining.find(b=>new Date(b.end).getTime()>Date.now());
  const offset=calendar?(new Date(calendar.year,calendar.month-1,1).getDay()+6)%7:0;
  return <div className={styles.stack}>
    <section className={styles.panel} aria-busy={loading}>
      <div className={styles.dayHead}><div><h2 className={styles.dayTitle}>{date===localDate()?'Hoje':prettyDay(date)}</h2><p className={styles.sectionHint}>{date===localDate()?prettyDay(date):'Agenda do dia selecionado'}</p></div>
        <button className={styles.btnGhost} onClick={()=>setRevision(v=>v+1)} disabled={loading}>Atualizar agenda</button>
      </div>
      <div className={styles.dayToolbar}><button className={styles.iconBtn} aria-label="Dia anterior" onClick={()=>shiftDay(-1)}><ChevronLeft size={18}/></button><label className={styles.fieldLabel}>Data da agenda<input type="date" value={date} onChange={e=>changeDate(e.target.value)}/></label><button className={styles.iconBtn} aria-label="Próximo dia" onClick={()=>shiftDay(1)}><ChevronRight size={18}/></button><button className={styles.btnGhost} onClick={()=>changeDate(localDate())}>Hoje</button></div>
      {message&&<p className={styles.toastOk} role="status">{message}</p>}
      {loading ? <p role="status">Carregando atendimentos…</p> : error ? <div className={styles.toastErr} role="alert">{error}<button className={styles.btnGhost} onClick={()=>setRevision(v=>v+1)}>Tentar novamente</button></div> : <>
        <div className={styles.daySummary}><p><strong>{remaining.length}</strong> {remaining.length===1?'atendimento por realizar':'atendimentos por realizar'}</p>{next&&<p>Próximo: <strong>{next.client_username || 'Cliente'}</strong> às {timeLabel(next.start)}</p>}</div>
        {bookings.length===0 ? <p className={styles.dayEmpty}>Nenhum agendamento nesse dia. Consulte o calendário para ver outras datas.</p> : <div className={styles.timeline}>{bookings.map(b=><BookingCard key={b.id} booking={b} onChanged={changed}/>)}</div>}
        <div className={styles.blockList}>{blackouts.map(b=><div className={styles.blockChip} key={b.id}><Lock size={15}/><span>{timeLabel(b.start)}–{timeLabel(b.end)} {b.reason}</span><button className={styles.btnGhost} disabled={pending} onClick={()=>void mutate(()=>deleteBlackout(b.id))} aria-label={`Remover bloqueio ${timeLabel(b.start)}`}>Liberar</button></div>)}</div>
        <button className={styles.btnGhost} onClick={()=>setManualOpen(v=>!v)} aria-expanded={manualOpen}>Registrar horário combinado</button>
        <button className={styles.btnGhost} onClick={()=>setBlocking(v=>!v)} aria-expanded={blocking}><Lock size={15}/> Bloquear horário</button>
      </>}
      {manualOpen && <ManualBookingForm initialDate={date} onClose={()=>setManualOpen(false)} onCreated={(booking,bookedDate)=>{setManualOpen(false);setDate(bookedDate);setMonth(bookedDate.slice(0,7));setMessage(booking.kind==='consultation'?'Avaliação registrada. Combine os próximos passos com o cliente.':'Reserva registrada; sinal de 50% pendente. Confira o pagamento antes de confirmar.');setRevision(v=>v+1);}}/>}
      {blockError&&<p className={styles.toastErr} role="alert">{blockError}</p>}
      {blocking&&<form className={styles.blockForm} onSubmit={e=>{e.preventDefault();if(blockEnd<=blockStart){setBlockError('O fim deve ser depois do início.');return;}void mutate(()=>createBlackout(new Date(`${date}T${blockStart}:00`).toISOString(),new Date(`${date}T${blockEnd}:00`).toISOString(),reason));}}>
        <p>Bloquear um período em {prettyDay(date)}.</p><div className={styles.blockRow}><label>Início<input required type="time" value={blockStart} onChange={e=>setBlockStart(e.target.value)}/></label><label>Fim<input required type="time" value={blockEnd} onChange={e=>setBlockEnd(e.target.value)}/></label></div>
        <label className={styles.fieldLabel}>Motivo (opcional)<input value={reason} onChange={e=>setReason(e.target.value)} maxLength={240}/></label>
        <div className={styles.pairActions}><button className={styles.btn} disabled={pending}>{pending?'Salvando…':'Bloquear período'}</button><button type="button" className={styles.btnGhost} disabled={pending} onClick={()=>setBlocking(false)}>Cancelar</button></div>
      </form>}
    </section>
    <div className={styles.agendaSecondary}>
      <section className={styles.panel}><div className={styles.panelHead}><h2 className={styles.panelTitle}>Calendário</h2><label className={styles.fieldLabel}>Mês<input type="month" value={month} onChange={e=>{if(e.target.value)setMonth(e.target.value);}}/></label></div>
        {monthError?<p role="alert">{monthError}<button className={styles.btnGhost} onClick={()=>setRevision(v=>v+1)}>Recarregar calendário</button></p>:!calendar?<p role="status">Carregando calendário…</p>:<>
          <div className={styles.calWeekdays}>{['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map(w=><span key={w}>{w}</span>)}</div><div className={styles.calGrid}>{Array.from({length:offset},(_,i)=><span key={`empty${i}`}/>)}{calendar.days.map(day=><button className={[styles.calDay,day.date===date?styles.calSelected:'',!day.is_open?styles.calClosed:''].join(' ')} key={day.date} aria-pressed={day.date===date} aria-label={`${prettyDay(day.date)}, ${!day.is_open?'fechado, ':''}${day.bookings} agendamentos${day.blocked?', bloqueado':''}`} onClick={()=>changeDate(day.date)}><span>{Number(day.date.slice(-2))}</span>{day.bookings>0&&<small>{day.bookings}</small>}{day.blocked&&<Lock size={10}/>}</button>)}</div>
          <p className={styles.sectionHint}>Os números indicam reservas. Selecione um dia para ver os horários.</p>
        </>}
      </section>
      <details className={styles.panel} onToggle={e=>setHoursOpen(e.currentTarget.open)}><summary className={styles.detailsTitle}>Expediente semanal</summary><p className={styles.sectionHint}>Defina os dias e horários de atendimento.</p>{hoursOpen&&<WeeklyHours onSaved={changed} onError={setBlockError}/>}</details>
    </div>
  </div>;
}
