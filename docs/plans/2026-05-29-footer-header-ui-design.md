# Design Document: Footer Business Info and Header Logo UI Optimization

## Overview
Optimize the mobile layout of the footer's business details to align it neatly, group "Company" and "BRN" on a single row, display the "Address" on a single line without wrapping, and slightly increase the font size of the "Gachon Money King" brand logo text on both desktop and mobile views.

## Proposed Design Details

### 1. Brand Logo Text (Gachon Money King) Size
- **Desktop**: Increase `.brand` class font-size from `1.1rem` to `1.2rem` to improve readability.
- **Mobile (`max-width: 480px`)**: Increase `.brand` class font-size from `0.8rem` to `0.95rem` to make it prominent.

### 2. Mobile Footer Business Information
- **Font size reduction**: Set `.company-details` font-size to `0.68rem` with `letter-spacing: -0.2px` to fit longer text neatly on smaller screens.
- **Row 1 layout**: Keep **Company** (1st span), **divider** (2nd span), and **BRN** (3rd span) visible and inline.
- **Hide extra dividers**: Hide the bullet dividers between BRN/Address and Address/Email in mobile view.
- **Row 2 layout**: Force **Address** (5th span) to display on its own line (`display: block`) with `white-space: nowrap` to prevent text wrapping.
- **Row 3 layout**: Force **Email** (7th span) to display on its own line (`display: block`).
- **Alignment**: Ensure all text within `.company-details` is center-aligned.

## Verification
- Rebuild the application and verify layout alignment in mobile view responsive emulator.
