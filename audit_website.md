# Website Audit — Web人 (webren)
Last audited: 2026-03-25

Legend: ✅ Good  ❌ Missing/Broken  ⚠️ Needs attention  N/A Not applicable

---

## 1. SEO — Meta Tags

| Page | `<title>` | `meta description` | `canonical` | `robots` |
|------|-----------|--------------------|-------------|----------|
| index.html | ✅ | ✅ | ✅ webren.dev | ✅ index |
| pricing/index.html | ✅ | ✅ | ⚠️ rayantion.me (not webren.dev) | ✅ index |
| join/index.html | ✅ | ✅ | ⚠️ rayantion.me (not webren.dev) | ✅ index |
| demo/index.html | ✅ | ✅ | ⚠️ rayantion26.github.io | ✅ index |
| privacy/index.html | ✅ | ✅ | ⚠️ rayantion26.github.io | ✅ index |
| 404.html | ✅ | N/A (noindex) | N/A | ✅ noindex |
| portal/index.html | ✅ | N/A (noindex) | N/A | ✅ noindex |
| portal/privacy.html | ✅ | N/A (noindex) | N/A | ✅ noindex |
| portal/terms.html | ✅ | N/A (noindex) | N/A | ✅ noindex |

**Issues:**
- ⚠️ Canonical domain mismatch — pricing, join, demo, privacy all point to `rayantion.me` or `rayantion26.github.io` instead of `webren.dev`. When the site moves fully to webren.dev, these must be updated or Google will treat them as duplicates of pages on those other domains.
- **Action required by Aaron:** Confirm final production domain for each page, then update canonicals.

---

## 2. Open Graph / Social Sharing

