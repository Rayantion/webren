# Webren Demo Configurator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-page interactive website demo at `webren/demo/` that lets clients preview and configure their Option A website (3 business modes, live theme/font customization, contact form → n8n webhook), served at `rayantion26.github.io/webren/demo`.

**Architecture:** All sections for all 3 business modes live in one `index.html`, toggled visible/hidden by JS based on the active mode. Theme and fonts are applied via CSS custom properties. A floating config drawer handles all customization. State persists to localStorage.

**Tech Stack:** Vanilla HTML/CSS/JS, i18next CDN, Google Fonts CDN, no frameworks, no build tools.

---

## File Map

| File | Responsibility |
|------|---------------|
| `demo/index.html` | All HTML: shared nav/footer, all 3 mode sections, config drawer |
| `demo/css/style.css` | CSS variables for theme/fonts, all layout and component styles, responsive |
| `demo/js/app.js` | Mode switching, page transitions, view counter animation, localStorage, init |
| `demo/js/i18n.js` | i18next setup, language switching, localStorage lang persistence |
| `demo/js/configurator.js` | Drawer open/close, color pickers, auto-theme HSL math, font loader, form validation, n8n POST |
| `demo/locales/en.json` | All English strings for all 3 modes |
| `demo/locales/zh-TW.json` | All Traditional Chinese strings for all 3 modes |
| `demo/config.json` | Default config (mode, theme, fonts, viewCounter) |
| `demo/sitemap.xml` | Sitemap for GitHub Pages URL |
| `demo/robots.txt` | Allow all crawlers |
| `demo/.well-known/security.txt` | Security contact |

---

## Task 1: Scaffold — directory structure and config.json

**Files:**
- Create: `demo/config.json`
- Create: `demo/index.html` (skeleton only)
- Create: `demo/css/style.css` (empty)
- Create: `demo/js/app.js` (empty)
- Create: `demo/js/i18n.js` (empty)
- Create: `demo/js/configurator.js` (empty)
- Create: `demo/locales/en.json` (empty object `{}`)
- Create: `demo/locales/zh-TW.json` (empty object `{}`)
- Create: `demo/assets/images/.gitkeep`

- [ ] **Step 1: Create config.json**

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
Save to: `demo/config.json`

- [ ] **Step 2: Create index.html skeleton**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Webren Demo — Website Configurator</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <div id="page-transition"></div>
  <!-- nav, main, footer will be added in later tasks -->
  <script src="https://cdn.jsdelivr.net/npm/i18next@23/i18next.min.js" defer></script>
  <script src="js/i18n.js" defer></script>
  <script src="js/app.js" defer></script>
  <script src="js/configurator.js" defer></script>
</body>
</html>
```
> Script order matters: `i18n.js` → `app.js` (defines `AppState`) → `configurator.js` (consumes `AppState`). All use `defer` so they execute in DOM order after parse.

- [ ] **Step 3: Create remaining empty files, commit**

```bash
cd C:/claude/webren
mkdir -p demo/css demo/js demo/locales demo/assets/images demo/.well-known
touch demo/css/style.css demo/js/app.js demo/js/i18n.js demo/js/configurator.js
echo '{}' > demo/locales/en.json
echo '{}' > demo/locales/zh-TW.json
touch demo/assets/images/.gitkeep
git add demo/
git commit -m "feat: scaffold webren demo structure"
```

---

## Task 2: CSS foundation — variables, reset, base layout

**Files:**
- Modify: `demo/css/style.css`

- [ ] **Step 1: Write CSS variables and reset**

Add to `demo/css/style.css`:
```css
/* ── Theme Variables (set by JS from config) ─────────────────────────── */
:root {
  --color-primary: #0D9488;
  --color-accent: #7C3AED;
  --color-bg: #0F1117;
  --color-text: #F9FAFB;
  --font-heading: 'Playfair Display', serif;
  --font-body: 'Inter', sans-serif;
  --transition-speed: 400ms;
}

/* ── Reset ───────────────────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-body);
  line-height: 1.6;
  overflow-x: hidden;
}
img { max-width: 100%; height: auto; display: block; }
a { color: var(--color-primary); text-decoration: none; }

/* ── Page Transition Overlay ─────────────────────────────────────────── */
#page-transition {
  position: fixed; inset: 0;
  background: var(--color-primary);
  transform: scaleY(0);
  transform-origin: top;
  z-index: 9999;
  pointer-events: none;
  transition: transform var(--transition-speed) ease-in-out;
}
#page-transition.active { transform: scaleY(1); pointer-events: all; }

/* ── Typography ──────────────────────────────────────────────────────── */
h1, h2, h3, h4 { font-family: var(--font-heading); line-height: 1.2; }
h1 { font-size: clamp(2rem, 5vw, 3.5rem); }
h2 { font-size: clamp(1.5rem, 3vw, 2.5rem); }
h3 { font-size: clamp(1.1rem, 2vw, 1.5rem); }

/* ── Container ───────────────────────────────────────────────────────── */
.container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; }

/* ── Section spacing ─────────────────────────────────────────────────── */
section { padding: 5rem 0; }

/* ── Buttons ─────────────────────────────────────────────────────────── */
.btn-primary {
  display: inline-flex; align-items: center; gap: 0.5rem;
  background: var(--color-primary); color: #fff;
  padding: 0.75rem 1.75rem; border-radius: 0.5rem;
  font-family: var(--font-body); font-size: 1rem; font-weight: 600;
  border: none; cursor: pointer;
  transition: opacity 0.2s, transform 0.2s;
}
.btn-primary:hover { opacity: 0.88; transform: translateY(-2px); }
.btn-secondary {
  display: inline-flex; align-items: center; gap: 0.5rem;
  background: transparent; color: var(--color-text);
  padding: 0.75rem 1.75rem; border-radius: 0.5rem;
  font-family: var(--font-body); font-size: 1rem; font-weight: 600;
  border: 2px solid rgba(255,255,255,0.2); cursor: pointer;
  transition: border-color 0.2s, transform 0.2s;
}
.btn-secondary:hover { border-color: var(--color-primary); transform: translateY(-2px); }

/* ── Reveal animation ────────────────────────────────────────────────── */
.reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.55s ease, transform 0.55s ease; }
.reveal.revealed { opacity: 1; transform: none; }

