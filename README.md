# Gachon Money King (가천대 외국인 유학생 자산 리더보드)

가천대학교에 재학 중인 외국인 유학생들을 위한 실시간 통장 잔고 인증 및 익명 자산 리더보드 서비스입니다. 

---

## 📅 운영 및 이벤트 안내
- **운영 기간**: ~ 2026년 6월 8일(월)까지 운영 후 종료
- **최종 시상**: 2026년 6월 8일(월) 당일 최종 순위 기준으로 시상 진행
- **이벤트 혜택**: 참여자 중 추첨을 통해 **20명에게 편의점 상품권** 증정

---

## 🛠 Tech Stack
- **Frontend**: React (Vite), React Router DOM (v6)
- **Backend / Database**: Supabase (PostgreSQL, Auth, Database)
- **AI Verification**: Vertex AI Gemini through Supabase Edge Functions
- **Authentication**: Kakao OAuth (카카오 로그인) 및 일반 이메일 가입
- **Styling**: Vanilla CSS (Linear.app 스타일 디자인 시스템 적용)
- **Font**: Pretendard Variable (Main Font)

---

## 📁 주요 프로젝트 구조
```text
gachon_money_king/
├── dist/                # 빌드 결과물
├── docs/                # 개발 기획서 및 변경 워크스루 아카이브
│   └── plans/           # 마일스톤별 피드백 반영 계획 및 태스크 관리
├── public/              # 정적 에셋 (로고, 폰트 등)
├── src/
│   ├── components/      # 리더보드 등 핵심 컴포넌트
│   ├── i18n/            # 다국어 리소스 (Translations, LanguageContext)
│   ├── App.jsx          # 라우팅 가드, 레이아웃 및 뷰 엔트리
│   ├── index.css        # Linear.app 테마 기반 전역 스타일 및 반응형 오버라이드
│   └── main.jsx         # 엔트리 포인트
├── supabase/
│   └── migrations/      # DB 스키마 정의 및 다국어 익명 더미데이터 세ด SQL
├── vercel.json          # SPA 라우팅 새로고침 404 방지 설정
└── vite.config.js       # Vite 빌드 설정
```

---

## 🚀 로컬 개발 및 실행 방법

### 1. 패키지 설치
```bash
npm install
```

### 2. 로컬 개발 서버 실행
```bash
npm run dev
```

### 3. 프로덕션 빌드 및 검증
```bash
npm run build
```

### 4. Vertex AI 환경 변수
AI 호출은 Vercel 서버가 아니라 Supabase Edge Function(`verify-balance`)에서 실행됩니다. 로컬 Edge Function과 배포된 Supabase Function에 아래 값을 설정해야 합니다.

```bash
GOOGLE_CLOUD_PROJECT=your-gcp-project-id
GOOGLE_CLOUD_LOCATION=global
GOOGLE_GENAI_USE_VERTEXAI=true
VERTEX_AI_MODEL=gemini-2.5-flash
GOOGLE_APPLICATION_CREDENTIALS=.secrets/gachon-money-king-vertex-ai.json
```

Vercel에 같은 값을 둘 수는 있지만, 현재 AI 검증 런타임은 Supabase Edge Function입니다. 배포 환경에서는 서비스 계정 JSON을 출력하지 말고 base64로 인코딩해 `GOOGLE_SERVICE_ACCOUNT_KEY_BASE64`에 저장하세요.

---

## 📄 라이선스 및 제공처
- **제공**: Ascentum (contact@ascentum.co.kr)
- 본 프로젝트는 가천대학교 유학생들을 위해 기획된 단기 이벤트 플랫폼으로, 약관 및 개인정보처리방침을 준수하여 운영됩니다.
