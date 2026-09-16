import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, test, vi } from 'vitest';
import type { RescheduleNotice } from '../../services/schedulingService';
import { NotificationCenter } from './NotificationCenter';

const notice: RescheduleNotice = {
  id: 4, booking: 9,
  old_start: '2099-10-01T09:00:00-03:00', old_end: '2099-10-01T12:00:00-03:00',
  new_start: '2099-10-02T14:00:00-03:00', new_end: '2099-10-02T17:00:00-03:00',
  reason: 'Primeira mudança da cor', changed_by: 2, changed_by_name: 'Elcio',
  created_at: '2026-09-13T12:00:00-03:00', acknowledged_at: null,
};
const newer: RescheduleNotice = {
  ...notice, id: 5, reason: 'Novo ajuste da cor',
  old_start: notice.new_start, old_end: notice.new_end,
  new_start: '2099-10-03T14:00:00-03:00', new_end: '2099-10-03T17:00:00-03:00',
  created_at: '2026-09-13T13:00:00-03:00',
};
const json = (data: unknown) => new Response(JSON.stringify(data), { status: 200 });
const card = (reason: string) => within(screen.getByText(reason).closest('article')!);
afterEach(() => { vi.restoreAllMocks(); document.cookie = 'barder_csrf=; Max-Age=0; path=/'; });

test('distinguishes previous changes for the same booking without treating another booking as outdated', async () => {
  const other = { ...notice, id: 3, booking: 10, reason: 'Mudança do corte', created_at: '2026-09-12T12:00:00-03:00' };
  const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json([notice, other, newer]));
  render(<MemoryRouter><NotificationCenter /></MemoryRouter>);
  await screen.findByText(notice.reason);
  expect(card(notice.reason).getByRole('heading', { name: 'Alteração anterior' })).toBeTruthy();
  expect(card(notice.reason).getByText('Alterado para:')).toBeTruthy();
  expect(card(notice.reason).getByText('Houve uma nova mudança nesta reserva. Consulte o horário atual em Meus horários.')).toBeTruthy();
  expect(card(notice.reason).queryByText('Agora:')).toBeNull();
  for (const current of [newer, other]) {
    expect(card(current.reason).getByRole('heading', { name: 'Seu horário mudou' })).toBeTruthy();
    expect(card(current.reason).getByText('Agora:')).toBeTruthy();
    expect(card(current.reason).queryByText('Alterado para:')).toBeNull();
  }
  expect(screen.getAllByRole('button', { name: 'Estou ciente' })).toHaveLength(3);
  expect(fetch).toHaveBeenCalledTimes(1);
});

test('keeps an older unread change historical when the latest was acknowledged and only acknowledges on request', async () => {
  const latestSeen = { ...newer, acknowledged_at: '2026-09-13T14:00:00-03:00' };
  const acknowledged = { ...notice, acknowledged_at: '2026-09-13T15:00:00-03:00' };
  document.cookie = 'barder_csrf=test; path=/';
  const fetch = vi.spyOn(globalThis, 'fetch').mockImplementation(async input =>
    String(input).endsWith('/notifications/4/ack/') ? json(acknowledged) : json([notice, latestSeen]));
  render(<MemoryRouter><NotificationCenter /></MemoryRouter>);
  await screen.findByText(notice.reason);
  expect(card(notice.reason).getByRole('heading', { name: 'Alteração anterior' })).toBeTruthy();
  expect(screen.queryByText(newer.reason)).toBeNull();
  expect(fetch).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: 'Ver alterações já vistas' }));
  const originalAcknowledgement = card(newer.reason).getByRole('status').textContent;
  fireEvent.click(card(notice.reason).getByRole('button', { name: 'Estou ciente' }));
  expect(await card(notice.reason).findByRole('status')).toBeTruthy();
  expect(card(notice.reason).getByRole('heading', { name: 'Alteração anterior' })).toBeTruthy();
  expect(card(newer.reason).getByRole('status').textContent).toBe(originalAcknowledgement);
  expect(screen.getAllByRole('article')).toHaveLength(2);
  expect(fetch.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(1);
  expect(fetch.mock.calls.find(([, init]) => init?.method === 'POST')?.[0]).toContain('/notifications/4/ack/');
});

test('uses the newest record when changes share a timestamp, regardless of response order', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(json([{ ...newer, created_at: notice.created_at }, notice]));
  render(<MemoryRouter><NotificationCenter /></MemoryRouter>);
  await screen.findByText(notice.reason);
  expect(card(notice.reason).getByRole('heading', { name: 'Alteração anterior' })).toBeTruthy();
  expect(card(newer.reason).getByRole('heading', { name: 'Seu horário mudou' })).toBeTruthy();
});