/* ── Responsive ──────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  section { padding: 3rem 0; }
}
```

- [ ] **Step 2: Open demo/index.html in browser, verify page loads with dark background and no console errors**

- [ ] **Step 3: Commit**
```bash
cd C:/claude/webren
git add demo/css/style.css
git commit -m "feat: add CSS foundation, variables, and reset"
```

---

## Task 3: i18n setup — i18next, locale files, language switching

**Files:**
- Modify: `demo/js/i18n.js`
- Modify: `demo/locales/en.json`
- Modify: `demo/locales/zh-TW.json`

- [ ] **Step 1: Write i18n.js**

```javascript
// i18n.js — i18next setup and language switching
const I18N = (() => {
  const STORAGE_KEY = 'webren_demo_lang';

  async function init() {
    const urlLang = new URLSearchParams(location.search).get('lang');
    const saved = urlLang || localStorage.getItem(STORAGE_KEY) || 'en';
    const [en, zhTW] = await Promise.all([
      fetch('locales/en.json').then(r => r.json()),
      fetch('locales/zh-TW.json').then(r => r.json())
    ]);

    await i18next.init({
      lng: saved,
      fallbackLng: 'en',
      resources: {
        en: { translation: en },
        'zh-TW': { translation: zhTW }
      }
    });

    applyTranslations();
    updateLangButtons(saved);
  }

  function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const val = i18next.t(key);
      if (val !== key) el.textContent = val;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const val = i18next.t(el.dataset.i18nPlaceholder);
      if (val !== el.dataset.i18nPlaceholder) el.placeholder = val;
    });
    document.documentElement.lang = i18next.language === 'zh-TW' ? 'zh-TW' : 'en';
  }

  async function switchLanguage(lang) {
    await i18next.changeLanguage(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    applyTranslations();
    updateLangButtons(lang);
  }

  function updateLangButtons(lang) {
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
  }

  return { init, switchLanguage, t: (key) => i18next.t(key) };
})();
```

- [ ] **Step 2: Write en.json with all keys for all 3 modes**

```json
{
  "nav": {
    "home": "Home",
    "services": "Services",
    "menu": "Menu",
    "products": "Products",
    "about": "About",
    "contact": "Contact"
  },
  "hero": {
    "badge": "Powered by Web人",
    "company": {
      "title": "Build a Brand That",
      "highlight": "Stands Out",
      "subtitle": "Professional web presence engineered for growth, SEO, and global audiences."
    },
    "restaurant": {
      "title": "Taste the Difference",
      "highlight": "Every Visit",
      "subtitle": "A warm, modern restaurant experience — reservations, menu, and your story, all in one place."
    },
    "store": {
      "title": "Shop the Latest",
      "highlight": "Collections",
      "subtitle": "Discover our curated selection of products with fast delivery and exceptional service."
    },
    "cta_primary": "Get Started",
    "cta_secondary": "Learn More"
  },
  "company": {
    "services": {
      "badge": "What We Do",
      "title": "Our Services",
      "subtitle": "Everything your business needs to thrive online.",
      "item_1_title": "Web Design",
      "item_1_desc": "Modern, responsive websites crafted for your brand.",
      "item_2_title": "SEO Optimization",
      "item_2_desc": "Rank higher, attract more visitors, grow faster.",
      "item_3_title": "Digital Marketing",
      "item_3_desc": "Reach the right audience at the right time."
    },
    "about": {
      "badge": "Our Story",
      "title": "Who We Are",
      "body": "We are a passionate team dedicated to delivering exceptional digital experiences. With years of expertise, we help businesses of all sizes establish a powerful online presence."
    },
    "features": {
      "badge": "Why Choose Us",
      "title": "Built Different",
      "item_1_title": "Fast & Reliable",
      "item_1_desc": "Optimized for performance and 99.9% uptime.",
      "item_2_title": "Mobile First",
      "item_2_desc": "Looks great on every screen, every device.",
      "item_3_title": "SEO Ready",
      "item_3_desc": "Built for search engines from the ground up."
    }
  },
  "restaurant": {
    "menu": {
      "badge": "Our Menu",
      "title": "Today's Selections",
      "subtitle": "Fresh ingredients, crafted with care.",
      "cat_1": "Starters",
      "cat_2": "Mains",
      "cat_3": "Desserts",
      "item_1_name": "Garden Salad",
      "item_1_desc": "Fresh seasonal greens, cherry tomatoes, house dressing",
      "item_1_price": "NT$180",
      "item_2_name": "Crispy Calamari",
      "item_2_desc": "Lightly breaded, served with lemon aioli",
      "item_2_price": "NT$240",
      "item_3_name": "Grilled Salmon",
      "item_3_desc": "Atlantic salmon, roasted vegetables, herb butter",
      "item_3_price": "NT$480",
      "item_4_name": "Beef Tenderloin",
      "item_4_desc": "200g, medium rare, red wine reduction",
      "item_4_price": "NT$680",
      "item_5_name": "Chocolate Lava",
      "item_5_desc": "Warm chocolate cake, vanilla ice cream",
      "item_5_price": "NT$160",
      "item_6_name": "Crème Brûlée",
      "item_6_desc": "Classic French custard, caramelized sugar top",
      "item_6_price": "NT$150"
    },
    "about": {
      "badge": "Our Story",
      "title": "A Tradition of Flavour",
      "body": "Founded in 2018, we have been serving the community with passion and dedication. Every dish tells a story of carefully sourced ingredients and time-honoured recipes."
    },
    "hours": {
      "badge": "Find Us",
      "title": "Hours & Location",
      "mon_fri": "Monday – Friday",
      "mon_fri_hours": "11:30 AM – 10:00 PM",
      "sat_sun": "Saturday – Sunday",
      "sat_sun_hours": "10:00 AM – 11:00 PM",
      "address": "123 Demo Street, Taipei City",
      "phone": "+886 2 1234 5678"
    }
  },
  "store": {
    "featured": {
      "badge": "New Arrivals",
      "title": "Featured Products",
      "subtitle": "Hand-picked selections, just for you.",
      "item_1_name": "Classic Tee",
      "item_1_desc": "100% organic cotton, available in 8 colours",
      "item_1_price": "NT$590",
      "item_2_name": "Canvas Tote",
      "item_2_desc": "Durable, spacious, and stylish",
      "item_2_price": "NT$380",
      "item_3_name": "Ceramic Mug",
      "item_3_desc": "Hand-thrown, dishwasher safe, 350ml",
      "item_3_price": "NT$320",
      "add_to_cart": "Add to Cart"
    },
    "categories": {
      "badge": "Shop By",
      "title": "Categories",
      "cat_1": "Apparel",
      "cat_2": "Accessories",
      "cat_3": "Home & Living",
      "cat_4": "Gifts"
    },
    "about": {
      "badge": "Our Brand",
      "title": "Made with Purpose",
      "body": "Every product in our store is thoughtfully designed and sustainably sourced. We believe in quality over quantity — each item is built to last and brings genuine joy."
    }
  },
  "contact": {
    "badge": "Get in Touch",
    "title": "Ready to Start?",
    "subtitle": "Reach out and we'll get back to you within 24 hours.",
    "name_label": "Full Name",
    "email_label": "Email Address",
    "message_label": "Message",
    "submit": "Send Message"
  },
  "footer": {
    "tagline": "This is a demo website by Web人.",
    "copyright": "© 2025 Web人. All rights reserved.",
    "counter_today": "Today",
    "counter_yesterday": "Yesterday",
    "counter_lastmonth": "Last Month",
    "counter_total": "Total"
  },
  "configurator": {
    "button": "Customize",
    "title": "Customize Your Site",
    "mode_label": "Business Type",
    "mode_company": "Company",
    "mode_restaurant": "Restaurant",
    "mode_store": "Store",
    "theme_label": "Theme Colors",
    "color_primary": "Primary",
    "color_accent": "Accent",
    "color_bg": "Background",
    "color_text": "Text",
    "auto_theme": "Auto Theme",
    "fonts_label": "Fonts",
    "font_heading": "Heading Font",
    "font_body": "Body Font",
    "lang_label": "Language",
    "contact_label": "Your Details",
    "name_placeholder": "Full Name",
    "email_placeholder": "Email Address",
    "phone_placeholder": "Phone Number",
    "send": "Send to Web人",
    "sending": "Sending...",
    "success": "Sent! We'll be in touch soon.",
    "error": "Something went wrong. Please try again."
  }
}
```

- [ ] **Step 3: Write zh-TW.json**

```json
{
  "nav": {
    "home": "首頁",
    "services": "服務",
    "menu": "菜單",
    "products": "商品",
    "about": "關於",
    "contact": "聯絡"
  },
  "hero": {
    "badge": "由 Web人 驅動",
    "company": {
      "title": "打造令人",
      "highlight": "印象深刻的品牌",
      "subtitle": "專業網路形象，為成長、SEO 與全球受眾而生。"
    },
    "restaurant": {
      "title": "每次造訪",
      "highlight": "都是美味體驗",
      "subtitle": "溫馨現代的餐廳體驗——訂位、菜單與品牌故事，盡在一處。"
    },
    "store": {
      "title": "探索最新",
      "highlight": "精選系列",
      "subtitle": "發現我們精心策劃的商品，快速配送，服務卓越。"
    },
    "cta_primary": "立即開始",
    "cta_secondary": "了解更多"
  },
  "company": {
    "services": {
      "badge": "我們的服務",
      "title": "服務項目",
      "subtitle": "您的企業線上成功所需的一切。",
      "item_1_title": "網頁設計",
      "item_1_desc": "為您的品牌量身打造現代響應式網站。",
      "item_2_title": "SEO 優化",
      "item_2_desc": "提高排名、吸引更多訪客、加速成長。",
      "item_3_title": "數位行銷",
      "item_3_desc": "在正確的時間觸及正確的受眾。"
    },
    "about": {
      "badge": "我們的故事",
      "title": "關於我們",
      "body": "我們是一支充滿熱情的團隊，致力於提供卓越的數位體驗。憑藉多年專業，我們協助各規模企業建立強大的線上形象。"
    },
    "features": {
      "badge": "為何選擇我們",
      "title": "與眾不同",
      "item_1_title": "快速可靠",
      "item_1_desc": "效能優化，99.9% 正常運行時間。",
      "item_2_title": "行動優先",
      "item_2_desc": "在每個螢幕、每台設備上都完美呈現。",
      "item_3_title": "SEO 就緒",
      "item_3_desc": "從底層為搜尋引擎而建。"
    }
  },
  "restaurant": {
    "menu": {
      "badge": "我們的菜單",
      "title": "今日精選",
      "subtitle": "新鮮食材，用心烹製。",
      "cat_1": "前菜",
      "cat_2": "主餐",
      "cat_3": "甜點",
      "item_1_name": "田園沙拉",
      "item_1_desc": "時令新鮮蔬菜、小番茄、特製醬汁",
      "item_1_price": "NT$180",
      "item_2_name": "酥炸魷魚",
      "item_2_desc": "輕盈裹粉，佐檸檬蒜泥醬",
      "item_2_price": "NT$240",
      "item_3_name": "香煎鮭魚",
      "item_3_desc": "大西洋鮭魚、烤蔬菜、香草奶油",
      "item_3_price": "NT$480",
      "item_4_name": "菲力牛排",
      "item_4_desc": "200g，三分熟，紅酒醬汁",
      "item_4_price": "NT$680",
      "item_5_name": "巧克力熔岩",
      "item_5_desc": "溫熱巧克力蛋糕，搭配香草冰淇淋",
      "item_5_price": "NT$160",
      "item_6_name": "法式焦糖布丁",
      "item_6_desc": "經典法式卡士達，焦糖脆頂",
      "item_6_price": "NT$150"
    },
    "about": {
      "badge": "我們的故事",
      "title": "風味傳承",
      "body": "創立於 2018 年，我們以熱情與奉獻服務社區。每道菜都訴說著精心挑選食材與傳統食譜的故事。"
    },
    "hours": {
      "badge": "找到我們",
      "title": "營業時間與地址",
      "mon_fri": "週一 至 週五",
      "mon_fri_hours": "上午 11:30 – 晚上 10:00",
      "sat_sun": "週六 至 週日",
      "sat_sun_hours": "上午 10:00 – 晚上 11:00",
      "address": "台北市範例街 123 號",
      "phone": "+886 2 1234 5678"
    }
  },
  "store": {
    "featured": {
      "badge": "新品上市",
      "title": "精選商品",
      "subtitle": "為您精心挑選。",
      "item_1_name": "經典 T 恤",
      "item_1_desc": "100% 有機棉，提供 8 種顏色",
      "item_1_price": "NT$590",
      "item_2_name": "帆布托特包",
      "item_2_desc": "耐用、寬敞、時尚",
      "item_2_price": "NT$380",
      "item_3_name": "陶瓷馬克杯",
      "item_3_desc": "手工拉坯，可洗碗機清洗，350ml",
      "item_3_price": "NT$320",
      "add_to_cart": "加入購物車"
    },
    "categories": {
      "badge": "分類瀏覽",
      "title": "商品分類",
      "cat_1": "服飾",
      "cat_2": "配件",
      "cat_3": "居家生活",
      "cat_4": "禮品"
    },
    "about": {
      "badge": "品牌理念",
      "title": "有意義的創作",
      "body": "我們商店中的每件商品都經過精心設計，以永續方式採購。我們相信質量勝於數量——每件商品都經久耐用，帶來真正的喜悅。"
    }
  },
  "contact": {
    "badge": "聯絡我們",
    "title": "準備好開始了嗎？",
    "subtitle": "聯繫我們，我們將在 24 小時內回覆。",
    "name_label": "姓名",
    "email_label": "電子郵件",
    "message_label": "訊息",
    "submit": "發送訊息"
  },
  "footer": {
    "tagline": "這是一個由 Web人 製作的示範網站。",
    "copyright": "© 2025 Web人。保留所有權利。",
    "counter_today": "今日",
    "counter_yesterday": "昨日",
    "counter_lastmonth": "上月",
    "counter_total": "總計"
  },
  "configurator": {
    "button": "自訂",
    "title": "自訂您的網站",
    "mode_label": "商業類型",
    "mode_company": "公司",
    "mode_restaurant": "餐廳",
    "mode_store": "商店",
    "theme_label": "主題顏色",
    "color_primary": "主色",
    "color_accent": "強調色",
    "color_bg": "背景色",
    "color_text": "文字色",
    "auto_theme": "自動配色",
    "fonts_label": "字型",
    "font_heading": "標題字型",
    "font_body": "內文字型",
    "lang_label": "語言",
    "contact_label": "您的資料",
    "name_placeholder": "姓名",
    "email_placeholder": "電子郵件",
    "phone_placeholder": "電話號碼",
    "send": "傳送給 Web人",
    "sending": "傳送中...",
    "success": "已傳送！我們將盡快與您聯絡。",
    "error": "發生錯誤，請重試。"
  }
}
```

- [ ] **Step 4: Commit**
```bash
cd C:/claude/webren
git add demo/js/i18n.js demo/locales/en.json demo/locales/zh-TW.json
git commit -m "feat: add i18n setup with EN and zh-TW locales for all 3 modes"
```

---

## Task 4: HTML — shared nav and footer

**Files:**
- Modify: `demo/index.html`

- [ ] **Step 1: Add nav and footer to index.html body**

Replace `<body>` content (keep scripts at bottom):
```html
<body>
  <!-- Page transition overlay -->
  <div id="page-transition"></div>

  <!-- ── Navbar ──────────────────────────────────────────────────── -->
  <header id="navbar">
    <nav class="container nav-inner">
      <a href="#" class="nav-brand">Web人 <span class="nav-brand-demo">Demo</span></a>
      <div class="nav-right">
        <div class="lang-toggle">
          <button class="lang-btn active" data-lang="en">EN</button>
          <button class="lang-btn" data-lang="zh-TW">中文</button>
        </div>
        <button id="menu-toggle" aria-label="Menu" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
      </div>
    </nav>
    <div id="mobile-menu">
      <a href="#" data-i18n="nav.home"></a>
    </div>
    <div id="menu-overlay"></div>
  </header>

  <!-- ── Main content (mode sections injected in Tasks 5-7) ─────── -->
  <main id="main-content"></main>

  <!-- ── Footer ──────────────────────────────────────────────────── -->
  <footer id="site-footer">
    <div class="container footer-inner">
      <p data-i18n="footer.tagline"></p>
      <div id="view-counter" class="view-counter">
        <span class="counter-item">
          <span data-i18n="footer.counter_today"></span>: <strong data-count="47">0</strong>
        </span>
        <span class="counter-item">
          <span data-i18n="footer.counter_yesterday"></span>: <strong data-count="83">0</strong>
        </span>
        <span class="counter-item">
          <span data-i18n="footer.counter_lastmonth"></span>: <strong data-count="1240">0</strong>
        </span>
        <span class="counter-item">
          <span data-i18n="footer.counter_total"></span>: <strong data-count="8600">0</strong>
        </span>
      </div>
      <p class="footer-copy" data-i18n="footer.copyright"></p>
    </div>
  </footer>

  <!-- ── Config Drawer (added in Task 8) ─────────────────────────── -->

  <!-- ── Scripts ─────────────────────────────────────────────────── -->
  <script src="https://cdn.jsdelivr.net/npm/i18next@23/i18next.min.js" defer></script>
  <script src="js/i18n.js" defer></script>
  <script src="js/app.js" defer></script>
  <script src="js/configurator.js" defer></script>
</body>
```

- [ ] **Step 2: Add nav and footer CSS to style.css**

```css
/* ── Navbar ──────────────────────────────────────────────────────── */
#navbar {
  position: sticky; top: 0; z-index: 100;
  background: rgba(15,17,23,0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255,255,255,0.07);
  transition: box-shadow 0.3s;
}
#navbar.scrolled { box-shadow: 0 2px 20px rgba(0,0,0,0.4); }
.nav-inner {
  display: flex; align-items: center; justify-content: space-between;
  height: 64px;
}
.nav-brand {
  font-family: var(--font-heading); font-size: 1.4rem; font-weight: 700;
  color: var(--color-text);
}
.nav-brand-demo {
  font-size: 0.7rem; font-family: var(--font-body);
  background: var(--color-primary); color: #fff;
  padding: 2px 6px; border-radius: 4px; margin-left: 6px;
  vertical-align: middle;
}
.nav-right { display: flex; align-items: center; gap: 1rem; }
.lang-toggle { display: flex; gap: 0.25rem; }
.lang-btn {
  background: none; border: 1px solid rgba(255,255,255,0.2);
  color: var(--color-text); padding: 0.3rem 0.75rem; border-radius: 4px;
  cursor: pointer; font-size: 0.85rem; transition: all 0.2s;
}
.lang-btn.active, .lang-btn:hover {
  background: var(--color-primary); border-color: var(--color-primary); color: #fff;
}
#menu-toggle {
  display: none; flex-direction: column; gap: 5px;
  background: none; border: none; cursor: pointer; padding: 4px;
}
#menu-toggle span {
  display: block; width: 22px; height: 2px;
  background: var(--color-text); border-radius: 2px; transition: all 0.3s;
}
#mobile-menu {
  display: none; flex-direction: column; gap: 0;
  background: rgba(15,17,23,0.97);
}
#mobile-menu a {
  padding: 1rem 1.5rem; color: var(--color-text);
  border-top: 1px solid rgba(255,255,255,0.07);
}
#menu-overlay {
  display: none; position: fixed; inset: 0; z-index: 90; background: rgba(0,0,0,0.5);
}
@media (max-width: 768px) {
  #menu-toggle { display: flex; }
  #mobile-menu.open, #menu-overlay.open { display: flex; }
  #menu-overlay.open { display: block; }
}

