import test from 'node:test';
import assert from 'node:assert/strict';
import { nextProgress, stageForProgress, ANALYSIS_TARGET } from '../src/lib/analysisProgress.js';

test('nextProgress eases up but never exceeds the target', () => {
  let p = 0;
  for (let i = 0; i < 500; i++) p = nextProgress(p);
  assert.ok(p <= ANALYSIS_TARGET, `expected <= ${ANALYSIS_TARGET}, got ${p}`);
  assert.ok(p > 80, `expected meaningful progress, got ${p}`);
});

test('nextProgress is strictly increasing below target', () => {
  const a = nextProgress(0);
  const b = nextProgress(a);
  assert.ok(b > a);
});

test('stageForProgress maps thresholds to stage keys', () => {
  assert.equal(stageForProgress(0), 'upload');
  assert.equal(stageForProgress(24), 'upload');
  assert.equal(stageForProgress(25), 'read');
  assert.equal(stageForProgress(54), 'read');
  assert.equal(stageForProgress(55), 'rank');
  assert.equal(stageForProgress(84), 'rank');
  assert.equal(stageForProgress(85), 'report');
  assert.equal(stageForProgress(100), 'report');
});
