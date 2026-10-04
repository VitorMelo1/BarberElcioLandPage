import { useEffect, useRef, useState } from 'react';
import { getServices, type ApiService } from '../../services/catalogService';
import { createBarberBooking, getBarberCustomers, type BarberCustomer } from '../../services/barberService';
import type { Booking } from '../../services/schedulingService';
import { localDate, prettyDay } from './formatters';
import styles from './BarberApp.module.css';

export function ManualBookingForm({ initialDate, onCreated, onClose }: { initialDate: string; onCreated: (booking: Booking, date: string) => void; onClose: () => void }) {
  const [date,setDate] = useState(initialDate < localDate() ? localDate() : initialDate);
  const [time,setTime] = useState('');
  const [clientId,setClientId] = useState('');
  const [serviceId,setServiceId] = useState('');
  const [notes,setNotes] = useState('');
  const [clients,setClients] = useState<BarberCustomer[]>([]);
  const [services,setServices] = useState<ApiService[]>([]);
  const [loading,setLoading] = useState(true);
  const [pending,setPending] = useState(false);
  const [error,setError] = useState('');
  const saving = useRef(false);
  useEffect(() => {
    let active = true;
    Promise.all([getBarberCustomers(),getServices()]).then(([people,catalog]) => {
      if(active) { setClients(people); setServices(catalog.filter(service=>service.active)); }
    }).catch(err=>{if(active)setError(err instanceof Error?err.message:'Não foi possível carregar clientes e serviços.');})
      .finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;};
  }, []);
  const chosen = services.find(service=>service.id===Number(serviceId));
  const [hour,minute] = time.split(':').map(Number);
  const startsAt = hour * 60 + minute;
  const fitsMorning = !!chosen && !!time && startsAt >= 480 && startsAt + chosen.duration_min <= 660;
  async function submit() {
    if(saving.current || !clientId || !chosen || !date || !fitsMorning || !notes.trim()) return;
    saving.current=true;setPending(true);setError('');
    try {
      const booking = await createBarberBooking(Number(clientId),[chosen.id],`${date}T${time}:00-03:00`,notes.trim());
      onCreated(booking,date);
    } catch(err) {setError(err instanceof Error?err.message:'Não foi possível registrar o horário.');}
    finally {saving.current=false;setPending(false);}
  }
  return <form className={styles.blockForm} onSubmit={e=>{e.preventDefault();void submit();}} aria-busy={loading||pending}>
    <h3>Horário combinado com o cliente</h3>
    <p>A manhã, das 08:00 às 11:00, é combinada diretamente com Elcio. Registre aqui apenas após acertar o horário com o cliente.</p>
    {loading ? <p role="status">Carregando clientes e serviços…</p> : <>
      {error && <p className={styles.toastErr} role="alert">{error}</p>}
      <label className={styles.fieldLabel}>Cliente<select required value={clientId} onChange={e=>setClientId(e.target.value)} disabled={pending}><option value="">Selecione um cliente cadastrado</option>{clients.map(client=><option key={client.id} value={client.id}>{client.username}{client.phone ? ` · ${client.phone}` : ''}</option>)}</select></label>
      <label className={styles.fieldLabel}>Serviço<select required value={serviceId} onChange={e=>setServiceId(e.target.value)} disabled={pending}><option value="">Selecione um serviço</option>{services.map(service=><option key={service.id} value={service.id}>{service.name} · {service.duration_min} min</option>)}</select></label>
      <label className={styles.fieldLabel}>Data combinada<input required type="date" min={localDate()} value={date} onChange={e=>setDate(e.target.value)} disabled={pending}/></label>
      <label className={styles.fieldLabel}>Horário combinado<input required type="time" min="08:00" max="10:59" value={time} onChange={e=>setTime(e.target.value)} disabled={pending}/></label>
      {time && chosen && !fitsMorning && <p role="alert">O serviço precisa terminar até 11:00. Escolha outro início.</p>}
      <label className={styles.fieldLabel}>Registro do combinado<textarea required rows={2} maxLength={2000} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Ex.: cliente confirmou o horário por WhatsApp" disabled={pending}/></label>
      <p className={styles.actionHint}>{chosen?.price_type==='quote' ? 'A avaliação não define o preço do procedimento. Envie o orçamento depois do atendimento.' : 'A reserva de preço fixo aguarda sinal de 50% por até 15 minutos; depois disso o horário pode ser liberado.'} O sistema confere conflito e expediente ao salvar; registrar aqui não envia mensagem nem cobra o sinal.</p>
      <div className={styles.pairActions}><button className={styles.btn} disabled={pending||!clientId||!chosen||!fitsMorning||!notes.trim()}>{pending?'Registrando…':'Registrar reserva'}</button><button type="button" className={styles.btnGhost} disabled={pending} onClick={onClose}>Voltar</button></div>
      <small>Data selecionada: {prettyDay(date)}.</small>
    </>}
  </form>;
}
