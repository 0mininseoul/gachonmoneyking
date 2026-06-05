// test/participation.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { participantCounts, topNationality } from '../src/lib/participation.js';

const list = [
  { nationality: 'vi' }, { nationality: 'vi' }, { nationality: 'zh' }, { nationality: null },
];

test('participantCounts returns total and per-nationality counts', () => {
  const r = participantCounts(list);
  assert.equal(r.total, 4);
  assert.equal(r.byNationality.vi, 2);
  assert.equal(r.byNationality.zh, 1);
  assert.equal(r.byNationality.unknown, 1);
});

test('topNationality returns the most common code and count', () => {
  assert.deepEqual(topNationality(list), { code: 'vi', count: 2 });
});

test('topNationality returns null on empty list', () => {
  assert.equal(topNationality([]), null);
});
