const DEFAULT_AXIOM_API_URL = 'https://api.axiom.co';
const DEFAULT_TIMEOUT_MS = 1200;

export function buildAxiomIngestRequest(event, env = process.env) {
  const config = axiomConfig(env);
  if (!config) return null;

  return {
    url: `${config.apiUrl}/v1/datasets/${encodeURIComponent(config.dataset)}/ingest`,
    options: {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([event]),
    },
    timeoutMs: config.timeoutMs,
  };
}

export async function sendAxiomEvent(event, env = process.env, fetchImpl = globalThis.fetch) {
  if (typeof fetchImpl !== 'function') return false;

  const request = buildAxiomIngestRequest(event, env);
  if (!request) return false;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), request.timeoutMs);

  try {
    const response = await fetchImpl(request.url, {
      ...request.options,
      signal: controller.signal,
    });

    if (!response.ok) {
      console.warn(JSON.stringify({
        source: 'axiom_ingest',
        status: response.status,
        dataset: safeDatasetName(env.AXIOM_DATASET),
      }));
      return false;
    }

    return true;
  } catch (error) {
    console.warn(JSON.stringify({
      source: 'axiom_ingest',
      status: 'failed',
      reason: error?.name === 'AbortError' ? 'timeout' : 'request_failed',
      dataset: safeDatasetName(env.AXIOM_DATASET),
    }));
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

function axiomConfig(env) {
  const token = firstNonEmpty(env.AXIOM_API_TOKEN, env.AXIOM_TOKEN);
  const dataset = safeDatasetName(env.AXIOM_DATASET);
  if (!token || !dataset) return null;

  return {
    token,
    dataset,
    apiUrl: safeApiUrl(env.AXIOM_API_URL || DEFAULT_AXIOM_API_URL),
    timeoutMs: safeTimeout(env.AXIOM_INGEST_TIMEOUT_MS),
  };
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function safeDatasetName(value) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/[^A-Za-z0-9-]/g, '').slice(0, 128);
}

function safeApiUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return DEFAULT_AXIOM_API_URL;
    url.pathname = url.pathname.replace(/\/+$/, '');
    url.search = '';
    url.hash = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return DEFAULT_AXIOM_API_URL;
  }
}

function safeTimeout(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_TIMEOUT_MS;
  return Math.min(Math.max(parsed, 250), 5000);
}
