# Observability

This service uses two analytics/logging paths:

- Amplitude: product analytics, journey events, and session replay.
- Axiom: sanitized operational logs for CLI-driven error and behavior analysis.

## Axiom

Dataset: `gachon-money-king-logs`

Vercel Production environment variables:

```sh
AXIOM_DATASET=gachon-money-king-logs
AXIOM_API_TOKEN=<Axiom ingest API token>
AXIOM_API_URL=https://api.axiom.co
AXIOM_INGEST_TIMEOUT_MS=1200
```

`AXIOM_API_TOKEN` must be a server-side Vercel env var. Do not expose it with a `VITE_` or `NEXT_PUBLIC_` prefix.

The `/api/ops-log` endpoint writes the same sanitized payload to Vercel runtime logs and, when Axiom is configured, to Axiom. Supabase verification-stage logs reach Axiom through `VERCEL_OPS_LOG_ENDPOINT`, so the deployed Supabase Edge Function should keep this set to the production ops-log endpoint.

After changing Vercel env vars, redeploy production so the serverless function sees the new values.

Local Axiom CLI on this machine is configured for org `ascentum02-ygdk` and dataset query access. For another machine, create a 30-day Axiom API token with:

- Individual dataset `gachon-money-king-logs`: `Query` read.
- Org level permissions: `Datasets` read.

With this query-scoped token, `axiom auth status` can return an Axiom API error even when queries work. Verify access with an `axiom query` command instead.

## Useful CLI Queries

Latest production operational logs:

```sh
axiom query "['gachon-money-king-logs'] | where vercelEnv == 'production' | sort by _time desc | limit 50"
```

Recent verification failures:

```sh
axiom query "['gachon-money-king-logs'] | where eventName == 'Balance Verification Failed' or properties.function_stage == 'verify_balance_failed' | sort by _time desc | limit 50"
```

Verification stages grouped by request:

```sh
axiom query "['gachon-money-king-logs'] | where eventName == 'Balance Verification Function Stage' | sort by _time asc | project _time, requestId, properties.function_stage, properties.function_step, properties.level, properties.error_code"
```
