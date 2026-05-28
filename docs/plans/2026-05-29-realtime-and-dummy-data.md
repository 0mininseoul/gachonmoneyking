# 실시간 데이터 연동 및 더미 데이터 대량 삽입 구현 계획

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**목표:** 
1. Supabase 데이터베이스 스키마에 이메일, 프로필 사진 수집을 위한 컬럼과 더미 데이터를 식별할 수 있는 `is_dummy` 컬럼을 추가합니다.
2. Supabase 내 `profiles` 변경 사항이 `leaderboard` 캐싱 테이블에 실시간으로 동기화되도록 Postgres trigger를 생성하고, 실시간 통신 기능(Postgres Realtime)을 활성화합니다.
3. 기존 가입자인 '조세연'과 '영민'의 프로필/순위 기록을 베트남 국적 및 베트남 이름으로 업데이트합니다.
4. 리더보드 테스트를 위해 총 44명(베트남 27명, 중국인 12명, 몽골인 2명, 우즈벡인 3명)의 그럴싸한 국제 유학생 더미 데이터를 대량 삽입합니다.
5. 유저가 카카오로 로그인 시, 카카오 메타데이터에서 이메일 및 프로필 사진 URL을 자동으로 추출하여 `profiles` 테이블에 실시간 자동 업데이트되도록 프론트엔드 연동을 고도화합니다.

**아키텍처:**
- **DB (Postgres DDL & DML)**:
  - `public.profiles` 테이블에 `email` (text, nullable), `avatar_url` (text, nullable), `is_dummy` (boolean, default false) 컬럼 추가.
  - `public.leaderboard` 테이블에 `is_dummy` (boolean, default false) 컬럼 추가.
  - `profiles` 테이블의 `nickname` 및 `nationality` 변경 시 `leaderboard` 테이블의 연관 필드가 자동 수정되도록 `sync_profile_to_leaderboard` 트리거 함수 정의.
  - `profiles` 및 `leaderboard` 테이블을 `supabase_realtime` 게시판(publication)에 추가하여 실시간 통신 활성화.
  - 44개의 더미 계정을 `auth.users`, `public.profiles`, `public.leaderboard` 테이블에 트랜잭션 안전하게 삽입하고 `is_dummy = true`로 설정.
- **프론트엔드 (React)**:
  - `App.jsx`에서 로그인 검증 시 `checkUserProfile` 및 프로필 저장 시 `handleSaveProfile`에서 카카오 OAuth `user_metadata`로부터 `email` 및 `avatar_url` (또는 `picture`)을 동기화하여 `profiles` 테이블을 자동으로 업데이트/인서트.
  - 리액트 내 Supabase Realtime 구독 대상을 `leaderboard` 뿐만 아니라 `profiles` 테이블까지 확장하여 DB 단의 실시간 프로필 정보 업데이트 발생 시 화면이 즉각 리로드되도록 구현.

**기술 스택:** Supabase, PostgreSQL, React (Vite)

---

### Task 1: DB 스키마 수정, 트리거 함수 생성 및 실시간(Realtime) 활성화

**파일:**
- Create: `supabase/migrations/20260529000001_add_dummy_and_realtime_and_email_avatar.sql`

**Step 1: SQL 마이그레이션 파일 작성**
아래 DDL 쿼리를 포함하는 파일 작성:
- `is_dummy` 및 카카오 수집 데이터(`email`, `avatar_url`) 컬럼을 각 테이블에 추가.
- `sync_profile_to_leaderboard` 트리거 함수 및 트리거 정의.
- `supabase_realtime`에 두 테이블을 등재.

**Step 2: 마이그레이션 적용 및 원격 DB에 쿼리 실행**
```bash
npx supabase db query --linked -f supabase/migrations/20260529000001_add_dummy_and_realtime_and_email_avatar.sql
```

**Step 3: 변경 내역 커밋**
```bash
git add supabase/migrations/20260529000001_add_dummy_and_realtime_and_email_avatar.sql
git commit -m "migration: alter tables for email, avatar, is_dummy and add sync triggers"
```

---

### Task 2: 기존 사용자 업데이트 및 44명 유학생 더미 데이터 삽입

**파일:**
- Create: `supabase/migrations/20260529000002_insert_dummy_data.sql`

**Step 1: SQL 마이그레이션 파일 작성**
- '조세연'과 '영민' 사용자의 정보를 베트남 국적(`vi`) 및 베트남 이름으로 업데이트.
  - '조세연' -> 닉네임: `Minh Anh`, 실명: `Nguyen Minh Anh`, 국적: `vi`
  - '영민' -> 닉네임: `Tuan`, 실명: `Tran Tuan Anh`, 국적: `vi`
- 총 44명(베트남 27명, 중국인 12명, 몽골인 2명, 우즈벡인 3명)의 사실적인 임의 데이터를 `auth.users`, `public.profiles`, `public.leaderboard` 테이블에 생성 및 매핑하여 삽입 (`is_dummy = true`). 각 나라별 이름 형식과 리얼한 잔고 액수 분배.

**Step 2: 쿼리 실행**
```bash
npx supabase db query --linked -f supabase/migrations/20260529000002_insert_dummy_data.sql
```

**Step 3: 커밋**
```bash
git add supabase/migrations/20260529000002_insert_dummy_data.sql
git commit -m "migration: update existing users and seed 44 international student dummy records"
```

---

### Task 3: 프론트엔드 카카오 메타데이터 자동 동기화 및 Realtime Listener 추가

**파일:**
- Modify: [App.jsx](file:///Users/youngminpark/Desktop/개발/balanceboard/src/App.jsx)

**Step 1: 카카오 메타데이터 동기화 및 profiles Realtime 수신 코드 작성**
- `checkUserProfile` 함수에서 사용자 프로필 정보가 조회되었을 때, `email` 및 `avatar_url` 정보가 카카오에서 제공한 최신 세션 정보와 불일치하거나 비어있으면 `profiles` 테이블을 자동으로 업데이트.
- `handleSaveProfile`에서 신규 가입 시 `email` 및 `avatar_url` 항목을 `user` 오브젝트에서 추출하여 데이터베이스에 저장.
- Realtime 채널 구독에 `profiles` 테이블을 추가하여, 외부/관리자 단에서 프로필 닉네임이나 아바타가 업데이트되었을 때 즉시 화면 리로드 구현.

**Step 2: 로컬 빌드 검증**
```bash
npm run build
```

**Step 3: 변경 내역 커밋 및 원격 푸시**
```bash
git add src/App.jsx
git commit -m "feat: auto-sync Kakao profile metadata and listen to profiles table changes in real-time"
git push origin main
```
