# 전환 마찰 개선 스펙 (Gachon Money King)

- **작성일**: 2026-06-05
- **운영 마감**: 2026-06-10 (약 5일)
- **최우선 KPI**: `Profile Save Succeeded`(= 실명·전화·국적·마케팅 동의 = **연락처 확보**) 수 극대화. 통장 잔고 검증은 부차/사후.
- **근거 데이터 출처**: Amplitude `Gachon Money King - QR Tracking` (appId 824414). 트래픽이 사실상 6/4 하루에 집중 → 오늘 ≈ 누적.

---

## 1. 문제 진단 (측정 근거)

오늘(6/4 KST) 퍼널, 순 사용자 기준:

| 단계 | 수 | 비고 |
|---|---|---|
| Poster QR Opened | 30 | |
| session_start | 37 | |
| Page Viewed | 44 | |
| Leaderboard Tab Selected | 23 | 세션의 62%가 국가별 탭 탐색 (콘텐츠 흥미 O) |
| **Login Clicked** | **7** | 세션 37 → 7 (**~81% 미클릭**) |
| **Login Completed** | **2** | 7 → 2 (**71% 이탈, 최대 누수**) |
| Profile Save Succeeded | 2 | |
| Dashboard Verify Clicked | 1 | |
| **리더보드 실제 등재** | **0** | 17개 노출 항목은 전부 시드(`is_dummy=true`) |

### 마찰 벽 3개

1. **로그인 동기 부족** (세션 37 → 클릭 7). `LandingView`(App.jsx:747-781)가 비로그인 사용자에게 리더보드 전체를 노출하고 잔고만 마스킹(`canViewBalances={false}`). 궁금증이 행동 없이 해소됨.
2. **카카오 로그인 벽 붕괴** (클릭 7 → 완료 2). CTA → `signInWithOAuth({ provider:'kakao' })`(App.jsx:360) → 즉시 `accounts.kakao.com`. 라이브 확인 결과: 영어 선택에도 **한국어** ID/비밀번호 폼, **카카오 단독**. 로그인 후 처리 코드(App.jsx:185-248)는 정상 → 이탈은 카카오 페이지에서 발생(앱 버그 아님).
3. **등재까지 요구하는 PII·통장 스크린샷 과중** (완료 2 → 검증 클릭 1 → 등재 0). 프로필 위저드(국적→닉네임→전화→약관) 후 `/verify-balance`에서 실제 모바일뱅킹 잔고 스크린샷 업로드 필요(App.jsx:609).

### 리더보드 신뢰도 (추가 검토)

시드 닉네임(migration `20260529000007_reduce_and_localize_dummies.sql`)이 16개 전부 동일 톤의 유학생 자학 밈(`sinh_viên_nghèo`, `早八受害者`, `加川摸鱼王`, `課題終わらん`…) + 일관된 snake_case → "세트로 작성된 것"으로 패턴 인식될 위험. 단, `Leaderboard Tab Selected=23`은 "즉시 가짜로 튕기진 않았다"는 약한 반증. **더 큰 신뢰 저하 요인은 전원 잔고 ●●● 마스킹(돈 보드인데 돈 안 보임) + 라이브니스 신호 0.** → 유력 기여 요인으로 보고 저비용 수정.

---

## 2. 개선 범위 (확정: P0 + P1 + P2)

### P0 — 등재·가입 분리 (인식 전환, 저난도·최고 ROI)

**목표**: 프로필 저장을 "완료 지점"으로. 잔고 인증은 선택 업셀.

- `handleSaveProfile` 성공 후 `navigate('/verify-balance')`(App.jsx:426)를 **완료 화면**으로 변경: "🎉 참여 완료! 추첨 대상에 등록됐어요."
- 완료 화면에 선택 업셀 2버튼: **[지금 잔고 인증하고 순위 보기 (선택)]** / **[나중에 하기 → 대시보드]**.
- `/verify-balance`는 선택 경로로 유지(대시보드에서 진입 가능).
- 카피: "잔고 인증은 *순위 공개*용일 뿐, 경품 추첨은 이미 응모 완료" 메시지로 잔고 업로드 부담 제거.

**수정 파일**: `src/App.jsx`(handleSaveProfile 분기, DashboardView/완료 화면), `src/i18n/translations.js`(7개 로케일).

**완료 기준**: 통장 스크린샷을 올리지 않아도 프로필 저장만으로 "완료" 상태 도달 가능. 잔고 인증은 명시적으로 "선택"으로 표기.

### P1 — 카카오 로그인 벽 완화 (최대 누수 71% 직공략)

**(a) 로그인 직전 안내 시트 (선택 언어)**
- `handleLogin`(App.jsx:358) 즉시 리다이렉트 대신, CTA 클릭 시 **바텀시트/모달** 표시: "다음은 **카카오**(한국 국민 메신저) 로그인입니다. 카카오톡 계정으로 30초면 끝나요. 잔고는 본인만 봅니다." + 제공자 버튼.
- 제공자 버튼 클릭 시 `signInWithOAuth` 호출. `Login Clicked` 이벤트는 **제공자 버튼 클릭** 시점에 기록(실제 의도 측정), 시트 오픈은 별도 이벤트(예: `Login Sheet Opened`).

**(b) 구글 로그인 추가**
- 안내 시트에 **[Google로 계속]** 버튼 추가 → `signInWithOAuth({ provider:'google', options:{ redirectTo: window.location.origin } })`.
- 프로필 메타 매핑은 이미 제공자 일반화(`meta.name || meta.full_name`, profilePayload.js:81) → 구글도 동작.
- **외부 설정 의존성(소유자 작업)**: Supabase Auth에 Google provider 활성화 + Google Cloud OAuth 클라이언트(redirect URI: `https://pnjiieykwznqjgwxprdi.supabase.co/auth/v1/callback`). 코드만으로 끝나지 않음 → 일정 리스크.

