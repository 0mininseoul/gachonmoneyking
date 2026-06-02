import test from 'node:test';
import assert from 'node:assert/strict';
import { translations } from '../src/i18n/translations.js';

const LOCALES = ['ko', 'en', 'vi', 'zh', 'mn', 'uz', 'ja'];
const NEW_KEYS = [
  'analyzing_stage_upload',
  'analyzing_stage_read',
  'analyzing_stage_rank',
  'analyzing_stage_report',
  'celebration_rank_summary',
  'shared_result_headline',
  'shared_not_found',
  'share_result_btn',
  'copy_link_done',
  'correction_attach_image',
];

test('every locale defines all new keys', () => {
  for (const locale of LOCALES) {
    for (const key of NEW_KEYS) {
      assert.ok(translations[locale][key], `missing ${key} in ${locale}`);
    }
  }
});

test('anonymous_rank_cta no longer says "anonymous" in any locale', () => {
  const banned = [/익명/, /anonymous/i, /匿名/, /ẩn danh/i, /нууц/, /anonim/i];
  for (const locale of LOCALES) {
    const value = translations[locale].anonymous_rank_cta;
    for (const re of banned) {
      assert.doesNotMatch(value, re, `${locale} still contains anonymous wording`);
    }
  }
});

test('templated keys keep their placeholders', () => {
  for (const locale of LOCALES) {
    assert.match(translations[locale].celebration_rank_summary, /\{rank\}/);
    assert.match(translations[locale].celebration_rank_summary, /\{percentile\}/);
    assert.match(translations[locale].shared_result_headline, /\{nickname\}/);
  }
});
