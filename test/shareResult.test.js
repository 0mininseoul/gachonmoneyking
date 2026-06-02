import test from 'node:test';
import assert from 'node:assert/strict';
import { buildShareUrl } from '../src/lib/shareResult.js';

test('buildShareUrl joins origin and record id', () => {
  assert.equal(buildShareUrl('https://x.app', 'abc'), 'https://x.app/r/abc');
});

test('buildShareUrl trims a trailing slash on origin', () => {
  assert.equal(buildShareUrl('https://x.app/', 'abc'), 'https://x.app/r/abc');
});
