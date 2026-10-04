import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { BookingCard } from './BookingCard';
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });
const booking = { id: 1, kind: 'consultation' as const, start: '2026-01-01T09:00:00-03:00', end: '2026-01-01T09:30:00-03:00', status: 'quote', total_price: '0.00', client_username: 'Ana', client_phone: '(62) 99999-0000', notes: 'Quero violeta', proposals: [] };
afterEach(() => { vi.restoreAllMocks(); document.cookie = 'barder_csrf=; Max-Age=0; path=/'; });

test('barber publishes price and procedure duration without replacing evaluation notes', async () => {
  let payload: unknown;
  document.cookie = 'barder_csrf=test; path=/';
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (_, init) => { payload = JSON.parse(String(init?.body)); return json(booking); });
  const changed = vi.fn(); render(<BookingCard booking={booking} onChanged={changed} />);
  expect(screen.getByRole('button', { name: 'Avaliação realizada' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Preparar orçamento' }));
  fireEvent.change(screen.getByLabelText('Valor combinado (R$)'), { target: { value: '300.00' } });
  fireEvent.change(screen.getByLabelText('Duração do procedimento (minutos)'), { target: { value: '180' } });
  fireEvent.change(screen.getByLabelText('Plano visível ao cliente'), { target: { value: 'Violeta e finalização' } });
  fireEvent.click(screen.getByRole('button', { name: 'Disponibilizar orçamento' }));
  await waitFor(() => expect(changed).toHaveBeenCalledOnce());
  expect(payload).toMatchObject({ price: '300.00', duration_min: 180, notes: 'Violeta e finalização' });
  expect(screen.getByText('Quero violeta')).toBeTruthy();
});

test('duration change discards old slots and shows the full conflicting appointment on save', async () => {
  let finishOld!: (response: Response) => void;
  const requests: string[] = [];
  document.cookie = 'barder_csrf=test; path=/';
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input); requests.push(url);
    if (url.endsWith('/reschedule/')) return json({ detail: 'Este intervalo encontra outro atendimento.', conflicts: [{ booking: 7, client_name: 'Bruno', start: '2099-10-02T15:00:00-03:00', end: '2099-10-02T16:00:00-03:00' }] }, 409);
    if (url.includes('duration_min=180')) return json({ slots: ['2099-10-02T14:00:00-03:00'], duration_min: 180 });
    return new Promise<Response>(resolve => { finishOld = resolve; });
  });
  render(<BookingCard booking={{ ...booking, kind: 'procedure', status: 'confirmed', start: '2099-10-02T09:00:00-03:00', end: '2099-10-02T09:30:00-03:00' }} onChanged={() => {}} />);
  fireEvent.click(screen.getByRole('button', { name: 'Reagendar' }));
  await waitFor(() => expect(finishOld).toBeTruthy());
  fireEvent.change(screen.getByLabelText('Tempo reservado (minutos)'), { target: { value: '180' } });
  const slot = await screen.findByRole('button', { name: '14:00' });
  await act(async () => finishOld(json({ slots: ['2099-10-02T09:00:00-03:00'] })));
  expect(screen.queryByRole('button', { name: '09:00' })).toBeNull();
  fireEvent.click(slot);
  fireEvent.change(screen.getByLabelText('Motivo da alteração'), { target: { value: 'Sessão precisa de mais tempo' } });
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar novo horário' }));
  expect(await screen.findByText(/Bruno/)).toBeTruthy();
  expect(screen.getByText(/15:00.*16:00/)).toBeTruthy();
  expect(requests.some(url => url.includes('duration_min=180'))).toBe(true);
});

test('barber sees pending acknowledgement and a correctly addressed WhatsApp draft', () => {
  const change = { id: 4, booking: 1, old_start: booking.start, old_end: booking.end, new_start: '2099-10-02T14:00:00-03:00', new_end: '2099-10-02T17:00:00-03:00', reason: 'Mais tempo para sua cor', changed_by: 2, changed_by_name: 'Elcio', created_at: '2026-09-13T12:00:00-03:00', acknowledged_at: null };
  render(<BookingCard booking={{ ...booking, latest_change: change }} onChanged={() => {}} />);
  expect(screen.getByText('Aguardando ciência do cliente')).toBeTruthy();
  const link = screen.getByRole('link', { name: 'Abrir aviso no WhatsApp' }) as HTMLAnchorElement;
  expect(link.href).toContain('https://wa.me/5562999990000?text=');
  expect(decodeURIComponent(link.href)).toContain(change.reason);
  expect(decodeURIComponent(link.href)).toContain(`${window.location.origin}/app?aba=historico`);
  expect(screen.getByText(/A mensagem precisa ser enviada por você/)).toBeTruthy();
});

