// test/authProviders.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { AUTH_PROVIDERS, isSupportedProvider, buildOAuthOptions } from '../src/lib/authProviders.js';

test('kakao and google are supported, others are not', () => {
  assert.deepEqual(AUTH_PROVIDERS, ['kakao', 'google']);
  assert.equal(isSupportedProvider('kakao'), true);
  assert.equal(isSupportedProvider('google'), true);
  assert.equal(isSupportedProvider('facebook'), false);
});

test('buildOAuthOptions returns redirectTo set to origin', () => {
  assert.deepEqual(buildOAuthOptions('https://gachonmoneyking.vercel.app'), {
    redirectTo: 'https://gachonmoneyking.vercel.app',
  });
});
