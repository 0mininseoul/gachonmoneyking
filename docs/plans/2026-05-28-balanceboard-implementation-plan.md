# Bank Balance Leaderboard Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Build a multilingual bank balance leaderboard for Gachon University international students with Kakao Login, secure screenshot upload, real-time AI-based OCR verification, and an admin dashboard.

**Architecture:** Frontend React SPA deployed on Vercel communicating with Supabase. Supabase manages Auth (Kakao OAuth), Database (PostgreSQL with RLS), and Storage. A Supabase Edge Function processes uploads, running AI OCR validation via the internally configured API.

**Tech Stack:** React, Vite, Vanilla CSS (adhering to Linear.app UI/UX design system tokens), Supabase (Auth, DB, Storage, Edge Functions), Vercel.

---

## Phase 1: Database Setup & RLS Configuration

### Task 1: Supabase DB Schema
**Files:**
- Create: `supabase/migrations/20260528000000_init_schema.sql`

**Step 1: Write schema SQL**
Write the PostgreSQL schema for the `profiles` and `leaderboard` tables including RLS (Row Level Security) policies. Non-logged-in users can only read blurred (masked) balances, and logged-in users can see full balances.
```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    nickname text not null,
    nationality text not null,
    real_name text not null,
    phone_number text not null,
    gender text not null,
    marketing_consent boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Leaderboard table
create table public.leaderboard (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) on delete cascade unique,
    nickname text not null,
    nationality text not null,
    balance numeric default 0 not null,
    screenshot_url text not null,
    status text default 'pending_ocr'::text not null check (status in ('pending_ocr', 'verified', 'rejected')),
    rank_cached integer,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.profiles enable row level security;
alter table public.leaderboard enable row level security;

-- Admin bypass role or policy (for admin accounts, we check role in future metadata)
create policy "Allow public read for leaderboard" on public.leaderboard
    for select using (true);

create policy "Allow authenticated users to insert/update their profiles" on public.profiles
    for all using (auth.uid() = id);

create policy "Allow authenticated users to insert/update their leaderboard record" on public.leaderboard
    for all using (auth.uid() = user_id);
```

**Step 2: Commit**
```bash
git add supabase/migrations/20260528000000_init_schema.sql
git commit -m "db: initialize database schema and RLS policies"
```

---

## Phase 2: Frontend Scaffold & Multilingual Config

### Task 2: Vite React Scaffold
**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `src/main.jsx`
- Create: `src/App.jsx`
- Create: `src/index.css`

**Step 1: Setup React Vite project files**
Configure Vite project structure and dependencies.
```json
{
  "name": "balanceboard",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.43.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^5.2.11"
  }
}
```

**Step 2: Install dependencies**
Run: `npm install`
Expected: Install successful with lockfile created.

**Step 3: Commit**
```bash
git add package.json index.html src/
git commit -m "feat: scaffold react vite application"
```

### Task 3: Multilingual (i18n) Setup
**Files:**
- Create: `src/i18n/translations.js`
- Create: `src/i18n/LanguageContext.jsx`

**Step 1: Write translations and Context Provider**
Write localized string maps for `vi`, `zh`, `mn`, `uz`, `ko`, `en`. Write the browser detector logic.
```javascript
// src/i18n/translations.js
export const translations = {
  ko: {
    title: "가천대 유학생 통장 잔고 리더보드",
    login_btn: "카카오 로그인하고 순위 확인하기",
    upload_title: "통장 잔고 이미지 업로드",
    nudge: "⚠️ 동의하지 않으실 경우, 상품(편의점 상품권 20명 추첨) 당첨 및 리더보드 수상 안내 문자를 받지 못하실 수 있습니다.",
    loading: "AI 자산 분석 시스템이 통장 잔고를 검증 중입니다..."
  },
  en: {
    title: "Gachon Int'l Student Bank Balance Leaderboard",
    login_btn: "Login with Kakao & Check Ranking",
    upload_title: "Upload Bank Statement Image",
    nudge: "⚠️ If you do not agree to the marketing consent, you may not receive raffle notifications or winner announcements.",
    loading: "AI asset verification system is analyzing your statement..."
  },
  vi: {
    title: "Bảng xếp hạng số dư tài khoản du học sinh ĐH Gachon",
    login_btn: "Đăng nhập Kakao & Kiểm tra thứ hạng",
    upload_title: "Tải lên ảnh chụp số dư tài khoản",
    nudge: "⚠️ Nếu bạn không đồng ý nhận thông tin tiếp thị, bạn có thể không nhận được thông báo trúng thưởng hoặc công bố giải thưởng.",
    loading: "Hệ thống AI đang xác minh số dư tài khoản của bạn..."
  },
  zh: {
    title: "嘉泉大学留学生银行存款排行榜",
    login_btn: "卡考登录并查看排名",
    upload_title: "上传银行余额截图",
    nudge: "⚠️ 如果您不同意营销同意书，您可能无法收到抽奖通知或获奖公告。",
    loading: "AI资产验证系统正在分析您的账户余额..."
  },
  mn: {
    title: "Гачон Их Сургуулийн гадаад оюутнуудын дансны үлдэгдлийн жагсаалт",
    login_btn: "Kakao-гоор нэвтэрч, зэрэглэлээ шалгах",
    upload_title: "Дансны үлдэгдэлтэй зургийг байршуулах",
    nudge: "⚠️ Хэрэв та маркетингийн зөвшөөрлийг зөвшөөрөхгүй бол тохиролцсон шагнал, зарлалын мэдээллийг хүлээн авахгүй байх магадлалтай.",
    loading: "AI системийн үлдэгдэл баталгаажуулах систем ажиллаж байна..."
  },
  uz: {
    title: "Gachon universiteti xalqaro talabalari bank balansi peshqadamlar jadvali",
    login_btn: "Kakao orqali kirish va reytingni tekshirish",
    upload_title: "Bank balansi skrinshotini yuklash",
    nudge: "⚠️ Agar siz marketing roziligiga rozi bo'lmasangiz, yutuqlar haqida xabar ololmasligingiz mumkin.",
    loading: "AI aktivlarni tekshirish tizimi balansingizni tahlil qilmoqda..."
  }
};
```

