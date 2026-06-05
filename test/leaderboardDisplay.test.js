// test/leaderboardDisplay.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldRevealBalance, formatBalanceLabel, MASKED_BALANCE } from '../src/lib/leaderboardDisplay.js';

test('verified viewer always sees the balance', () => {
  assert.equal(shouldRevealBalance({ canViewBalances: true, overallRank: 50, revealTopN: 3 }), true);
});

test('global top-N is revealed to anonymous viewers', () => {
  assert.equal(shouldRevealBalance({ overallRank: 1, revealTopN: 3 }), true);
  assert.equal(shouldRevealBalance({ overallRank: 3, revealTopN: 3 }), true);
});

test('rank below N stays masked', () => {
  assert.equal(shouldRevealBalance({ overallRank: 4, revealTopN: 3 }), false);
});

test('no revealTopN and not verified means masked', () => {
  assert.equal(shouldRevealBalance({ overallRank: 1, revealTopN: 0 }), false);
  assert.equal(shouldRevealBalance({ overallRank: null, revealTopN: 3 }), false);
});

test('formatBalanceLabel masks or formats KRW with thousands separators', () => {
  assert.equal(formatBalanceLabel(1234567, true), '1,234,567 KRW');
  assert.equal(formatBalanceLabel(1234567, false), MASKED_BALANCE);
});