test('barber can prepare a reminder for a future booking without implying it was sent', () => {
  render(<BookingCard booking={{ ...booking, kind: 'procedure', status: 'confirmed', start: '2099-10-02T14:00:00-03:00', end: '2099-10-02T15:00:00-03:00' }} onChanged={() => {}} />);
  const link = screen.getByRole('link', { name: 'Preparar lembrete no WhatsApp' }) as HTMLAnchorElement;
  expect(link.href).toContain('https://wa.me/5562999990000?text=');
  expect(decodeURIComponent(link.href)).toContain('14:00');
  expect(screen.getByText(/Envie você mesmo cerca de 1 hora antes/)).toBeTruthy();
});

test('a requested longer interval exposes the existing client conflict before saving', async () => {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async input => String(input).includes('/barber/bookings/?')
    ? json([{ ...booking, id: 7, kind: 'procedure', client_username: 'Bruno', status: 'confirmed', start: '2099-10-02T15:00:00-03:00', end: '2099-10-02T16:00:00-03:00' }])
    : json({ slots: [], duration_min: 180 }));
  render(<BookingCard booking={{ ...booking, kind: 'procedure', status: 'confirmed', start: '2099-10-02T09:00:00-03:00', end: '2099-10-02T10:00:00-03:00' }} onChanged={() => {}} />);
  fireEvent.click(screen.getByRole('button', { name: 'Reagendar' }));
  fireEvent.change(screen.getByLabelText('Tempo reservado (minutos)'), { target: { value: '180' } });
  fireEvent.change(screen.getByLabelText('Ou informe o início desejado'), { target: { value: '14:00' } });
  expect(await screen.findByText(/Bruno: 15:00 até 16:00/)).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Motivo da alteração'), { target: { value: 'Mais tempo para cor' } });
  expect((screen.getByRole('button', { name: 'Confirmar novo horário' }) as HTMLButtonElement).disabled).toBe(true);
});

test('evaluation absence uses its own deliberate action without payment', async () => {
  let recorded = false;
  document.cookie = 'barder_csrf=test; path=/';
  vi.spyOn(globalThis, 'fetch').mockImplementation(async input => { recorded = String(input).endsWith('/noshow/'); return json({ ...booking, status: 'noshow' }); });
  render(<BookingCard booking={booking} onChanged={() => {}} />);
  expect(screen.queryByRole('button', { name: 'Registrar sinal' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Registrar falta' }));
  expect(recorded).toBe(false);
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar falta' }));
  await waitFor(() => expect(recorded).toBe(true));
});

test('barber can distinguish original agreement from the adjusted calendar duration', () => {
  render(<BookingCard booking={{ ...booking, kind: 'procedure', status: 'confirmed', duration_min: 240, agreed_duration_min: 180 }} onChanged={() => {}} />);
  expect(screen.getByText('Tempo acordado no orçamento: 180 min. Reserva atual: 240 min.')).toBeTruthy();
});

test('completed paid strand test can receive a separate procedure quote', () => {
  render(<BookingCard booking={{ ...booking, kind: 'procedure', status: 'completed', deposit_paid: true, services: [{ id: 35, slug: 'teste-de-mecha', name: 'Teste de mecha', price: '35.00', price_type: 'fixed', duration_min: 30 }] }} onChanged={() => {}} />);
  expect(screen.getByRole('button', { name: 'Preparar orçamento' })).toBeTruthy();
});

test('barber records a separately agreed proposal only with a consent note', async () => {
  const calls: { url: string; body: Record<string, unknown> }[] = [];
  document.cookie = 'barder_csrf=test; path=/';
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    calls.push({ url: String(input), body: JSON.parse(String(init?.body)) });
    return json({ ...booking, status: 'pending' }, 201);
  });
  const proposal = { id: 20, consultation: 1, version: 2, price: '300.00', deposit_amount: '150.00', duration_min: 180, notes: '', expires_at: '2099-10-01T00:00:00-03:00', owner: 2, status: 'sent' as const, created_at: '2026-09-01T00:00:00-03:00', accepted_at: null, accepted_by: null, procedure: null };
  const changed = vi.fn();
  render(<BookingCard booking={{ ...booking, status: 'completed', proposals: [proposal] }} onChanged={changed} />);
  fireEvent.click(screen.getByRole('button', { name: 'Registrar aceite combinado' }));
  const submit = screen.getByRole('button', { name: 'Reservar procedimento combinado' }) as HTMLButtonElement;
  expect(submit.disabled).toBe(true);
  fireEvent.change(screen.getByLabelText('Data do procedimento'), { target: { value: '2099-10-02' } });
  fireEvent.change(screen.getByLabelText('Horário do procedimento'), { target: { value: '09:00' } });
  fireEvent.change(screen.getByLabelText('Como o cliente aceitou'), { target: { value: 'Cliente confirmou preço e horário no WhatsApp em 16/09.' } });
  fireEvent.click(submit);
  await waitFor(() => expect(changed).toHaveBeenCalledOnce());
  expect(calls[0]).toEqual({ url: expect.stringContaining('/scheduling/barber/proposals/20/accept/'), body: { version: 2, start: '2099-10-02T09:00:00-03:00', consent_note: 'Cliente confirmou preço e horário no WhatsApp em 16/09.' } });
});