/* ── Footer ──────────────────────────────────────────────────────── */
#site-footer {
  background: rgba(255,255,255,0.03);
  border-top: 1px solid rgba(255,255,255,0.07);
  padding: 2.5rem 0;
  text-align: center;
}
.footer-inner { display: flex; flex-direction: column; align-items: center; gap: 1rem; }
.view-counter {
  display: flex; flex-wrap: wrap; justify-content: center; gap: 1.5rem;
  font-size: 0.9rem; opacity: 0.7;
}
.view-counter strong { color: var(--color-primary); font-size: 1.05rem; }
.footer-copy { opacity: 0.4; font-size: 0.85rem; }
```

- [ ] **Step 3: Open in browser, verify nav and footer render, no errors**

- [ ] **Step 4: Commit**
```bash
cd C:/claude/webren
git add demo/index.html demo/css/style.css
git commit -m "feat: add shared navbar and footer HTML + styles"
```

---

## Task 5: Company mode — HTML sections

**Files:**
- Modify: `demo/index.html` (add company sections into `<main>`)

- [ ] **Step 1: Add company mode HTML inside `<main id="main-content">`**

```html
<!-- ── COMPANY MODE ────────────────────────────────────────────── -->
<div id="mode-company" class="mode-sections">

  <!-- Hero -->
  <section class="hero" id="home">
    <div class="container hero-inner">
      <div class="hero-content reveal">
        <span class="badge" data-i18n="hero.badge"></span>
        <h1><span data-i18n="hero.company.title"></span> <span class="highlight" data-i18n="hero.company.highlight"></span></h1>
        <p data-i18n="hero.company.subtitle"></p>
        <div class="hero-actions">
          <button class="btn-primary" data-i18n="hero.cta_primary"></button>
          <button class="btn-secondary" data-i18n="hero.cta_secondary"></button>
        </div>
      </div>
    </div>
  </section>

  <!-- Services -->
  <section id="services">
    <div class="container">
      <div class="section-header reveal">
        <span class="badge" data-i18n="company.services.badge"></span>
        <h2 data-i18n="company.services.title"></h2>
        <p data-i18n="company.services.subtitle"></p>
      </div>
      <div class="card-grid">
        <div class="card reveal">
          <h3 data-i18n="company.services.item_1_title"></h3>
          <p data-i18n="company.services.item_1_desc"></p>
        </div>
        <div class="card reveal">
          <h3 data-i18n="company.services.item_2_title"></h3>
          <p data-i18n="company.services.item_2_desc"></p>
        </div>
        <div class="card reveal">
          <h3 data-i18n="company.services.item_3_title"></h3>
          <p data-i18n="company.services.item_3_desc"></p>
        </div>
      </div>
    </div>
  </section>

  <!-- About -->
  <section id="about" class="section-alt">
    <div class="container about-inner reveal">
      <span class="badge" data-i18n="company.about.badge"></span>
      <h2 data-i18n="company.about.title"></h2>
      <p data-i18n="company.about.body"></p>
    </div>
  </section>

  <!-- Features -->
  <section id="features">
    <div class="container">
      <div class="section-header reveal">
        <span class="badge" data-i18n="company.features.badge"></span>
        <h2 data-i18n="company.features.title"></h2>
      </div>
      <div class="card-grid">
        <div class="card reveal">
          <h3 data-i18n="company.features.item_1_title"></h3>
          <p data-i18n="company.features.item_1_desc"></p>
        </div>
        <div class="card reveal">
          <h3 data-i18n="company.features.item_2_title"></h3>
          <p data-i18n="company.features.item_2_desc"></p>
        </div>
        <div class="card reveal">
          <h3 data-i18n="company.features.item_3_title"></h3>
          <p data-i18n="company.features.item_3_desc"></p>
        </div>
      </div>
    </div>
  </section>

  <!-- Contact -->
  <section id="contact" class="section-alt">
    <div class="container contact-inner reveal">
      <span class="badge" data-i18n="contact.badge"></span>
      <h2 data-i18n="contact.title"></h2>
      <p data-i18n="contact.subtitle"></p>
    </div>
  </section>

