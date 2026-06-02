import test from 'node:test';
import assert from 'node:assert/strict';
import { translations } from '../src/i18n/translations.js';
import {
  buildProfilePayload,
  isProfileFormComplete,
  isPhoneNumberComplete,
  joinPhoneSegments,
  splitPhoneNumber,
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
    phoneNumber: '010-123-',
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

test('normalizes phone number segments for three-field phone input', () => {
  assert.equal(joinPhoneSegments({
    first: '010',
    middle: '9876',
    last: '5432',
  }), '010-9876-5432');

  assert.equal(joinPhoneSegments({
    first: '010a',
    middle: '98-76',
    last: '54321',
  }), '010-9876-5432');

  assert.deepEqual(splitPhoneNumber('010-9876-5432'), {
    first: '010',
    middle: '9876',
    last: '5432',
  });

  assert.equal(isPhoneNumberComplete('010-9876-5432'), true);
  assert.equal(isPhoneNumberComplete('010-987-5432'), true);
  assert.equal(isPhoneNumberComplete('010-98-5432'), false);
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
  assert.equal(
    translations.ko.phone_number_hint,
    '상품 당첨 및 리더보드 수상 안내 등의 목적으로 수집됩니다.'
  );

  for (const [locale, copy] of Object.entries(translations)) {
    assert.ok(copy.phone_number, `${locale} missing phone_number`);
    assert.ok(copy.enter_phone_number, `${locale} missing enter_phone_number`);
    assert.ok(copy.phone_number_hint, `${locale} missing phone_number_hint`);
    assert.ok(copy.profile_step_nationality_title, `${locale} missing nationality step title`);
    assert.ok(copy.profile_step_nickname_title, `${locale} missing nickname step title`);
    assert.ok(copy.profile_step_phone_title, `${locale} missing phone step title`);
    assert.ok(copy.profile_step_consent_title, `${locale} missing consent step title`);
    assert.ok(copy.next_profile_step, `${locale} missing next_profile_step`);
    assert.ok(copy.previous_profile_step, `${locale} missing previous_profile_step`);
    assert.ok(copy.agree_all, `${locale} missing agree_all`);
    assert.match(copy.terms_required_label, /\{terms\}/, `${locale} missing terms label placeholder`);
    assert.match(copy.privacy_required_label, /\{privacy\}/, `${locale} missing privacy label placeholder`);
    assert.match(copy.profile_terms_notice, /\{terms\}/, `${locale} missing terms placeholder`);
    assert.match(copy.profile_terms_notice, /\{privacy\}/, `${locale} missing privacy placeholder`);
  }
});

test('rank report and upload trust copy exists for every locale', () => {
  const requiredKeys = [
    'anonymous_rank_cta',
    'upload_trust_title',
    'upload_trust_ai_reads',
    'upload_trust_public_identity',
    'upload_trust_delete',
    'upload_trust_reward',
    'anonymous_badge_label',
    'rank_report_title',
    'rank_report_overall',
    'rank_report_nationality',
    'rank_report_percentile',
    'rank_report_next_gap',
    'rank_report_people_below',
    'rank_report_share_title',
    'copy_share_card',
    'share_card_copied',
    'leaderboard_locked_label',
    'leaderboard_locked_desc',
    'leaderboard_unlocked_label',
    'leaderboard_unlocked_desc',
    'go_verify_balance_btn',
    'verify_step_label',
    'verify_page_subtitle',
    'verify_upload_hint',
  ];

  for (const [locale, copy] of Object.entries(translations)) {
    for (const key of requiredKeys) {
      assert.ok(copy[key], `${locale} missing ${key}`);
    }
  }
});
