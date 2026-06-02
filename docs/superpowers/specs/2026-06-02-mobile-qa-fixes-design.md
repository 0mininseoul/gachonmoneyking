# Mobile QA Fixes — Design Spec (2026-06-02)

Gachon Money King 모바일 QA 결과 8개 항목 수정. React/Vite SPA, Supabase 백엔드, 7개 로케일 i18n.

## 확정 결정 사항
- **item 4 네비게이션**: 프로필 저장 후 `/verify-balance`로 **직접 이동**. (인증 의도 최고 시점, 인증 페이지 자체에 맥락·뒤로가기 존재, 리더보드 사회적 증거는 랜딩+결과 페이지가 앞뒤로 감쌈)
- **item 5 게이지**: 기존 orbit 스피너 유지 + 진행 바·%·단계 라벨 추가.
- **item 7 결과 카드**: `재인증(잔고 업데이트)` 링크는 **제거**. `잔고 수정요청`만 작은 링크로 유지.
- **잔고 수정요청 모달**: 텍스트 + **이미지 첨부**(신규 스크린샷) 지원.
- **공유**: 카카오 JavaScript SDK로 카카오톡 메시지 공유 구현(도메인 등록 완료). `VITE_KAKAO_JS_KEY` 미설정 시 링크 복사로 폴백.
- **공유 페이지 구성**: 헤드라인 + 결과 카드 + 모자이크 리더보드 + CTA.

---

## 항목별 설계

### 1. 회원가입 제거
- `App.jsx`: `SignupView` import, `/signup` Route, 푸터 `signup_link` span + 인접 divider 제거.
- `src/components/SignupView.jsx` 삭제.
- `signup_link` 번역 키는 잔존(미사용, 무해).

### 2. 메인 CTA 문구
- `anonymous_rank_cta`에서 "익명/anonymous/匿名/ẩn danh/нууц/anonim" 제거 (7개 로케일).
- 동일 키를 공유 페이지 하단 CTA로 재사용.

### 3. 국적 선택 → 언어 전환
- `nationalities` 코드 == 로케일 코드 (`vi/ja/zh/mn/uz/ko/en`), 1:1 매핑.
- `ProfileSetupView`에서 `useLanguage()`로 `setLocale` 획득.
- 국적 단계에서 **다음으로 넘어가는 시점**에 `setLocale(nationality)` 호출 → 닉네임 단계부터 해당 언어. 헤더 드롭다운도 동기화.
- 우선순위: 국적 선택 > 헤더 선택. 이후 헤더 수동 변경은 더 최근 행동이므로 우선.

### 4. 잔고 인증 페이지
- `handleSaveProfile` → `navigate('/verify-balance')`.
- `verify-status-strip`(익명 리더보드 / 잔고 잠김) 블록 제거.
- 신뢰 안내 4줄 유지하되 패딩·폰트 압축.
- 버튼 위 여백 축소, 버튼+안내문이 모바일 한 화면에 들어오게 spacing 조정.
- 버튼 아래 안내문: `verify_upload_hint` → 기존 `upload_desc`(토스/카카오뱅크 안내)로 교체.

### 5. 분석 게이지
- App 레벨 `uploading` 상태에 `uploadProgress`(0–100), 파생 `uploadStage` 추가.
- `useEffect([uploading])`: true면 `setInterval`로 ease-out 증가(목표 ~92%까지 `p += (target - p) * 0.06`, ~200ms). false면 리셋. 완료 시 100% 스냅 후 숨김.
- 단계 임계값: 0–25 업로드 / 25–55 잔고 인식 / 55–85 순위 계산 / 85–95 리포트 생성.
- 로더 UI: orbit 스피너 + 진행 바 + % + 단계 라벨.
- 신규 키: `analyzing_stage_upload/read/rank/report` (4 × 7).

### 6. 완료(축하) 모달
- 잘림 수정: `.rank-celebration-card h2`의 `white-space:nowrap … ellipsis` 제거 → 줄바꿈 허용.
- 콘텐츠 순서: 🏆 → `rankReport.mainCopy`(스파이시 메인 카피) → `가천대 {rank}등 · {percentile}` 요약 → `celebration_subtitle`(잔고 등록 문구) → `view_leaderboard_btn`.
- `DashboardView` 내 `rankReport` 재사용. null이면 `celebration_title` 폴백.
- 신규 키: `celebration_rank_summary` (1 × 7).