</div><!-- end #mode-company -->
```

- [ ] **Step 2: Add section CSS to style.css**

```css
/* ── Badges ──────────────────────────────────────────────────────── */
.badge {
  display: inline-block;
  background: color-mix(in srgb, var(--color-primary) 15%, transparent);
  color: var(--color-primary);
  border: 1px solid color-mix(in srgb, var(--color-primary) 30%, transparent);
  padding: 0.3rem 0.9rem; border-radius: 999px;
  font-size: 0.8rem; font-weight: 600; letter-spacing: 0.05em;
  text-transform: uppercase; margin-bottom: 1rem;
}

/* ── Hero ────────────────────────────────────────────────────────── */
.hero { min-height: 90vh; display: flex; align-items: center; padding: 6rem 0 4rem; }
.hero-content { max-width: 700px; }
.hero-content h1 { margin: 0.75rem 0 1.25rem; }
.highlight { color: var(--color-primary); }
.hero-content p { font-size: 1.15rem; opacity: 0.8; max-width: 560px; margin-bottom: 2rem; }
.hero-actions { display: flex; gap: 1rem; flex-wrap: wrap; }

/* ── Section Header ──────────────────────────────────────────────── */
.section-header { text-align: center; max-width: 650px; margin: 0 auto 3.5rem; }
.section-header p { opacity: 0.7; margin-top: 0.75rem; }

/* ── Card grid ───────────────────────────────────────────────────── */
.card-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.5rem;
}
.card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 1rem; padding: 1.75rem;
  transition: border-color 0.25s, transform 0.25s;
}
.card:hover { border-color: var(--color-primary); transform: translateY(-3px); }
.card h3 { margin-bottom: 0.6rem; color: var(--color-text); }
.card p { opacity: 0.7; font-size: 0.95rem; }

/* ── Section alt bg ──────────────────────────────────────────────── */
.section-alt { background: rgba(255,255,255,0.02); }
.about-inner, .contact-inner { max-width: 680px; margin: 0 auto; text-align: center; }
.about-inner h2, .contact-inner h2 { margin: 0.5rem 0 1rem; }
.about-inner p, .contact-inner p { opacity: 0.75; }

/* ── Mode sections (hidden by default except active) ─────────────── */
.mode-sections { display: none; }
.mode-sections.active { display: block; }
```

- [ ] **Step 3: Open in browser. Company sections should be hidden (display:none). No errors in console.**

- [ ] **Step 4: Commit**
```bash
cd C:/claude/webren
git add demo/index.html demo/css/style.css
git commit -m "feat: add company mode HTML sections and card/hero styles"
```

---

## Task 6: Restaurant and Store mode HTML

**Files:**
- Modify: `demo/index.html`

- [ ] **Step 1: Add restaurant mode HTML after `#mode-company` closing div**

```html
<!-- ── RESTAURANT MODE ────────────────────────────────────────── -->
<div id="mode-restaurant" class="mode-sections">

  <section class="hero" id="home-r">
    <div class="container hero-inner">
      <div class="hero-content reveal">
        <span class="badge" data-i18n="hero.badge"></span>
        <h1><span data-i18n="hero.restaurant.title"></span> <span class="highlight" data-i18n="hero.restaurant.highlight"></span></h1>
        <p data-i18n="hero.restaurant.subtitle"></p>
        <div class="hero-actions">
          <button class="btn-primary" data-i18n="hero.cta_primary"></button>
          <button class="btn-secondary" data-i18n="hero.cta_secondary"></button>
        </div>
      </div>
    </div>
  </section>

  <section id="menu">
    <div class="container">
      <div class="section-header reveal">
        <span class="badge" data-i18n="restaurant.menu.badge"></span>
        <h2 data-i18n="restaurant.menu.title"></h2>
        <p data-i18n="restaurant.menu.subtitle"></p>
      </div>
      <!-- Category tabs -->
      <div class="menu-tabs">
        <button class="menu-tab active" data-category="all">All</button>
        <button class="menu-tab" data-category="starter" data-i18n="restaurant.menu.cat_1"></button>
        <button class="menu-tab" data-category="main" data-i18n="restaurant.menu.cat_2"></button>
        <button class="menu-tab" data-category="dessert" data-i18n="restaurant.menu.cat_3"></button>
      </div>
      <div class="menu-grid">
        <div class="menu-item card reveal" data-category="starter">
          <div class="menu-item-info">
            <h3 data-i18n="restaurant.menu.item_1_name"></h3>
            <p data-i18n="restaurant.menu.item_1_desc"></p>
          </div>
          <span class="menu-price" data-i18n="restaurant.menu.item_1_price"></span>
        </div>
        <div class="menu-item card reveal" data-category="starter">
          <div class="menu-item-info">
            <h3 data-i18n="restaurant.menu.item_2_name"></h3>
            <p data-i18n="restaurant.menu.item_2_desc"></p>
          </div>
          <span class="menu-price" data-i18n="restaurant.menu.item_2_price"></span>
        </div>
        <div class="menu-item card reveal" data-category="main">
          <div class="menu-item-info">
            <h3 data-i18n="restaurant.menu.item_3_name"></h3>
            <p data-i18n="restaurant.menu.item_3_desc"></p>
          </div>
          <span class="menu-price" data-i18n="restaurant.menu.item_3_price"></span>
        </div>
        <div class="menu-item card reveal" data-category="main">
          <div class="menu-item-info">
            <h3 data-i18n="restaurant.menu.item_4_name"></h3>
            <p data-i18n="restaurant.menu.item_4_desc"></p>
          </div>
          <span class="menu-price" data-i18n="restaurant.menu.item_4_price"></span>
        </div>
        <div class="menu-item card reveal" data-category="dessert">
          <div class="menu-item-info">
            <h3 data-i18n="restaurant.menu.item_5_name"></h3>
            <p data-i18n="restaurant.menu.item_5_desc"></p>
          </div>
          <span class="menu-price" data-i18n="restaurant.menu.item_5_price"></span>
        </div>
        <div class="menu-item card reveal" data-category="dessert">
          <div class="menu-item-info">
            <h3 data-i18n="restaurant.menu.item_6_name"></h3>
            <p data-i18n="restaurant.menu.item_6_desc"></p>
          </div>
          <span class="menu-price" data-i18n="restaurant.menu.item_6_price"></span>
        </div>
      </div>
    </div>
  </section>

  <section class="section-alt">
    <div class="container about-inner reveal">
      <span class="badge" data-i18n="restaurant.about.badge"></span>
      <h2 data-i18n="restaurant.about.title"></h2>
      <p data-i18n="restaurant.about.body"></p>
    </div>
  </section>

  <section id="hours">
    <div class="container">
      <div class="section-header reveal">
        <span class="badge" data-i18n="restaurant.hours.badge"></span>
        <h2 data-i18n="restaurant.hours.title"></h2>
      </div>
      <div class="hours-grid reveal">
        <div class="hours-card card">
          <h3 data-i18n="restaurant.hours.mon_fri"></h3>
          <p data-i18n="restaurant.hours.mon_fri_hours"></p>
        </div>
        <div class="hours-card card">
          <h3 data-i18n="restaurant.hours.sat_sun"></h3>
          <p data-i18n="restaurant.hours.sat_sun_hours"></p>
        </div>
        <div class="hours-card card">
          <p data-i18n="restaurant.hours.address"></p>
          <p data-i18n="restaurant.hours.phone"></p>
        </div>
      </div>
    </div>
  </section>

  <section id="contact-r" class="section-alt">
    <div class="container contact-inner reveal">
      <span class="badge" data-i18n="contact.badge"></span>
      <h2 data-i18n="contact.title"></h2>
      <p data-i18n="contact.subtitle"></p>
    </div>
  </section>

</div><!-- end #mode-restaurant -->
```

