# Multilingual Mobile UI Text Wrap and Styling Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Improve mobile layout rendering across all 7 supported languages, focusing on headline text wrapping/truncation, announcement banner centering, and subtitle balance.

**Architecture:** Update `src/index.css` under the `@media (max-width: 480px)` media query to remove `-webkit-line-clamp` truncation, apply `text-wrap: balance` to hero titles and subtitles, center the announcement banner layout, and adjust font-sizes dynamically based on the language class (`.headline-vi`, `.headline-en`, etc.).

**Tech Stack:** CSS (Vanilla CSS, Media Queries).

---

### Task 1: Update Mobile Hero Title and Subtitle Styling

**Files:**
- Modify: `src/index.css`

**Step 1: Write the minimal style modifications**
Under `@media (max-width: 480px)` in `src/index.css`:
- Remove `-webkit-line-clamp` and `-webkit-box` styling from `h1` to prevent text truncation.
- Add `text-wrap: balance` to `h1` and `.subtitle` to distribute text lines evenly.
- Define font-sizes for specific language classes to prevent layout overflow.
  - `.headline-vi` -> `1.3rem`
  - `.headline-en` -> `1.35rem`
  - `.headline-uz`, `.headline-mn` -> `1.15rem`

```css
  h1 {
    font-size: 1.5rem;
    white-space: normal;
    line-height: 1.3;
    text-wrap: balance;
  }
  h1.headline-vi {
    font-size: 1.3rem;
  }
  h1.headline-en {
    font-size: 1.35rem;
  }
  h1.headline-uz, h1.headline-mn {
    font-size: 1.15rem; /* Slightly increased for better readability */
  }

  .subtitle {
    font-size: 0.9rem;
    text-wrap: balance;
    word-break: keep-all;
  }
```

**Step 2: Run verification**
Run: `npm run build`
Expected: PASS

**Step 3: Commit**
```bash
git add src/index.css
git commit -m "style: optimize mobile hero title and subtitle wrapping across languages"
```

---

### Task 2: Align Mobile Announcement Banner Layout

**Files:**
- Modify: `src/index.css`

**Step 1: Write mobile announcement banner centering CSS**
Under `@media (max-width: 480px)` in `src/index.css`, update the `.announcement-banner` class to center-align the content:
```css
  .announcement-banner {
    padding: 8px var(--spacing-sm);
    font-size: 0.72rem;
    text-align: center;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
  }
```

**Step 2: Run verification**
Run: `npm run build`
Expected: PASS

**Step 3: Commit**
```bash
git add src/index.css
git commit -m "style: center-align mobile announcement banner content"
```
