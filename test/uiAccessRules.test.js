import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appSource = readFileSync(resolve(__dirname, '../src/App.jsx'), 'utf8');
const leaderboardSource = readFileSync(resolve(__dirname, '../src/components/Leaderboard.jsx'), 'utf8');

test('leaderboard balances unlock only after the current user has a verified leaderboard record', () => {
  assert.match(appSource, /const\s+canViewLeaderboardBalances\s*=\s*Boolean\(\s*userRecord\s*&&\s*userRecord\.status\s*===\s*['"]verified['"]\s*\)/);
  assert.doesNotMatch(appSource, /isAuthenticated=\{!!user\}/);
  assert.doesNotMatch(appSource, /isAuthenticated=\{true\}/);
  assert.match(leaderboardSource, /canViewBalances/);
});

test('balance upload is handled on a dedicated protected route instead of inline dashboard card', () => {
  assert.match(appSource, /path="\/verify-balance"/);
  assert.match(appSource, /function\s+BalanceUploadView/);
  assert.doesNotMatch(appSource, /className="user-dashboard-card linear-card"[\s\S]*id="screenshot-file-upload"[\s\S]*<Leaderboard/);
});
