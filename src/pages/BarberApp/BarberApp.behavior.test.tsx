import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { AgendaCalendar } from './AgendaCalendar';

const response = (data: unknown, status = 200) => ({ ok: status < 400, status, json: async () => data }) as Response;
const booking = {id: 9, start: '2026-09-13T09:00:00-03:00', end: '2026-09-13T10:00:00-03:00', status: 'completed', total_price: '80.00', client_username: 'Ana', client_phone: '62999990000', notes: 'Manter comprimento', services: [{id:1, name:'Corte', price:'80.00', price_type:'fixed' as const, duration_min:60}]};
function network(items: unknown[] = [booking], failDay = false) {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async input => {
    const url = String(input);
    if (url.endsWith('/auth/csrf/')) return response({csrfToken:'fixture-csrf'});
    if (url.endsWith('/cancel/')) return response({detail:'Cancelamento indisponível'},400);
    if (url.includes('/calendar/')) return response({year:2026, month:9, days:[]});
    if (url.includes('/blackouts/')) return response([]);
    if (url.includes('/bookings/?')) return response(failDay ? {detail:'Agenda indisponível'} : items, failDay ? 503 : 200);
    throw new Error(`Unexpected URL ${url}`);
  });
}
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

test('completed appointments expose service and notes without mutable actions', async () => {
  network(); render(<AgendaCalendar />);
  const card = (await screen.findByText('Ana')).closest('article')!;
  expect(within(card).queryByRole('button', {name:/Finalizar|Cancelar|Reagendar/})).toBeNull();
  expect(within(card).getByText(/Manter comprimento/)).toBeTruthy();
  expect(within(card).getByText('Corte')).toBeTruthy();
});

test('a failed day read offers retry instead of an empty agenda', async () => {
  network([], true); render(<AgendaCalendar />);
  await screen.findByText('Agenda indisponível');
  expect(screen.queryByText(/Nenhum agendamento/)).toBeNull();
  expect(screen.getByRole('button', {name:/Tentar novamente/})).toBeTruthy();
});

test('cancellation requires a deliberate confirmation and preserves its reason on error', async () => {
  network([{...booking, status:'confirmed'}]); render(<AgendaCalendar />);
  const card = (await screen.findByText('Ana')).closest('article')!;
  fireEvent.click(within(card).getByRole('button', {name:'Cancelar'}));
  const reason = within(card).getByLabelText('Motivo do cancelamento (opcional)');
  fireEvent.change(reason, {target:{value:'Cliente solicitou'}});
  fireEvent.click(within(card).getByRole('button', {name:'Confirmar cancelamento'}));
  await screen.findByText('Cancelamento indisponível');
  expect((reason as HTMLInputElement).value).toBe('Cliente solicitou');
});
import { BookingCard } from './BookingCard';

test('changing a reschedule date ignores the previous request when it finishes later', async()=>{
  let finishFirst: ((response:Response)=>void) | undefined;
  vi.spyOn(globalThis,'fetch').mockImplementation(async input=>{
    const url=String(input);
    if(url.includes('date=2099-10-02'))return response({date:'2099-10-02',slots:['2099-10-02T17:00:00-03:00']});
    if(url.includes('date=2099-10-01'))return new Promise<Response>(resolve=>{finishFirst=resolve;});
    return response({date:'2026-09-13',slots:[]});
  });
  render(<BookingCard booking={{...booking,status:'confirmed'}} onChanged={()=>{}}/>);
  fireEvent.click(screen.getByRole('button',{name:'Reagendar'}));
  fireEvent.change(screen.getByLabelText('Nova data'),{target:{value:'2099-10-01'}});
  await waitFor(()=>expect(finishFirst).toBeTruthy());
  fireEvent.change(screen.getByLabelText('Nova data'),{target:{value:'2099-10-02'}});
  const available=await screen.findByRole('button',{name:'17:00'});
  await act(async()=>{finishFirst!(response({date:'2099-10-01',slots:['2099-10-01T09:00:00-03:00']}));});
  expect(screen.queryByRole('button',{name:'09:00'})).toBeNull();
  expect(available.isConnected).toBe(true);
});

test('pending procedures without a paid deposit cannot be manually confirmed',()=>{
  render(<BookingCard booking={{...booking,kind:'procedure',deposit_paid:false,status:'pending',start:'2099-10-01T09:00:00-03:00',end:'2099-10-01T10:00:00-03:00'}} onChanged={()=>{}}/>);
  expect(screen.queryByRole('button',{name:'Finalizar'})).toBeNull();
  expect(screen.queryByRole('button',{name:'Confirmar horário'})).toBeNull();
});

test('barber books an existing customer in the contact-only morning after agreement', async () => {
  const calls: { url: string; body?: Record<string, unknown> }[] = [];
  document.cookie = 'barder_csrf=test; path=/';
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = String(input);
    calls.push({ url, ...(init?.body ? { body: JSON.parse(String(init.body)) } : {}) });
    if (url.endsWith('/auth/csrf/')) return response({ csrfToken: 'fixture-csrf' });
    if (url.includes('/calendar/')) return response({ year: 2099, month: 10, days: [] });
    if (url.includes('/blackouts/')) return response([]);
    if (url.includes('/bookings/?')) return response([]);
    if (url.includes('/barber/customers/')) return response([{ id: 7, username: 'Ana', phone: '62999990000', email: 'ana@example.com' }]);
    if (url.includes('/catalog/services/')) return response([{ id: 35, slug: 'teste-de-mecha', name: 'Teste de mecha', price: '35.00', price_type: 'fixed', duration_min: 30, active: true }]);
    if (url.includes('/barber/bookings/create/')) return response({ ...booking, id: 30, status: 'pending' }, 201);
    throw new Error(`Unexpected URL ${url}`);
  });
  render(<AgendaCalendar />);
  await screen.findByText(/Nenhum agendamento/);
  fireEvent.click(screen.getByRole('button', { name: 'Registrar horário combinado' }));
  await screen.findByRole('option', { name: /Ana/ });
  fireEvent.change(screen.getByLabelText('Data combinada'), { target: { value: '2099-10-02' } });
  fireEvent.change(screen.getByLabelText('Cliente'), { target: { value: '7' } });
  fireEvent.change(screen.getByLabelText('Serviço'), { target: { value: '35' } });
  fireEvent.change(screen.getByLabelText('Horário combinado'), { target: { value: '09:00' } });
  fireEvent.change(screen.getByLabelText('Registro do combinado'), { target: { value: 'Ana confirmou o horário por WhatsApp.' } });
  fireEvent.click(screen.getByRole('button', { name: 'Registrar reserva' }));
  await waitFor(() => expect(calls.some(c => c.url.includes('/barber/bookings/create/'))).toBe(true));
  expect(calls.find(c => c.url.includes('/barber/bookings/create/'))?.body).toEqual({ client_id: 7, service_ids: [35], start: '2099-10-02T09:00:00-03:00', notes: 'Ana confirmou o horário por WhatsApp.' });
  expect(await screen.findByText(/sinal.*pendente/i)).toBeTruthy();
});

test('pending evaluations keep their existing manual confirmation flow',()=>{
  render(<BookingCard booking={{...booking,kind:'consultation',deposit_paid:false,status:'pending',start:'2099-10-01T09:00:00-03:00',end:'2099-10-01T10:00:00-03:00'}} onChanged={()=>{}}/>);
  expect(screen.getByRole('button',{name:'Confirmar horário'})).toBeTruthy();
});
