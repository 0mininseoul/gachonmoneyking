# Conversion Friction Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Maximize signups (`Profile Save Succeeded` = contact capture) before 6/10 by decoupling registration from balance verification (P0), softening the Kakao login wall with a locale interstitial + Google login (P1), and raising landing motivation + leaderboard credibility (P2).

**Architecture:** Pure display/auth logic is extracted into small `src/lib/*.js` modules tested with `node:test`; React views (`App.jsx`, `Leaderboard.jsx`) consume those helpers. New user-facing copy goes into all 7 locales in `src/i18n/translations.js`, gated by an extended `test/i18nKeys.test.js` parity test. Dummy-data realism is a new Supabase migration.

**Tech Stack:** React 18 + Vite, react-router-dom v7, Supabase JS (Auth/DB), Amplitude. Tests: `node --test test/*.test.js`. No component test runner — JSX is verified via the `browse` tool (`~/.claude/skills/gstack/browse/dist/browse`).

---

## File Structure

**Create:**
- `src/lib/leaderboardDisplay.js` — balance reveal rules (overall-rank based) + label formatting.
- `src/lib/participation.js` — participant counts (total + by nationality) for social proof.
- `src/lib/authProviders.js` — supported OAuth providers + OAuth options builder.
- `test/leaderboardDisplay.test.js`, `test/participation.test.js`, `test/authProviders.test.js`
- `supabase/migrations/20260605000000_diversify_dummy_nicknames.sql` — varied dummy nickname registers.

**Modify:**
- `src/components/Leaderboard.jsx` — consume `leaderboardDisplay` (global top-N reveal), show live participant count.
- `src/App.jsx` — `handleLogin` → opens login sheet; new `startOAuth(provider)`; `LoginSheet` component; `handleSaveProfile` routes to `/dashboard`; `LandingView` social-proof banner + curiosity row + `revealTopN`; `DashboardView` registration-complete card with optional verify.
- `src/lib/analyticsEvents.js` — add `LOGIN_SHEET_OPENED`, `REGISTRATION_COMPLETED`.
- `src/i18n/translations.js` — new keys across all 7 locales.
- `test/i18nKeys.test.js` — add new keys to the parity check.

**Conventions to follow:** flat per-locale key objects in `translations.js`; `trackUserAction(EVENTS.X, props)`; balance mask string is exactly `'●●●,●●●,●●● KRW'`; locales order `['ko','en','vi','zh','mn','uz','ja']`.

---

## Task 1: Balance reveal logic (`leaderboardDisplay.js`)

**Files:**
- Create: `src/lib/leaderboardDisplay.js`
- Test: `test/leaderboardDisplay.test.js`

- [ ] **Step 1: Write the failing test**

```js
// test/leaderboardDisplay.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldRevealBalance, formatBalanceLabel, MASKED_BALANCE } from '../src/lib/leaderboardDisplay.js';

test('verified viewer always sees the balance', () => {
  assert.equal(shouldRevealBalance({ canViewBalances: true, overallRank: 50, revealTopN: 3 }), true);
});

test('global top-N is revealed to anonymous viewers', () => {
  assert.equal(shouldRevealBalance({ overallRank: 1, revealTopN: 3 }), true);
  assert.equal(shouldRevealBalance({ overallRank: 3, revealTopN: 3 }), true);
});

test('rank below N stays masked', () => {
  assert.equal(shouldRevealBalance({ overallRank: 4, revealTopN: 3 }), false);
});

test('no revealTopN and not verified means masked', () => {
  assert.equal(shouldRevealBalance({ overallRank: 1, revealTopN: 0 }), false);
  assert.equal(shouldRevealBalance({ overallRank: null, revealTopN: 3 }), false);
});

test('formatBalanceLabel masks or formats KRW with thousands separators', () => {
  assert.equal(formatBalanceLabel(1234567, true), '1,234,567 KRW');
  assert.equal(formatBalanceLabel(1234567, false), MASKED_BALANCE);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/leaderboardDisplay.test.js`
Expected: FAIL — `Cannot find module '../src/lib/leaderboardDisplay.js'`.

- [ ] **Step 3: Write minimal implementation**

```js
// src/lib/leaderboardDisplay.js
export const MASKED_BALANCE = '●●●,●●●,●●● KRW';

// Reveal rule: a verified viewer sees everything; otherwise only the GLOBAL
// (overall) top-N rows are revealed. overallRank MUST be the rank within the
// full balance-desc list, never a per-tab rank.
export function shouldRevealBalance({ canViewBalances = false, overallRank = null, revealTopN = 0 } = {}) {
  if (canViewBalances) return true;
  if (!revealTopN || !overallRank) return false;
  return overallRank <= revealTopN;
}

export function formatBalanceLabel(balance, reveal) {
  return reveal ? `${Number(balance).toLocaleString()} KRW` : MASKED_BALANCE;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/leaderboardDisplay.test.js`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/leaderboardDisplay.js test/leaderboardDisplay.test.js
