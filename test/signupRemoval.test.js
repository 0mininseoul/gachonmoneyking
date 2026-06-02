import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appSource = readFileSync(resolve(__dirname, '../src/App.jsx'), 'utf8');

test('signup route and import are gone', () => {
  assert.doesNotMatch(appSource, /path="\/signup"/);
  assert.doesNotMatch(appSource, /SignupView/);
});

test('footer no longer links to signup', () => {
  assert.doesNotMatch(appSource, /navigate\('\/signup'\)/);
  assert.doesNotMatch(appSource, /t\('signup_link'\)/);
});

test('SignupView component file is removed', () => {
  assert.equal(existsSync(resolve(__dirname, '../src/components/SignupView.jsx')), false);
});
