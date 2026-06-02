# Mobile QA Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship 8 mobile-QA fixes for Gachon Money King: remove signup, tighten CTA copy, switch language by nationality, redesign the verify page, add an analysis progress gauge, fix the celebration modal, collapse the dashboard into one shareable result card with a public share page + Kakao share + photo-attached correction, and polish per-locale line breaks.

**Architecture:** React/Vite SPA, all views inline in `src/App.jsx`. Pure logic extracted to `src/lib/*` and unit-tested with `node:test`; structural/i18n changes covered by source-assertion tests (the existing project pattern). New shareable result page is a public, unguarded route reading the public-read `leaderboard` table by row `id` (no migration for sharing). One migration adds `correction_image_url`. Kakao sharing via dynamically-loaded JS SDK with copy-link fallback.

**Tech Stack:** React 18, react-router-dom 7, Supabase JS, Vite, node:test, Playwright (QA), Kakao JS SDK.

---

## File Structure

**Create:**
- `src/lib/analysisProgress.js` — eased progress + stage selection for the gauge.
- `src/lib/shareResult.js` — `buildShareUrl` + Kakao/native/clipboard share.
- `src/components/ResultCard.jsx` — single compact result card (owner + public variants).
- `supabase/migrations/20260602120000_add_correction_image_url.sql` — correction image column.
- Tests: `test/i18nKeys.test.js`, `test/signupRemoval.test.js`, `test/analysisProgress.test.js`, `test/shareResult.test.js`, `test/resultPage.test.js`.

**Modify:**
- `src/i18n/translations.js` — edit `anonymous_rank_cta`; add ~10 keys × 7 locales.
- `src/App.jsx` — signup removal; ProfileSetup locale switch + nav; gauge; celebration modal; DashboardView → ResultCard + correction image; SharedResultView + route; admin correction image; `rankingsLoaded` state.
- `src/lib/rankReport.js` — `export` `ZONE_LABELS`.
- `src/index.css` — verify page, gauge bar, celebration wrap, result card, shared page, share button, line-break QA.
- `.env.local.example` — add `VITE_KAKAO_JS_KEY`.

**Delete:**
- `src/components/SignupView.jsx`.

---

## Task 1: Feature branch

- [ ] **Step 1: Create branch**

Run:
```bash
cd /Users/youngminpark/Desktop/개발/gachon_money_king
git checkout -b feat/mobile-qa-fixes
```
Expected: `Switched to a new branch 'feat/mobile-qa-fixes'`

- [ ] **Step 2: Commit the spec + plan**

```bash
git add docs/superpowers/specs/2026-06-02-mobile-qa-fixes-design.md docs/superpowers/plans/2026-06-02-mobile-qa-fixes.md
git commit -m "docs: mobile QA fixes spec and plan"
```

---

## Task 2: i18n — CTA edit + new keys

**Files:**
- Modify: `src/i18n/translations.js`
- Test: `test/i18nKeys.test.js`

- [ ] **Step 1: Write the failing test**

Create `test/i18nKeys.test.js`:
```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { translations } from '../src/i18n/translations.js';

const LOCALES = ['ko', 'en', 'vi', 'zh', 'mn', 'uz', 'ja'];
const NEW_KEYS = [
  'analyzing_stage_upload',
  'analyzing_stage_read',
  'analyzing_stage_rank',
  'analyzing_stage_report',
  'celebration_rank_summary',
  'shared_result_headline',
  'shared_not_found',
  'share_result_btn',
  'copy_link_done',
  'correction_attach_image',
];

test('every locale defines all new keys', () => {
  for (const locale of LOCALES) {
    for (const key of NEW_KEYS) {
      assert.ok(translations[locale][key], `missing ${key} in ${locale}`);
    }
  }
});

test('anonymous_rank_cta no longer says "anonymous" in any locale', () => {
  const banned = [/익명/, /anonymous/i, /匿名/, /ẩn danh/i, /нууц/, /anonim/i];
  for (const locale of LOCALES) {
    const value = translations[locale].anonymous_rank_cta;
    for (const re of banned) {
      assert.doesNotMatch(value, re, `${locale} still contains anonymous wording`);
    }
  }
});

test('templated keys keep their placeholders', () => {
  for (const locale of LOCALES) {
    assert.match(translations[locale].celebration_rank_summary, /\{rank\}/);
    assert.match(translations[locale].celebration_rank_summary, /\{percentile\}/);
    assert.match(translations[locale].shared_result_headline, /\{nickname\}/);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/i18nKeys.test.js` (or `node --test test/i18nKeys.test.js`)
Expected: FAIL (keys missing, CTA still has 익명).

- [ ] **Step 3: Edit `anonymous_rank_cta` in each locale**

In `src/i18n/translations.js` replace each locale's value:
- ko: `"30초 안에 내 순위 확인하기"`
- en: `"Check my rank in 30 seconds"`
- vi: `"Xem hạng của tôi trong 30 giây"`
- zh: `"30秒内查看我的排名"`
- mn: `"30 секундэд зэрэглэлээ шалгах"`
- uz: `"30 soniyada reytingimni tekshirish"`
- ja: `"30秒で順位を確認する"`

- [ ] **Step 4: Add the new keys to each locale**

Append these key/value pairs inside each locale object (use the matching language column):