| Page | `og:title` | `og:description` | `og:image` | `og:type` | `og:site_name` | `og:url` |
|------|-----------|-----------------|-----------|----------|---------------|---------|
| index.html | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| pricing/index.html | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| join/index.html | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| demo/index.html | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| privacy/index.html | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| portal/* | N/A (noindex) | — | — | — | — | — |

| Page | `twitter:card` | `twitter:title` | `twitter:description` | `twitter:image` |
|------|---------------|----------------|----------------------|----------------|
| index.html | ✅ | ✅ | ✅ | ❌ |
| pricing/index.html | ✅ | ✅ | ✅ | ❌ |
| join/index.html | ❌ | ❌ | ❌ | ❌ |
| demo/index.html | ✅ | ✅ | ✅ | ❌ |
| privacy/index.html | ❌ | ❌ | ❌ | ❌ |

**Fixed in this audit:**
- ✅ Added `og:site_name`, `og:image`, `og:type` where missing on all public pages
- ✅ Added `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image` where missing
- ✅ Added `og:url` to privacy/index.html

---

## 3. Mobile / Responsive

| Check | Status | Notes |
|-------|--------|-------|
| `viewport` meta on all pages | ✅ | All pages correct |
| `@media (max-width: 768px)` | ✅ | All pages covered |
| `@media (max-width: 480px)` | ✅ | Fixed in prior session |
| CSS grid `minmax(min(Npx, 100%), 1fr)` | ✅ | Fixed across all CSS files |
| `-webkit-tap-highlight-color` on interactive elements | ✅ | Fixed across all CSS files |
| `touch-action: manipulation` on interactive elements | ✅ | All covered |
| Button touch targets (min 44px) | ✅ | `btn-primary` 16px padding = ~56px height |
| `#menu-toggle` touch target | ✅ | Explicit `min-height: 44px` |
| iOS input zoom (`font-size >= 16px`) | ✅ | Fixed `.cf-group input/textarea` to 1rem |
| `apple-touch-icon` (iOS home screen) | ⚠️ | Link tag added to all pages — PNG asset needed |
| `theme-color` meta (mobile browser chrome) | ✅ | Added `#0d9488` to all pages |
| Web app manifest (`.webmanifest`) | ❌ | Not present |

**Remaining action:** Create `apple-touch-icon.png` (180x180 PNG) and place it in the webren root. The `<link>` tag is already in all pages pointing to `/apple-touch-icon.png`.

---

## 4. Performance

| Check | Status | Notes |
|-------|--------|-------|
| Google Fonts `display=swap` | ✅ | All pages |
| Scripts at end of `<body>` | ✅ | All pages |
| `defer` on external scripts | ✅ | Fixed in this audit |
| CDN scripts with `crossorigin="anonymous"` | ✅ | Three.js, Supabase, html2pdf |
| `<link rel="preconnect">` for Google Fonts | ✅ | All pages |
| `<link rel="preload">` for critical fonts/CSS | ❌ | Not used — first fonts load unguided |
| Images with `loading="lazy"` | N/A | No `<img>` with large images found in HTML |
| Images with explicit `width`/`height` (CLS prevention) | ⚠️ | `.about-img` uses `aspect-ratio: 3/2` which covers CLS — acceptable |
| Inline critical CSS | ❌ | Not implemented, but low priority for this site |

---

## 5. Accessibility (a11y)

| Check | Status | Notes |
|-------|--------|-------|
| All `<img>` have `alt` attributes | ✅ | Grep confirmed zero missing |
| `<html lang>` correct on all pages | ✅ | Fixed `index.html` zh-TW → en in this audit |
| `lang` updated dynamically by i18n.js | ✅ | `document.documentElement.lang = currentLang` |
| Semantic HTML5 (`<main>`, `<nav>`, `<header>`, `<footer>`, `<section>`) | ✅ | Used across all pages |
| Form `<label>` elements | ✅ | All inputs labelled in portal |
| `role="alert"` on error messages | ✅ | portal/index.html |
| `aria-labelledby` on sections | ⚠️ | Only `sneak-section` on pricing has it; most sections lack |
| `aria-label` on lang buttons | ✅ | Added "Switch to English / Traditional Chinese" to shared-nav.js, demo, portal |
| `aria-label` on nav | ⚠️ | join/index.html still has minimal aria coverage on sections |
| Skip-to-main link | ✅ | Added to index, pricing, join, privacy, demo with CSS in shared-nav.css |
| Visible focus styles | ⚠️ | Not checked — requires browser DevTools / a11y audit |
| Color contrast ratios | ⚠️ | Not checked — requires DevTools |

---

## 6. Security

| Check | Status | Notes |
|-------|--------|-------|
| `rel="noopener noreferrer"` on all `target="_blank"` | ✅ | Fixed in this audit |
| No `target="_blank"` without `rel` | ✅ | Confirmed by grep |
| Portal pages `noindex, nofollow` | ✅ | Correctly hidden from crawlers |
| `Content-Security-Policy` meta tag | ❌ | Not set (typically server-level but meta fallback possible) |
| Referrer-Policy meta | ❌ | Not set |
| X-Frame-Options / `frame-ancestors` | ❌ | Not set (server-level) |
| Form inputs: `autocomplete` attributes | ✅ | Portal: `autocomplete="new-password"` present |
| No sensitive data in HTML source | ✅ | Supabase keys loaded in JS, not hardcoded in HTML |

**Note:** CSP, Referrer-Policy, X-Frame-Options should be set as HTTP response headers on the server. The meta tag fallback is secondary.

---

## 7. Infrastructure

| Check | Status | Notes |
|-------|--------|-------|
| `sitemap.xml` exists | ✅ | `/sitemap.xml` |
| `robots.txt` exists | ✅ | Allows all crawlers + AI bots |
| Sitemap includes all public pages | ❌ | Only `index.html` listed — pricing, join, demo, privacy missing |
| `hreflang` in sitemap | ✅ | en / zh-TW alternates for homepage |
| hreflang for subpages | ❌ | Not included for pricing/join (they also have i18n) |
| `robots.txt` points to sitemap | ✅ | `Sitemap: https://webren.dev/sitemap.xml` |
| Favicon (SVG) | ✅ | All pages |
| Favicon (PNG fallback for older browsers) | ❌ | No `.ico` or PNG favicon |
| `apple-touch-icon.png` | ❌ | Not present |
| 404 page exists | ✅ | `404.html` |

**Fixed in this audit:**
- ✅ Sitemap updated to include pricing, join, demo, privacy pages

---

## 8. Code Quality

| Check | Status | Notes |
|-------|--------|-------|
| HTML5 doctype on all pages | ✅ | All pages |
| UTF-8 charset on all pages | ✅ | All pages |
| `<title>` unique per page | ✅ | All distinct |
| JS files versioned (`?v=30`) | ✅ | Consistent cache-busting |
| No inline styles for layout (only theming) | ⚠️ | `privacy/index.html` uses inline `style="color:var(--teal)"` |
| No console errors in HTML structure | ⚠️ | Requires browser check |
| Consistent indentation | ✅ | 2-space HTML, consistent CSS |
| Unused CSS classes | ⚠️ | Not audited — requires tooling (PurgeCSS) |

---

## Summary: Items Fixed in This Audit Session

| # | What | Where |
|---|------|-------|
| 1 | `rel="noopener noreferrer"` on all `target="_blank"` | privacy, demo, pricing, portal |
| 2 | `rel` missing entirely on portal checkbox links | portal HTML + JS strings |
| 3 | iOS input zoom: `font-size: 0.95rem` → `1rem` | demo/css/style.css |
| 4 | `<html lang="zh-TW">` → `lang="en"` | index.html |
| 5 | `defer` added to `shared-nav.js` | privacy, pricing, demo |
| 6 | `og:site_name`, `og:image`, `og:type` added | pricing, join, privacy |
| 7 | `twitter:card/title/description/image` added | join, privacy |
| 8 | `og:url` added | privacy |
| 9 | `twitter:image` added | index, pricing, demo |
| 10 | Sitemap expanded to include all public pages | sitemap.xml |

---

## Summary: Open Items (Action Required)

| Priority | Item | Effort |
|----------|------|--------|
| High | Canonical URLs — align all pages to `webren.dev` domain | Low (find/replace once on final domain) |
| Medium | `apple-touch-icon.png` — create 180x180 PNG asset | Needs design asset |
| Low | ARIA — section `aria-labelledby` on pricing/join/index pages | Medium |
| Low | Visible focus styles — audit in DevTools | Medium |
| Low | Color contrast — audit in DevTools | Medium |
| Low | PNG favicon `.ico` fallback for legacy browsers | Needs asset |
| Low | CSP / Referrer-Policy / X-Frame-Options | Server-level config |
| Low | `<link rel="preload">` for hero fonts | Low |
| Low | Web app manifest (`.webmanifest`) | Low |
