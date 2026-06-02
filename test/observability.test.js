import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { safeErrorCode } from '../src/lib/analyticsEvents.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function readProjectFile(path) {
  return readFileSync(resolve(root, path), 'utf8');
}

test('Amplitude taxonomy covers the core user journey and admin actions', () => {
  const taxonomyPath = resolve(root, 'src/lib/analyticsEvents.js');
  assert.equal(existsSync(taxonomyPath), true, 'missing analytics event taxonomy');

  const taxonomy = readProjectFile('src/lib/analyticsEvents.js');
  const requiredEvents = [
    'Language Changed',
    'Login Clicked',
    'Login Completed',
    'Logout Clicked',
    'Profile Step Completed',
    'Profile Save Succeeded',
    'Balance Upload Started',
    'Balance Verification Succeeded',
    'Balance Verification Failed',
    'Leaderboard Tab Selected',
    'Result Share Started',
    'Result Share Completed',
    'Correction Request Submitted',
    'Shared Result Viewed',
    'Admin Verification Updated',
  ];

  for (const eventName of requiredEvents) {
    assert.match(taxonomy, new RegExp(`['"]${eventName}['"]`), `missing event ${eventName}`);
  }
});

test('App emits custom Amplitude events for key interactions beyond QR opens', () => {
  const appSource = readProjectFile('src/App.jsx');
  const leaderboardSource = readProjectFile('src/components/Leaderboard.jsx');

  assert.match(appSource, /trackUserAction/);
  assert.match(leaderboardSource, /trackUserAction/);

  const expectedUsage = [
    'EVENTS.LOGIN_CLICKED',
    'EVENTS.LOGIN_COMPLETED',
    'EVENTS.LOGOUT_CLICKED',
    'EVENTS.LANGUAGE_CHANGED',
    'EVENTS.PROFILE_STEP_COMPLETED',
    'EVENTS.PROFILE_SAVE_SUCCEEDED',
    'EVENTS.BALANCE_UPLOAD_STARTED',
    'EVENTS.BALANCE_VERIFICATION_SUCCEEDED',
    'EVENTS.BALANCE_VERIFICATION_FAILED',
    'EVENTS.RESULT_SHARE_STARTED',
    'EVENTS.RESULT_SHARE_COMPLETED',
    'EVENTS.CORRECTION_REQUEST_SUBMITTED',
    'EVENTS.SHARED_RESULT_VIEWED',
    'EVENTS.ADMIN_VERIFICATION_UPDATED',
  ];

  for (const usage of expectedUsage) {
    assert.match(appSource + leaderboardSource, new RegExp(usage.replace('.', '\\.')), `missing ${usage}`);
  }
});

test('anonymous visitors are not reset on every unauthenticated app load', () => {
  const appSource = readProjectFile('src/App.jsx');
  const resetCalls = appSource.match(/clearAnalyticsUser\(\);/g) || [];

  assert.equal(resetCalls.length, 1, 'clearAnalyticsUser should only run during explicit logout');
  assert.match(appSource, /const handleLogout = async \(\) => \{[\s\S]*clearAnalyticsUser\(\);/);
});

test('safe error codes do not preserve raw ids or paths from provider messages', () => {
  const code = safeErrorCode({
    message: 'Failed to download screenshot: users/123e4567-e89b-12d3-a456-426614174000/private.png',
  });

  assert.doesNotMatch(code, /123e4567|426614174000|private|png|users/);
  assert.equal(code, 'storage_download_failed');
});

test('Vercel ops log endpoint allowlists operational events and redacts unsafe values', () => {
  const apiPath = resolve(root, 'api/ops-log.js');
  assert.equal(existsSync(apiPath), true, 'missing Vercel ops log endpoint');

  const apiSource = readProjectFile('api/ops-log.js');
  assert.match(apiSource, /ALLOWED_OPERATIONAL_EVENTS/);
  assert.match(apiSource, /console\.log\(JSON\.stringify/);
  assert.match(apiSource, /requestId/);
  assert.match(apiSource, /sanitizeProperties/);
  assert.doesNotMatch(apiSource, /phone_number|real_name|screenshot_url|service_role/i);

  const analyticsSource = readProjectFile('src/lib/analytics.js');
  assert.match(analyticsSource, /sendOperationalLog/);
  assert.match(analyticsSource, /\/api\/ops-log/);
});

test('verify-balance function writes structured non-PII logs with request ids', () => {
  const source = readProjectFile('supabase/functions/verify-balance/index.ts');

  assert.match(source, /requestId/);
  assert.match(source, /logFunctionEvent/);
  assert.match(source, /verify_balance_started/);
  assert.match(source, /verify_balance_completed/);
  assert.match(source, /verify_balance_failed/);
  assert.match(source, /console\.(info|error)\(JSON\.stringify/);
  assert.match(source, /requestId,\s*stage/);
  assert.doesNotMatch(source, /console\.(info|log|error)\([^)]*filePath/);
  assert.doesNotMatch(source, /console\.(info|log|error)\([^)]*userId/);
});