ko:
```js
analyzing_stage_upload: "스크린샷 업로드 중",
analyzing_stage_read: "잔고 인식 중",
analyzing_stage_rank: "순위 계산 중",
analyzing_stage_report: "리포트 생성 중",
celebration_rank_summary: "가천대 {rank}등 · {percentile}",
shared_result_headline: "{nickname}님의 지갑 현실",
shared_not_found: "결과를 찾을 수 없어요. 직접 내 순위를 확인해보세요.",
share_result_btn: "공유",
copy_link_done: "링크가 복사됐어요",
correction_attach_image: "사진 첨부",
```
en:
```js
analyzing_stage_upload: "Uploading screenshot",
analyzing_stage_read: "Reading your balance",
analyzing_stage_rank: "Calculating your rank",
analyzing_stage_report: "Generating your report",
celebration_rank_summary: "#{rank} at Gachon · {percentile}",
shared_result_headline: "{nickname}'s wallet reality",
shared_not_found: "This result is unavailable. Check your own rank instead.",
share_result_btn: "Share",
copy_link_done: "Link copied",
correction_attach_image: "Attach photo",
```
vi:
```js
analyzing_stage_upload: "Đang tải ảnh lên",
analyzing_stage_read: "Đang đọc số dư",
analyzing_stage_rank: "Đang tính thứ hạng",
analyzing_stage_report: "Đang tạo báo cáo",
celebration_rank_summary: "Hạng {rank} tại Gachon · {percentile}",
shared_result_headline: "Thực tế chiếc ví của {nickname}",
shared_not_found: "Không tìm thấy kết quả. Hãy tự kiểm tra thứ hạng của bạn.",
share_result_btn: "Chia sẻ",
copy_link_done: "Đã sao chép liên kết",
correction_attach_image: "Đính kèm ảnh",
```
zh:
```js
analyzing_stage_upload: "正在上传截图",
analyzing_stage_read: "正在识别余额",
analyzing_stage_rank: "正在计算排名",
analyzing_stage_report: "正在生成报告",
celebration_rank_summary: "嘉泉大学第{rank}名 · {percentile}",
shared_result_headline: "{nickname}的钱包现实",
shared_not_found: "找不到该结果。来查看你自己的排名吧。",
share_result_btn: "分享",
copy_link_done: "链接已复制",
correction_attach_image: "添加图片",
```
mn:
```js
analyzing_stage_upload: "Зураг байршуулж байна",
analyzing_stage_read: "Үлдэгдлийг уншиж байна",
analyzing_stage_rank: "Зэрэглэл тооцож байна",
analyzing_stage_report: "Тайлан үүсгэж байна",
celebration_rank_summary: "Гачонд {rank}-р байр · {percentile}",
shared_result_headline: "{nickname}-ийн хэтэвчний бодит байдал",
shared_not_found: "Үр дүн олдсонгүй. Өөрийн зэрэглэлээ шалгаарай.",
share_result_btn: "Хуваалцах",
copy_link_done: "Холбоос хуулагдлаа",
correction_attach_image: "Зураг хавсаргах",
```
uz:
```js
analyzing_stage_upload: "Skrinshot yuklanmoqda",
analyzing_stage_read: "Balans o'qilmoqda",
analyzing_stage_rank: "Reyting hisoblanmoqda",
analyzing_stage_report: "Hisobot tayyorlanmoqda",
celebration_rank_summary: "Gachonda {rank}-o'rin · {percentile}",
shared_result_headline: "{nickname}ning hamyon haqiqati",
shared_not_found: "Natija topilmadi. O'z reytingingizni tekshiring.",
share_result_btn: "Ulashish",
copy_link_done: "Havola nusxalandi",
correction_attach_image: "Rasm biriktirish",
```
ja:
```js
analyzing_stage_upload: "スクリーンショットをアップロード中",
analyzing_stage_read: "残高を読み取り中",
analyzing_stage_rank: "順位を計算中",
analyzing_stage_report: "レポートを生成中",
celebration_rank_summary: "嘉泉大学{rank}位 · {percentile}",
shared_result_headline: "{nickname}さんの財布の現実",
shared_not_found: "結果が見つかりません。自分の順位を確認してみましょう。",
share_result_btn: "シェア",
copy_link_done: "リンクをコピーしました",
correction_attach_image: "写真を添付",
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- test/i18nKeys.test.js`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/i18n/translations.js test/i18nKeys.test.js
git commit -m "i18n: tighten rank CTA and add gauge/share/correction keys"
```

---

## Task 3: Remove signup (item 1)

**Files:**
- Modify: `src/App.jsx` (import line 7, route line 460, footer line 580-581)
- Delete: `src/components/SignupView.jsx`
- Test: `test/signupRemoval.test.js`

- [ ] **Step 1: Write the failing test**

Create `test/signupRemoval.test.js`:
```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appSource = readFileSync(resolve(__dirname, '../src/App.jsx'), 'utf8');

test('signup route and import are gone', () => {
  assert.doesNotMatch(appSource, /path="\/signup"/);
  assert.doesNotMatch(appSource, /SignupView/);
});

test('footer no longer links to signup', () => {
  assert.doesNotMatch(appSource, /navigate\('\/signup'\)/);
  assert.doesNotMatch(appSource, /t\('signup_link'\)/);
});