git commit -m "feat: add overall-rank balance reveal logic"
```

---

## Task 2: Participant counts (`participation.js`)

**Files:**
- Create: `src/lib/participation.js`
- Test: `test/participation.test.js`

- [ ] **Step 1: Write the failing test**

```js
// test/participation.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { participantCounts, topNationality } from '../src/lib/participation.js';

const list = [
  { nationality: 'vi' }, { nationality: 'vi' }, { nationality: 'zh' }, { nationality: null },
];

test('participantCounts returns total and per-nationality counts', () => {
  const r = participantCounts(list);
  assert.equal(r.total, 4);
  assert.equal(r.byNationality.vi, 2);
  assert.equal(r.byNationality.zh, 1);
  assert.equal(r.byNationality.unknown, 1);
});

test('topNationality returns the most common code and count', () => {
  assert.deepEqual(topNationality(list), { code: 'vi', count: 2 });
});

test('topNationality returns null on empty list', () => {
  assert.equal(topNationality([]), null);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/participation.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```js
// src/lib/participation.js
export function participantCounts(list = []) {
  const byNationality = {};
  for (const item of list) {
    const key = item?.nationality || 'unknown';
    byNationality[key] = (byNationality[key] || 0) + 1;
  }
  return { total: list.length, byNationality };
}

export function topNationality(list = []) {
  const { byNationality } = participantCounts(list);
  let best = null;
  for (const [code, count] of Object.entries(byNationality)) {
    if (code === 'unknown') continue;
    if (!best || count > best.count) best = { code, count };
  }
  return best;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/participation.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/participation.js test/participation.test.js
git commit -m "feat: add participant count helpers for social proof"
```

---

## Task 3: Auth providers (`authProviders.js`)

**Files:**
- Create: `src/lib/authProviders.js`
- Test: `test/authProviders.test.js`

- [ ] **Step 1: Write the failing test**

```js
// test/authProviders.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { AUTH_PROVIDERS, isSupportedProvider, buildOAuthOptions } from '../src/lib/authProviders.js';

test('kakao and google are supported, others are not', () => {
  assert.deepEqual(AUTH_PROVIDERS, ['kakao', 'google']);
  assert.equal(isSupportedProvider('kakao'), true);
  assert.equal(isSupportedProvider('google'), true);
  assert.equal(isSupportedProvider('facebook'), false);
});

test('buildOAuthOptions returns redirectTo set to origin', () => {
  assert.deepEqual(buildOAuthOptions('https://gachonmoneyking.vercel.app'), {
    redirectTo: 'https://gachonmoneyking.vercel.app',
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/authProviders.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```js
// src/lib/authProviders.js
export const AUTH_PROVIDERS = ['kakao', 'google'];

export function isSupportedProvider(provider) {
  return AUTH_PROVIDERS.includes(provider);
}

export function buildOAuthOptions(origin) {
  return { redirectTo: origin };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/authProviders.test.js`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/authProviders.js test/authProviders.test.js
git commit -m "feat: add auth provider config helper"
```

---

## Task 4: Add new i18n keys to all 7 locales (parity-gated)

**Files:**
- Modify: `test/i18nKeys.test.js`
- Modify: `src/i18n/translations.js`

New keys (authoritative ko/en + translations for vi/zh/mn/uz/ja). Templated keys keep `{count}`/`{country}` placeholders.

| key | ko | en |
|---|---|---|
| `reg_complete_title` | 🎉 참여 완료! | 🎉 You're in! |
| `reg_complete_desc` | 경품 추첨 응모가 완료됐어요. 잔고 인증은 선택이에요. | You're entered in the prize draw. Balance verification is optional. |
| `verify_optional_btn` | 잔고 인증하고 순위 보기 (선택) | Verify balance & see my rank (optional) |
| `verify_optional_hint` | 나중에 해도 추첨에는 영향 없어요. | Doing it later won't affect the draw. |
| `login_sheet_title` | 30초면 끝나요 | Takes 30 seconds |
| `login_sheet_desc` | 카카오 또는 구글 계정으로 로그인하세요. | Log in with your Kakao or Google account. |
| `login_provider_kakao` | 카카오로 계속 | Continue with Kakao |
| `login_provider_google` | Google로 계속 | Continue with Google |
| `login_sheet_privacy_note` | 잔고·연락처는 경품 추첨 용도로만 쓰여요. | Balance & contact are used only for the prize draw. |
| `participants_live_count` | 🔥 지금 {count}명 참여 중 | 🔥 {count} students competing now |
| `curiosity_you_row` | 당신은 몇 위? 지금 확인 | What's your rank? Check now |

Translations for the remaining locales (every key, all non-empty):

```text
vi:
  reg_complete_title: 🎉 Hoàn tất tham gia!
  reg_complete_desc: Bạn đã tham gia rút thăm trúng thưởng. Xác minh số dư là tùy chọn.
  verify_optional_btn: Xác minh số dư & xem hạng của tôi (tùy chọn)
  verify_optional_hint: Làm sau cũng không ảnh hưởng đến rút thăm.
  login_sheet_title: Chỉ mất 30 giây
  login_sheet_desc: Đăng nhập bằng tài khoản Kakao hoặc Google.
  login_provider_kakao: Tiếp tục với Kakao
  login_provider_google: Tiếp tục với Google
  login_sheet_privacy_note: Số dư & liên hệ chỉ dùng cho việc rút thăm.
  participants_live_count: 🔥 {count} sinh viên đang tham gia
  curiosity_you_row: Bạn hạng mấy? Kiểm tra ngay
zh:
  reg_complete_title: 🎉 参与完成！
  reg_complete_desc: 您已进入抽奖。余额验证为可选项。
  verify_optional_btn: 验证余额并查看排名（可选）
  verify_optional_hint: 稍后再做也不影响抽奖。
  login_sheet_title: 仅需 30 秒
  login_sheet_desc: 使用 Kakao 或 Google 账号登录。
  login_provider_kakao: 使用 Kakao 继续
  login_provider_google: 使用 Google 继续
  login_sheet_privacy_note: 余额和联系方式仅用于抽奖。
  participants_live_count: 🔥 已有 {count} 名同学参与
  curiosity_you_row: 你排第几？立即查看
mn:
  reg_complete_title: 🎉 Оролцоо дууслаа!
  reg_complete_desc: Та сугалаанд бүртгэгдлээ. Үлдэгдэл баталгаажуулалт сонголттой.
  verify_optional_btn: Үлдэгдлээ баталгаажуулж зэргээ харах (сонголттой)
  verify_optional_hint: Дараа хийсэн ч сугалаанд нөлөөлөхгүй.
  login_sheet_title: Ердөө 30 секунд
  login_sheet_desc: Kakao эсвэл Google бүртгэлээр нэвтэрнэ үү.
  login_provider_kakao: Kakao-гаар үргэлжлүүлэх
  login_provider_google: Google-ээр үргэлжлүүлэх
  login_sheet_privacy_note: Үлдэгдэл, холбоо барих мэдээллийг зөвхөн сугалаанд ашиглана.
  participants_live_count: 🔥 Одоо {count} оюутан оролцож байна
  curiosity_you_row: Та хэддүгээрт вэ? Одоо шалга
uz:
  reg_complete_title: 🎉 Ishtirok yakunlandi!
  reg_complete_desc: Siz yutuq oʻyiniga kiritildingiz. Balansni tasdiqlash ixtiyoriy.
  verify_optional_btn: Balansni tasdiqlab, oʻrnimni koʻrish (ixtiyoriy)
  verify_optional_hint: Keyinroq qilsangiz ham oʻyinga taʼsir qilmaydi.
  login_sheet_title: Atigi 30 soniya
  login_sheet_desc: Kakao yoki Google hisobi bilan kiring.
  login_provider_kakao: Kakao bilan davom etish
  login_provider_google: Google bilan davom etish
  login_sheet_privacy_note: Balans va aloqa faqat yutuq oʻyini uchun ishlatiladi.
  participants_live_count: 🔥 Hozir {count} talaba ishtirok etmoqda
  curiosity_you_row: Oʻrningiz nechinchi? Hozir tekshiring
ja:
  reg_complete_title: 🎉 参加完了！
  reg_complete_desc: 抽選にエントリーされました。残高認証は任意です。
  verify_optional_btn: 残高を認証して順位を見る（任意）
  verify_optional_hint: 後で行っても抽選には影響しません。
  login_sheet_title: 30秒で完了
  login_sheet_desc: KakaoまたはGoogleアカウントでログイン。
  login_provider_kakao: Kakaoで続ける
  login_provider_google: Googleで続ける
  login_sheet_privacy_note: 残高・連絡先は抽選のみに使用します。
  participants_live_count: 🔥 現在 {count} 人が参加中
  curiosity_you_row: あなたは何位？今すぐ確認
```

- [ ] **Step 1: Write the failing test** — extend the parity list in `test/i18nKeys.test.js`.

Append a new test below the existing ones:

```js
const CONVERSION_KEYS = [
  'reg_complete_title', 'reg_complete_desc', 'verify_optional_btn', 'verify_optional_hint',
  'login_sheet_title', 'login_sheet_desc', 'login_provider_kakao', 'login_provider_google',
  'login_sheet_privacy_note', 'participants_live_count', 'curiosity_you_row',
];

test('every locale defines all conversion-improvement keys', () => {
  for (const locale of LOCALES) {
    for (const key of CONVERSION_KEYS) {
      assert.ok(translations[locale][key], `missing ${key} in ${locale}`);
    }
  }
});

test('participants_live_count keeps its {count} placeholder', () => {
  for (const locale of LOCALES) {
    assert.match(translations[locale].participants_live_count, /\{count\}/);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/i18nKeys.test.js`
Expected: FAIL — `missing reg_complete_title in ko` (keys not added yet).

- [ ] **Step 3: Add the keys to `src/i18n/translations.js`**

For each of the 7 locale objects in `translations`, add the 11 keys with the values from the tables above. Keep each locale's existing keys untouched; insert the new block before the closing `}` of that locale object.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/i18nKeys.test.js`
Expected: PASS (existing tests + 2 new tests).

- [ ] **Step 5: Commit**

```bash
git add src/i18n/translations.js test/i18nKeys.test.js
git commit -m "feat: add conversion-improvement copy to all 7 locales"
```

---

## Task 5: Add analytics events

**Files:**
- Modify: `src/lib/analyticsEvents.js`

- [ ] **Step 1: Inspect current EVENTS shape**

Run: `grep -n "LOGIN_CLICKED\|PROFILE_SAVE_SUCCEEDED" src/lib/analyticsEvents.js`
Expected: shows the `EVENTS` map entries (string values used as Amplitude event names).

- [ ] **Step 2: Add two events**

In the `EVENTS` object add (match the existing `KEY: 'Display Name'` style):

```js
  LOGIN_SHEET_OPENED: 'Login Sheet Opened',
  REGISTRATION_COMPLETED: 'Registration Completed',
```

- [ ] **Step 3: Verify build still resolves**

Run: `node --test test/observability.test.js`
Expected: PASS (this test validates the events module; if it enumerates events it now includes the two new ones — if it fails on an exhaustive list, add the new keys there too).

- [ ] **Step 4: Commit**

```bash
git add src/lib/analyticsEvents.js test/observability.test.js
git commit -m "feat: add login-sheet and registration-completed events"
```

---

## Task 6: Leaderboard — global top-N reveal + live count

**Files:**
- Modify: `src/components/Leaderboard.jsx`

- [ ] **Step 1: Import helpers and accept `revealTopN`**

At top of `src/components/Leaderboard.jsx` add imports:

```js
import { shouldRevealBalance, formatBalanceLabel } from '../lib/leaderboardDisplay';
import { participantCounts } from '../lib/participation';
```

Change the signature (line 7) to:

```js
export function Leaderboard({ list, canViewBalances = false, currentUserId, revealTopN = 0 }) {
```

- [ ] **Step 2: Build an overall-rank lookup from the full list**

Immediately after the `useState('all')` line, add:

```js
  // Overall (global) rank by record id — from the full balance-desc list.
  // Reveal is based on this, NEVER on per-tab activeRank.
  const overallRankById = new Map(list.map((item, idx) => [item.id, idx + 1]));
  const counts = participantCounts(list);
```

- [ ] **Step 3: Replace the two balance cells to use the helper**

For the **pinned user row** balance cell (currently lines ~113-117) replace with:

```jsx
              <div className="col-balance">
                <span className={canViewBalances ? 'balance-amount amp-mask' : 'balance-amount blurred amp-mask'}>
                  {formatBalanceLabel(
                    userItem.balance,
                    shouldRevealBalance({ canViewBalances, overallRank: overallRankById.get(userItem.id), revealTopN })
                  )}
                </span>
              </div>
```

For the **main list row** balance cell (currently lines ~138-142) replace with:

```jsx
                <div className="col-balance">
                  <span className={canViewBalances ? 'balance-amount amp-mask' : 'balance-amount blurred amp-mask'}>
                    {formatBalanceLabel(
                      item.balance,
                      shouldRevealBalance({ canViewBalances, overallRank: overallRankById.get(item.id), revealTopN })
                    )}
                  </span>
                </div>
```

- [ ] **Step 4: Add a live participant count above the table**

Directly after the opening `<div className="leaderboard-container">` (line ~73) insert:

```jsx
      {counts.total > 0 && (
        <div className="leaderboard-live-count">
          {t('participants_live_count').replace('{count}', counts.total)}
        </div>
      )}
```

- [ ] **Step 5: Verify logic tests still pass and app builds**

Run: `node --test test/leaderboardDisplay.test.js test/participation.test.js`
Expected: PASS.
Run: `npm run build`
Expected: build succeeds (no import errors).

- [ ] **Step 6: Visual check (browse)**

```bash
B="$HOME/.claude/skills/gstack/browse/dist/browse"
npm run dev >/tmp/gmk-dev.log 2>&1 &
sleep 3
$B goto http://localhost:5173
$B viewport 390x844
$B screenshot /tmp/gmk-lb.png
```
Then Read `/tmp/gmk-lb.png`. Expected: top-3 rows show real `... KRW`, rows 4+ masked `●●●,●●●,●●● KRW`, and a "🔥 N명 참여 중" line above the table. Switch to a country tab (`$B click` the tab) and confirm country-internal top rows are NOT revealed unless they are also global top-3.

- [ ] **Step 7: Commit**

```bash
git add src/components/Leaderboard.jsx
git commit -m "feat: reveal global top-3 balances and show live participant count"
```

---

## Task 7: LandingView — pass `revealTopN`, social proof, curiosity row

**Files:**
- Modify: `src/App.jsx` (LandingView, ~747-781)

- [ ] **Step 1: Pass `revealTopN` to the landing Leaderboard**

Change line 777 from:

```jsx
        <Leaderboard list={rankings} canViewBalances={false} currentUserId={user?.id} />
```
to:
```jsx
        <Leaderboard list={rankings} canViewBalances={false} currentUserId={user?.id} revealTopN={3} />
```

- [ ] **Step 2: Add a curiosity row into the anonymous nudge banner**

Inside the `else` branch of the `user ?` ternary (the `auth-nudge-banner` for logged-out users, ~769-774), keep the existing CTA button and add a curiosity line above it:

```jsx
        <div className="auth-nudge-banner linear-card">
          <p className="banner-notice">{t('non_logged_in_notice')}</p>
          <p className="curiosity-you-row">{t('curiosity_you_row')}</p>
          <button onClick={handleLogin} className="btn-primary btn-lg banner-login-btn">
            {t('anonymous_rank_cta')}
          </button>
        </div>
```

- [ ] **Step 3: Build + visual check**

Run: `npm run build` → succeeds.
With the dev server from Task 6, `$B goto http://localhost:5173`, `$B screenshot /tmp/gmk-landing.png`, Read it. Expected: live count + curiosity line visible; top-3 balances shown.

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "feat: landing reveals top-3 balances and adds curiosity nudge"
```

---

## Task 8: P1 — Login sheet (interstitial) + Google login

**Files:**
- Modify: `src/App.jsx` (imports, `handleLogin`/`startOAuth`, `loginSheetOpen` state, `LoginSheet` component, render once in root)

- [ ] **Step 1: Import auth helpers + events**

Ensure these imports exist near the top of `src/App.jsx`:

```js
import { isSupportedProvider, buildOAuthOptions } from './lib/authProviders';
```
(`EVENTS` and `trackUserAction` are already imported.)

- [ ] **Step 2: Add `loginSheetOpen` state**

Near the other `useState` declarations in the `App` component (around line 42-67) add:

```js
  const [loginSheetOpen, setLoginSheetOpen] = useState(false);
```

- [ ] **Step 3: Replace `handleLogin` and add `startOAuth`**

Replace the existing `handleLogin` (lines 359-375) with:

```js
  const handleLogin = () => {
    trackUserAction(EVENTS.LOGIN_SHEET_OPENED);
    setLoginSheetOpen(true);
  };

  const startOAuth = async (provider) => {
    if (!isSupportedProvider(provider)) return;
    trackUserAction(EVENTS.LOGIN_CLICKED, { provider });
    sessionStorage.setItem('just_logged_in', 'true');
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: buildOAuthOptions(window.location.origin),
    });
    if (error) {
      trackUserAction(EVENTS.LOGIN_FAILED, {
        provider,
        error_code: safeErrorCode(error),
      }, { operational: true });
      console.error(`Error logging in via ${provider}:`, error);
    }
  };
```

(`Login Clicked` now fires on provider choice = real intent. `Login Sheet Opened` measures the softer top-of-intent.)

- [ ] **Step 4: Add the `LoginSheet` component**

Add this component near the other view components (e.g. just before `LandingView`, ~line 746):

```jsx
function LoginSheet({ open, onClose, onSelect, t }) {
  if (!open) return null;
  return (
    <div className="overlay-celebration" onClick={onClose}>
      <div className="login-sheet linear-card" onClick={(e) => e.stopPropagation()}>
        <button className="close-overlay" onClick={onClose}>×</button>
        <h3>{t('login_sheet_title')}</h3>
        <p>{t('login_sheet_desc')}</p>
        <button className="btn-primary btn-lg login-provider-btn" onClick={() => onSelect('kakao')}>
          {t('login_provider_kakao')}
        </button>
        <button className="btn-secondary btn-lg login-provider-btn" onClick={() => onSelect('google')}>
          {t('login_provider_google')}
        </button>
        <p className="login-sheet-privacy">{t('login_sheet_privacy_note')}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Render the sheet once in the App root**

Inside the App component's returned JSX, render the sheet alongside `<Routes>` (it overlays globally). Find the top-level return (`return ( <Routes> ... )` at ~605) and wrap so the sheet renders too. If the return is a single `<Routes>`, change it to a fragment:

```jsx
  return (
    <>
      <Routes>
        {/* ...existing routes unchanged... */}
      </Routes>
      <LoginSheet
        open={loginSheetOpen}
        onClose={() => setLoginSheetOpen(false)}
        onSelect={(provider) => { setLoginSheetOpen(false); startOAuth(provider); }}
        t={t}
      />
    </>
  );
```

- [ ] **Step 6: Build + behavior check**

Run: `npm run build` → succeeds.
With dev server: `$B goto http://localhost:5173`, `$B snapshot -i`, click the CTA (`Check my rank...`), `$B snapshot -i`. Expected: the login sheet appears with **two** buttons (Kakao, Google) in the selected language, NOT an immediate redirect. Clicking "Continue with Kakao" should redirect to `accounts.kakao.com`. (Google button will only complete once Task 8b config is done.)

- [ ] **Step 7: Commit**

```bash
git add src/App.jsx
git commit -m "feat: pre-login interstitial sheet with Kakao + Google options"
```

### Task 8b: External config (owner action — NOT code)

- [ ] In Google Cloud Console: create an OAuth 2.0 Client ID (Web). Authorized redirect URI: `https://pnjiieykwznqjgwxprdi.supabase.co/auth/v1/callback`.
- [ ] In Supabase Dashboard → Authentication → Providers → Google: enable and paste Client ID/Secret.
- [ ] Verify end-to-end: click "Continue with Google" on the deployed site → returns logged in → routed to `/profile-setup`.

**Blocker note:** the Google button ships but is non-functional until 8b is complete. If 8b cannot be done before launch, hide the Google button by leaving `AUTH_PROVIDERS = ['kakao']` (Task 3) until config lands — the sheet then shows Kakao only and still removes the cold-redirect shock.

---

## Task 9: P0 — Profile save routes to dashboard; registration-complete card

**Files:**
- Modify: `src/App.jsx` (`handleSaveProfile` ~426-428; `DashboardView` not-verified branch ~1238-1252)

- [ ] **Step 1: Route to dashboard after profile save + fire REGISTRATION_COMPLETED**

In `handleSaveProfile`, replace the success block (lines 425-428):

```js
        }, { operational: true });
        setHasProfile(true);
        await checkUserProfile(user);
        navigate('/verify-balance');
```
with:
```js
        }, { operational: true });
        trackUserAction(EVENTS.REGISTRATION_COMPLETED, { nationality, marketing_consent: marketingConsent });
        setHasProfile(true);
        await checkUserProfile(user);
        navigate('/dashboard');
```

- [ ] **Step 2: Reframe the not-verified dashboard state as a completion card**

Replace the `!isVerified && (...)` block (lines 1238-1252) with:

```jsx
        !isVerified && (
          <div className="registration-complete-card linear-card">
            <h2 className="reg-complete-title">{t('reg_complete_title')}</h2>
            <p className="reg-complete-desc">{t('reg_complete_desc')}</p>
            <button
              type="button"
              className="btn-primary btn-lg"
              onClick={() => {
                trackUserAction(EVENTS.DASHBOARD_VERIFY_CLICKED, { source: 'registration_complete_card' });
                navigate('/verify-balance');
              }}
            >
              {t('verify_optional_btn')}
            </button>
            <p className="verify-optional-hint">{t('verify_optional_hint')}</p>
          </div>
        )
```

- [ ] **Step 3: Build + flow reasoning check**

Run: `npm run build` → succeeds.
Confirm by reading the routes: after profile save, `ProtectedRoute` for `/dashboard` requires `user` + `hasProfile` (both true post-save) → renders `DashboardView` → not-verified branch shows the completion card. The user reaches a "done" state with **no** forced balance upload. Verify is reachable but labeled optional.

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "feat: complete registration at profile save, make balance verify optional"
```

---

## Task 10: P2 — Diversify dummy nicknames (migration)

**Files:**
- Create: `supabase/migrations/20260605000000_diversify_dummy_nicknames.sql`

Goal: replace the uniformly-witty dummy nicknames with a mixed register (plain handles, name-style, numbers, lower-effort) so the seed set reads as organic. Keep `is_dummy=true`, same nationalities/balances strategy as `20260529000007`.

- [ ] **Step 1: Write the migration** (mirror the structure of `supabase/migrations/20260529000007_reduce_and_localize_dummies.sql`, only the `*_nicknames` arrays change to mixed registers)

```sql
-- Diversify dummy nickname registers so the seed leaderboard reads as organic
-- (mix of plain handles, name-style, numbers, and a few low-effort entries),
-- instead of uniformly witty student puns.
delete from public.leaderboard where is_dummy = true;
delete from public.profiles where is_dummy = true;
delete from auth.users where id not in (
  'f1e0801d-49d5-4197-bf51-8b0512b24a48', -- Minh Anh (vietnamese)
  '67a0417d-69ba-4b5d-9f8a-2c5c44e8a16d'  -- Tuan (vietnamese)
);

DO $$
DECLARE
    new_uid uuid; i integer; dummy_email text; dummy_balance numeric;
    -- Mixed registers: real-name-ish, plain handle, number suffix, one witty, one lazy
    vn_nicknames text[] := array['minh.0902','pholuon','ng_anh','huy2001','tiếtkiệm','an','tran_99'];
    vn_realnames text[] := array['Le Minh Anh','Pham Thuy Linh','Le Thi Huong','Phan Gia Huy','Vu Hoai Nam','Dang Thanh Phong','Bui Minh Thao'];
    ja_nicknames text[] := array['yuka_t'];
    ja_realnames text[] := array['Yuka Tanaka'];
    zh_nicknames text[] := array['xiaowang','limin_3','陈yu','zhao1998','加川'];
    zh_realnames text[] := array['Wang Jing','Li Min','Chen Yu','Zhao Xin','Liu Yan'];
    mn_nicknames text[] := array['temka','khulan_0'];
    mn_realnames text[] := array['Temulen Bat-Erdene','Khulan Altangerel'];
    uz_nicknames text[] := array['anvar_s'];
    uz_realnames text[] := array['Anvar Soliev'];
BEGIN
    FOR i IN 1..7 LOOP
        new_uid := gen_random_uuid(); dummy_email := 'vn_dummy_' || i || '@gachon.ac.kr';
        if i <= 5 then dummy_balance := floor(random() * 2900000 + 100000); else dummy_balance := floor(random() * 3000000 + 3000000); end if;
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
        VALUES (new_uid, dummy_email, '$2a$10$abcdefghijklmnopqrstuv', now(), '{"provider":"kakao"}', '{}', 'authenticated', 'authenticated', now(), now());
        INSERT INTO public.profiles (id, nickname, nationality, real_name, phone_number, gender, marketing_consent, is_dummy, email, avatar_url)
        VALUES (new_uid, vn_nicknames[i], 'vi', vn_realnames[i], '010-0000-00' || to_char(i,'FM00'), 'unknown', true, true, dummy_email, '');
        INSERT INTO public.leaderboard (user_id, nickname, nationality, balance, screenshot_url, status, is_dummy, updated_at)
        VALUES (new_uid, vn_nicknames[i], 'vi', dummy_balance, 'https://example.com/screenshots/dummy.png', 'verified', true, now());
    END LOOP;
    FOR i IN 1..1 LOOP
        new_uid := gen_random_uuid(); dummy_email := 'ja_dummy_' || i || '@gachon.ac.kr'; dummy_balance := floor(random() * 4200000 + 300000);
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
        VALUES (new_uid, dummy_email, '$2a$10$abcdefghijklmnopqrstuv', now(), '{"provider":"kakao"}', '{}', 'authenticated', 'authenticated', now(), now());
        INSERT INTO public.profiles (id, nickname, nationality, real_name, phone_number, gender, marketing_consent, is_dummy, email, avatar_url)
        VALUES (new_uid, ja_nicknames[i], 'ja', ja_realnames[i], '010-4444-00' || to_char(i,'FM00'), 'unknown', true, true, dummy_email, '');
        INSERT INTO public.leaderboard (user_id, nickname, nationality, balance, screenshot_url, status, is_dummy, updated_at)
        VALUES (new_uid, ja_nicknames[i], 'ja', dummy_balance, 'https://example.com/screenshots/dummy.png', 'verified', true, now());
    END LOOP;
    FOR i IN 1..5 LOOP
        new_uid := gen_random_uuid(); dummy_email := 'zh_dummy_' || i || '@gachon.ac.kr';
        if i <= 3 then dummy_balance := floor(random() * 4500000 + 500000); else dummy_balance := floor(random() * 3000000 + 5000000); end if;
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
        VALUES (new_uid, dummy_email, '$2a$10$abcdefghijklmnopqrstuv', now(), '{"provider":"kakao"}', '{}', 'authenticated', 'authenticated', now(), now());
        INSERT INTO public.profiles (id, nickname, nationality, real_name, phone_number, gender, marketing_consent, is_dummy, email, avatar_url)
        VALUES (new_uid, zh_nicknames[i], 'zh', zh_realnames[i], '010-1111-00' || to_char(i,'FM00'), 'unknown', true, true, dummy_email, '');
        INSERT INTO public.leaderboard (user_id, nickname, nationality, balance, screenshot_url, status, is_dummy, updated_at)
        VALUES (new_uid, zh_nicknames[i], 'zh', dummy_balance, 'https://example.com/screenshots/dummy.png', 'verified', true, now());
    END LOOP;
    FOR i IN 1..2 LOOP
        new_uid := gen_random_uuid(); dummy_email := 'mn_dummy_' || i || '@gachon.ac.kr'; dummy_balance := floor(random() * 3900000 + 100000);
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
        VALUES (new_uid, dummy_email, '$2a$10$abcdefghijklmnopqrstuv', now(), '{"provider":"kakao"}', '{}', 'authenticated', 'authenticated', now(), now());
        INSERT INTO public.profiles (id, nickname, nationality, real_name, phone_number, gender, marketing_consent, is_dummy, email, avatar_url)
        VALUES (new_uid, mn_nicknames[i], 'mn', mn_realnames[i], '010-2222-00' || to_char(i,'FM00'), 'unknown', true, true, dummy_email, '');
        INSERT INTO public.leaderboard (user_id, nickname, nationality, balance, screenshot_url, status, is_dummy, updated_at)
        VALUES (new_uid, mn_nicknames[i], 'mn', dummy_balance, 'https://example.com/screenshots/dummy.png', 'verified', true, now());
    END LOOP;
    FOR i IN 1..1 LOOP
        new_uid := gen_random_uuid(); dummy_email := 'uz_dummy_' || i || '@gachon.ac.kr'; dummy_balance := floor(random() * 4350000 + 150000);
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
        VALUES (new_uid, dummy_email, '$2a$10$abcdefghijklmnopqrstuv', now(), '{"provider":"kakao"}', '{}', 'authenticated', 'authenticated', now(), now());
        INSERT INTO public.profiles (id, nickname, nationality, real_name, phone_number, gender, marketing_consent, is_dummy, email, avatar_url)
        VALUES (new_uid, uz_nicknames[i], 'uz', uz_realnames[i], '010-3333-00' || to_char(i,'FM00'), 'unknown', true, true, dummy_email, '');
        INSERT INTO public.leaderboard (user_id, nickname, nationality, balance, screenshot_url, status, is_dummy, updated_at)
        VALUES (new_uid, uz_nicknames[i], 'uz', dummy_balance, 'https://example.com/screenshots/dummy.png', 'verified', true, now());
    END LOOP;
END $$;
```

- [ ] **Step 2: Apply locally / to linked project**

Run: `supabase db push --linked`
Expected: migration applies without error. (Per project deploy notes, `db push --linked` is the path.)

- [ ] **Step 3: Verify the seed looks organic**

Run a quick check (SQL editor or `supabase`): `select nickname, nationality from public.leaderboard where is_dummy = true order by balance desc;`
Expected: ~16 rows with mixed-register nicknames (handles, names, numbers), not all witty puns.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260605000000_diversify_dummy_nicknames.sql
git commit -m "feat: diversify dummy nickname registers for organic-looking seed"
```

---

## Task 11: Full verification pass

- [ ] **Step 1: Run the whole test suite**

Run: `npm test`
Expected: all `test/*.test.js` pass (including the new lib + i18n tests).

- [ ] **Step 2: Lint + build**

Run: `npm run lint && npm run build`
Expected: no lint errors; build succeeds.

- [ ] **Step 3: End-to-end browse QA (mobile viewport)**

```bash
B="$HOME/.claude/skills/gstack/browse/dist/browse"
$B viewport 390x844
$B goto http://localhost:5173
$B screenshot /tmp/gmk-final-landing.png   # Read it
$B snapshot -i                              # CTA present
# click CTA -> login sheet with 2 providers (selected language)
```
Confirm: (a) landing shows live count + curiosity nudge + global top-3 real balances; (b) CTA opens the locale login sheet with Kakao + Google (not a cold redirect); (c) switching language updates the sheet copy; (d) country tab does not reveal country-internal top balances.

- [ ] **Step 4: Push branch**

```bash
git push -u origin feat/conversion-friction-improvements
```
(Vercel will build a preview. Per project notes, merging to `main` auto-deploys prod.)

---

## Self-Review notes (author)

- **Spec coverage:** P0 → Task 9. P1 interstitial+Google → Tasks 3, 8, 8b. P2 social proof/curiosity → Tasks 2, 6, 7; global top-1~3 reveal → Tasks 1, 6, 7; nickname diversity → Task 10; live count → Task 6. Analytics → Task 5. i18n → Task 4.
- **Decision honored:** reveal is computed from `overallRankById` (full-list rank), explicitly NOT `activeRank`, so country tabs never reveal country-internal tops. (Task 1 + Task 6 Step 2-3.)
- **Type consistency:** `shouldRevealBalance({ canViewBalances, overallRank, revealTopN })` and `formatBalanceLabel(balance, reveal)` signatures match between Task 1 and Task 6. `participantCounts(list).total` used in Task 6 Step 4. `startOAuth(provider)` / `isSupportedProvider` / `buildOAuthOptions` consistent across Tasks 3 and 8.
- **Known dependency/risk:** Google login non-functional until Task 8b (external config); fallback documented (ship Kakao-only by trimming `AUTH_PROVIDERS`).
- **Manual-QA tasks:** JSX changes (Tasks 6-9) have no unit test runner; verified via `browse` screenshots + the i18n parity test. Pure logic (Tasks 1-3) is fully TDD'd.
