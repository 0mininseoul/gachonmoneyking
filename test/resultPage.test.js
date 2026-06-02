import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appSource = readFileSync(resolve(__dirname, '../src/App.jsx'), 'utf8');

test('profile save navigates straight to verify-balance', () => {
  assert.match(appSource, /navigate\('\/verify-balance'\)/);
});

test('selecting nationality switches the active locale', () => {
  assert.match(appSource, /setLocale\(nationality\)/);
});

test('verify page drops the locked-balance strip and uses banking-app hint', () => {
  assert.doesNotMatch(appSource, /verify-status-strip/);
  const verifyBlock = appSource.slice(appSource.indexOf('function BalanceUploadView'));
  assert.match(verifyBlock, /t\('upload_desc'\)/);
  assert.doesNotMatch(verifyBlock, /t\('verify_upload_hint'\)/);
});
