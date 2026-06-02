const SDK_URL = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';
let sdkPromise = null;

export function buildShareUrl(origin, recordId) {
  return `${String(origin).replace(/\/$/, '')}/r/${recordId}`;
}

function kakaoKey() {
  const env = (typeof import.meta !== 'undefined' && import.meta.env) || {};
  return env.VITE_KAKAO_JS_KEY || '';
}

function loadSdk() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.Kakao) return Promise.resolve(window.Kakao);
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = SDK_URL;
    s.async = true;
    s.onload = () => resolve(window.Kakao || null);
    s.onerror = () => resolve(null);
    document.head.appendChild(s);
  });
  return sdkPromise;
}

async function ensureKakao() {
  const key = kakaoKey();
  if (!key) return null;
  const Kakao = await loadSdk();
  if (!Kakao) return null;
  try {
    if (!Kakao.isInitialized()) Kakao.init(key);
    return Kakao.isInitialized() ? Kakao : null;
  } catch {
    return null;
  }
}

// Returns one of: 'kakao' | 'native' | 'copied' | 'failed'
export async function shareResult({ url, title, description, imageUrl, ctaLabel, homeUrl }) {
  const Kakao = await ensureKakao();
  if (Kakao) {
    Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title,
        description,
        imageUrl,
        link: { mobileWebUrl: url, webUrl: url },
      },
      buttons: [
        { title: ctaLabel, link: { mobileWebUrl: homeUrl || url, webUrl: homeUrl || url } },
      ],
    });
    return 'kakao';
  }
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title, text: description, url });
      return 'native';
    } catch (_e) {
      // user canceled or unsupported — fall through to clipboard
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return 'copied';
  } catch {
    return 'failed';
  }
}
