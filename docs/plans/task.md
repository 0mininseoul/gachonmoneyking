| Implementation Task | Status | Notes |
| :--- | :---: | :--- |
| **Task 1: Supabase DB Schema** | [x] | Database schema migration file `supabase/migrations/20260528000000_init_schema.sql` created and committed. |
| **Task 2: Vite React Scaffold** | [x] | Vite React skeleton created, package.json dependencies defined, `npm install` and `npm run build` ran and passed. |
| **Task 3: Multilingual (i18n) Setup** | [x] | Localized string maps for 6 locales created. `LanguageContext` hook implemented to auto-detect browser language and manage toggle. |
| **Task 4: Supabase Kakao OAuth Login Integration** | [x] | Client initialized, Kakao OAuth flow integrated, and profiles collection schema mapped to user metadata. |
| **Task 5: Supabase Edge Function for AI OCR** | [x] | Created Deno Edge Function using `gemini-2.5-flash` model for 1-2 second OCR extraction. |
| **Task 6: Leaderboard Component & UI (Linear Style)** | [x] | Full frontend UI implemented with Linear.app aesthetics, file upload area, status views, and orbital loader overlay. |
| **Task 7: Admin Panel & CSV Export** | [x] | Admin review queue, balance manual updates, verification decisions (approve/reject), and CSV export integrated into App.jsx. |
| **Task 8: Create vercel.json rewrite rules** | [x] | Create `vercel.json` rewrite configuration to prevent 404 on refresh. |
| **Task 9: Update main.jsx with BrowserRouter** | [x] | Wrap application in `<BrowserRouter>` inside `main.jsx`. |
| **Task 10: Create Signup, Privacy, and Terms views** | [x] | Design and create `SignupView.jsx`, `PrivacyView.jsx`, and `TermsView.jsx` incorporating service name (Gachon Money King) and domain. |
| **Task 11: Refactor App.jsx with React Router** | [x] | Update `App.jsx` to define routes, layouts, navigation footer, and auth guards. |
| **Task 12: Add footer styling to index.css** | [x] | Apply custom styling classes for footer links in `index.css`. |
| **Task 13: Run build verification and route testing** | [x] | Run `npm run build` and route tests to verify build output and guard routing. |
| **Task 14: Modify PrivacyView.jsx to remove name & update email** | [x] | Remove '박영민' name and replace contact email with contact@ascentum.co.kr in `PrivacyView.jsx`. |
| **Task 15: Fix back-navigation loop on /profile-setup** | [x] | Adjust `PublicRoute` guard in `App.jsx` to allow non-onboarded logged-in users to visit landing page. |
| **Task 16: Verify changes, commit and push** | [x] | Verify with npm run build and push to origin main branch. |
| **Task 17: Update footer layout in App.jsx to include business info** | [x] | Restructure the footer HTML markup in `App.jsx` to match the design with company metadata. |
| **Task 18: Add CSS styles for new footer structure in index.css** | [x] | Replace old footer styling in `index.css` with the newer responsive, multi-line footer layout. |
| **Task 19: Build and run test verification, commit and push** | [x] | Re-build locally, verify, commit and push main branch changes. |
| **Task 20: Remove 'Representative' line from footer in App.jsx** | [x] | Open `App.jsx` and delete the representative element and its trailing dot divider. |
| **Task 21: Add new key-value translation strings to translations.js** | [x] | Expand translation maps for all 6 locales with missing labels (marketing consent, verification popup, leaderboard columns, etc.). |
| **Task 22: Update App.jsx and Leaderboard.jsx to use translations** | [x] | Apply `t()` dynamic functions on App.jsx and Leaderboard.jsx hardcoded strings. |
| **Task 23: Optimize index.css for mobile-first/responsive screens** | [x] | Write media queries for navigation bar, leaderboard grid, and card spacing. |
| **Task 24: Re-build, run test and push to origin main** | [x] | Run production build, execute Playwright, commit and push to main. |
| **Task 25: Add footer translation keys to translations.js** | [x] | Add `footer_desc`, `terms_link`, `privacy_link`, and `signup_link` keys for 6 locales in translations.js. |
| **Task 26: Update App.jsx with translated footer and change lang select dropdown order** | [x] | Apply `t()` to footer links and description. Re-order dropdown select options to match the requested language list. |
| **Task 27: Rewrite PrivacyView.jsx with conditional Ko/En layout** | [x] | Update `PrivacyView.jsx` to select English statement unless user locale is Korean ('ko'). |
| **Task 28: Rewrite TermsView.jsx with conditional Ko/En layout** | [x] | Update `TermsView.jsx` to select English statement unless user locale is Korean ('ko'). |
| **Task 29: Build, test, commit and push to origin main** | [x] | Build verification, confirm routing and language toggle, then commit and push to main branch. |
| **Task 35: Redesign header layout for mobile screens/iOS Safari** | [x] | Redesign .top-nav layout to prevent dual-line wrapping and fix vertical alignments, verify. |
| **Task 36: Refine celebration card overlay copy and layout** | [x] | Implement dynamic main/sub copy with rank calculation, support all 6 languages, and styled single-line layouts |
| **Task 37: Supabase DB schema updates, Realtime, and profiles-leaderboard sync triggers** | [x] | Add is_dummy, email, avatar_url columns, write profiles-to-leaderboard sync trigger, and enable Postgres Realtime |
| **Task 38: Add 44 dummy user records and update '조세연'/'영민' to Vietnamese** | [x] | Insert 44 foreign students (27 VI, 12 ZH, 2 MN, 3 UZ) and update '조세연'/'영민' to Vietnamese profiles/records |
| **Task 39: Implement Kakao email/avatar auto-sync and Realtime profiles listener in App.jsx** | [x] | Sync user email/avatar on sign-in and register, add profiles Realtime table listener to dynamically refresh state |
| **Task 40: Add tab translations and 'Me' labels to translations.js** | [x] | Add tab_all, tab_vi, tab_zh, tab_mn, tab_uz, and me_label translations for all 6 languages |
| **Task 41: Realistic dummy data update (amount ranges and community nicknames)** | [x] | Apply migration to update dummy data balances and nicknames for natural community vibes |
| **Task 42: Refactor Leaderboard.jsx with tabs filtering and user pinning** | [x] | Implement activeTab selection state, filter logic, and row pinning at the top with highlights |
| **Task 43: Update App.jsx with new headline copy and Leaderboard props** | [x] | Update title translations, pass currentUserId to Leaderboard, and adjust layout |
| **Task 44: Style filters, pinned rows, and headline single-line fit in index.css** | [x] | Write CSS for tabs, pinned highlights, and headline clamp to prevent wraps |
| **Task 45: Update brand logo text size for desktop and mobile views** | [x] | Adjust `.brand` font-size in desktop and mobile viewport in `src/index.css`. |
| **Task 46: Reflow mobile footer business info layout** | [x] | Apply media query rules for footer details row-breaking, divider-hiding, address no-wrap, and font scaling. |
| **Task 47: Optimize mobile hero title and subtitle wrapping across languages** | [ ] | Update `h1` and `.subtitle` properties in `src/index.css` with `text-wrap: balance` and language-specific mobile font scaling. |
| **Task 48: Center-align mobile announcement banner content** | [ ] | Center the alignment, text, and flex properties of `.announcement-banner` in mobile media query. |