- [ ] **Step 2: Add store mode HTML after restaurant closing div**

```html
<!-- ── STORE MODE ────────────────────────────────────────────── -->
<div id="mode-store" class="mode-sections">

  <section class="hero" id="home-s">
    <div class="container hero-inner">
      <div class="hero-content reveal">
        <span class="badge" data-i18n="hero.badge"></span>
        <h1><span data-i18n="hero.store.title"></span> <span class="highlight" data-i18n="hero.store.highlight"></span></h1>
        <p data-i18n="hero.store.subtitle"></p>
        <div class="hero-actions">
          <button class="btn-primary" data-i18n="hero.cta_primary"></button>
          <button class="btn-secondary" data-i18n="hero.cta_secondary"></button>
        </div>
      </div>
    </div>
  </section>

  <section id="products">
    <div class="container">
      <div class="section-header reveal">
        <span class="badge" data-i18n="store.featured.badge"></span>
        <h2 data-i18n="store.featured.title"></h2>
        <p data-i18n="store.featured.subtitle"></p>
      </div>
      <div class="card-grid">
        <div class="product-card card reveal">
          <div class="product-img"></div>
          <h3 data-i18n="store.featured.item_1_name"></h3>
          <p data-i18n="store.featured.item_1_desc"></p>
          <div class="product-footer">
            <span class="product-price" data-i18n="store.featured.item_1_price"></span>
            <button class="btn-primary btn-sm" data-i18n="store.featured.add_to_cart"></button>
          </div>
        </div>
        <div class="product-card card reveal">
          <div class="product-img"></div>
          <h3 data-i18n="store.featured.item_2_name"></h3>
          <p data-i18n="store.featured.item_2_desc"></p>
          <div class="product-footer">
            <span class="product-price" data-i18n="store.featured.item_2_price"></span>
            <button class="btn-primary btn-sm" data-i18n="store.featured.add_to_cart"></button>
          </div>
        </div>
        <div class="product-card card reveal">
          <div class="product-img"></div>
          <h3 data-i18n="store.featured.item_3_name"></h3>
          <p data-i18n="store.featured.item_3_desc"></p>
          <div class="product-footer">
            <span class="product-price" data-i18n="store.featured.item_3_price"></span>
            <button class="btn-primary btn-sm" data-i18n="store.featured.add_to_cart"></button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section id="categories" class="section-alt">
    <div class="container">
      <div class="section-header reveal">
        <span class="badge" data-i18n="store.categories.badge"></span>
        <h2 data-i18n="store.categories.title"></h2>
      </div>
      <div class="cat-grid">
        <div class="cat-card reveal" data-i18n="store.categories.cat_1"></div>
        <div class="cat-card reveal" data-i18n="store.categories.cat_2"></div>
        <div class="cat-card reveal" data-i18n="store.categories.cat_3"></div>
        <div class="cat-card reveal" data-i18n="store.categories.cat_4"></div>
      </div>
    </div>
  </section>

  <section>
    <div class="container about-inner reveal">
      <span class="badge" data-i18n="store.about.badge"></span>
      <h2 data-i18n="store.about.title"></h2>
      <p data-i18n="store.about.body"></p>
    </div>
  </section>

  <section id="contact-s" class="section-alt">
    <div class="container contact-inner reveal">
      <span class="badge" data-i18n="contact.badge"></span>
      <h2 data-i18n="contact.title"></h2>
      <p data-i18n="contact.subtitle"></p>
    </div>
  </section>

</div><!-- end #mode-store -->
```

- [ ] **Step 3: Add restaurant/store CSS**

```css
/* ── Menu items ───────────────────────────────────────────────────── */
.menu-tabs { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 2rem; justify-content: center; }
.menu-tab {
  padding: 0.4rem 1.1rem; border-radius: 999px;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  color: var(--color-text); cursor: pointer; font-size: 0.9rem; transition: all 0.2s;
}
.menu-tab.active, .menu-tab:hover {
  background: var(--color-primary); border-color: var(--color-primary); color: #fff;
}
.menu-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem; }
.menu-item { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
.menu-item.hidden { display: none; }
.menu-item-info h3 { margin-bottom: 0.3rem; }
.menu-price { color: var(--color-primary); font-weight: 700; white-space: nowrap; font-size: 1.05rem; }
.hours-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; }

/* ── Products ─────────────────────────────────────────────────────── */
.product-card { display: flex; flex-direction: column; gap: 0.6rem; }
.product-img {
  width: 100%; aspect-ratio: 4/3; border-radius: 0.5rem;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%);
  opacity: 0.35;
}
.product-footer { display: flex; justify-content: space-between; align-items: center; margin-top: auto; }
.product-price { font-weight: 700; color: var(--color-primary); }
.btn-sm { padding: 0.4rem 1rem; font-size: 0.85rem; }

/* ── Categories ───────────────────────────────────────────────────── */
.cat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 1rem; }
.cat-card {
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 0.75rem; padding: 2rem 1rem;
  text-align: center; font-weight: 600; cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}
.cat-card:hover { background: color-mix(in srgb, var(--color-primary) 15%, transparent); border-color: var(--color-primary); }
```

- [ ] **Step 4: Commit**
```bash
cd C:/claude/webren
git add demo/index.html demo/css/style.css
git commit -m "feat: add restaurant and store mode HTML sections and styles"
```

---

## Task 7: app.js — mode switching, transitions, counter, init

**Files:**
- Modify: `demo/js/app.js`

- [ ] **Step 1: Write app.js**

```javascript
// app.js — Mode switching, transitions, counter, scroll reveal, init

const STORAGE_KEY_CONFIG = 'webren_demo_config';
let isTransitioning = false;
let currentConfig = {};

// ── Load config ───────────────────────────────────────────────────────────────
async function loadConfig() {
  const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
  if (saved) {
    try { currentConfig = JSON.parse(saved); return; } catch(e) {}
  }
  try {
    const res = await fetch('config.json');
    currentConfig = await res.json();
  } catch(e) {
    currentConfig = {
      mode: 'company',
      theme: { primary: '#0D9488', accent: '#7C3AED', bg: '#0F1117', text: '#F9FAFB' },
      fonts: { heading: 'Playfair Display', body: 'Inter' },
      viewCounter: true
    };
  }
}

// ── Apply theme ───────────────────────────────────────────────────────────────
function applyTheme(theme) {
  const root = document.documentElement;
  root.style.setProperty('--color-primary', theme.primary);
  root.style.setProperty('--color-accent', theme.accent);
  root.style.setProperty('--color-bg', theme.bg);
  root.style.setProperty('--color-text', theme.text);
}

// ── Apply fonts ───────────────────────────────────────────────────────────────
function applyFonts(fonts) {
  document.documentElement.style.setProperty('--font-heading', `'${fonts.heading}', serif`);
  document.documentElement.style.setProperty('--font-body', `'${fonts.body}', sans-serif`);
}

// ── Show mode ──────────────────────────────────────────────────────────────────
function showMode(mode, withTransition = true) {
  if (isTransitioning) return;

  const doSwitch = () => {
    document.querySelectorAll('.mode-sections').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(`mode-${mode}`);
    if (target) target.classList.add('active');
    currentConfig.mode = mode;
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(currentConfig));
    window.scrollTo({ top: 0, behavior: 'auto' });
    initScrollReveal();
  };

  if (withTransition) {
    runTransition(doSwitch);
  } else {
    doSwitch();
  }
}

// ── Page transition ────────────────────────────────────────────────────────────
// Async-aware: overlay fills in (400ms) → await callback → overlay fades out (400ms)
async function runTransition(callback) {
  if (isTransitioning) return;
  isTransitioning = true;
  const overlay = document.getElementById('page-transition');
  overlay.classList.add('active');
  await new Promise(r => setTimeout(r, 400)); // wait for overlay to fully cover
  await callback();                            // swap content while fully covered
  overlay.classList.remove('active');
  await new Promise(r => setTimeout(r, 400)); // wait for overlay to fully clear
  isTransitioning = false;
}

// ── Scroll reveal ─────────────────────────────────────────────────────────────
function initScrollReveal() {
  const els = document.querySelectorAll('.reveal:not(.revealed)');
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  els.forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 60}ms`;
    io.observe(el);
  });
}

