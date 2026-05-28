# Gachon University International Student Bank Balance Leaderboard - Design Document

This document outlines the architecture, data flow, key user experience (UX) flows, and security guidelines for the Gachon University International Student Bank Balance Leaderboard service.

## 1. Project Overview & Business Goals

### 1.1 Objectives
1. **User Pool Acquisition**: Collect personal details (Real Name, Phone Number, Gender, Nationality) via Kakao Simple Sign-up to build an initial user pool of foreign students for the AI Learning Assistant "Archy".
2. **Purchasing Power Validation**: Indirectly validate the purchasing power of international students in Korea (primarily Vietnamese, Chinese, Mongolian, and Uzbek students) by analyzing their actual bank balances, helping to decide whether to target Korea or pivot immediately to the US/Australia.

### 1.2 User Incentives
* **Reward**: 20 participants will be randomly selected to receive convenience store coupons. (Raffle-based reward system to prevent intentional balance manipulation for prizes).
* **Viral Factor**: Compete anonymously using nicknames and nationalities to see rank within Gachon University.

---

## 2. System Architecture & Tech Stack

* **Frontend**: React (Vite) SPA styled with Vanilla CSS, hosted on **Vercel**.
* **Database & Auth**: **Supabase** (PostgreSQL + Supabase Auth for Kakao OAuth).
* **Storage**: **Supabase Storage** (secure upload bucket for screenshots).
* **Backend Processing**: **Supabase Edge Functions** (triggering on image upload to run AI OCR, update DB, and handle verification).
* **AI Engine**: Gemini 2.5 Flash / Gemini 2.5 Flash-Lite (Vision API) running internally in Edge Functions.
  * **Strict Constraint**: Under no circumstances should the name of the AI model or "Gemini" be shown to the user. User-facing text must use generic terms like "AI Asset Verification Engine".

---

## 3. Database Schema

### `profiles` (User Detailed Information - Admin Access Only)
* `id` (`uuid`, PK, references `auth.users.id`)
* `nickname` (`text`, required, display name on leaderboard)
* `nationality` (`text`, required, chosen from VN / CN / MN / UZ / etc.)
* `real_name` (`text`, required, provided via Kakao Sync)
* `phone_number` (`text`, required, provided via Kakao Sync)
* `gender` (`text`, required, provided via Kakao Sync)
* `marketing_consent` (`boolean`, default: `false`, consent for Archy marketing SMS)
* `created_at` (`timestamp`, default: `now()`)

### `leaderboard` (Publicly Accessible - Filtered by RLS)
* `id` (`uuid`, PK)
* `user_id` (`uuid`, FK references `profiles.id`, Unique)
* `nickname` (`text`, cached from profiles.nickname)
* `nationality` (`text`, cached from profiles.nationality)
* `balance` (`numeric`, default: `0`, masked for non-logged-in users)
* `screenshot_url` (`text`, URL of uploaded statement)
* `status` (`text`, enum: `'pending_ocr'`, `'verified'`, `'rejected'`)
* `rank_cached` (`integer`, updated periodically or via trigger)
* `updated_at` (`timestamp`, default: `now()`)

---

## 4. Key Flows & User Experience (UX)

### 4.1 Landing Page & Multilingual Support
1. **Auto-Detection**: Read `navigator.language` to automatically render the page in **Vietnamese, Chinese, Mongolian, Uzbek, Korean, or English**.
2. **Selector dropdown**: Fixed dropdown on the top-right header for manual language switching.
3. **Mosaic Display**:
   * **Unauthenticated/Non-logged-in**: Names and balances in the leaderboard are heavily blurred (`filter: blur(8px)`).
   * **Authenticated**: Blur is removed, revealing the full rankings.

### 4.2 Kakao Login & Marketing Nudge
* **Mandatory Agreement**: Real Name, Phone Number, and Gender must be required during Kakao Simple Sign-up.
* **Consent Nudge**: The optional Marketing Consent checkbox displays:
  > "⚠️ If you do not agree to the marketing consent, you may not receive raffle notifications or winner announcements."
* **Full Agreement (전체 동의)**: Prominently nudge the user to click Kakao's "Agree to All" button.

### 4.3 Screenshot Upload & 5-Second Processing
1. User uploads a banking screenshot showing their balance.
2. A full-screen interactive loading spinner displays: *"AI asset verification system is analyzing your statement..."* (Gemini is not mentioned).
3. The upload triggers a Supabase Edge Function that sends the image to the Gemini Vision API.
4. The API extracts the balance and flags fake/manipulated screenshots.
5. The balance is stored in the database, and the client displays: *"Congratulations! Your rank among international students at Gachon is [Rank]!"*

---

## 5. Admin Dashboard & Anti-Abuse

### 5.1 Admin Panel (`/admin-dashboard`)
* Accessible only to accounts with admin roles.
* Contains a grid view of all uploaded screenshots alongside the AI-extracted balances.
* Admins can:
  * Manually overwrite/adjust balance amounts.
  * Reject invalid/fake uploads (removes them from the leaderboard).
  * Export participant list (Name, Phone Number, Nationality, Consent Status) to CSV.

### 5.2 Abusing Countermeasures
* Limit uploads to **one per user account** (new uploads overwrite the existing entry).
* Highlight entries with balances exceeding a realistic threshold (e.g., > 10,000,000 KRW) at the top of the admin review queue.
