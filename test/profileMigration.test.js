import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationSql = readFileSync(
  resolve(__dirname, '../supabase/migrations/20260601120941_drop_profile_gender_require_contact_fields.sql'),
  'utf8'
);

test('profile consent migration preserves legacy gender data while making it optional', () => {
  assert.doesNotMatch(migrationSql, /drop\s+column\s+if\s+exists\s+gender/i);
  assert.match(migrationSql, /alter\s+column\s+gender\s+drop\s+not\s+null/i);
});

test('profile consent migration adds required agreement columns', () => {
  assert.match(migrationSql, /add\s+column\s+if\s+not\s+exists\s+terms_agreed/i);
  assert.match(migrationSql, /add\s+column\s+if\s+not\s+exists\s+privacy_agreed/i);
  assert.match(migrationSql, /add\s+column\s+if\s+not\s+exists\s+terms_agreed_at/i);
  assert.match(migrationSql, /add\s+column\s+if\s+not\s+exists\s+privacy_agreed_at/i);
});
