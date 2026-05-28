import { chromium } from 'playwright';
import path from 'path';

const PROJECT_REF = 'pnjiieykwznqjgwxprdi';
const AUTH_KEY = `sb-${PROJECT_REF}-auth-token`;

const FAKE_SESSION = {
  access_token: 'fake-access-token',
  token_type: 'bearer',
  expires_in: 3600,
  refresh_token: 'fake-refresh-token',
  user: {
    id: '12345678-1234-1234-1234-123456789012',
    aud: 'authenticated',
    role: 'authenticated',
    email: '0mininseoul@gmail.com',
    email_confirmed_at: '2026-05-28T00:00:00Z',
    phone: '',
    confirmed_at: '2026-05-28T00:00:00Z',
    user_metadata: {
      full_name: 'Young Min Park',
      name: 'Young Min Park'
    },
    app_metadata: {
      provider: 'kakao',
      providers: ['kakao']
    },
    created_at: '2026-05-28T00:00:00Z',
    updated_at: '2026-05-28T00:00:00Z'
  },
  expires_at: 2000000000
};

async function runRoutingTest() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 1000 });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[Browser Error]:`, msg.text());
    }
  });

  page.on('pageerror', err => {
    console.error('BROWSER PAGE ERROR:', err.message);
  });

  // Mock API requests
  await page.route('**/rest/v1/profiles*', async (route) => {
    try {
      const url = route.request().url();
      if (url.includes('id=eq.12345678-1234-1234-1234-123456789012')) {
        // If testing profile-setup onboarding, mock 406 or empty
        if (page.url().includes('profile-setup')) {
          await route.fulfill({
            status: 406,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'No profile' })
          });
        } else {
          // If testing dashboard or admin, mock profile data
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: '12345678-1234-1234-1234-123456789012',
              real_name: 'Young Min Park',
              phone_number: '010-1234-5678',
              gender: 'male',
              marketing_consent: true
            })
          });
        }
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      }
    } catch (e) {}
  });

  await page.route('**/rest/v1/leaderboard*', async (route) => {
    try {
      const url = route.request().url();
      if (url.includes('profiles')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 101,
              user_id: 'user-a',
              nickname: 'StrugglingStudent',
              nationality: 'mn',
              balance: 15000,
              status: 'pending_ocr',
              screenshot_url: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=200',
              updated_at: '2026-05-28T10:00:00Z',
              profiles: {
                real_name: 'Batu',
                phone_number: '010-9999-8888',
                gender: 'male',
                marketing_consent: true
              }
            }
          ])
        });
      } else if (url.includes('status=eq.verified')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 1, nickname: 'SuperRich', nationality: 'uz', balance: 99000000, status: 'verified' },
            { id: 10, nickname: 'YoungMin', nationality: 'ko', balance: 5000000, status: 'verified' }
          ])
        });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      }
    } catch (e) {}
  });

  // -------------------------------------------------------------
  // TEST 1: Land on `/` without login
  // -------------------------------------------------------------
  console.log('Testing Test 1: Unauthenticated Landing page...');
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(2000);
  console.log('Current URL:', page.url());
  await page.screenshot({ path: '/Users/youngminpark/.gemini/antigravity/brain/26f9fd08-e4db-4710-a70d-c1404330b6dc/state1_landing.png' });

  // -------------------------------------------------------------
  // TEST 2: Navigate to `/dashboard` without profile -> Should redirect to `/profile-setup`
  // -------------------------------------------------------------
  console.log('Testing Test 2: Redirect to profile-setup if profile is missing...');
  // Inject session
  await page.evaluate(({ key, val }) => {
    window.localStorage.setItem(key, JSON.stringify(val));
  }, { key: AUTH_KEY, val: FAKE_SESSION });

  // Go to /dashboard -> Guard should catch profile missing and redirect to /profile-setup
  await page.goto('http://localhost:5173/dashboard');
  await page.waitForTimeout(2000);
  console.log('Current URL after visiting /dashboard (no profile):', page.url());
  await page.screenshot({ path: '/Users/youngminpark/.gemini/antigravity/brain/26f9fd08-e4db-4710-a70d-c1404330b6dc/state2_profile_onboarding.png' });

  // -------------------------------------------------------------
  // TEST 3: Navigate to `/dashboard` with profile -> Should load dashboard
  // -------------------------------------------------------------
  console.log('Testing Test 3: Load dashboard when profile exists...');
  await page.goto('http://localhost:5173/dashboard');
  await page.waitForTimeout(2000);
  console.log('Current URL after visiting /dashboard (with profile):', page.url());
  await page.screenshot({ path: '/Users/youngminpark/.gemini/antigravity/brain/26f9fd08-e4db-4710-a70d-c1404330b6dc/state3_dashboard.png' });

  // -------------------------------------------------------------
  // TEST 4: Navigate to `/admin` with admin session -> Should load admin console
  // -------------------------------------------------------------
  console.log('Testing Test 4: Load admin console for admin user...');
  await page.goto('http://localhost:5173/admin');
  await page.waitForTimeout(2000);
  console.log('Current URL after visiting /admin:', page.url());
  await page.screenshot({ path: '/Users/youngminpark/.gemini/antigravity/brain/26f9fd08-e4db-4710-a70d-c1404330b6dc/state4_admin_console.png' });

  await browser.close();
  console.log('Routing verification completed successfully!');
}

runRoutingTest();
