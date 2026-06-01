import * as amplitude from '@amplitude/analytics-browser';
import { buildPosterQrEvent } from './qrAttribution';

let initialized = false;

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
  amplitude.track(eventName, properties);
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
