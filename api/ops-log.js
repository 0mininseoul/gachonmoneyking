const ALLOWED_OPERATIONAL_EVENTS = new Set([
  'Login Failed',
  'Profile Save Succeeded',
  'Profile Save Failed',
  'Balance Upload Started',
  'Balance Upload Failed',
  'Balance Verification Started',
  'Balance Verification Succeeded',
  'Balance Verification Rejected',
  'Balance Verification Failed',
  'Correction Request Submitted',
  'Correction Request Succeeded',
  'Correction Request Failed',
  'Admin Verification Updated',
  'Admin Correction Cleared',
]);

const BLOCKED_PROPERTY_KEY = /(phone|email|name|nick|avatar|screen|image|token|secret|credential|key|amount|money|asset|balance|file|path)/i;

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const body = typeof req.body === 'object' && req.body !== null
    ? req.body
    : await readJsonBody(req);
  const eventName = typeof body?.eventName === 'string' ? body.eventName : '';

  if (!ALLOWED_OPERATIONAL_EVENTS.has(eventName)) {
    res.status(204).end();
    return;
  }

  const payload = {
    source: 'vercel_ops_log',
    eventName,
    requestId: safeString(body?.requestId, 96),
    properties: sanitizeProperties(body?.properties || {}),
    vercelEnv: process.env.VERCEL_ENV || 'local',
    timestamp: new Date().toISOString(),
  };

  console.log(JSON.stringify(payload));
  res.status(204).end();
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function sanitizeProperties(properties) {
  const sanitized = {};
  for (const [property, value] of Object.entries(properties || {})) {
    if (BLOCKED_PROPERTY_KEY.test(property)) continue;
    if (value === undefined || typeof value === 'function') continue;
    if (typeof value === 'string') {
      sanitized[property] = safeString(value, 160);
    } else if (typeof value === 'number' || typeof value === 'boolean' || value === null) {
      sanitized[property] = value;
    } else if (Array.isArray(value)) {
      sanitized[property] = value.slice(0, 20).map((item) => safeString(item, 80));
    } else {
      sanitized[property] = safeString(value, 160);
    }
  }
  return sanitized;
}

function safeString(value, maxLength) {
  return String(value || '')
    .replace(/[^\w .:/-]/g, '')
    .slice(0, maxLength);
}
