import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { Portfolio } from './sections/Portfolio/Portfolio';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const photos = [
  { id: 1, image_url: '/images/portfolio/look-09.jpg', image: '', alt: 'Desenho de leopardo', look: 'Freestyle', mandala: false, active: true, order: 1 },
  { id: 2, image_url: '/images/portfolio/look-08.jpg', image: '', alt: 'Cabelo rosa', look: 'Colorimetria', mandala: false, active: true, order: 2 },
];
function catalog() {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, status: 200, json: async () => photos } as Response);
}

test('published art opens in an accessible detail and Escape returns focus to its trigger', async () => {
  catalog(); render(<Portfolio />);
  const trigger = await screen.findByRole('button', { name: 'Ampliar: Desenho de leopardo' });
  fireEvent.click(trigger);
  expect(screen.getByRole('dialog', { name: 'Desenho de leopardo' })).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Agendar uma avaliação' }).getAttribute('href')).toBe('#avaliacao');
  fireEvent.keyDown(document, { key: 'Escape' });
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(document.activeElement).toBe(trigger);
});

test('art filters show only the selected published specialty and can restore all works', async () => {
  catalog(); render(<Portfolio />);
  await screen.findByAltText('Cabelo rosa');
  fireEvent.click(screen.getByRole('button', { name: 'Freestyle' }));
  expect(screen.queryByAltText('Cabelo rosa')).toBeNull();
  expect(screen.getByAltText('Desenho de leopardo')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Todos os trabalhos' }));
  expect(screen.getByAltText('Cabelo rosa')).toBeTruthy();
});
