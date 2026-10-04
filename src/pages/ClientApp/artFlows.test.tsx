import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, test, vi } from 'vitest';
import App from '../../App';
import { MeusHorariosView } from './MeusHorariosView';

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });
const service = { id: 3, slug: 'cor', name: 'Colorimetria', description: 'Avaliação artística', price: '0.00', price_type: 'quote', duration_min: 30, active: true, order: 0, tool: 'pincel' };
const proposal = { id: 8, consultation: 1, version: 2, price: '300.00', deposit_amount: '150.00', duration_min: 180, notes: 'Cor violeta e finalização', expires_at: '2099-12-31T23:00:00-03:00', status: 'sent', created_at: '2026-09-12T12:00:00-03:00', accepted_at: null, accepted_by: null, procedure: null, owner: 2 };
const evaluation = { id: 1, kind: 'consultation', start: '2026-09-12T09:00:00-03:00', end: '2026-09-12T09:30:00-03:00', duration_min: 30, status: 'completed', total_price: '0.00', services: [service], proposals: [proposal] };
const notice = { id: 4, booking: 9, old_start: '2099-10-01T09:00:00-03:00', old_end: '2099-10-01T12:00:00-03:00', new_start: '2099-10-02T14:00:00-03:00', new_end: '2099-10-02T17:00:00-03:00', reason: 'Mais tempo para finalizar sua cor', changed_by: 2, changed_by_name: 'Elcio', created_at: '2026-09-13T12:00:00-03:00', acknowledged_at: null };
afterEach(() => { vi.restoreAllMocks(); window.history.replaceState({}, '', '/'); document.cookie = 'barder_csrf=; Max-Age=0; path=/'; });

test('client accepts persisted three-hour proposal into a separate procedure while retaining the evaluation', async () => {
  let accepted = false;
  const requests: { url: string; body: unknown }[] = [];
  document.cookie = 'barder_csrf=test; path=/';
  const procedure = { ...evaluation, id: 9, kind: 'procedure', start: '2099-10-02T14:00:00-03:00', end: '2099-10-02T17:00:00-03:00', duration_min: 180, status: 'pending', total_price: '300.00', source_consultation: 1, proposals: [], deposit_paid: false };
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = String(input); requests.push({ url, body: init?.body ? JSON.parse(String(init.body)) : undefined });
    if (url.includes('/proposals/8/slots/')) return json({ date: '2099-10-02', duration_min: 180, slots: ['2099-10-02T09:00:00-03:00', procedure.start] });
    if (url.endsWith('/proposals/8/accept/')) { accepted = true; return json(procedure, 201); }
    return json(accepted ? [{ ...evaluation, proposals: [{ ...proposal, status: 'accepted', procedure: 9 }] }, procedure] : [evaluation]);
  });
  render(<MemoryRouter><MeusHorariosView /></MemoryRouter>);
  fireEvent.click(await screen.findByRole('button', { name: 'Escolher horário do procedimento' }));
  fireEvent.change(screen.getByLabelText('Data do procedimento'), { target: { value: '2099-10-02' } });
  expect(screen.getByRole('link', { name: 'Consultar manhã pelo WhatsApp' })).toBeTruthy();
  fireEvent.click(await screen.findByRole('button', { name: '14:00' }));
  expect(screen.queryByRole('button', { name: '09:00' })).toBeNull();
  expect(screen.getByText(/até 17:00/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Aceitar e agendar procedimento' }));
  await screen.findByText('Procedimento reservado. A avaliação permanece no seu histórico.');
  expect(requests.find(r => r.url.endsWith('/proposals/8/accept/'))?.body).toEqual({ version: 2, start: procedure.start });
  expect(requests.find(r => r.url.includes('/proposals/8/slots/'))?.url).not.toContain('duration_min');
  expect(await screen.findByText('Avaliação concluída')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Pagar sinal' })).toBeTruthy();
});

test('client sees old and new times with reason then explicitly acknowledges the persisted change', async () => {
  let acknowledged = false;
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input);
    if (url.endsWith('/auth/me/')) return json({ id: 1, username: 'Ana', role: 'client' });
    if (url.endsWith('/auth/csrf/')) return json({ csrfToken: 'fixture' });
    if (url.endsWith('/notifications/4/ack/')) { acknowledged = true; return json({ ...notice, acknowledged_at: '2026-09-13T13:00:00-03:00' }); }
    if (url.endsWith('/notifications/')) return json([notice]);
    return json([]);
  });
  window.history.replaceState({}, '', '/app'); render(<App />);
  const alert = (await screen.findByText('Seu horário mudou')).closest('article')!;
  expect(within(alert).getByText(/Antes:/)).toBeTruthy();
  expect(within(alert).getByText(/Agora:/)).toBeTruthy();
  expect(within(alert).getByText(notice.reason)).toBeTruthy();
  expect(acknowledged).toBe(false);
  fireEvent.click(within(alert).getByRole('button', { name: 'Estou ciente' }));
  expect(await within(alert).findByText(/Ciência registrada/)).toBeTruthy();
  expect(acknowledged).toBe(true);
});

