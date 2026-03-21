# Webren Demo — Website Configurator & Mockup
**Date:** 2026-03-21
**Location:** `webren/demo/`
**Future:** Will be extracted to its own repo once confirmed working.

---

## Overview

A full-page interactive website demo that lets prospective clients of Web人 (webren) preview what their Option A website will look like — and configure it live before ordering.

The client opens the demo, customizes mode/colors/fonts, fills in contact details, and clicks "Send to Web人". This POSTs a `config.json` + contact details to an n8n webhook, which forwards it to the owner via Telegram. The owner (Aaron) then sends the config to Claude, who clones the template, applies the config, and deploys a real repo.

---

## File Structure

```
webren/demo/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js              ← main logic, mode switching, transitions
│   ├── i18n.js             ← language handling (i18next)
│   └── configurator.js     ← config drawer, color picker, font loader, export
├── locales/
│   ├── en.json
│   └── zh-TW.json
├── config.json             ← default config (loaded on startup)
└── assets/
    └── images/
```

---

## Architecture

### Config Schema (`config.json`)
```json
{
  "mode": "company",
  "theme": {
    "primary": "#0D9488",
    "accent": "#7C3AED",
    "bg": "#0F1117",
    "text": "#F9FAFB"
  },
  "fonts": {
    "heading": "Playfair Display",
    "body": "Inter"
  },
  "viewCounter": true
}
```

### n8n Webhook Payload
When the client clicks "Send to Web人", a POST is made to the n8n webhook URL (placeholder constant in `configurator.js`):
```json
{
  "contact": {
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+886 912 345 678"
  },
  "config": {
    "mode": "restaurant",
    "theme": { "primary": "#...", "accent": "#...", "bg": "#...", "text": "#..." },
    "fonts": { "heading": "Lora", "body": "Inter" },
    "viewCounter": true
  }
}
```

---

## Components

### 1. Business Modes
Three modes with distinct section layouts. Switching triggers a dropdown fill-up transition.

| Mode | Sections |
|------|----------|
| **Company** | Hero, Services, About, Features, Contact |
| **Restaurant** | Hero, Menu (categories + items), About, Hours & Location, Contact |
| **Store** | Hero, Featured Products, Categories, About, Contact |

Header, footer, and view counter are shared across all modes.

All content is localised via i18n keys — separate keys per mode (e.g. `restaurant.menu.title`).

### 2. Config Drawer (floating panel)
- Fixed "⚙ Customize" button at bottom-right
- Slides in from the right on click; close button + click-outside to close
- Sections:
  1. **Mode selector** — 3 buttons: Company / Restaurant / Store
  2. **Theme colors** — 4 color pickers + hex inputs: Primary, Accent, Background, Text
     - **Auto-theme button**: user picks Primary only → system auto-generates remaining 3 colors using color theory:
       - Accent: 30° analogous hue shift
       - Background: primary hue at 10% saturation, 8% lightness (deep dark)
       - Text: white (#F9FAFB) for dark bg, near-black (#111827) for light bg
  3. **Font selector** — 2 dropdowns (Heading, Body) populated from ~20 curated Google Fonts options. Loading a new font injects a `<link>` tag and applies CSS variables.
  4. **Language toggle** — EN / 中文 buttons
  5. **Contact fields** (required, validated before sending):
     - Full Name (required, min 2 chars)
     - Email (required, valid email format regex)
     - Phone Number (required, valid: digits/+/spaces/dashes, min 8 digits)
  6. **Send to Web人** button — validates fields, POSTs to n8n webhook, shows success/error toast

### 3. Live View Counter (Footer)
- Displayed on every mode: `Today | Yesterday | Last Month | Total`
- Animated count-up on page load (matching webren's existing counter style)
- **Demo mode**: shows realistic mock numbers (no real API call)
- If `viewCounter: false` in config → counter row is hidden
- Future: will hit the Cloudflare KV Worker endpoint and show webren's actual traffic

### 4. i18n
- i18next via CDN
- English default on load
- Traditional Chinese (zh-TW) available
- All 3 modes fully translated
- Language preference persisted in `localStorage`

### 5. Page Transitions
- Dropdown fill-up overlay (CSS) triggered on:
  - Mode switch
  - Language switch

---

## Tech Stack
- Vanilla HTML, CSS, JavaScript only
- i18next via CDN (`https://cdn.jsdelivr.net/npm/i18next@23/i18next.min.js`)
- Google Fonts via CDN (dynamic `<link>` injection for selected fonts)
- No React, no Vue, no npm, no build tools

---

## SEO & Meta
- Full meta tags, Open Graph, Twitter Card
- Canonical URL, hreflang (en + zh-TW)
- Schema.org JSON-LD (WebApplication type for the configurator)
- sitemap.xml, robots.txt, .well-known/security.txt
- Mobile responsive, semantic HTML

---

## Git Workflow
- Build in `webren/demo/` subfolder
- Commit after every major feature
- Final commit: `feat: webren-demo - initial release`
- Push to GitHub (webren repo, main branch)
- GitHub Pages serves at `rayantion26.github.io/webren/demo`
- When confirmed by Aaron: extract to standalone repo + local backup

---

## Out of Scope (For Now)
- Real Cloudflare KV Worker integration (endpoint TBD)
- Real n8n webhook URL (placeholder used)
- Backend of any kind
- Dark/light mode toggle
- More than 2 languages
