import { expect, test } from 'vitest';
import { clientDestination } from './authDestination';

test.each(['https://example.com/app?servicos=3', '//example.com/app', '/app/../../barber', '/barber', 'javascript:alert(1)', '/app\\example.com'])('rejects unsupported login destination %s', destination => {
  expect(clientDestination(destination)).toBe('/app');
});
test('retains only supported client parameters', () => {
  expect(clientDestination('/app?servicos=3,4&aba=historico&pagamento=9&redirect=https://example.com')).toBe('/app?servicos=3%2C4&aba=historico&pagamento=9');
  expect(clientDestination('/app?servicos=-1&aba=admin&pagamento=evil')).toBe('/app');
});