**Step 2: Commit**
```bash
git add src/i18n/
git commit -m "feat: add multilingual configuration and translations context"
```

---

## Phase 3: Kakao Auth & Supabase Client Integration

### Task 4: Supabase Kakao OAuth Login Integration
**Files:**
- Create: `src/lib/supabaseClient.js`
- Modify: `src/App.jsx`

**Step 1: Write supabase client wrapper**
```javascript
// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

**Step 2: Implement login method**
Implement Kakao OAuth sign-in in `src/App.jsx`:
```javascript
const handleLogin = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo: window.location.origin
    }
  })
  if (error) console.error("Error logging in:", error)
}
```

**Step 3: Commit**
```bash
git add src/lib/supabaseClient.js src/App.jsx
git commit -m "feat: integrate Supabase client and Kakao OAuth flow"
```

---

## Phase 4: Image Upload and Backend AI OCR Function

### Task 5: Supabase Edge Function for AI OCR (Using specified model)
**Files:**
- Create: `supabase/functions/verify-balance/index.ts`

**Step 1: Write OCR function script using Deno**
The edge function will trigger when a file is uploaded to `screenshots` storage bucket. It parses the image, sends it to `gemini-2.5-flash` model, extracts the numeric value, and saves it.
```typescript
import { serve } from "https://deno.land/std@0.168/0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    const payload = await req.json()
    const { record } = payload
    const imagePath = record.name // file path in storage
    
    // 1. Fetch image from storage
    // 2. Call internal AI API with gemini-2.5-flash-lite / gemini-2.5-flash model
    // 3. Extract balance amount (numeric)
    // 4. Update public.leaderboard table: balance = extractedAmount, status = 'verified'
    
    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
```

**Step 2: Commit**
```bash
git add supabase/functions/verify-balance/
git commit -m "feat: add verify-balance Edge Function template"
```

---

## Phase 5: UI/UX & Leaderboard Component (Linear.app Style)

### Task 6: Leaderboard Component with Blur, Custom Language Selector, and Linear Style
**Files:**
- Create: `src/components/Leaderboard.jsx`
- Modify: `src/App.jsx`
- Modify: `src/index.css`

**Step 1: Write Leaderboard Component**
Add logic to render list. If `user` is not authenticated, render `balance` with mosaic-blur styling:
```jsx
// src/components/Leaderboard.jsx
import React from 'react'

export function Leaderboard({ list, isAuthenticated }) {
  return (
    <div className="leaderboard-container">
      {list.map((item, index) => (
        <div key={item.id} className="leaderboard-item">
          <span className="rank">{index + 1}</span>
          <span className="nickname">{item.nickname}</span>
          <span className="nationality">{item.nationality}</span>
          <span className={isAuthenticated ? 'balance-value' : 'balance-value-blurred'}>
            {isAuthenticated ? `${item.balance.toLocaleString()} KRW` : '●●●,●●● KRW'}
          </span>
        </div>
      ))}
    </div>
  )
}
```

**Step 2: Write Linear.app CSS styling**
Write beautiful modern premium styles in `src/index.css` using the tokens in `DESIGN.md`:
*   `body` background color should be pure near-black (`#010102`).
*   Text color: `#f7f8f8` (light gray).
*   Primary accent color: `#5e6ad2` (lavender-blue) for buttons, focus states, and primary actions.
*   Cards and items styled as dense charcoal panels (`#0f1011`) with hairline borders (`#23252a`).
*   Transitions: smooth, precise, minimal interface aesthetics.

**Step 3: Commit**
```bash
git add src/components/Leaderboard.jsx src/index.css
git commit -m "feat: build beautiful visual leaderboard component in Linear style"
```

---

## Phase 6: Admin Dashboard

### Task 7: Admin Panel
**Files:**
- Create: `src/components/AdminDashboard.jsx`

**Step 1: Write Admin Dashboard**
Create a grid list showing: Nickname, Real Name, Phone Number, Nationality, Uploaded Screenshot Image, AI-extracted balance, status, and Action buttons (Approve / Overwrite / Reject).
Create CSV Export function. Follow Linear style (dark table layout, hairline separators, small status badges).

**Step 2: Commit**
```bash
git add src/components/AdminDashboard.jsx
git commit -m "feat: implement admin dashboard with screenshot review and CSV export"
```
