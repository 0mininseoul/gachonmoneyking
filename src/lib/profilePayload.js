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
    && phoneNumber?.trim()
    && termsAgreed
    && privacyAgreed
  );
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
    phone_number: phoneNumber.trim(),
    terms_agreed: Boolean(termsAgreed),
    terms_agreed_at: termsAgreed ? agreedAt : null,
    privacy_agreed: Boolean(privacyAgreed),
    privacy_agreed_at: privacyAgreed ? agreedAt : null,
    marketing_consent: Boolean(marketingConsent),
    email: user.email || meta.email || '',
    avatar_url: meta.avatar_url || meta.picture || '',
  };
}
