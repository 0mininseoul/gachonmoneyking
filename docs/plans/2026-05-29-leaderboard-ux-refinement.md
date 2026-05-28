# 리더보드 사용자 고정, 일본어 지원 추가, 탭 필터링 및 데이터 현실화 계획

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

본 계획은 일본어 지원을 새롭게 추가하고, 리더보드에 로그인 유저 랭킹이 항상 최상단에 고정 표시되도록 UX를 개편하며, 44명 더미 데이터를 일본인 3명을 포함한 현실적인 금액대/닉네임으로 개편하고 국가별 필터 탭 바를 추가하는 계획입니다.

**목표:**
1. **사용자 로우 최상단 고정 (Pinning)**: 로그인한 인증 유저의 경우 리더보드의 어떤 탭 뷰(전체/국가별)에서든 본인의 랭킹 로우가 항상 표 최상단에 고정되어 노출되도록 개선합니다.
2. **일본어(ja) 지원**: 일본어 번역 리소스 및 일본 국적 탭을 추가합니다.
3. **더미 데이터 현실화 및 일본인 대체**: 44명의 더미 유저 데이터를 리셋 후 국가별 특징에 맞춰 자연스러운 닉네임과 현실성 있는 금액대로 재구축합니다. (베트남 24명, 일본 3명, 중국 12명, 몽골 2명, 우즈벡 3명)
4. **국가별 탭 필터링**: 리더보드 상단에 탭 메뉴를 추가하여 필터링 뷰를 제공합니다.
5. **헤드라인 카피 개편**: 메인 헤드라인을 "나는 가천대에서 자산 순위 몇 등일까?"로 전격 변경하고, 모바일에서도 무조건 한 줄로 나오도록 보장합니다.

---

### Task 1: 다국어 번역 리소스 추가 및 헤드라인/일본어 변경

**Files:**
- Modify: [translations.js](file:///Users/youngminpark/Desktop/개발/balanceboard/src/i18n/translations.js)

**Step 1: 번역 추가**
- 모든 기존 6개 국어 팩의 `title` 값을 각 국가별 언어에 어울리는 **"나는 가천대에서 자산 순위 몇 등일까?"** 번역으로 수정.
- 각 국가 언어 팩 마지막에 `tab_all`, `tab_vi`, `tab_zh`, `tab_mn`, `tab_uz`, `tab_ja`, `me_label` 번역 추가.
- 일본어(`ja`) 번역 전체 블록을 `translations` 오브젝트에 추가.
- `nationalities` 목록에 `{ code: "ja", name: "Japan", flag: "🇯🇵" }` 추가.

**Step 2: 변경 내역 커밋**
```bash
git add src/i18n/translations.js
git commit -m "feat: add Japanese support, update headline copy, and tab translations"
```

---

### Task 2: 더미 데이터 현실화 및 일본인 Seeding 마이그레이션 적용

**Files:**
- Create: `supabase/migrations/20260529000003_refine_dummy_realism.sql`

**Step 1: SQL 마이그레이션 파일 작성**
- 기존 44명의 더미 유저들의 `profiles` 및 `leaderboard` 데이터를 삭제하고 새로 Seeding을 수행하는 SQL 스크립트 작성.
  - 베트남(24명): 닉네임 예: `Linh_Cute`, `Huy_Gachon` / 잔고: 10만 ~ 1,200만 KRW 분포.
  - 일본(3명): 닉네임 예: `Kento_jp`, `Yuka_Sato`, `Haru_Haru` / 잔고: 30만 ~ 1,500만 KRW 분포.
  - 중국(12명): 닉네임 예: `Gachon_Panda`, `Xiao_Wang` / 잔고: 50만 ~ 2,500만 KRW 분포.
  - 몽골(2명): 닉네임 예: `Temu_Mn`, `Khulan_Kh` / 잔고: 10만 ~ 800만 KRW 분포.
  - 우즈벡(3명): 닉네임 예: `Anvar_Uz`, `Jasur_Uz` / 잔고: 15만 ~ 1,000만 KRW 분포.

**Step 2: DB 쿼리 실행**
```bash
npx supabase db query --linked -f supabase/migrations/20260529000003_refine_dummy_realism.sql
```

**Step 3: 커밋**
```bash
git add supabase/migrations/20260529000003_refine_dummy_realism.sql
git commit -m "migration: update dummy user nicknames, balances, and add Japanese users"
```

---

### Task 3: Leaderboard.jsx 필터 탭 및 사용자 로우 고정 구현

**Files:**
- Modify: [Leaderboard.jsx](file:///Users/youngminpark/Desktop/개발/balanceboard/src/components/Leaderboard.jsx)

**Step 1: 필터 탭 및 최상단 고정 로직 코드 구현**
- `currentUserId` prop 추가.
- `activeTab` 상태 생성 및 탭 메뉴 바 렌더링.
- 랭킹 전체 목록에서 현재 로그인 사용자의 `overallRank`를 먼저 구한 뒤, 필터링 및 로우 조립 진행.
- 렌더링 시 `item.isPinned` 일 경우 `.pinned-user-row` 클래스를 부여하여 별도 강조 표시 및 "나/Me" 배지 노출.

**Step 2: 커밋**
```bash
git add src/components/Leaderboard.jsx
git commit -m "feat: add tabs filtering and top row pinning to Leaderboard"
```

---

### Task 4: App.jsx 연동 및 헤드라인 한 줄 보장 CSS 적용

**Files:**
- Modify: [App.jsx](file:///Users/youngminpark/Desktop/개발/balanceboard/src/App.jsx)
- Modify: [index.css](file:///Users/youngminpark/Desktop/개발/balanceboard/src/index.css)

**Step 1: App.jsx 내 Leaderboard 연동 수정**
- `LandingView` 및 `DashboardView`에서 `<Leaderboard>` 호출 부에 `currentUserId={user?.id}` 추가 전달.

**Step 2: index.css 스타일링**
- 헤드라인 `h1`에 `white-space: nowrap`, `font-size: clamp(1.2rem, 5vw, 2.2rem)` 스타일 적용하여 모바일 한 줄 유지.
- 탭 필터 바 및 고정 유저 하이라이트 보더/배경 스타일 추가.

**Step 3: 빌드 및 배포**
```bash
npm run build
npx vercel --prod --yes
git add src/App.jsx src/index.css
git commit -m "style: style filters, pinned user rows and prevent title text wrap"
git push origin main
```
