import { expect, test } from 'vitest';
import { localDate, timeLabel } from './formatters';

test('agenda and change notices show Brasilia time independently of device timezone', () => {
  expect(timeLabel('2099-10-02T14:00:00-03:00')).toBe('14:00');
  expect(localDate(new Date('2099-10-02T01:00:00Z'))).toBe('2099-10-01');
});
