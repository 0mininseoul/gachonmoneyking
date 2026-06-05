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

const EXPECTED_BANNER_DATES = {
  ko: '6/10(수)',
  en: '6/10 (Wed)',
  vi: '6/10 (Thứ Tư)',
  zh: '6/10 (周三)',
  mn: '6/10 (Лхагва)',
  uz: '6/10 (Chorshanba)',
  ja: '6/10(水)',
};

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

test('promo banner says the service runs until June 10 Wednesday', () => {
  for (const locale of LOCALES) {
    const value = translations[locale].banner_promo;
    assert.match(value, new RegExp(EXPECTED_BANNER_DATES[locale].replace(/[()]/g, '\\$&')));
    assert.doesNotMatch(value, /6\/8|월\)|Mon|Thứ Hai|周一|Даваа|Dushanba|月\)/);
  }
});

const CONVERSION_KEYS = [
  'reg_complete_title', 'reg_complete_desc', 'verify_optional_btn', 'verify_optional_hint',
  'login_sheet_title', 'login_sheet_desc', 'login_provider_kakao', 'login_provider_google',
  'login_sheet_privacy_note', 'participants_live_count', 'curiosity_you_row',
];

test('every locale defines all conversion-improvement keys', () => {
  for (const locale of LOCALES) {
    for (const key of CONVERSION_KEYS) {
      assert.ok(translations[locale][key], `missing ${key} in ${locale}`);
    }
  }
});

test('participants_live_count keeps its {count} placeholder', () => {
  for (const locale of LOCALES) {
    assert.match(translations[locale].participants_live_count, /\{count\}/);
  }
});
