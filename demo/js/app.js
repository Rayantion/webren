// app.js — Mode switching, transitions, view counter, scroll reveal, init

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

// ── Page transition (async-aware: fill in → callback → fade out) ──────────────
async function runTransition(callback) {
  if (isTransitioning) return;
  isTransitioning = true;
  const overlay = document.getElementById('page-transition');
  overlay.classList.add('active');
  await new Promise(r => setTimeout(r, 400)); // wait for overlay to fully cover
  await callback();                            // swap content while covered
  overlay.classList.remove('active');
  await new Promise(r => setTimeout(r, 400)); // wait for overlay to clear
  isTransitioning = false;
}

// ── Show mode ─────────────────────────────────────────────────────────────────
function showMode(mode, withTransition = true) {
  if (isTransitioning) return;

  const doSwitch = () => {
    document.querySelectorAll('.mode-sections').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(`mode-${mode}`);
    if (target) target.classList.add('active');
    currentConfig.mode = mode;
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(currentConfig));
    window.scrollTo({ top: 0, behavior: 'auto' });
    // Reset all reveal elements in the newly shown mode so they animate in
    target && target.querySelectorAll('.reveal').forEach(el => {
      el.classList.remove('revealed');
      el.style.transitionDelay = '';
    });
    initScrollReveal();
  };

  if (withTransition) {
    runTransition(doSwitch);
  } else {
    doSwitch();
  }
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
  // initScrollReveal() is called inside showMode()
});

// ── Expose for configurator.js ────────────────────────────────────────────────
window.AppState = {
  get: () => currentConfig,
  showMode,
  applyTheme,
  applyFonts,
  runTransition,
  saveConfig: () => localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(currentConfig))
};
