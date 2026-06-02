import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildFallbackRankReport,
  buildRankInsight,
  normalizeRankReport,
} from '../src/lib/rankReport.js';

const rankings = [
  { id: 'a', user_id: 'a', nickname: '加川摸鱼王', nationality: 'zh', balance: 1200000 },
  { id: 'b', user_id: 'b', nickname: 'di_lam_them', nationality: 'vi', balance: 820000 },
  { id: 'c', user_id: 'c', nickname: 'osh_plov', nationality: 'uz', balance: 742000 },
  { id: 'd', user_id: 'd', nickname: 'them_bun_cha', nationality: 'vi', balance: 240000 },
  { id: 'e', user_id: 'e', nickname: 'broke_mode', nationality: 'uz', balance: 12000 },
];

test('builds rank insight with overall, nationality, and gap metrics', () => {
  const insight = buildRankInsight({
    userId: 'c',
    userRecord: rankings[2],
    rankings,
  });

  assert.deepEqual(insight, {
    nickname: 'osh_plov',
    nationality: 'uz',
    balance: 742000,
    overallRank: 3,
    overallTotal: 5,
    nationalRank: 1,
    nationalTotal: 2,
    percentileTop: 60,
    peopleAbove: 2,
    peopleBelow: 2,
    gapToNextRank: 78001,
    gapToTop10: 0,
    balanceZone: 'maintenance',
  });
});

test('classifies top-ranked users into money king zone with no next-rank gap', () => {
  const insight = buildRankInsight({
    userId: 'a',
    userRecord: rankings[0],
    rankings,
  });

  assert.equal(insight.overallRank, 1);
  assert.equal(insight.peopleBelow, 4);
  assert.equal(insight.gapToNextRank, 0);
  assert.equal(insight.balanceZone, 'money_king');
});

test('normalizes missing Gemini report fields with fallback roast copy', () => {
  const insight = buildRankInsight({
    userId: 'c',
    userRecord: rankings[2],
    rankings,
  });

  const fallback = buildFallbackRankReport(insight, 'ko');
  const normalized = normalizeRankReport({
    mainCopy: '',
    personaName: 'Survivor',
    shareCards: [{ type: 'rank', title: 'Top 60%', subtitle: '' }],
  }, insight, 'ko');

  assert.equal(normalized.personaName, 'Survivor');
  assert.notEqual(normalized.mainCopy, '');
  assert.equal(normalized.personaDescription, fallback.personaDescription);
  assert.equal(normalized.shareCards.length, 3);
  assert.equal(normalized.shareCards[0].title, 'Top 60%');
  assert.notEqual(normalized.shareCards[0].subtitle, '');
});
