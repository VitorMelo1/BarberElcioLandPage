import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Landing } from './Landing';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
function fixture(services: unknown[], failed = false) {
  vi.spyOn(window, 'matchMedia').mockImplementation(query => ({ matches: true, media: query, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => true }));
  vi.spyOn(globalThis, 'fetch').mockImplementation(async input => ({ ok: !failed, status: failed ? 503 : 200, json: async () => String(input).includes('/catalog/services/') ? services : [] }) as Response);
  render(<MemoryRouter><Landing /></MemoryRouter>);
}
test('art evaluation CTA uses published quote specialty even when service has a custom name', async () => {
  fixture([{ id: 17, slug: 'avaliacao-artistica', name: 'Sua próxima cor', price_type: 'quote', specialty: 'colorimetry', price: '0.00', duration_min: 45, description: '', active: true }]);
  await waitFor(() => expect(screen.getByRole('link', { name: 'Avaliar Colorimetria' }).getAttribute('href')).toBe('/app?servicos=17'));
  expect(decodeURIComponent(screen.getByRole('link', { name: 'Avaliar Freestyle' }).getAttribute('href') || '')).toContain('https://wa.me/5562993397680?text=Olá! Quero combinar uma avaliação de Freestyle com o Elcio.');
});
test('unavailable catalog keeps art visible but does not fabricate a bookable specialty', async () => {
  fixture([], true);
  expect(decodeURIComponent((await screen.findByRole('link', { name: 'Avaliar Colorimetria' })).getAttribute('href') || '')).toContain('https://wa.me/5562993397680?text=Olá! Quero combinar uma avaliação de Colorimetria com o Elcio.');
  expect(decodeURIComponent(screen.getByRole('link', { name: 'Avaliar Freestyle' }).getAttribute('href') || '')).toContain('https://wa.me/5562993397680?text=Olá! Quero combinar uma avaliação de Freestyle com o Elcio.');
  expect(screen.queryByRole('link', { name: 'Agendar Sua próxima cor' })).toBeNull();
});
