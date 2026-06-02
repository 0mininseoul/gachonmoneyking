import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatKstDate,
  formatKstTimestamp,
  getKstEventProperties,
} from '../src/lib/kstTime.js';

test('formats timestamps as Korea Standard Time without changing the underlying instant', () => {
  const timestamp = '2026-06-01T15:34:56.789Z';

  assert.equal(formatKstTimestamp(timestamp), '2026-06-02T00:34:56.789+09:00');
  assert.equal(formatKstDate(timestamp), '2026-06-02');
});

test('builds KST event properties for analytics and logs', () => {
  const properties = getKstEventProperties('2026-06-01T15:34:56.789Z');

  assert.deepEqual(properties, {
    event_time_kst: '2026-06-02T00:34:56.789+09:00',
    event_date_kst: '2026-06-02',
    event_hour_kst: 0,
    event_timezone: 'Asia/Seoul',
  });
});