// ── View counter ──────────────────────────────────────────────────────────────
function initCounter() {
  const counter = document.getElementById('view-counter');
  if (!counter) return;

  if (!currentConfig.viewCounter) {
    counter.style.display = 'none';
    return;
  }

  const counters = counter.querySelectorAll('[data-count]');
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10);
      const duration = 1400;
      const start = performance.now();
      const tick = now => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(eased * target).toLocaleString();
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      io.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach(c => io.observe(c));
}

// ── Navbar scroll ─────────────────────────────────────────────────────────────
function initNav() {
  const nav = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

// ── Mobile menu ───────────────────────────────────────────────────────────────
function initMobileMenu() {
  const toggle = document.getElementById('menu-toggle');
  const menu = document.getElementById('mobile-menu');
  const overlay = document.getElementById('menu-overlay');
  toggle?.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    overlay.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open);
  });
  overlay?.addEventListener('click', () => {
    menu.classList.remove('open');
    overlay.classList.remove('open');
  });
}

// ── Language toggle ───────────────────────────────────────────────────────────
function initLangToggle() {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('active')) return;
      runTransition(async () => {
        await I18N.switchLanguage(btn.dataset.lang);
      });
    });
  });
}

// ── Menu category tabs ────────────────────────────────────────────────────────
function initMenuTabs() {
  document.querySelectorAll('.menu-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.menu-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const cat = tab.dataset.category;
      document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.toggle('hidden', cat !== 'all' && item.dataset.category !== cat);
      });
    });
  });
}

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadConfig();
  applyTheme(currentConfig.theme);
  applyFonts(currentConfig.fonts);
  await I18N.init();
  showMode(currentConfig.mode || 'company', false);
  initNav();
  initMobileMenu();
  initLangToggle();
  initCounter();
  initMenuTabs();
  // initScrollReveal() is called inside showMode() — no need to call it again here
});

// Expose for configurator.js
window.AppState = { get: () => currentConfig, showMode, applyTheme, applyFonts, runTransition, saveConfig: () => localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(currentConfig)) };
```

- [ ] **Step 2: Open in browser. Company mode should be visible with teal/purple theme. Scroll down — cards should fade in. Counter should count up.**

- [ ] **Step 3: Manually test: open browser console and run `AppState.showMode('restaurant')` — restaurant mode should appear with transition.**

- [ ] **Step 4: Commit**
```bash
cd C:/claude/webren
git add demo/js/app.js
git commit -m "feat: add app.js with mode switching, transitions, counter, and scroll reveal"
```

---

## Task 8: Config drawer — HTML and CSS

**Files:**
- Modify: `demo/index.html` (add drawer before closing body)
- Modify: `demo/css/style.css`

- [ ] **Step 1: Add config drawer HTML before `</body>`**

```html
<!-- ── Config Drawer ────────────────────────────────────────────── -->
<button id="config-toggle" aria-label="Customize">
  ⚙ <span data-i18n="configurator.button"></span>
</button>

<div id="config-backdrop"></div>

<aside id="config-drawer" role="dialog" aria-label="Site Configurator">
  <div class="drawer-header">
    <h2 data-i18n="configurator.title"></h2>
    <button id="config-close" aria-label="Close">✕</button>
  </div>
  <div class="drawer-body">

    <!-- Mode -->
    <div class="drawer-section">
      <label data-i18n="configurator.mode_label"></label>
      <div class="mode-btns">
        <button class="mode-btn active" data-mode="company" data-i18n="configurator.mode_company"></button>
        <button class="mode-btn" data-mode="restaurant" data-i18n="configurator.mode_restaurant"></button>
        <button class="mode-btn" data-mode="store" data-i18n="configurator.mode_store"></button>
      </div>
    </div>

    <!-- Theme -->
    <div class="drawer-section">
      <label data-i18n="configurator.theme_label"></label>
      <div class="color-row">
        <div class="color-item">
          <span data-i18n="configurator.color_primary"></span>
          <div class="color-input-wrap">
            <input type="color" id="cp-primary" value="#0D9488">
            <input type="text" class="hex-input" id="hex-primary" value="#0D9488" maxlength="7">
          </div>
        </div>
        <div class="color-item">
          <span data-i18n="configurator.color_accent"></span>
          <div class="color-input-wrap">
            <input type="color" id="cp-accent" value="#7C3AED">
            <input type="text" class="hex-input" id="hex-accent" value="#7C3AED" maxlength="7">
          </div>
        </div>
        <div class="color-item">
          <span data-i18n="configurator.color_bg"></span>
          <div class="color-input-wrap">
            <input type="color" id="cp-bg" value="#0F1117">
            <input type="text" class="hex-input" id="hex-bg" value="#0F1117" maxlength="7">
          </div>
        </div>
        <div class="color-item">
          <span data-i18n="configurator.color_text"></span>
          <div class="color-input-wrap">
            <input type="color" id="cp-text" value="#F9FAFB">
            <input type="text" class="hex-input" id="hex-text" value="#F9FAFB" maxlength="7">
          </div>
        </div>
      </div>
      <button class="btn-auto-theme" id="btn-auto-theme" data-i18n="configurator.auto_theme"></button>
    </div>

    <!-- Fonts -->
    <div class="drawer-section">
      <label data-i18n="configurator.fonts_label"></label>
      <div class="font-row">
        <div class="font-item">
          <span data-i18n="configurator.font_heading"></span>
          <select id="sel-heading-font"></select>
        </div>
        <div class="font-item">
          <span data-i18n="configurator.font_body"></span>
          <select id="sel-body-font"></select>
        </div>
      </div>
    </div>

    <!-- Language -->
    <div class="drawer-section">
      <label data-i18n="configurator.lang_label"></label>
      <div class="lang-toggle">
        <button class="lang-btn active" data-lang="en">EN</button>
        <button class="lang-btn" data-lang="zh-TW">中文</button>
      </div>
    </div>

    <!-- Contact -->
    <div class="drawer-section">
      <label data-i18n="configurator.contact_label"></label>
      <input type="text" id="contact-name" data-i18n-placeholder="configurator.name_placeholder" placeholder="Full Name">
      <input type="email" id="contact-email" data-i18n-placeholder="configurator.email_placeholder" placeholder="Email Address">
      <input type="tel" id="contact-phone" data-i18n-placeholder="configurator.phone_placeholder" placeholder="Phone Number">
      <div id="form-errors" class="form-errors"></div>
    </div>

    <button id="btn-send" class="btn-primary btn-send" data-i18n="configurator.send"></button>
  </div>
</aside>

<div id="toast" class="toast" role="alert" aria-live="polite"></div>
```

- [ ] **Step 2: Add drawer CSS to style.css**

```css
/* ── Config Toggle Button ────────────────────────────────────────── */
#config-toggle {
  position: fixed; bottom: 2rem; right: 2rem; z-index: 500;
  background: var(--color-primary); color: #fff;
  border: none; border-radius: 2rem; padding: 0.75rem 1.4rem;
  font-size: 0.95rem; font-weight: 600; cursor: pointer;
  box-shadow: 0 4px 20px rgba(0,0,0,0.4);
  transition: transform 0.2s, opacity 0.2s;
  display: flex; align-items: center; gap: 0.4rem;
}
#config-toggle:hover { transform: translateY(-2px); opacity: 0.9; }

/* ── Backdrop ─────────────────────────────────────────────────────── */
#config-backdrop {
  display: none; position: fixed; inset: 0; z-index: 600;
  background: rgba(0,0,0,0.5);
}
#config-backdrop.open { display: block; }

/* ── Drawer ───────────────────────────────────────────────────────── */
#config-drawer {
  position: fixed; top: 0; right: 0; z-index: 700;
  width: min(420px, 95vw); height: 100vh;
  background: #131720; border-left: 1px solid rgba(255,255,255,0.1);
  display: flex; flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.35s cubic-bezier(0.4,0,0.2,1);
  overflow: hidden;
}
#config-drawer.open { transform: translateX(0); }

.drawer-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  flex-shrink: 0;
}
.drawer-header h2 { font-size: 1.1rem; margin: 0; }
#config-close {
  background: none; border: none; color: var(--color-text);
  font-size: 1.2rem; cursor: pointer; opacity: 0.6; padding: 4px;
}
#config-close:hover { opacity: 1; }

.drawer-body {
  flex: 1; overflow-y: auto; padding: 1.25rem 1.5rem;
  display: flex; flex-direction: column; gap: 1.5rem;
}
.drawer-section { display: flex; flex-direction: column; gap: 0.75rem; }
.drawer-section > label { font-weight: 600; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.6; }

