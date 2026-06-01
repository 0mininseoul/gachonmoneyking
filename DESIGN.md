version: beta
name: Linear-design-analysis
description: "A near-black product-focused marketing canvas built around #010102 (the deepest dark surface of any tool in this collection), light gray text (#f7f8f8), and the signature Linear lavender-blue (#5e6ad2) used as the single chromatic accent. The system reads as software-craft documentation: dense, technical, and quietly luxurious. Display type set in Pretendard Variable (Google Fonts CDN) falling back to system-ui. Cards live as charcoal panels (#0f1011) with hairline borders. The accent lavender appears on the brand mark, focus rings, and a few intentional CTAs — never decoratively. Page rhythm leans on product UI screenshots framed in dark panels rather than atmospheric color."

colors:
  primary: "#5e6ad2"
  on-primary: "#ffffff"
  primary-hover: "#828fff"
  primary-focus: "#5e69d1"
  ink: "#f7f8f8"
  ink-muted: "#d0d6e0"
  ink-subtle: "#8a8f98"
  ink-tertiary: "#62666d"
  canvas: "#010102"
  surface-1: "#0f1011"
  surface-2: "#141516"
  surface-3: "#18191a"
  surface-4: "#191a1b"
  hairline: "#23252a"
  hairline-strong: "#34343a"
  hairline-tertiary: "#3e3e44"
  inverse-canvas: "#ffffff"
  inverse-surface-1: "#f5f6f6"
  inverse-surface-2: "#f6f7f7"
  inverse-ink: "#000000"
  brand-secure: "#7a7fad"
  semantic-success: "#27a644"
  semantic-overlay: "#000000"

typography:
  display-xl:
    fontFamily: Linear Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif
    fontSize: 80px
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: -3.0px
  display-lg:
    fontFamily: Linear Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif
    fontSize: 56px
    fontWeight: 600
    lineHeight: 1.10
    letterSpacing: -1.8px
  display-md:
    fontFamily: Linear Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif
    fontSize: 40px
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: -1.0px
  headline:
    fontFamily: Linear Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif
    fontSize: 28px
    fontWeight: 600
    lineHeight: 1.20
    letterSpacing: -0.6px
  card-title:
    fontFamily: Linear Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif
    fontSize: 22px
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: -0.4px
  subhead:
    fontFamily: Linear Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif
    fontSize: 20px
    fontWeight: 400
    lineHeight: 1.40
    letterSpacing: -0.2px
  body-lg:
    fontFamily: Linear Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.50
    letterSpacing: -0.1px
  body:
    fontFamily: Linear Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.50
    letterSpacing: -0.05px
  body-sm:
    fontFamily: Linear Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.50
    letterSpacing: 0
  caption:
    fontFamily: Linear Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.40
    letterSpacing: 0
  button:
    fontFamily: Linear Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.20
    letterSpacing: 0
  eyebrow:
    fontFamily: Linear Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.30
    letterSpacing: 0.4px
  mono:
    fontFamily: Linear Mono, monospace
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.50
    letterSpacing: 0

rounded:
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  xxl: 24px
  pill: 9999px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 96px

# ── i18n & Localization ──────────────────────────────────────────────────────

supported_locales:
  - code: ko
    name: 한국어
    css_class: headline-ko
    notes: "Default fallback for unknown browser locale"
  - code: en
    name: English
    css_class: headline-en
    notes: "Used as translation fallback when a key is missing in another locale"
  - code: vi
    name: Tiếng Việt
    css_class: headline-vi
    notes: "Primary target audience (Vietnamese international students)"
  - code: zh
    name: 中文
    css_class: headline-zh
    notes: "CJK — characters are narrower, headline fits in 1–2 lines at standard size"
  - code: mn
    name: Монгол
    css_class: headline-mn
    notes: "Cyrillic script — headline and table headers are significantly longer. h1 uses reduced font-size."
  - code: uz
    name: O'zbek
    css_class: headline-uz
    notes: "Latin script with apostrophes — headline is long. h1 uses reduced font-size."
  - code: ja
    name: 日本語
    css_class: headline-ja
    notes: "CJK — compact characters, behaves similarly to zh"

locale_detection:
  strategy: "navigator.language → shortLang prefix → translations key lookup → fallback to 'en'"
  manual_override: "lang-select dropdown in top-right nav"

# ── Mobile Responsive System ─────────────────────────────────────────────────

breakpoints:
  mobile: "max-width: 480px"
  notes: "Single breakpoint. Below 480px activates compact layout."

mobile_overrides:
  top_nav:
    height: 48px
    brand_font_size: 0.8rem
    brand_logo_size: 16px
    nav_controls_gap: 5px
    lang_select_font: 0.7rem
    lang_select_height: 28px
    btn_sm_height: 28px

  content_area:
    padding: "16px 12px"

  h1_headline:
    font_size: 1.5rem
    white_space: normal
    line_clamp: 2
    locale_overrides:
      mn: "font-size: 1.1rem — Cyrillic title is long"
      uz: "font-size: 1.1rem — Latin title is long"

  leaderboard_table:
    grid_columns: "50px 1.2fr 50px 1.3fr"
    padding: "12px 12px"
    font_size: 0.8rem
    col_rank_header: "font-size: 0 + ::before '#' — prevents Mongolian/Uzbek rank text overflow"
    col_nationality_header: "font-size: 0 + ::before '🌐'"
    col_country_name: "display: none — flag emoji only on mobile"
    all_header_cells: "min-width: 0; overflow: hidden to prevent grid cell overflow"

  auth_nudge_banner:
    padding: "16px 12px — reduced from 32px to allow long i18n text to wrap in 2 lines not 3"

  announcement_banner:
    padding: "8px 12px"
    font_size: 0.72rem
    text_align: left
    notes: "Deadline copy is kept short and split into a balanced event line plus a lower-emphasis reward line; do not reduce below 0.72rem on mobile"

  footer:
    flex_direction: column
    text_align: center
    company_details: "stacked vertically, dividers hidden"

# ── Component Notes ───────────────────────────────────────────────────────────

components:
  Leaderboard:
    file: src/components/Leaderboard.jsx
    tabs: ["all", "vi", "zh", "mn", "uz", "ja"]
    tab_labels: "t('tab_all'), t('tab_vi') etc. — translated via i18n"
    pinned_row: "Logged-in user's row is always pinned at top of their active tab"
    balance_blur: "Unauthenticated users see blurred balances"
    mobile_note: "Tabs scroll horizontally; scrollbar hidden via scrollbar-width: none"

  MainLayout:
    file: src/App.jsx (MainLayout function)
    header: "Sticky top-nav at z-index 100"
    lang_select: "select.lang-select with 7 locale options"
    announcement_banner: "Below nav, above content — event deadline + prize info"
    footer: "Legal info, company details, copyright"

  ProfileSetupView:
    file: src/App.jsx (ProfileSetupView function)
    profile_card_max_width: 480px
    nationality_options: "from nationalities[] export in translations.js"
    consent_checkbox: "Custom styled checkbox with ::after checkmark"

  AdminConsoleView:
    file: src/App.jsx (AdminConsoleView function)
    access: "emails ending @archy.ai or 0mininseoul@gmail.com"
    grid: "5-column admin table — not optimized for mobile (admin-only, desktop use assumed)"
