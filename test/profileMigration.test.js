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
const rankReportMigrationSql = readFileSync(
  resolve(__dirname, '../supabase/migrations/20260602063418_add_rank_report_json.sql'),
  'utf8'
);
const verifyBalanceSource = readFileSync(
  resolve(__dirname, '../supabase/functions/verify-balance/index.ts'),
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

test('rank report migration stores generated result JSON without changing leaderboard visibility', () => {
  assert.match(rankReportMigrationSql, /add\s+column\s+if\s+not\s+exists\s+result_report_json\s+jsonb/i);
  assert.match(rankReportMigrationSql, /add\s+column\s+if\s+not\s+exists\s+result_report_generated_at/i);
  assert.doesNotMatch(rankReportMigrationSql, /drop\s+policy|drop\s+table|disable\s+row\s+level\s+security/i);
});

test('verify-balance function generates spicy anonymous rank report copy', () => {
  assert.match(verifyBalanceSource, /result_report_json/);
  assert.match(verifyBalanceSource, /lightly mocking/i);
  assert.match(verifyBalanceSource, /Do not mention Gemini/i);
  assert.match(verifyBalanceSource, /nickname \+ nationality/i);
});

test('verify-balance function uses Vertex AI credentials instead of Gemini API keys', () => {
  assert.match(verifyBalanceSource, /GOOGLE_CLOUD_PROJECT/);
  assert.match(verifyBalanceSource, /GOOGLE_CLOUD_LOCATION/);
  assert.match(verifyBalanceSource, /GOOGLE_GENAI_USE_VERTEXAI/);
  assert.match(verifyBalanceSource, /GOOGLE_SERVICE_ACCOUNT_KEY_BASE64/);
  assert.match(verifyBalanceSource, /GOOGLE_APPLICATION_CREDENTIALS/);
  assert.match(verifyBalanceSource, /aiplatform\.googleapis\.com/);
  assert.doesNotMatch(verifyBalanceSource, /GEMINI_API_KEY/);
  assert.doesNotMatch(verifyBalanceSource, /generativelanguage\.googleapis\.com/);
  assert.doesNotMatch(verifyBalanceSource, /@google\/generative-ai/);
});