/* Mode buttons */
.mode-btns { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.mode-btn {
  flex: 1; padding: 0.5rem 0.75rem; border-radius: 0.4rem;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  color: var(--color-text); cursor: pointer; font-size: 0.9rem; transition: all 0.2s;
}
.mode-btn.active, .mode-btn:hover {
  background: var(--color-primary); border-color: var(--color-primary); color: #fff;
}

/* Color pickers */
.color-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
.color-item { display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.85rem; opacity: 0.8; }
.color-input-wrap { display: flex; gap: 0.4rem; align-items: center; }
input[type="color"] { width: 36px; height: 36px; border: none; border-radius: 6px; cursor: pointer; padding: 2px; background: none; }
.hex-input {
  flex: 1; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
  color: var(--color-text); border-radius: 6px; padding: 0.4rem 0.6rem;
  font-size: 0.85rem; font-family: monospace;
}
.btn-auto-theme {
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
  color: var(--color-text); border-radius: 0.4rem; padding: 0.5rem 1rem;
  cursor: pointer; font-size: 0.85rem; transition: all 0.2s; align-self: flex-start;
}
.btn-auto-theme:hover { background: rgba(13,148,136,0.2); border-color: var(--color-primary); }

/* Font selects */
.font-row { display: flex; flex-direction: column; gap: 0.6rem; }
.font-item { display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.85rem; opacity: 0.8; }
.font-item select {
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
  color: var(--color-text); border-radius: 6px; padding: 0.5rem 0.75rem; font-size: 0.9rem;
}

/* Contact inputs */
.drawer-section input[type="text"],
.drawer-section input[type="email"],
.drawer-section input[type="tel"] {
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
  color: var(--color-text); border-radius: 6px; padding: 0.6rem 0.85rem;
  font-size: 0.95rem; width: 100%;
}
.drawer-section input:focus { outline: none; border-color: var(--color-primary); }
.form-errors { font-size: 0.82rem; color: #f87171; display: flex; flex-direction: column; gap: 0.2rem; }
.btn-send { width: 100%; justify-content: center; padding: 0.85rem; margin-top: 0.5rem; }
.btn-send:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

/* ── Toast ────────────────────────────────────────────────────────── */
.toast {
  position: fixed; bottom: 5rem; left: 50%; transform: translateX(-50%) translateY(20px);
  background: #1e2433; border: 1px solid rgba(255,255,255,0.12);
  color: var(--color-text); padding: 0.75rem 1.5rem; border-radius: 0.5rem;
  font-size: 0.9rem; opacity: 0; pointer-events: none; z-index: 800;
  transition: opacity 0.3s, transform 0.3s;
}
.toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
.toast.success { border-color: var(--color-primary); }
.toast.error { border-color: #f87171; }
```

- [ ] **Step 3: Open in browser. ⚙ Customize button should appear at bottom-right. Clicking it should slide the drawer in. No functionality yet.**

- [ ] **Step 4: Commit**
```bash
cd C:/claude/webren
git add demo/index.html demo/css/style.css
git commit -m "feat: add config drawer HTML and CSS"
```

---

## Task 9: configurator.js — all drawer logic

**Files:**
- Modify: `demo/js/configurator.js`

- [ ] **Step 1: Write configurator.js**

```javascript
// configurator.js — Config drawer: color picker, auto-theme, fonts, form, n8n POST

const N8N_WEBHOOK_URL = 'https://YOUR_N8N_WEBHOOK_URL_HERE';

const GOOGLE_FONTS = [
  'Inter', 'DM Sans', 'Plus Jakarta Sans', 'Nunito', 'Poppins',
  'Lato', 'Open Sans', 'Raleway', 'Work Sans', 'Quicksand',
  'Playfair Display', 'Lora', 'Merriweather', 'Cormorant Garamond',
  'EB Garamond', 'Libre Baskerville', 'Crimson Text', 'Source Serif 4',
  'Josefin Sans', 'Montserrat'
];

// ── Drawer open / close ───────────────────────────────────────────────────────
function initDrawer(onOpen) {
  const toggle = document.getElementById('config-toggle');
  const drawer = document.getElementById('config-drawer');
  const backdrop = document.getElementById('config-backdrop');
  const close = document.getElementById('config-close');

  const open = () => {
    drawer.classList.add('open');
    backdrop.classList.add('open');
    if (onOpen) onOpen(); // sync pickers from current config on every open
  };
  const closeDrawer = () => { drawer.classList.remove('open'); backdrop.classList.remove('open'); };

  toggle.addEventListener('click', open);
  close.addEventListener('click', closeDrawer);
  backdrop.addEventListener('click', closeDrawer);
}

// ── Color helpers (HSL math) ──────────────────────────────────────────────────
function hexToHsl(hex) {
  let r = parseInt(hex.slice(1,3),16)/255;
  let g = parseInt(hex.slice(3,5),16)/255;
  let b = parseInt(hex.slice(5,7),16)/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h, s, l = (max+min)/2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d/(2-max-min) : d/(max+min);
    switch(max) {
      case r: h = ((g-b)/d + (g<b?6:0))/6; break;
      case g: h = ((b-r)/d + 2)/6; break;
      case b: h = ((r-g)/d + 4)/6; break;
    }
  }
  return [Math.round(h*360), Math.round(s*100), Math.round(l*100)];
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1-l);
  const f = n => {
    const k = (n + h/30) % 12;
    const color = l - a * Math.max(Math.min(k-3, 9-k, 1), -1);
    return Math.round(255*color).toString(16).padStart(2,'0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function autoTheme(primaryHex) {
  const [h, s, l] = hexToHsl(primaryHex);
  const accent = hslToHex((h + 150) % 360, Math.min(s + 10, 100), Math.max(l - 5, 20));
  const bg = hslToHex(h, 10, 8);
  const [,,bgL] = hexToHsl(bg);
  const text = bgL < 40 ? '#F9FAFB' : '#111827';
  return { primary: primaryHex, accent, bg, text };
}

// ── Sync color picker ↔ hex input ─────────────────────────────────────────────
function syncColorPair(pickerId, hexId, onchange) {
  const picker = document.getElementById(pickerId);
  const hexInput = document.getElementById(hexId);

  picker.addEventListener('input', () => {
    hexInput.value = picker.value;
    onchange(picker.value);
  });
  hexInput.addEventListener('input', () => {
    const val = hexInput.value;
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      picker.value = val;
      onchange(val);
    }
  });
}

// ── Apply and persist a full theme ────────────────────────────────────────────
function applyAndSaveTheme(theme) {
  AppState.get().theme = theme;
  AppState.applyTheme(theme);
  AppState.saveConfig();
  // Sync pickers
  ['primary','accent','bg','text'].forEach(key => {
    const pick = document.getElementById(`cp-${key}`);
    const hex = document.getElementById(`hex-${key}`);
    if (pick) pick.value = theme[key];
    if (hex) hex.value = theme[key];
  });
}

function initColorPickers() {
  ['primary','accent','bg','text'].forEach(key => {
    syncColorPair(`cp-${key}`, `hex-${key}`, val => {
      AppState.get().theme[key] = val;
      AppState.applyTheme(AppState.get().theme);
      AppState.saveConfig();
    });
  });

  document.getElementById('btn-auto-theme').addEventListener('click', () => {
    const primary = document.getElementById('cp-primary').value;
    const theme = autoTheme(primary);
    applyAndSaveTheme(theme);
  });
}

// ── Font loader ───────────────────────────────────────────────────────────────
function loadGoogleFont(fontName) {
  const href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g,'+')}:wght@400;600;700&display=swap`;
  if (document.querySelector(`link[href="${href}"]`)) return; // already loaded
  const link = document.createElement('link');
  link.rel = 'stylesheet'; link.href = href;
  document.head.appendChild(link);
}

function populateFontSelects() {
  ['sel-heading-font','sel-body-font'].forEach(id => {
    const sel = document.getElementById(id);
    GOOGLE_FONTS.forEach(font => {
      const opt = document.createElement('option');
      opt.value = opt.textContent = font;
      sel.appendChild(opt);
    });
  });

  const config = AppState.get();
  document.getElementById('sel-heading-font').value = config.fonts.heading;
  document.getElementById('sel-body-font').value = config.fonts.body;
}

function initFontSelectors() {
  populateFontSelects();

  document.getElementById('sel-heading-font').addEventListener('change', e => {
    const font = e.target.value;
    loadGoogleFont(font);
    AppState.get().fonts.heading = font;
    AppState.applyFonts(AppState.get().fonts);
    AppState.saveConfig();
  });

  document.getElementById('sel-body-font').addEventListener('change', e => {
    const font = e.target.value;
    loadGoogleFont(font);
    AppState.get().fonts.body = font;
    AppState.applyFonts(AppState.get().fonts);
    AppState.saveConfig();
  });

  // Preload current fonts
  const f = AppState.get().fonts;
  loadGoogleFont(f.heading);
  loadGoogleFont(f.body);
}

// ── Mode buttons ──────────────────────────────────────────────────────────────
function initModeButtons() {
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      AppState.showMode(btn.dataset.mode);
    });
  });

  // Sync button state with current mode
  const mode = AppState.get().mode || 'company';
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
}

// ── Validation ────────────────────────────────────────────────────────────────
function validateForm() {
  const name = document.getElementById('contact-name').value.trim();
  const email = document.getElementById('contact-email').value.trim();
  const phone = document.getElementById('contact-phone').value.trim();
  const errors = [];

  if (name.length < 2) errors.push('Name must be at least 2 characters.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Please enter a valid email address.');
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length < 8) errors.push('Phone must contain at least 8 digits.');

  const errEl = document.getElementById('form-errors');
  errEl.innerHTML = errors.map(e => `<span>${e}</span>`).join('');
  return errors.length === 0;
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast show ${type}`;
  setTimeout(() => { toast.className = 'toast'; }, 3500);
}

