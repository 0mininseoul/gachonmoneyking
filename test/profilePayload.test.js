import test from 'node:test';
import assert from 'node:assert/strict';
import { translations } from '../src/i18n/translations.js';
import {
  buildProfilePayload,
  isProfileFormComplete,
} from '../src/lib/profilePayload.js';

test('requires profile fields plus terms and privacy consent before profile save', () => {
  assert.equal(isProfileFormComplete({
    nickname: 'money_king',
    nationality: 'vi',
    phoneNumber: '010-1234-5678',
    termsAgreed: true,
    privacyAgreed: true,
  }), true);

  assert.equal(isProfileFormComplete({
    nickname: 'money_king',
    nationality: 'vi',
    phoneNumber: '   ',
    termsAgreed: true,
    privacyAgreed: true,
  }), false);

  assert.equal(isProfileFormComplete({
    nickname: '',
    nationality: 'vi',
    phoneNumber: '010-1234-5678',
    termsAgreed: true,
    privacyAgreed: true,
  }), false);

  assert.equal(isProfileFormComplete({
    nickname: 'money_king',
    nationality: 'vi',
    phoneNumber: '010-1234-5678',
    termsAgreed: true,
    privacyAgreed: false,
  }), false);
});

test('builds profile payload with required phone number and without gender', () => {
  const payload = buildProfilePayload({
    user: {
      id: 'user-1',
      email: 'student@example.com',
      user_metadata: {
        name: 'Kakao Name',
        avatar_url: 'https://example.com/avatar.png',
        gender: 'female',
      },
    },
    nickname: '  leaderboard_star  ',
    nationality: 'zh',
    phoneNumber: ' 010-9876-5432 ',
    termsAgreed: true,
    privacyAgreed: true,
    marketingConsent: true,
    agreementTimestamp: '2026-06-01T12:00:00.000Z',
  });

  assert.deepEqual(payload, {
    id: 'user-1',
    nickname: 'leaderboard_star',
    nationality: 'zh',
    real_name: 'Kakao Name',
    phone_number: '010-9876-5432',
    terms_agreed: true,
    terms_agreed_at: '2026-06-01T12:00:00.000Z',
    privacy_agreed: true,
    privacy_agreed_at: '2026-06-01T12:00:00.000Z',
    marketing_consent: true,
    email: 'student@example.com',
    avatar_url: 'https://example.com/avatar.png',
  });
  assert.equal(Object.hasOwn(payload, 'gender'), false);
});

test('profile phone and agreement copy exists for every locale', () => {
  for (const [locale, copy] of Object.entries(translations)) {
    assert.ok(copy.phone_number, `${locale} missing phone_number`);
    assert.ok(copy.enter_phone_number, `${locale} missing enter_phone_number`);
    assert.ok(copy.phone_number_hint, `${locale} missing phone_number_hint`);
    assert.ok(copy.agree_all, `${locale} missing agree_all`);
    assert.match(copy.terms_required_label, /\{terms\}/, `${locale} missing terms label placeholder`);
    assert.match(copy.privacy_required_label, /\{privacy\}/, `${locale} missing privacy label placeholder`);
    assert.match(copy.profile_terms_notice, /\{terms\}/, `${locale} missing terms placeholder`);
    assert.match(copy.profile_terms_notice, /\{privacy\}/, `${locale} missing privacy placeholder`);
  }
});
