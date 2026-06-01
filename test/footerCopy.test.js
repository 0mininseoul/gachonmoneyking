import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appSource = readFileSync(resolve(__dirname, '../src/App.jsx'), 'utf8');

test('footer omits company registration details but keeps contact email', () => {
  assert.doesNotMatch(appSource, /Company:/);
  assert.doesNotMatch(appSource, /BRN:/);
  assert.doesNotMatch(appSource, /Address:/);
  assert.match(appSource, /contact@ascentum\.co\.kr/);
});
