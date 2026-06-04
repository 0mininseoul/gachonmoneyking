import * as amplitude from '@amplitude/analytics-browser';
import { sessionReplayPlugin } from '@amplitude/plugin-session-replay-browser';
import { buildOnlineLinkEvent, buildPosterQrEvent } from './qrAttribution';
import { OPERATIONAL_EVENTS } from './analyticsEvents';
import { formatKstTimestamp, getKstEventProperties } from './kstTime';

let initialized = false;
const OPS_LOG_ENDPOINT = '/api/ops-log';
const BLOCKED_PROPERTY_KEY = /(phone|email|name|nick|avatar|screen|image|token|secret|credential|key|balance|file|path)/i;
const DEFAULT_SESSION_REPLAY_SAMPLE_RATE = 0.01;
const SESSION_REPLAY_BLOCK_SELECTORS = [
  '.amp-block',
  '.admin-thumb',
  '.admin-col-img',
  '.admin-correction-img-link',
];
const SESSION_REPLAY_MASK_SELECTORS = [
  '.amp-mask',
  '.verify-balance-summary',
  '.result-card',
  '.balance-amount',
  '.admin-col-user',
  '.admin-col-meta',
  '.admin-col-balance',
  '.admin-correction-text',
  '.correction-existing',
  '.correction-file-name',
  '.phone-segment-grid',
];
const KST_EVENT_PROPERTY_KEYS = [
  'event_time_kst',
  'event_date_kst',
  'event_hour_kst',
  'event_timezone',
];

export function initAnalytics() {
  if (initialized || typeof window === 'undefined') return initialized;

  const apiKey = import.meta.env.VITE_AMPLITUDE_API_KEY;
  if (!apiKey) return false;

  const sessionReplaySampleRate = getSessionReplaySampleRate();
  const sessionReplayTracking = sessionReplayPlugin({
    sampleRate: sessionReplaySampleRate,
    forceSessionTracking: true,
    debugMode: import.meta.env.DEV && import.meta.env.VITE_AMPLITUDE_SESSION_REPLAY_DEBUG === 'true',
    useWebWorker: true,
    privacyConfig: {
      defaultMaskLevel: 'conservative',
      blockSelector: SESSION_REPLAY_BLOCK_SELECTORS,
      maskSelector: SESSION_REPLAY_MASK_SELECTORS,
    },
  });
  amplitude.add(kstTimestampEnrichmentPlugin());
  amplitude.add(sessionReplayTracking).promise.catch(() => {
    // Replay capture must never block analytics events or app startup.
  });

  amplitude.init(apiKey, {
    defaultTracking: {
      attribution: true,
      pageViews: true,
      sessions: true,
      fileDownloads: false,
      formInteractions: false,
    },
  });
  initialized = true;
  return true;
}

function kstTimestampEnrichmentPlugin() {
  return {
    name: 'kst-timestamp-enrichment',
    type: 'enrichment',
    execute: async (event) => {
      const kstEventProperties = getKstEventProperties(event.time || Date.now());
      event.event_properties = {
        ...event.event_properties,
        ...Object.fromEntries(KST_EVENT_PROPERTY_KEYS.map((key) => [key, kstEventProperties[key]])),
      };
      return event;
    },
  };
}

function getSessionReplaySampleRate() {
  const rawSampleRate = import.meta.env.VITE_AMPLITUDE_SESSION_REPLAY_SAMPLE_RATE;
  if (rawSampleRate === undefined || rawSampleRate === '') return DEFAULT_SESSION_REPLAY_SAMPLE_RATE;

  const parsed = Number(rawSampleRate);
  if (!Number.isFinite(parsed)) return DEFAULT_SESSION_REPLAY_SAMPLE_RATE;
  return Math.min(Math.max(parsed, 0), 1);
}

export function trackEvent(eventName, properties = {}) {
  if (!initAnalytics()) return false;
  amplitude.track(eventName, sanitizeProperties({
    ...properties,
    ...getKstEventProperties(),
  }));
  return true;
}

export function trackUserAction(eventName, properties = {}, options = {}) {
  const enrichedProperties = {
    ...browserContext(),
    ...properties,
  };
  const tracked = trackEvent(eventName, enrichedProperties);

  if (options.operational || OPERATIONAL_EVENTS.has(eventName)) {
    sendOperationalLog(eventName, enrichedProperties);
  }

  return tracked;
}

export function setAnalyticsProfileId(profileId) {
  const normalizedProfileId = String(profileId || '').trim();
  if (!normalizedProfileId || !initAnalytics()) return false;
  amplitude.setUserId(normalizedProfileId);
  return true;
}

export function clearAnalyticsUser() {
  if (!initAnalytics()) return false;
  amplitude.reset();
  return true;
}

export function trackPosterQrOpen({ url, locale } = {}) {
  if (typeof window === 'undefined') return false;

  const currentUrl = url || window.location.href;
  const event = buildPosterQrEvent(currentUrl, locale);
  if (!event) return false;

  const storageKey = `gmk.posterQrTracked.${event.properties.qr_id}.${event.properties.landing_url}`;
  if (hasSessionMarker(storageKey)) return false;

  const tracked = trackEvent(event.eventName, {
    ...event.properties,
    referrer: document.referrer || '',
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
  });
  if (tracked) setSessionMarker(storageKey);
  return tracked;
}

export function trackOnlineLinkOpen({ url, locale } = {}) {
  if (typeof window === 'undefined') return false;

  const currentUrl = url || window.location.href;
  const event = buildOnlineLinkEvent(currentUrl, locale);
  if (!event) return false;

  const storageKey = `gmk.onlineLinkTracked.${event.properties.link_id}.${event.properties.landing_url}`;
  if (hasSessionMarker(storageKey)) return false;

  const tracked = trackEvent(event.eventName, {
    ...event.properties,
    referrer: document.referrer || '',
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
  });
  if (tracked) setSessionMarker(storageKey);
  return tracked;
}

function browserContext() {
  if (typeof window === 'undefined') return {};
  return {
    route: window.location.pathname,
    search_present: Boolean(window.location.search),
    referrer_present: Boolean(document.referrer),
  };
}

function sanitizeProperties(properties = {}) {
  const sanitized = {};
  for (const [key, value] of Object.entries(properties)) {
    if (BLOCKED_PROPERTY_KEY.test(key)) continue;
    if (value === undefined || typeof value === 'function') continue;
    if (typeof value === 'string') {
      sanitized[key] = value.slice(0, 160);
    } else if (typeof value === 'number' || typeof value === 'boolean' || value === null) {
      sanitized[key] = value;
    } else if (Array.isArray(value)) {
      sanitized[key] = value.slice(0, 20).map((item) => String(item).slice(0, 80));
    } else {
      sanitized[key] = String(value).slice(0, 160);
    }
  }
  return sanitized;
}

function sendOperationalLog(eventName, properties = {}) {
  if (typeof window === 'undefined' || typeof fetch !== 'function') return;
  const kstProperties = getKstEventProperties();
  const payload = {
    eventName,
    requestId: properties.request_id || properties.requestId || '',
    logged_at_kst: formatKstTimestamp(),
    properties: sanitizeProperties({
      ...properties,
      ...kstProperties,
    }),
  };

  fetch(OPS_LOG_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    // Observability must never change user-facing app behavior.
  });
}

function hasSessionMarker(key) {
  try {
    return window.sessionStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function setSessionMarker(key) {
  try {
    window.sessionStorage.setItem(key, '1');
  } catch {
    // Ignore storage failures; analytics should not affect the app flow.
  }
}