### 7. 단일 결과 카드 + 공유 + 공개 페이지
**DB**
- 마이그레이션: `leaderboard.correction_image_url text` 추가.

**ResultCard 컴포넌트 (신규, 대시보드+공개 페이지 공용)**
- 구성: 상단 우측 공유 아이콘 → 메인 카피(`rankReport.mainCopy`) → 전체 순위(`#N / total`) + 퍼센타일 + wallet-zone(미니 맵 + zone 라벨) → 하단 작은 `잔고 수정요청` 텍스트 링크(owner 변형만).
- props: `insight`, `report`, `t`, `locale`, `variant`('owner' | 'public'), `onShare`, `onCorrection`.

**DashboardView**
- `leaderboard-access-rail` + `rank-report-panel` **둘 다 제거**, 그 자리에 `<ResultCard variant="owner">` 하나.
- 수정요청 모달: `<input type=file accept=image/*>` 추가 + 미리보기. 제출 시 파일 있으면 `screenshots` 버킷 `{user.id}/...`에 업로드 → public URL → `leaderboard` 업데이트(`correction_note`, `correction_image_url`).

**공유 (Kakao)**
- `src/lib/kakaoShare.js`: SDK 동적 로드 + `Kakao.init(VITE_KAKAO_JS_KEY)` + `Kakao.Share.sendDefault({objectType:'feed', content:{title,description,imageUrl:`${origin}/logo.png`,link}, buttons})`.
- 폴백: SDK/키 없으면 `navigator.share` → `clipboard.writeText` + 토스트.
- 공유 URL: `${origin}/r/${record.id}` (leaderboard 행 id, 이미 public-read).
- 신규 키: `share_result_btn`, `copy_link_done` (2 × 7).

**공개 라우트 `/r/:recordId` → SharedResultView**
- `MainLayout` 자식, 인증 가드 없음.
- 공개 `rankings`에서 id로 레코드 검색 → `buildRankInsight` + `result_report_json`(없으면 뷰어 로케일 fallback).
- 렌더: `shared_result_headline`(`{nickname}님의 지갑 현실`) → `ResultCard variant="public"` → `Leaderboard`(canViewBalances = 뷰어 verified 여부 → 로그아웃은 모자이크) → 하단 CTA `anonymous_rank_cta`(handleLogin).
- 미발견/미인증 id: `shared_not_found` + CTA.
- 신규 키: `shared_result_headline`, `shared_not_found` (2 × 7).
- 한계: AI 로스트 카피는 생성 시점 언어로 저장됨(교차 언어 방문자는 owner 언어로 봄). 헤드라인·순위 라벨·CTA는 뷰어 로케일.

**Admin**
- 수정요청 행에 `correction_image_url` 썸네일/링크 표시.

### 8. 언어별 줄바꿈 QA
- 구조 변경 완료 후 마지막에 수행(새 카드·모달·게이지 포함).
- `npm run dev` + Playwright 모바일 뷰포트로 7개 로케일 주요 화면 스크린샷 → 오버플로·줄바꿈·폰트 보정.
- 기본 `h1`의 `white-space:nowrap … ellipsis`가 몽골어/우즈벡어 제목 클립 가능 → 같이 처리.

---

## 신규 i18n 키 (~10 × 7 로케일)
`analyzing_stage_upload`, `analyzing_stage_read`, `analyzing_stage_rank`, `analyzing_stage_report`, `celebration_rank_summary`, `shared_result_headline`, `shared_not_found`, `share_result_btn`, `copy_link_done`.
수정: `anonymous_rank_cta`.

## 환경 변수
- `VITE_KAKAO_JS_KEY` (카카오 JavaScript 키) — `.env.local` + Vercel에 사용자가 등록 필요. 미설정 시 링크 복사 폴백.

## 검증
- `npm run build`, `npm run lint`, `npm test`.
- Playwright로 7개 로케일 모바일 QA (item 8 겸).
- 플로우: 로그인 → 프로필(국적 선택 시 언어 전환) → /verify-balance(한 화면) → 업로드 게이지 → 완료 모달 → 대시보드 결과 카드 → 공유 → /r/:id 로그아웃 조회(모자이크).
