import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appSource = readFileSync(resolve(__dirname, '../src/App.jsx'), 'utf8');
const cssSource = readFileSync(resolve(__dirname, '../src/index.css'), 'utf8');

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

test('analysis loader renders an eased progress gauge', () => {
  assert.match(appSource, /from '\.\/lib\/analysisProgress'/);
  assert.match(appSource, /loader-progress/);
  assert.match(appSource, /uploadProgress/);
});

test('celebration modal uses the spicy main copy + rank summary and no longer truncates', () => {
  const modal = appSource.slice(appSource.indexOf('showRankCard && userRecord'));
  assert.match(modal, /rankReport\?\.mainCopy/);
  assert.match(modal, /celebration_rank_summary/);
  const h2Block = cssSource.slice(cssSource.indexOf('.rank-celebration-card h2'));
  assert.doesNotMatch(h2Block.slice(0, 160), /white-space:\s*nowrap/);
});

test('dashboard collapses into a single ResultCard above the leaderboard', () => {
  assert.ok(existsSync(resolve(__dirname, '../src/components/ResultCard.jsx')));
  assert.match(appSource, /import \{ ResultCard \}/);
  assert.match(appSource, /<ResultCard/);
  assert.doesNotMatch(appSource, /rank-report-panel/);
  assert.doesNotMatch(appSource, /leaderboard-access-rail/);
});
