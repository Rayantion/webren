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