// ── n8n POST ──────────────────────────────────────────────────────────────────
function initSendButton() {
  const btn = document.getElementById('btn-send');
  btn.addEventListener('click', async () => {
    if (!validateForm()) return;

    const config = AppState.get();
    const payload = {
      contact: {
        name: document.getElementById('contact-name').value.trim(),
        email: document.getElementById('contact-email').value.trim(),
        phone: document.getElementById('contact-phone').value.trim()
      },
      config: {
        mode: config.mode,
        theme: config.theme,
        fonts: config.fonts,
        viewCounter: config.viewCounter
      }
    };

    btn.disabled = true;
    btn.dataset.i18n && (btn.textContent = I18N.t('configurator.sending'));

    try {
      const res = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast(I18N.t('configurator.success'), 'success');
    } catch(e) {
      showToast(I18N.t('configurator.error'), 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = I18N.t('configurator.send');
    }
  });
}

// ── Sync pickers from current config (called when drawer opens) ───────────────
function syncPickersFromConfig() {
  const theme = AppState.get().theme;
  ['primary','accent','bg','text'].forEach(key => {
    const pick = document.getElementById(`cp-${key}`);
    const hex = document.getElementById(`hex-${key}`);
    if (pick && theme[key]) pick.value = theme[key];
    if (hex && theme[key]) hex.value = theme[key];
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────
// app.js loads before configurator.js (script order: i18n → app → configurator)
// so AppState is defined by the time this DOMContentLoaded fires.
document.addEventListener('DOMContentLoaded', () => {
  initDrawer(syncPickersFromConfig); // pass sync fn to call on open
  initColorPickers();
  initFontSelectors();
  initModeButtons();
  initSendButton();
});
```

- [ ] **Step 2: Open in browser. Test the drawer:**
  - Click ⚙ Customize
  - Change primary color — verify page updates in real time
  - Click Auto Theme — verify accent/bg/text update automatically
  - Change heading font — verify font changes on headings
  - Switch mode via buttons in drawer — verify page switches with transition
  - Fill in contact form with invalid data and click Send — verify error messages

- [ ] **Step 3: Reload page — verify mode, colors, and fonts are restored from localStorage**

- [ ] **Step 4: Commit**
```bash
cd C:/claude/webren
git add demo/js/configurator.js
git commit -m "feat: add configurator.js with color picker, auto-theme, fonts, form validation, n8n POST"
```

---

## Task 10: SEO, meta tags, sitemap, robots, security.txt

**Files:**
- Modify: `demo/index.html` (add full `<head>` meta tags)
- Create: `demo/sitemap.xml`
- Create: `demo/robots.txt`
- Create: `demo/.well-known/security.txt`

- [ ] **Step 1: Replace `<head>` in index.html with full SEO head**

```html
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- Primary Meta -->
  <title>Webren Demo — Website Configurator | Web人</title>
  <meta name="description" content="Preview and customize your Option A website by Web人. Choose your business type, colors, and fonts, then send your preferences directly.">
  <meta name="keywords" content="web design demo, website configurator, webren, Web人, business website preview">
  <meta name="author" content="Web人">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://rayantion26.github.io/webren/demo/">

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://rayantion26.github.io/webren/demo/">
  <meta property="og:title" content="Webren Demo — Website Configurator">
  <meta property="og:description" content="Preview and customize your Option A website. Configure colors, fonts, and business type, then send to Web人.">
  <meta property="og:image" content="https://rayantion26.github.io/webren/demo/assets/images/og-image.jpg">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Webren Demo — Website Configurator">
  <meta name="twitter:description" content="Preview and configure your Option A website by Web人.">

  <!-- Hreflang -->
  <link rel="alternate" hreflang="en" href="https://rayantion26.github.io/webren/demo/">
  <link rel="alternate" hreflang="zh-TW" href="https://rayantion26.github.io/webren/demo/?lang=zh-TW">
  <link rel="alternate" hreflang="x-default" href="https://rayantion26.github.io/webren/demo/">

  <!-- Schema.org JSON-LD -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Webren Website Configurator",
    "url": "https://rayantion26.github.io/webren/demo/",
    "description": "Interactive website configurator and demo for Web人 Option A clients",
    "applicationCategory": "WebApplication",
    "operatingSystem": "Any",
    "inLanguage": ["en", "zh-TW"],
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "TWD" },
    "author": { "@type": "Organization", "name": "Web人", "url": "https://rayantion26.github.io/webren/" }
  }
  </script>

  <!-- Fonts (default) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="css/style.css">
</head>
```

- [ ] **Step 2: Create sitemap.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://rayantion26.github.io/webren/demo/</loc>
    <xhtml:link rel="alternate" hreflang="en" href="https://rayantion26.github.io/webren/demo/"/>
    <xhtml:link rel="alternate" hreflang="zh-TW" href="https://rayantion26.github.io/webren/demo/?lang=zh-TW"/>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

- [ ] **Step 3: Create robots.txt**

```
User-agent: *
Allow: /
Sitemap: https://rayantion26.github.io/webren/demo/sitemap.xml
```

- [ ] **Step 4: Create .well-known/security.txt**

```
Contact: mailto:security@webren.dev
Preferred-Languages: en, zh-TW
Canonical: https://rayantion26.github.io/webren/demo/.well-known/security.txt
```

- [ ] **Step 5: Commit**
```bash
cd C:/claude/webren
git add demo/index.html demo/sitemap.xml demo/robots.txt demo/.well-known/security.txt
git commit -m "feat: add full SEO meta tags, sitemap, robots.txt, security.txt"
```

---

## Task 11: Performance pass and mobile testing

**Files:**
- Review: `demo/index.html`, `demo/css/style.css`, `demo/js/app.js`, `demo/js/configurator.js`

- [ ] **Step 1: Verify script loading — all JS files use `defer`**

Check `<script>` tags in index.html. All should have `defer`. Fix any that don't.

- [ ] **Step 2: Add `font-display: swap` to any @font-face or Google Fonts URL params**

Google Fonts CDN URLs already include `display=swap` — verify the `<link>` hrefs include `&display=swap`.

- [ ] **Step 3: Add `width` and `height` to any `<img>` tags**

Check for `<img>` tags and ensure they have explicit `width` and `height` attributes to prevent layout shifts.

- [ ] **Step 4: Mobile test at 375px**

Open browser DevTools → set device to iPhone SE (375px wide). Verify:
- Nav collapses to hamburger
- Hero text is readable
- Cards stack vertically
- Config drawer takes up full width on small screens
- ⚙ Customize button is visible and clickable

- [ ] **Step 5: Mobile test at 768px (tablet)**

- Cards should show 2 columns
- Drawer should be narrower than full screen

- [ ] **Step 6: Test at 1280px**

- 3-column card grid
- Drawer is 420px wide
- Hero fills viewport nicely

- [ ] **Step 7: Test language switch**

- Switch to 中文 — all text should change
- Refresh — should stay in 中文
- Switch back to EN — should work

- [ ] **Step 8: Test all 3 modes**

Switch Company → Restaurant → Store. Verify each shows correct sections and content in both languages.

- [ ] **Step 9: Commit**
```bash
cd C:/claude/webren
git add demo/
git commit -m "fix: performance pass — defer scripts, mobile responsive, font display swap"
```

---

## Task 12: Final commit and push

- [ ] **Step 1: Final visual check — open index.html in browser, check all 3 modes in both languages**

- [ ] **Step 2: Check browser console — zero errors**

- [ ] **Step 3: Final commit and push**
```bash
cd C:/claude/webren
git add demo/
git status
git commit -m "feat: webren-demo - initial release"
git push origin main
```

- [ ] **Step 4: Verify GitHub Pages is enabled**
```bash
gh api repos/Rayantion26/webren/pages 2>&1
```
If not enabled:
```bash
gh api repos/Rayantion26/webren/pages --method POST -f source='{"branch":"main","path":"/"}' 2>&1
```

- [ ] **Step 5: Report back to Aaron**

Send via Telegram:
- What was built
- Live URL: `https://rayantion26.github.io/webren/demo/`
- File locations: `C:/claude/webren/demo/`
- n8n webhook URL is a placeholder — share the real URL when ready
- Cloudflare KV Worker counter endpoint TBD — will wire up when URL is shared