test.each(['login', 'register'])('service selection survives %s and remains limited to the client route', async mode => {
  let signedIn = false;
  vi.spyOn(globalThis, 'fetch').mockImplementation(async input => {
    const url = String(input);
    if (url.endsWith('/auth/csrf/')) return json({ csrfToken: 'fixture' });
    if (url.endsWith('/auth/refresh/')) return json({}, 401);
    if (url.endsWith('/auth/me/')) return signedIn ? json({ id: 1, username: 'Ana', role: 'client' }) : json({}, 401);
    if (url.endsWith('/auth/login/') || url.endsWith('/auth/register/')) { signedIn = true; return json({ user: { id: 1, username: 'Ana', role: 'client' } }); }
    if (url.endsWith('/catalog/services/')) return json([service]);
    return json([]);
  });
  window.history.replaceState({}, '', '/app?servicos=3'); render(<App />);
  await screen.findByText('Bem-vindo de volta');
  if (mode === 'register') fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
  fireEvent.change(screen.getByLabelText('Usuário'), { target: { value: 'Ana' } });
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'password-123' } });
  const buttons = screen.getAllByRole('button', { name: mode === 'register' ? 'Criar conta' : 'Entrar' });
  const submit = buttons[buttons.length - 1];
  fireEvent.click(submit);
  const selection = await screen.findByRole('button', { name: /Colorimetria/ });
  await waitFor(() => expect(selection.getAttribute('aria-pressed')).toBe('true'));
  expect(window.location.pathname + window.location.search).toBe('/app?servicos=3');
});

test.each(['cancelled', 'noshow'])('a proposal belonging to a %s evaluation is visible only as history', async status => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(json([{ ...evaluation, status }]));
  render(<MemoryRouter><MeusHorariosView /></MemoryRouter>);
  expect(await screen.findByText('Orçamento do procedimento')).toBeTruthy();
  expect(screen.getByText(status === 'cancelled' ? 'Esta avaliação foi cancelada. O orçamento fica no histórico e não pode ser aceito.' : 'Foi registrada falta nesta avaliação. O orçamento fica no histórico e não pode ser aceito.')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Escolher horário do procedimento' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Recusar orçamento' })).toBeNull();
  expect(screen.getByText(proposal.notes)).toBeTruthy();
});

test('client sees both current occupied time and original agreed time after duration adjustment', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(json([{ ...evaluation, kind: 'procedure', status: 'confirmed', start: '2099-10-02T14:00:00-03:00', end: '2099-10-02T18:00:00-03:00', duration_min: 240, agreed_duration_min: 180, source_consultation: 1, proposals: [], total_price: '300.00' }]));
  render(<MemoryRouter><MeusHorariosView /></MemoryRouter>);
  expect(await screen.findByText(/Tempo reservado: 240 min/)).toBeTruthy();
  expect(screen.getByText('Tempo acordado no orçamento: 180 min. A reserva atual foi ajustada para 240 min.')).toBeTruthy();
});
