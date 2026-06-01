export function isProfileFormComplete({
  nickname,
  nationality,
  phoneNumber,
  termsAgreed,
  privacyAgreed,
}) {
  return Boolean(
    nickname?.trim()
    && nationality?.trim()
    && isPhoneNumberComplete(phoneNumber)
    && termsAgreed
    && privacyAgreed
  );
}

export function sanitizePhoneSegment(value, maxLength) {
  return String(value || '').replace(/\D/g, '').slice(0, maxLength);
}

export function joinPhoneSegments({ first, middle, last }) {
  return [
    sanitizePhoneSegment(first, 3),
    sanitizePhoneSegment(middle, 4),
    sanitizePhoneSegment(last, 4),
  ].join('-');
}

export function splitPhoneNumber(phoneNumber) {
  const value = String(phoneNumber || '');
  const parts = value.split('-');

  if (parts.length >= 3) {
    return {
      first: sanitizePhoneSegment(parts[0], 3),
      middle: sanitizePhoneSegment(parts[1], 4),
      last: sanitizePhoneSegment(parts.slice(2).join(''), 4),
    };
  }

  const digits = sanitizePhoneSegment(value, 11);
  if (digits.length <= 3) {
    return { first: digits, middle: '', last: '' };
  }

  const last = digits.length > 7 ? digits.slice(-4) : '';
  const middleEnd = last ? digits.length - 4 : digits.length;

  return {
    first: digits.slice(0, 3),
    middle: digits.slice(3, middleEnd),
    last,
  };
}

export function normalizePhoneNumber(phoneNumber) {
  return joinPhoneSegments(splitPhoneNumber(phoneNumber));
}

export function isPhoneNumberComplete(phoneNumber) {
  return /^\d{2,3}-\d{3,4}-\d{4}$/.test(normalizePhoneNumber(phoneNumber));
}

export function buildProfilePayload({
  user,
  nickname,
  nationality,
  phoneNumber,
  termsAgreed,
  privacyAgreed,
  marketingConsent,
  agreementTimestamp,
}) {
  const meta = user?.user_metadata || {};
  const agreedAt = agreementTimestamp || new Date().toISOString();

  return {
    id: user.id,
    nickname: nickname.trim(),
    nationality,
    real_name: meta.name || meta.full_name || 'Kakao User',
    phone_number: normalizePhoneNumber(phoneNumber),
    terms_agreed: Boolean(termsAgreed),
    terms_agreed_at: termsAgreed ? agreedAt : null,
    privacy_agreed: Boolean(privacyAgreed),
    privacy_agreed_at: privacyAgreed ? agreedAt : null,
    marketing_consent: Boolean(marketingConsent),
    email: user.email || meta.email || '',
    avatar_url: meta.avatar_url || meta.picture || '',
  };
}
