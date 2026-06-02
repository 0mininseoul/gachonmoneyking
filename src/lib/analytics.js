import * as amplitude from '@amplitude/analytics-browser';
import { buildPosterQrEvent } from './qrAttribution';
import { OPERATIONAL_EVENTS } from './analyticsEvents';

let initialized = false;
const OPS_LOG_ENDPOINT = '/api/ops-log';
const BLOCKED_PROPERTY_KEY = /(phone|email|name|nick|avatar|screen|image|token|secret|credential|key|balance|file|path)/i;

export function initAnalytics() {
  if (initialized || typeof window === 'undefined') return initialized;

  const apiKey = import.meta.env.VITE_AMPLITUDE_API_KEY;
  if (!apiKey) return false;

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

export function trackEvent(eventName, properties = {}) {
  if (!initAnalytics()) return false;
  amplitude.track(eventName, sanitizeProperties(properties));
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

export function setAnalyticsUser(user) {
  if (!user?.id || !initAnalytics()) return false;
  amplitude.setUserId(user.id);
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
  const payload = {
    eventName,
    requestId: properties.request_id || properties.requestId || '',
    properties: sanitizeProperties(properties),
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