test('SignupView component file is removed', () => {
  assert.equal(existsSync(resolve(__dirname, '../src/components/SignupView.jsx')), false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/signupRemoval.test.js`
Expected: FAIL.

- [ ] **Step 3: Remove the import**

In `src/App.jsx` delete line 7: `import { SignupView } from './components/SignupView';`

- [ ] **Step 4: Remove the route**

In `src/App.jsx` delete this line (≈460):
```jsx
        <Route path="/signup" element={<SignupView />} />
```

- [ ] **Step 5: Remove the footer link + its divider**

In `src/App.jsx` `MainLayout` footer, change:
```jsx
          <div className="footer-links">
            <span onClick={() => navigate('/terms')}>{t('terms_link')}</span>
            <span className="divider">|</span>
            <span onClick={() => navigate('/privacy')}>{t('privacy_link')}</span>
            <span className="divider">|</span>
            <span onClick={() => navigate('/signup')}>{t('signup_link')}</span>
          </div>
```
to:
```jsx
          <div className="footer-links">
            <span onClick={() => navigate('/terms')}>{t('terms_link')}</span>
            <span className="divider">|</span>
            <span onClick={() => navigate('/privacy')}>{t('privacy_link')}</span>
          </div>
```

- [ ] **Step 6: Delete the component file**

Run: `git rm src/components/SignupView.jsx`

- [ ] **Step 7: Run tests**

Run: `npm test -- test/signupRemoval.test.js`
Expected: PASS (3 tests).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: remove signup route, footer link, and component"
```

---

## Task 4: Analysis progress lib (item 5 logic)

**Files:**
- Create: `src/lib/analysisProgress.js`
- Test: `test/analysisProgress.test.js`

- [ ] **Step 1: Write the failing test**

Create `test/analysisProgress.test.js`:
```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { nextProgress, stageForProgress, ANALYSIS_TARGET } from '../src/lib/analysisProgress.js';

test('nextProgress eases up but never exceeds the target', () => {
  let p = 0;
  for (let i = 0; i < 500; i++) p = nextProgress(p);
  assert.ok(p <= ANALYSIS_TARGET, `expected <= ${ANALYSIS_TARGET}, got ${p}`);
  assert.ok(p > 80, `expected meaningful progress, got ${p}`);
});

test('nextProgress is strictly increasing below target', () => {
  const a = nextProgress(0);
  const b = nextProgress(a);
  assert.ok(b > a);
});

test('stageForProgress maps thresholds to stage keys', () => {
  assert.equal(stageForProgress(0), 'upload');
  assert.equal(stageForProgress(24), 'upload');
  assert.equal(stageForProgress(25), 'read');
  assert.equal(stageForProgress(54), 'read');
  assert.equal(stageForProgress(55), 'rank');
  assert.equal(stageForProgress(84), 'rank');
  assert.equal(stageForProgress(85), 'report');
  assert.equal(stageForProgress(100), 'report');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/analysisProgress.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement the module**

Create `src/lib/analysisProgress.js`:
```js
export const ANALYSIS_TARGET = 92;

// Ease toward the target so the bar slows as it approaches it (believable "almost done").
export function nextProgress(current, { target = ANALYSIS_TARGET, factor = 0.06 } = {}) {
  if (current >= target) return target;
  return Math.min(target, current + (target - current) * factor);
}

export function stageForProgress(progress) {
  if (progress < 25) return 'upload';
  if (progress < 55) return 'read';
  if (progress < 85) return 'rank';
  return 'report';
}

export const STAGE_KEYS = {
  upload: 'analyzing_stage_upload',
  read: 'analyzing_stage_read',
  rank: 'analyzing_stage_rank',
  report: 'analyzing_stage_report',
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- test/analysisProgress.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/analysisProgress.js test/analysisProgress.test.js
git commit -m "feat: add eased analysis progress helper"
```

---

## Task 5: Share URL/Kakao lib (item 7 logic)

**Files:**
- Create: `src/lib/shareResult.js`
- Test: `test/shareResult.test.js`

- [ ] **Step 1: Write the failing test**

Create `test/shareResult.test.js`:
```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildShareUrl } from '../src/lib/shareResult.js';

test('buildShareUrl joins origin and record id', () => {
  assert.equal(buildShareUrl('https://x.app', 'abc'), 'https://x.app/r/abc');
});

test('buildShareUrl trims a trailing slash on origin', () => {
  assert.equal(buildShareUrl('https://x.app/', 'abc'), 'https://x.app/r/abc');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/shareResult.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement the module**

Create `src/lib/shareResult.js`:
```js
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- test/shareResult.test.js`
Expected: PASS (2 tests).

- [ ] **Step 5: Add the env var placeholder**

Append to `.env.local.example`:
```
VITE_KAKAO_JS_KEY
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/shareResult.js test/shareResult.test.js .env.local.example
git commit -m "feat: add share-result helper with Kakao + clipboard fallback"
```

---

## Task 6: Export ZONE_LABELS (needed by ResultCard)

**Files:**
- Modify: `src/lib/rankReport.js:1`

- [ ] **Step 1: Make the export**

In `src/lib/rankReport.js` change `const ZONE_LABELS = {` to `export const ZONE_LABELS = {`.

- [ ] **Step 2: Verify existing tests still pass**

Run: `npm test -- test/rankReport.test.js`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/rankReport.js
git commit -m "refactor: export ZONE_LABELS for reuse"
```

---

## Task 7: Profile → language + go straight to verify (items 3, 4-nav)

**Files:**
- Modify: `src/App.jsx` — `handleSaveProfile` (≈344), `ProfileSetupView` (≈623-697)
- Test: append to `test/resultPage.test.js`

- [ ] **Step 1: Write the failing test**

Create `test/resultPage.test.js` (this file collects source-assertions for Tasks 7-13):
```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appSource = readFileSync(resolve(__dirname, '../src/App.jsx'), 'utf8');

test('profile save navigates straight to verify-balance', () => {
  assert.match(appSource, /navigate\('\/verify-balance'\)/);
});

test('selecting nationality switches the active locale', () => {
  assert.match(appSource, /setLocale\(nationality\)/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/resultPage.test.js`
Expected: FAIL.

- [ ] **Step 3: Navigate to verify after save**

In `src/App.jsx` `handleSaveProfile`, change `navigate('/dashboard');` (inside the `if (!error)` block) to `navigate('/verify-balance');`.

- [ ] **Step 4: Give ProfileSetupView access to setLocale**

In `ProfileSetupView`, after `const [currentStep, setCurrentStep] = useState(0);` add:
```jsx
  const { setLocale } = useLanguage();
```
(`useLanguage` is already imported at the top of `App.jsx`.)

- [ ] **Step 5: Switch locale when leaving the nationality step**

In `ProfileSetupView` replace `goToNextStep`:
```jsx
  const goToNextStep = () => {
    if (!currentStepData.complete) return;
    if (currentStepData.key === 'nationality' && nationality) {
      setLocale(nationality);
    }
    setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
  };
```

- [ ] **Step 6: Run tests**

Run: `npm test -- test/resultPage.test.js`
Expected: PASS (2 tests).

- [ ] **Step 7: Commit**

```bash
git add src/App.jsx test/resultPage.test.js
git commit -m "feat: switch language on nationality choice and go straight to verify"
```

---

## Task 8: Verify page compaction (item 4)

**Files:**
- Modify: `src/App.jsx` `BalanceUploadView` (≈1156-1190), `src/index.css` (verify section ≈432-553)
- Test: append to `test/resultPage.test.js`

- [ ] **Step 1: Write the failing test**

Append to `test/resultPage.test.js`:
```js
test('verify page drops the locked-balance strip and uses banking-app hint', () => {
  assert.doesNotMatch(appSource, /verify-status-strip/);
  // button hint reuses the toss/kakaobank upload_desc copy
  const verifyBlock = appSource.slice(appSource.indexOf('function BalanceUploadView'));
  assert.match(verifyBlock, /t\('upload_desc'\)/);
  assert.doesNotMatch(verifyBlock, /t\('verify_upload_hint'\)/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/resultPage.test.js`
Expected: FAIL.

- [ ] **Step 3: Remove the status strip and repoint the hint**

In `BalanceUploadView` delete this block:
```jsx
        <div className="verify-status-strip">
          <span>{t('anonymous_badge_label')}</span>
          <strong>{isVerified ? t('leaderboard_unlocked_label') : t('leaderboard_locked_label')}</strong>
        </div>
```
And change the upload hint paragraph from `<p>{t('verify_upload_hint')}</p>` to:
```jsx
          <p>{t('upload_desc')}</p>
```

- [ ] **Step 4: Compact the layout CSS**

In `src/index.css`, update `.verify-mobile-shell` `gap` and the trust sheet so everything fits one mobile viewport. Replace the `.verify-mobile-shell` rule's `gap: var(--spacing-md);` with `gap: var(--spacing-sm);` and add after the `.verify-trust-sheet` rule:
```css
.verify-trust-sheet {
  margin-bottom: 0;
  padding: var(--spacing-sm) var(--spacing-md);
}

.verify-trust-sheet .trust-sheet-title {
  margin-bottom: 6px;
}

.verify-trust-sheet ul {
  gap: 6px;
}

.verify-trust-sheet li {
  font-size: 0.82rem;
  line-height: 1.4;
}

.verify-upload-zone {
  margin-top: var(--spacing-md);
}

@media (max-width: 480px) {
  .verify-mobile-shell {
    min-height: auto;
    padding: var(--spacing-md);
    gap: var(--spacing-sm);
  }
  .verify-upload-zone {
    margin-top: var(--spacing-sm);
  }
  .verify-upload-zone p {
    padding-bottom: var(--spacing-sm);
  }
}
```
(Note: the existing `.upload-trust-sheet ul`/`li` base rules at lines ≈356-368 still apply; these overrides only tighten the verify variant.)

- [ ] **Step 5: Run tests + build**

Run: `npm test -- test/resultPage.test.js && npm run build`
Expected: PASS + successful build.

- [ ] **Step 6: Commit**

```bash
git add src/App.jsx src/index.css test/resultPage.test.js
git commit -m "feat: compact verify page to fit one mobile viewport"
```

---

## Task 9: Analysis gauge UI (item 5)

**Files:**
- Modify: `src/App.jsx` — imports, App state/effect, the `if (uploading)` block (≈435-451); `src/index.css` (after loader rules ≈1321)
- Test: append to `test/resultPage.test.js`

- [ ] **Step 1: Write the failing test**

Append to `test/resultPage.test.js`:
```js
test('analysis loader renders an eased progress gauge', () => {
  assert.match(appSource, /from '\.\/lib\/analysisProgress'/);
  assert.match(appSource, /loader-progress/);
  assert.match(appSource, /uploadProgress/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/resultPage.test.js`
Expected: FAIL.

- [ ] **Step 3: Import the helper**

In `src/App.jsx` add near the other lib imports:
```jsx
import { nextProgress, stageForProgress, STAGE_KEYS } from './lib/analysisProgress';
```

- [ ] **Step 4: Add progress state + driver effect**

In `App`, add state next to the upload state (`const [uploadSuccess...`):
```jsx
  const [uploadProgress, setUploadProgress] = useState(0);
```
Add this effect after the existing effects (e.g. after the admin-queue effect ≈133):
```jsx
  useEffect(() => {
    if (!uploading) {
      setUploadProgress(0);
      return;
    }
    setUploadProgress(8);
    const id = setInterval(() => {
      setUploadProgress((p) => nextProgress(p));
    }, 220);
    return () => clearInterval(id);
  }, [uploading]);
```

- [ ] **Step 5: Replace the loader block**

Replace the `if (uploading) { ... }` return block with:
```jsx
  if (uploading) {
    const stageKey = STAGE_KEYS[stageForProgress(uploadProgress)];
    const pct = Math.round(uploadProgress);
    return (
      <div className="app-container loader-overlay">
        <div className="loader-box">
          <div className="orbit-spinner">
            <div className="orbit"></div>
            <div className="orbit"></div>
            <div className="orbit"></div>
          </div>
          <div className="loader-content-wrap">
            <p className="loader-text">{t('loading')}</p>
            <div className="loader-progress">
              <div className="loader-progress-track">
                <div className="loader-progress-fill" style={{ width: `${pct}%` }}></div>
              </div>
              <div className="loader-progress-meta">
                <span className="loader-stage">{t(stageKey)}</span>
                <span className="loader-percent">{pct}%</span>
              </div>
            </div>
            <p className="loader-caution">{t('loading_caution')}</p>
          </div>
        </div>
      </div>
    );
  }
```

- [ ] **Step 6: Add gauge CSS**

In `src/index.css` after `.loader-caution { ... }` (≈1321) add:
```css
.loader-progress {
  width: min(320px, 86vw);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.loader-progress-track {
  height: 8px;
  border-radius: var(--rounded-pill);
  background-color: var(--color-surface-3);
  border: 1px solid var(--color-hairline);
  overflow: hidden;
}

.loader-progress-fill {
  height: 100%;
  border-radius: var(--rounded-pill);
  background: linear-gradient(90deg, var(--color-primary), var(--color-primary-hover));
  box-shadow: 0 0 16px rgba(130, 143, 255, 0.45);
  transition: width 0.25s ease-out;
}

.loader-progress-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
}

.loader-stage {
  color: var(--color-ink-muted);
}

.loader-percent {
  color: var(--color-primary-hover);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
```

- [ ] **Step 7: Run tests + build**

Run: `npm test -- test/resultPage.test.js && npm run build`
Expected: PASS + build OK.

- [ ] **Step 8: Commit**

```bash
git add src/App.jsx src/index.css test/resultPage.test.js
git commit -m "feat: add eased progress gauge to the analysis loader"
```

---

## Task 10: Celebration modal rework (item 6)

**Files:**
- Modify: `src/App.jsx` `DashboardView` celebration modal (≈1107-1119); `src/index.css` `.rank-celebration-card h2` (≈1347-1352)
- Test: append to `test/resultPage.test.js`

- [ ] **Step 1: Write the failing test**

Append to `test/resultPage.test.js`:
```js
import { readFileSync as _rf } from 'node:fs';
const cssSource = _rf(resolve(__dirname, '../src/index.css'), 'utf8');

test('celebration modal uses the spicy main copy + rank summary and no longer truncates', () => {
  const modal = appSource.slice(appSource.indexOf('showRankCard && userRecord'));
  assert.match(modal, /rankReport\?\.mainCopy/);
  assert.match(modal, /celebration_rank_summary/);
  // h2 in the celebration card must wrap
  const h2Block = cssSource.slice(cssSource.indexOf('.rank-celebration-card h2'));
  assert.doesNotMatch(h2Block.slice(0, 160), /white-space:\s*nowrap/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/resultPage.test.js`
Expected: FAIL.

- [ ] **Step 3: Rework the modal markup**

In `DashboardView`, replace the celebration modal body:
```jsx
      {showRankCard && userRecord && (
        <div className="overlay-celebration" onClick={() => setShowRankCard(false)}>
          <div className="rank-celebration-card linear-card" onClick={(e) => e.stopPropagation()}>
            <button className="close-overlay" onClick={() => setShowRankCard(false)}>×</button>
            <div className="medal-icon">🏆</div>
            <h2>{rankReport?.mainCopy || titleText}</h2>
            <p className="celebration-rank-summary">
              {t('celebration_rank_summary')
                .replace('{rank}', userRank)
                .replace('{percentile}', percentileLabel)}
            </p>
            <p className="celebration-text">{subtitleText}</p>
            <button onClick={() => setShowRankCard(false)} className="btn-primary">
              {t('view_leaderboard_btn')}
            </button>
          </div>
        </div>
      )}
```

- [ ] **Step 4: Fix the truncation CSS + style the summary**

In `src/index.css` replace:
```css
.rank-celebration-card h2 {
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```
with:
```css
.rank-celebration-card h2 {
  font-size: 1.2rem;
  line-height: 1.3;
  font-weight: 800;
  margin-bottom: var(--spacing-xs);
}

.celebration-rank-summary {
  color: var(--color-primary-hover);
  font-size: 0.95rem;
  font-weight: 700;
  margin-bottom: var(--spacing-xs);
}
```

- [ ] **Step 5: Run tests + build**

Run: `npm test -- test/resultPage.test.js && npm run build`
Expected: PASS + build OK.

- [ ] **Step 6: Commit**

```bash
git add src/App.jsx src/index.css test/resultPage.test.js
git commit -m "feat: rework celebration modal copy and stop title truncation"
```

---

## Task 11: ResultCard + DashboardView collapse (item 7 card)

**Files:**
- Create: `src/components/ResultCard.jsx`
- Modify: `src/App.jsx` `DashboardView` (imports, access-rail ≈990-1005, rank-report-panel ≈1011-1071), `src/index.css`
- Test: append to `test/resultPage.test.js`

- [ ] **Step 1: Write the failing test**

Append to `test/resultPage.test.js`:
```js
import { existsSync } from 'node:fs';

test('dashboard collapses into a single ResultCard above the leaderboard', () => {
  assert.ok(existsSync(resolve(__dirname, '../src/components/ResultCard.jsx')));
  assert.match(appSource, /import \{ ResultCard \}/);
  assert.match(appSource, /<ResultCard/);
  assert.doesNotMatch(appSource, /rank-report-panel/);
  assert.doesNotMatch(appSource, /leaderboard-access-rail/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/resultPage.test.js`
Expected: FAIL.

- [ ] **Step 3: Create ResultCard**

Create `src/components/ResultCard.jsx`:
```jsx
import React from 'react';
import { ZONE_LABELS } from '../lib/rankReport';

function ShareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
      <line x1="15.4" y1="6.5" x2="8.6" y2="10.5" />
    </svg>
  );
}

export function ResultCard({ insight, report, t, variant = 'owner', onShare, onCorrection }) {
  const zoneLabel = ZONE_LABELS[insight.balanceZone] || ZONE_LABELS.maintenance;
  return (
    <section className="result-card linear-card">
      <button type="button" className="result-share-btn" onClick={onShare} aria-label={t('share_result_btn')}>
        <ShareIcon />
      </button>

      <h2 className="result-main-copy">{report.mainCopy}</h2>

      <div className="result-metric-row">
        <div className="result-metric">
          <span>{t('rank_report_overall')}</span>
          <strong>#{insight.overallRank} / {insight.overallTotal}</strong>
        </div>
        <div className="result-metric">
          <span>{t('rank_report_percentile')}</span>
          <strong>{t('percentile_top')} {insight.percentileTop}%</strong>
        </div>
      </div>

      <div className="result-zone">
        <span>WALLET ZONE</span>
        <div className={`wallet-zone-map zone-${insight.balanceZone}`}>
          <i></i><i></i><i></i><i></i><i></i>
        </div>
        <strong>{zoneLabel}</strong>
      </div>

      {variant === 'owner' && (
        <button type="button" className="result-correction-link" onClick={onCorrection}>
          {t('correction_btn')}
        </button>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Import + render ResultCard in DashboardView; remove old cards**

In `src/App.jsx` add to imports:
```jsx
import { ResultCard } from './components/ResultCard';
import { buildShareUrl, shareResult } from './lib/shareResult';
```
In `DashboardView`, delete the entire `leaderboard-access-rail` block (the `<div className={`leaderboard-access-rail ...`}> ... </div>`) and the entire `rank-report-panel` `<section>...</section>`.

Add a share handler inside `DashboardView` (near `handleCopyShareCard`), and a toast state:
```jsx
  const [shareToast, setShareToast] = React.useState(false);
  const handleShare = async () => {
    if (!userRecord) return;
    const url = buildShareUrl(window.location.origin, userRecord.id);
    const result = await shareResult({
      url,
      title: t('shared_result_headline').replace('{nickname}', userRecord.nickname),
      description: rankReport?.mainCopy || '',
      imageUrl: `${window.location.origin}/logo.png`,
      ctaLabel: t('anonymous_rank_cta'),
      homeUrl: window.location.origin,
    });
    if (result === 'copied') {
      setShareToast(true);
      window.setTimeout(() => setShareToast(false), 1800);
    }
  };
```
Then, where the rank-report-panel used to be, render (keep the existing unverified prompt minimal):
```jsx
      {isVerified && rankReport && reportInsight ? (
        <ResultCard
          insight={reportInsight}
          report={rankReport}
          t={t}
          variant="owner"
          onShare={handleShare}
          onCorrection={openCorrectionModal}
        />
      ) : (
        !isVerified && (
          <div className="dashboard-verify-prompt">
            <button type="button" className="btn-primary btn-lg" onClick={() => navigate('/verify-balance')}>
              {t('go_verify_balance_btn')}
            </button>
          </div>
        )
      )}

      {shareToast && <div className="share-toast">{t('copy_link_done')}</div>}
```

- [ ] **Step 5: Add ResultCard + toast CSS**

In `src/index.css` (after the `.rank-conclusion-card` block, before `.share-card-section`) add:
```css
.result-card {
  position: relative;
  border-color: rgba(130, 143, 255, 0.34);
  background:
    radial-gradient(circle at top right, rgba(130, 143, 255, 0.16), transparent 40%),
    linear-gradient(180deg, rgba(24, 25, 26, 0.98), rgba(10, 11, 12, 0.98));
}

.result-share-btn {
  position: absolute;
  top: var(--spacing-md);
  right: var(--spacing-md);
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--rounded-md);
  border: 1px solid var(--color-hairline);
  background-color: var(--color-surface-2);
  color: var(--color-ink);
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease;
}

.result-share-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary-hover);
}

.result-main-copy {
  font-size: clamp(1.35rem, 4.5vw, 1.9rem);
  line-height: 1.18;
  font-weight: 800;
  margin: 0 44px var(--spacing-md) 0;
}

.result-metric-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.result-metric {
  border: 1px solid var(--color-hairline);
  border-radius: var(--rounded-md);
  background-color: rgba(1, 1, 2, 0.42);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.result-metric span {
  color: var(--color-ink-subtle);
  font-size: 0.74rem;
}

.result-metric strong {
  color: var(--color-ink);
  font-size: 1.05rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.result-zone > span {
  display: block;
  color: var(--color-primary-hover);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  margin-bottom: 8px;
}

.result-zone > strong {
  display: block;
  margin-top: 6px;
  font-size: 0.95rem;
  font-weight: 700;
}

.result-correction-link {
  display: block;
  margin: var(--spacing-md) auto 0;
  background: none;
  border: none;
  color: var(--color-ink-tertiary);
  font-size: 0.78rem;
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
}

.result-correction-link:hover {
  color: var(--color-ink-muted);
}

.dashboard-verify-prompt {
  display: flex;
  justify-content: center;
  margin-bottom: var(--spacing-lg);
}

.share-toast {
  position: fixed;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--color-surface-3);
  border: 1px solid var(--color-hairline-strong);
  color: var(--color-ink);
  padding: 10px 18px;
  border-radius: var(--rounded-pill);
  font-size: 0.85rem;
  z-index: 300;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
}
```

- [ ] **Step 6: Run tests + build**

Run: `npm test && npm run build`
Expected: PASS + build OK.

- [ ] **Step 7: Commit**

```bash
git add src/App.jsx src/components/ResultCard.jsx src/index.css test/resultPage.test.js
git commit -m "feat: collapse dashboard into single shareable ResultCard"
```

---

## Task 12: Correction with photo attachment + migration + admin (item 7 correction)

**Files:**
- Create: `supabase/migrations/20260602120000_add_correction_image_url.sql`
- Modify: `src/App.jsx` `DashboardView` correction modal + `handleCorrectionSubmit`; `AdminConsoleView` correction row
- Test: append to `test/resultPage.test.js`

- [ ] **Step 1: Write the failing test**

Append to `test/resultPage.test.js`:
```js
const correctionMigration = _rf(
  resolve(__dirname, '../supabase/migrations/20260602120000_add_correction_image_url.sql'),
  'utf8'
);

test('correction stores an optional image url', () => {
  assert.match(correctionMigration, /add\s+column\s+if\s+not\s+exists\s+correction_image_url/i);
  assert.match(appSource, /correction_image_url/);
  assert.match(appSource, /correction_attach_image/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/resultPage.test.js`
Expected: FAIL.

- [ ] **Step 3: Create the migration**

Create `supabase/migrations/20260602120000_add_correction_image_url.sql`:
```sql
alter table public.leaderboard
  add column if not exists correction_image_url text;
```

- [ ] **Step 4: Add file state + upload to the correction flow**

In `DashboardView`, add state near the other correction state:
```jsx
  const [correctionImage, setCorrectionImage] = React.useState(null);
```
Replace `handleCorrectionSubmit` with:
```jsx
  const handleCorrectionSubmit = async (e) => {
    e.preventDefault();
    if (!correctionText.trim()) return;
    setSubmittingCorrection(true);
    try {
      let imageUrl = userRecord?.correction_image_url || null;
      if (correctionImage) {
        const ext = correctionImage.name.split('.').pop();
        const path = `${user.id}/correction-${Date.now()}.${ext}`;
        const { data, error: upErr } = await supabase.storage
          .from('screenshots')
          .upload(path, correctionImage, { upsert: true });
        if (!upErr && data) {
          imageUrl = supabase.storage.from('screenshots').getPublicUrl(data.path).data.publicUrl;
        }
      }
      const { error } = await supabase
        .from('leaderboard')
        .update({ correction_note: correctionText.trim(), correction_image_url: imageUrl })
        .eq('user_id', user.id);
      if (!error) {
        setCorrectionSuccess(true);
      }
    } catch (err) {
      console.error('Error submitting correction:', err);
    } finally {
      setSubmittingCorrection(false);
    }
  };
```
Reset the file in `openCorrectionModal`:
```jsx
  const openCorrectionModal = () => {
    setCorrectionText(userRecord?.correction_note || '');
    setCorrectionImage(null);
    setCorrectionSuccess(false);
    setShowCorrectionModal(true);
  };
```

- [ ] **Step 5: Add the file input to the modal form**

In the correction modal `<form>`, after the `<textarea>` add:
```jsx
                <label className="correction-attach">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCorrectionImage(e.target.files[0] || null)}
                    className="file-hidden-input"
                  />
                  <span className="btn-secondary btn-sm">{t('correction_attach_image')}</span>
                  {correctionImage && <span className="correction-file-name">{correctionImage.name}</span>}
                </label>
```

- [ ] **Step 6: Surface the image in the admin correction row**

In `AdminConsoleView`, inside the `row.correction_note &&` block, after the `<span className="admin-correction-text">` add:
```jsx
                      {row.correction_image_url && (
                        <a href={row.correction_image_url} target="_blank" rel="noopener noreferrer" className="admin-correction-img-link">
                          🖼️ 이미지 보기
                        </a>
                      )}
```

- [ ] **Step 7: Add minimal CSS**

In `src/index.css` (near `.correction-modal`) add:
```css
.correction-attach {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-top: var(--spacing-sm);
  cursor: pointer;
}

.correction-file-name {
  font-size: 0.78rem;
  color: var(--color-ink-subtle);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
}

.admin-correction-img-link {
  margin-left: 8px;
  color: var(--color-primary-hover);
  font-size: 0.82rem;
  text-decoration: none;
}
```

- [ ] **Step 8: Run tests + build**

Run: `npm test && npm run build`
Expected: PASS + build OK.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: allow photo attachment in balance correction requests"
```

---

## Task 13: Public shared result page + route (item 7 share page)

**Files:**
- Modify: `src/App.jsx` — imports (`useParams`), App `rankingsLoaded` state, `fetchLeaderboard`, route table, new `SharedResultView`; `src/index.css`
- Test: append to `test/resultPage.test.js`

- [ ] **Step 1: Write the failing test**

Append to `test/resultPage.test.js`:
```js
test('public shared result route exists and is unguarded', () => {
  assert.match(appSource, /path="\/r\/:recordId"/);
  assert.match(appSource, /function SharedResultView/);
  const shared = appSource.slice(appSource.indexOf('function SharedResultView'));
  assert.match(shared, /shared_result_headline/);
  assert.match(shared, /anonymous_rank_cta/);   // bottom CTA
  assert.match(shared, /canViewBalances=\{/);    // mosaic when not verified
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/resultPage.test.js`
Expected: FAIL.

- [ ] **Step 3: Import useParams**

In `src/App.jsx` line 2, add `useParams` to the react-router-dom import:
```jsx
import { Link, Routes, Route, Navigate, Outlet, useNavigate, useLocation, useParams } from 'react-router-dom';
```

- [ ] **Step 4: Track when rankings are loaded**

Add state in `App`:
```jsx
  const [rankingsLoaded, setRankingsLoaded] = useState(false);
```
In `fetchLeaderboard`, set it in the success path (after `setRankings(data);`) and also on error — simplest is to set it in a `finally`. Update `fetchLeaderboard`:
```jsx
  const fetchLeaderboard = async () => {
    try {
      const { data } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('status', 'verified')
        .order('balance', { ascending: false });
      if (data) setRankings(data);
      return data || [];
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      return [];
    } finally {
      setRankingsLoaded(true);
    }
  };
```

- [ ] **Step 5: Add the route**

In the `MainLayout` route group (after the `/terms` route, before the closing `</Route>`), add:
```jsx
        <Route path="/r/:recordId" element={<SharedResultView rankings={rankings} rankingsLoaded={rankingsLoaded} user={user} userRecord={userRecord} handleLogin={handleLogin} t={t} />} />
```

- [ ] **Step 6: Implement SharedResultView**

Add this component (e.g. after `BalanceUploadView`):
```jsx
function SharedResultView({ rankings, rankingsLoaded, user, userRecord, handleLogin, t }) {
  const { recordId } = useParams();
  const { locale } = useLanguage();
  const navigate = useNavigate();
  const [shareToast, setShareToast] = React.useState(false);

  if (!rankingsLoaded) {
    return <div className="app-container loading-container"><div className="spinner"></div></div>;
  }

  const record = rankings.find((r) => r.id === recordId);
  if (!record) {
    return (
      <div className="app-container shared-result-view shared-result-missing">
        <p className="shared-not-found">{t('shared_not_found')}</p>
        <button className="btn-primary btn-lg" onClick={() => navigate('/')}>{t('anonymous_rank_cta')}</button>
      </div>
    );
  }

  const insight = buildRankInsight({ userId: record.user_id, userRecord: record, rankings });
  const report = normalizeRankReport(
    record.result_report_json || buildFallbackRankReport(insight, locale),
    insight,
    locale
  );
  const canViewBalances = Boolean(userRecord && userRecord.status === 'verified');

  const handleShare = async () => {
    const url = buildShareUrl(window.location.origin, record.id);
    const result = await shareResult({
      url,
      title: t('shared_result_headline').replace('{nickname}', record.nickname),
      description: report.mainCopy || '',
      imageUrl: `${window.location.origin}/logo.png`,
      ctaLabel: t('anonymous_rank_cta'),
      homeUrl: window.location.origin,
    });
    if (result === 'copied') {
      setShareToast(true);
      window.setTimeout(() => setShareToast(false), 1800);
    }
  };

  return (
    <div className="shared-result-view">
      <div className="hero-section">
        <h1 className={`headline-${locale}`}>
          {t('shared_result_headline').replace('{nickname}', record.nickname)}
        </h1>
      </div>

      <ResultCard insight={insight} report={report} t={t} variant="public" onShare={handleShare} />

      <div className="leaderboard-wrapper">
        <Leaderboard list={rankings} canViewBalances={canViewBalances} currentUserId={user?.id} />
      </div>

      <div className="shared-cta-wrap">
        <button className="btn-primary btn-lg" onClick={user ? () => navigate('/dashboard') : handleLogin}>
          {t('anonymous_rank_cta')}
        </button>
      </div>

      {shareToast && <div className="share-toast">{t('copy_link_done')}</div>}
    </div>
  );
}
```

- [ ] **Step 7: Add shared-page CSS**

In `src/index.css` add:
```css
.shared-result-view {
  display: flex;
  flex-direction: column;
}

.shared-cta-wrap {
  display: flex;
  justify-content: center;
  margin: var(--spacing-lg) 0 var(--spacing-xl);
}

.shared-result-missing {
  align-items: center;
  text-align: center;
  gap: var(--spacing-md);
  padding-top: var(--spacing-xxl);
}

.shared-not-found {
  color: var(--color-ink-muted);
  font-size: 1rem;
}
```

- [ ] **Step 8: Run tests + build**

Run: `npm test && npm run build`
Expected: PASS + build OK.

- [ ] **Step 9: Commit**

```bash
git add src/App.jsx src/index.css test/resultPage.test.js
git commit -m "feat: public shareable result page at /r/:recordId"
```

---

## Task 14: Per-locale line-break QA (item 8)

**Files:**
- Modify: `src/index.css` (per-locale tweaks as found)

- [ ] **Step 1: Build and start a local preview**

Run:
```bash
npm run build
npm run preview -- --port 4173 &
```
Expected: preview server on http://localhost:4173 (Supabase env must be present in `.env.local`).

- [ ] **Step 2: Screenshot each locale at a phone viewport with Playwright**

Use the `qa` / Playwright MCP (or a Playwright script) at 390×844. For each locale `ko,en,vi,zh,mn,uz,ja` visit `/?lang=<locale>` and capture: landing hero (`h1.headline-<locale>`), the verify page, and (with a verified session if available) the dashboard ResultCard + a `/r/:id` page. Record any text that overflows, clips, or wraps awkwardly.

- [ ] **Step 3: Fix overflow/clipping in CSS**

The base `h1` has `white-space: nowrap; overflow: hidden; text-overflow: ellipsis;` which clips long localized titles. In the existing `@media (max-width: 480px)` block, ensure long-title locales wrap instead of clip, e.g.:
```css
@media (max-width: 480px) {
  h1.headline-mn,
  h1.headline-uz,
  h1.headline-vi {
    white-space: normal;
    font-size: 1.5rem;
    line-height: 1.22;
  }
}
```
Apply analogous per-locale font-size/`white-space: normal` tweaks for any clipped strings found in Step 2 (result card main copy, verify title, gauge stage labels, share CTA). Keep changes scoped to the affected `headline-<locale>` / component selectors.

- [ ] **Step 4: Re-screenshot to confirm**

Re-run Step 2 for the locales you changed; confirm no clipping/ugly wraps remain.

- [ ] **Step 5: Stop the preview server + commit**

```bash
# stop the backgrounded preview (e.g. kill %1)
git add src/index.css
git commit -m "fix: per-locale line breaks and title clipping on mobile"
```

---

## Task 15: Final verification

- [ ] **Step 1: Full test suite**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no errors (fix any introduced).

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Manual smoke (preview) of the full funnel**

With `npm run preview`, verify: login → profile (pick nationality → UI switches language on the nickname step) → `/verify-balance` fits one screen with toss/kakaobank hint → upload shows the gauge → celebration modal shows full (untruncated) main copy + `가천대 N등 · 상위 X%` + balance line → dashboard shows one ResultCard (share icon + small 수정요청 link, no 재인증) → correction modal accepts a photo → share icon → Kakao (if `VITE_KAKAO_JS_KEY` set) or copy-link toast → open `/r/:id` logged-out shows `{nickname}님의 지갑 현실`, mosaiced leaderboard, bottom CTA.

- [ ] **Step 5: Note Kakao env requirement**

Confirm `VITE_KAKAO_JS_KEY` is documented in `.env.local.example`. Remind the user to add it to `.env.local` and Vercel for Kakao share (falls back to copy-link without it).

---

## Self-Review Notes
- **Spec coverage:** item 1 → Task 3; item 2 → Task 2; item 3 → Task 7; item 4 → Tasks 7-8; item 5 → Tasks 4, 9; item 6 → Task 10; item 7 → Tasks 5, 6, 11, 12, 13; item 8 → Task 14. Kakao share → Tasks 5, 11, 13. Correction photo → Task 12. 재인증 removal → Task 11 (no 재인증 link rendered).
- **Placeholder scan:** all code blocks are concrete; i18n given for all 7 locales.
- **Type/name consistency:** `nextProgress`/`stageForProgress`/`STAGE_KEYS` (Task 4) reused in Task 9; `buildShareUrl`/`shareResult` (Task 5) reused in Tasks 11, 13; `ResultCard` props `{insight, report, t, variant, onShare, onCorrection}` consistent across Tasks 11, 13; `ZONE_LABELS` export (Task 6) consumed in Task 11.
