import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPosterQrEvent,
  createPosterQrUrl,
  normalizeLocale,
} from '../src/lib/qrAttribution.js';

test('normalizes only supported poster locales', () => {
  assert.equal(normalizeLocale('ko'), 'ko');
  assert.equal(normalizeLocale('KO'), 'ko');
  assert.equal(normalizeLocale('zh-CN'), 'zh');
  assert.equal(normalizeLocale('id'), 'en');
  assert.equal(normalizeLocale(null), 'en');
});

test('builds a Poster QR Opened event from a QR campaign URL', () => {
  const event = buildPosterQrEvent(
    'https://gachonmoneyking.vercel.app/?lang=vi&utm_source=poster&utm_medium=qr&utm_campaign=2026_spring&utm_content=vi_main',
    'en'
  );

  assert.deepEqual(event, {
    eventName: 'Poster QR Opened',
    properties: {
      language: 'vi',
      campaign: '2026_spring',
      poster_id: 'vi_main',
      qr_id: 'vi_main',
      utm_source: 'poster',
      utm_medium: 'qr',
      utm_campaign: '2026_spring',
      utm_content: 'vi_main',
      utm_term: '',
      landing_path: '/',
      landing_url: 'https://gachonmoneyking.vercel.app/?lang=vi&utm_source=poster&utm_medium=qr&utm_campaign=2026_spring&utm_content=vi_main',
    },
  });
});

test('does not emit a QR event for ordinary traffic', () => {
  assert.equal(buildPosterQrEvent('https://gachonmoneyking.vercel.app/?lang=ko', 'ko'), null);
});

test('creates stable language-specific poster QR URLs', () => {
  assert.equal(
    createPosterQrUrl('mn'),
    'https://gachonmoneyking.vercel.app/?lang=mn&utm_source=poster&utm_medium=qr&utm_campaign=2026_spring&utm_content=mn_main'
  );
});
