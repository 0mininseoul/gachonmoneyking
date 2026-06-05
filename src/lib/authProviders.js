// src/lib/authProviders.js
export const AUTH_PROVIDERS = ['kakao', 'google'];

export function isSupportedProvider(provider) {
  return AUTH_PROVIDERS.includes(provider);
}

export function buildOAuthOptions(origin) {
  return { redirectTo: origin };
}
