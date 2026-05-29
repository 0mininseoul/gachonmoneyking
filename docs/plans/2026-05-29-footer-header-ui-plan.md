# Footer Business Info and Header Logo UI Optimization Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Modify the header brand logo font-size for desktop/mobile views and optimize the mobile footer layout to align company details on three specific rows, ensuring the address is on a single line.

**Architecture:** Utilize pure CSS selectors (such as `:nth-child` pseudoclass) in the `@media (max-width: 480px)` section of `src/index.css` to group and wrap the footer's details without altering the HTML structure. Update the desktop and mobile header brand logo selectors in `src/index.css` to adjust font size.

**Tech Stack:** CSS (Vanilla CSS, Media Queries).

---

### Task 1: Update Brand Header Logo Text Size in CSS

**Files:**
- Modify: `src/index.css`

**Step 1: Write the minimal style modifications**
Update `.brand` in desktop:
```css
.brand {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-weight: 600;
  font-size: 1.2rem; /* Increased from 1.1rem */
  letter-spacing: -0.5px;
  color: var(--color-ink);
  white-space: nowrap;
  flex-shrink: 0;
}
```

Update `.brand` in mobile (`@media (max-width: 480px)`):
```css
  .brand {
    font-size: 0.95rem; /* Increased from 0.8rem */
    width: auto;
    justify-content: flex-start;
    margin-bottom: 0;
    gap: 5px;
  }
```

**Step 2: Run verification**
Run: `npm run build`
Expected: PASS (No compilation errors)

**Step 3: Commit**
```bash
git add src/index.css
git commit -m "style: increase brand logo text size for desktop and mobile views"
```

---

### Task 2: Reflow Mobile Footer Business Info Layout

**Files:**
- Modify: `src/index.css`

**Step 1: Write mobile-first footer layout CSS overrides**
Under `@media (max-width: 480px)` in `src/index.css`, replace:
```css
  .company-details {
    flex-direction: column;
    align-items: center;
    gap: 4px;
    text-align: center;
  }
  .company-details .divider {
    display: none;
  }
```
with:
```css
  .company-details {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 4px var(--spacing-sm);
    font-size: 0.68rem; /* Smaller font size as requested */
    letter-spacing: -0.2px;
    text-align: center;
    line-height: 1.5;
  }
  /* Show Company, divider, and BRN inline on the first row */
  .company-details > span:nth-child(1),
  .company-details > span:nth-child(2),
  .company-details > span:nth-child(3) {
    display: inline-block;
  }
  /* Hide the divider between BRN and Address */
  .company-details > span:nth-child(4) {
    display: none;
  }
  /* Force Address to start on its own row, and stay on a single line */
  .company-details > span:nth-child(5) {
    display: block;
    width: 100%;
    white-space: nowrap;
    text-align: center;
  }
  /* Hide the divider between Address and Email */
  .company-details > span:nth-child(6) {
    display: none;
  }
  /* Force Email to start on its own row */
  .company-details > span:nth-child(7) {
    display: block;
    width: 100%;
    text-align: center;
  }
```

**Step 2: Run verification**
Run: `npm run build`
Expected: PASS

**Step 3: Commit**
```bash
git add src/index.css
git commit -m "style: reflow mobile footer business info layout"
```
