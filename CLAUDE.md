# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **Web人 (webren)** marketing site and demo configurator — a static vanilla HTML/CSS/JS project deployed via GitHub Pages. No build step, no bundler, no package manager.

**Live URLs:**
- Main site: `https://webren.dev/` (serves from repo root)
- Demo configurator: `https://rayantion26.github.io/webren/demo/`

## Running Locally

Since there's no build step, serve directly with any static file server:

```bash
# Python
python -m http.server 8080

# Node (if npx available)
npx serve .
```

Open `http://localhost:8080` for the main site, `http://localhost:8080/demo/` for the configurator.

## Architecture

### Main Site (`/`)
- `index.html` — single-page site with sections: hero, services, portfolio, features, demo, contact
- `css/style.css` — all styles
- `js/i18n.js` — custom i18n module (no i18next dependency despite comments; loads `locales/*.json` via fetch, caches, and applies via `data-i18n` attributes)
- `js/app.js` — Three.js hero canvas, scroll reveal (IntersectionObserver), navbar hide/show, mobile menu, counter animation, language toggle, cursor glow, card tilt
- `locales/en.json` / `locales/zh-TW.json` — translation strings

### Demo Configurator (`/demo/`)
- `demo/index.html` — interactive configurator for prospective clients ("Option A" package)
- `demo/js/configurator.js` — config drawer, HSL color picker, auto-theme generation, Google Fonts loader, form, POST to n8n webhook
- `demo/js/app.js` — mode switching (company/personal/portfolio), live preview rendering
- `demo/js/i18n.js` — same i18n pattern as main site
- `demo/config.json` — default config loaded on startup (`mode`, `theme`, `fonts`, `viewCounter`)
- `demo/locales/en.json` / `demo/locales/zh-TW.json`

### Client Ordering Flow
1. Client opens `/demo/`, customizes mode/colors/fonts, fills contact details
2. Clicks "Send to Web人" — POSTs `config.json` + contact to n8n webhook (`N8N_WEBHOOK_URL` in `configurator.js`)
3. n8n forwards to Aaron via Telegram
4. Aaron sends config to Claude, who clones the template, applies config, and deploys

## i18n System

All translatable text uses `data-i18n="key.path"` attributes. The `I18N` module:
- Detects language from `localStorage` key `webren_lang`, then timezone (Taipei → `zh-TW`)
- Supports `data-i18n` (textContent), `data-i18n-html` (innerHTML), `data-i18n-placeholder`
- Applies `lang-zh` class to `<body>` for CJK font switching
- Language preference stored in `localStorage` as `webren_lang`

When adding new translatable strings, add keys to **both** `locales/en.json` and `locales/zh-TW.json`.

## Key Constraints

- **White theme + EN/zh-TW i18n required** on all pages — never omit either
- No build tools — all dependencies loaded from CDN (Three.js via cdnjs)
- `</script>` closing tags must always be present
- CSS `ul` elements need explicit `list-style: none` reset where needed
- `localStorage` keys are versioned (`webren_lang`) — don't change key names without migration
- Avoid Unicode escape sequences in bash commands (write files directly)