**(c) 이메일 OTP** — 범위 외(여유 시).

**수정 파일**: `src/App.jsx`(handleLogin, 로그인 버튼/시트, LandingView·MainLayout), `src/i18n/translations.js`, Supabase 대시보드 설정(코드 외).

**완료 기준**: 로그인 CTA 클릭 시 선택 언어 안내가 먼저 뜨고, 카카오/구글 2개 경로 제공. 구글 로그인으로 신규 프로필 생성까지 happy path 동작.

### P2 — 랜딩 동기 강화 + 리더보드 신뢰도

**(a) 동기 강화**
- 국가 기반 사회적 증거 배너(랜딩): "🇻🇳 베트남 유학생 N명 참여 · ⏰ 6/10 마감". N은 `rankings`에서 국적별 실제 카운트.
- CTA 카피 개인화+희소성: "내 순위 확인 · 6/10 마감".
- 호기심 갭: 리더보드에 placeholder "당신" 행("?? — 입력 시 당신의 위치는?") → 로그인 유도.

**(b) 리더보드 신뢰도**
- **잔고 노출(확정 결정): 전체(글로벌) 상위 1~3위만 실금액, 나머지 ●●● 유지.** **국가별 탭의 상위에는 적용 금지** — 반드시 전체 순위 기준.
  - 구현 주의: `Leaderboard.jsx`는 탭마다 `activeRank`를 재계산(filteredList index+1)하므로 `activeRank`로 판정하면 안 됨. 전체 정렬 리스트(`list`, balance desc) 기준 **overall rank**를 별도 계산해 `overallRank <= 3`일 때만 `Number(balance).toLocaleString()+' KRW'` 노출.
  - 결과: 'All' 탭에서는 전체 1~3위만 금액 노출. 국가 탭에서는 해당 인물이 *전체* 1~3위에도 드는 경우에만 노출되고, 그 외(국가 내 1위 등)는 전부 ●●● 유지.
  - "라이브 데이터" 신호 + 호기심 동시 충족.
- **닉네임 다양화**: 신규 migration으로 시드 닉네임 레지스터를 섞음(밈 + 실명풍 + 밋밋한 것 + 숫자 포함 등). 전부 위트 밈인 균질성 제거. `is_dummy=true` 유지.
- **라이브니스**: "총 N명 참여 중" 카운트, 상대 시각(`updated_at` 기반 "방금/N분 전") 일부 노출, 신규 실유저 상단 하이라이트(기존 `pinned-user-row` 활용). 아바타는 **dicebear 로봇(bottts) 금지** — 노출 시 카카오 프로필풍 이니셜/색상 칩 사용.

**수정 파일**: `src/App.jsx`(LandingView 배너·placeholder 행), `src/components/Leaderboard.jsx`(revealTopN, 라이브니스, 카운트), `src/i18n/translations.js`, 신규 `supabase/migrations/*_diversify_dummy_nicknames.sql`.

**완료 기준**: 비로그인 랜딩 'All' 탭에서 **전체 상위 1~3위만** 실금액 노출(국가 탭의 국가 내 상위는 미노출), 국가별 참여 수·마감 배너 표시, 닉네임 톤 다양화 확인.

---

## 3. 범위 외 (Out of Scope)

- P3 프로필 입력 마찰 감소(전화번호 사유 명시·닉네임 prefill·위저드 단계 압축) — 여유 시 후속.
- 이메일 OTP 로그인.
- 잔고 검증 OCR/Edge Function 로직 변경.
- 전면 리디자인.

---

## 4. 측정 계획

- **주 지표**: `Profile Save Succeeded` 일별 추이(개선 전후).
- **보조 지표**: 로그인 의도율(`session_start`→`Login Clicked`), 로그인 완료율(`Login Clicked`→`Login Completed`, 제공자별 group_by), 구글 vs 카카오 완료율.
- **신뢰도 간접 신호**: `Leaderboard Tab Selected`→`Login Clicked` 전환.
- **한계**: 표본 작음(일 30~40 세션). 방향성 지표로만 해석, 통계적 유의성 기대 X.

---

## 5. 리스크 / 의사결정 기록

- **결정**: 잔고 노출 = **전체 상위 1~3위만** 실금액(국가별 탭 상위는 미적용, overall rank 기준). (대안: 자산 구간 배지 / 전원 마스킹 → 기각)
- **결정**: 최우선 KPI = 연락처(가입자). 잔고 검증은 선택화(P0).
- **리스크(일정)**: 구글 OAuth는 Supabase+Google Cloud 외부 설정 필요 → 코드 외 작업, 마감 5일 내 우선 처리 필요.
- **리스크(무결성)**: 상위 N 실금액이 현재는 시드(dummy) 금액. 실유저 유입 시 자연 대체. 시드 금액은 `super_realistic_balances` 기반으로 현실적.
- **프라이버시**: 닉네임이 익명이므로 금액-신원 비연결. 약관/익명성 약속과 상충 없음(확인 필요).

---

## 6. 구현 순서 (5일)

1. **D1**: P0(완료 화면 분리) + P2(a) 카피/배너 + P2(b) `revealTopN` — 전부 저난도·고임팩트.
2. **D2**: P1(a) 안내 시트 + 7개 로케일 카피. 병행: 구글 OAuth 외부 설정 시작.
3. **D3**: P1(b) 구글 로그인 코드 + happy path 검증. P2(b) 닉네임 다양화 migration.
4. **D4**: 라이브니스 신호, QA(모바일), 카피 다국어 검수.
5. **D5**: 배포·canary, Amplitude 지표 모니터링. 여유 시 P3.
