// i18n.js — Internationalization with i18next
// Loads locale JSON files and handles language switching

const I18N = (() => {
  let currentLang = 'en';
  const supportedLangs = ['en', 'zh-TW'];
  const cache = {};

  async function loadLocale(lang) {
    if (cache[lang]) return cache[lang];
    const res = await fetch(`./locales/${lang}.json`);
    const data = await res.json();
    cache[lang] = data;
    return data;
  }

  function getNestedValue(obj, keyPath) {
    return keyPath.split('.').reduce((acc, key) => acc && acc[key], obj);
  }

  function applyTranslations(data) {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = getNestedValue(data, key);
      if (val !== undefined) el.textContent = val;
    });

    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      const val = getNestedValue(data, key);
      if (val !== undefined) el.innerHTML = val;
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const val = getNestedValue(data, key);
      if (val !== undefined) el.placeholder = val;
    });

    document.documentElement.lang = currentLang;
  }

  async function switchLanguage(lang, animate = true) {
    if (!supportedLangs.includes(lang)) return;

    const overlay = animate ? document.getElementById('lang-overlay') : null;

    if (overlay) {
      overlay.classList.add('active');
      await new Promise(r => setTimeout(r, 420)); // wait for scaleY wipe (0.4s) to fully cover
    }

    currentLang = lang;
    const data = await loadLocale(lang);
    applyTranslations(data);
    localStorage.setItem('webren_lang', lang);

    // Update toggle buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    // Update font class for CJK
    document.body.classList.toggle('lang-zh', lang === 'zh-TW');

    if (overlay) {
      setTimeout(() => overlay.classList.remove('active'), 50); // trigger slide-back-up
    }
  }

  function detectLang() {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz && tz.includes('Taipei') ? 'zh-TW' : 'en';
  }

  async function init() {
    const saved = localStorage.getItem('webren_lang');
    const preferred = saved || detectLang();
    await switchLanguage(preferred, false); // no animation on initial load
  }

  return { init, switchLanguage, getCurrentLang: () => currentLang };
})();
