export const SUPPORTED_LOCALES = ['vi', 'zh', 'mn', 'uz', 'ja', 'en', 'ko'];
export const DEFAULT_QR_CAMPAIGN = '2026_spring';
export const DEFAULT_SITE_URL = 'https://gachonmoneyking.vercel.app/';

export function normalizeLocale(value, fallback = 'en') {
  const normalizedFallback = SUPPORTED_LOCALES.includes(fallback) ? fallback : 'en';
  if (!value || typeof value !== 'string') return normalizedFallback;

  const shortLocale = value.split('-')[0].toLowerCase();
  return SUPPORTED_LOCALES.includes(shortLocale) ? shortLocale : normalizedFallback;
}

export function createPosterQrUrl(locale, options = {}) {
  const normalizedLocale = normalizeLocale(locale);
  const campaign = options.campaign || DEFAULT_QR_CAMPAIGN;
  const posterId = options.posterId || `${normalizedLocale}_main`;
  const url = new URL(options.baseUrl || DEFAULT_SITE_URL);

  url.searchParams.set('lang', normalizedLocale);
  url.searchParams.set('utm_source', 'poster');
  url.searchParams.set('utm_medium', 'qr');
  url.searchParams.set('utm_campaign', campaign);
  url.searchParams.set('utm_content', posterId);

  return url.toString();
}

export function buildPosterQrEvent(urlLike, fallbackLocale = 'en') {
  const url = toUrl(urlLike);
  if (!url) return null;

  const utmSource = url.searchParams.get('utm_source') || '';
  const utmMedium = url.searchParams.get('utm_medium') || '';
  const posterId = url.searchParams.get('utm_content') || url.searchParams.get('qr_id') || '';
  const isPosterQr =
    utmMedium.toLowerCase() === 'qr' ||
    url.searchParams.get('qr') === '1' ||
    url.searchParams.has('qr_id');

  if (!isPosterQr) return null;

  const language = normalizeLocale(url.searchParams.get('lang'), normalizeLocale(fallbackLocale));
  const campaign = url.searchParams.get('utm_campaign') || DEFAULT_QR_CAMPAIGN;

  return {
    eventName: 'Poster QR Opened',
    properties: {
      language,
      campaign,
      poster_id: posterId || `${language}_main`,
      qr_id: posterId || `${language}_main`,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: campaign,
      utm_content: posterId,
      utm_term: url.searchParams.get('utm_term') || '',
      landing_path: url.pathname,
      landing_url: url.toString(),
    },
  };
}

export function buildOnlineLinkEvent(urlLike, fallbackLocale = 'en') {
  const url = toUrl(urlLike);
  if (!url) return null;

  const utmSource = url.searchParams.get('utm_source') || '';
  const utmMedium = url.searchParams.get('utm_medium') || '';
  const utmCampaign = url.searchParams.get('utm_campaign') || '';
  const utmContent = url.searchParams.get('utm_content') || '';

  // Poster QR scans are tracked separately by buildPosterQrEvent; this builder
  // covers online campaign links (e.g. Facebook group posts) so they land in the
  // same by-language analytics with a matching `language` + `campaign` shape.
  const isPosterQr =
    utmMedium.toLowerCase() === 'qr' ||
    url.searchParams.get('qr') === '1' ||
    url.searchParams.has('qr_id');
  const hasCampaignAttribution = Boolean(utmSource || utmMedium || utmCampaign);
  if (isPosterQr || !hasCampaignAttribution) return null;

  const language = normalizeLocale(url.searchParams.get('lang'), normalizeLocale(fallbackLocale));
  const campaign = utmCampaign || DEFAULT_QR_CAMPAIGN;

  return {
    eventName: 'Online Link Opened',
    properties: {
      language,
      campaign,
      channel: utmMedium || 'other',
      link_id: utmContent,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: campaign,
      utm_content: utmContent,
      utm_term: url.searchParams.get('utm_term') || '',
      landing_path: url.pathname,
      landing_url: url.toString(),
    },
  };
}

function toUrl(urlLike) {
  try {
    if (urlLike instanceof URL) return urlLike;
    if (typeof urlLike === 'string') return new URL(urlLike);
    return null;
  } catch {
    return null;
  }
}
