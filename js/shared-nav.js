// shared-nav.js — Injects the main Web人 nav + footer into any page.
// Matches the headpage style exactly. Pages listen for 'nav:lang' event
// to handle language switching in their own way.

(function () {
  // ── Detect base path (depth from webren root) ────────────────────────
  const path = window.location.pathname;
  // e.g. /webren/ → depth 0, /webren/pricing/ → depth 1
  const isDemo    = path.includes('/demo/');
  const isPricing = path.includes('/pricing/');
  const base = (isDemo || isPricing) ? '../' : './';

  // ── Current lang (used to set active button) ─────────────────────────
  const savedLang = localStorage.getItem('webren_lang') ||
    (new URLSearchParams(location.search).get('lang')) || 'en';

  // ── Nav HTML ─────────────────────────────────────────────────────────
  const navHTML = `
<nav id="shared-nav">
  <div class="nav-inner">
    <a href="${base}" class="nav-logo">
      <div class="logo-dot"></div>
      Web<span>人</span>
    </a>
    <ul class="nav-links">
      <li><a href="${base}"${!isPricing && !isDemo ? ' class="active"' : ''}>Home</a></li>
      <li><a href="${base}pricing/"${isPricing ? ' class="active"' : ''}>Pricing</a></li>
      <li><a href="${base}#portfolio">Portfolio</a></li>
      <li><a href="${base}#services">Services</a></li>
      <li><a href="${base}#features">Features</a></li>
      <li><a href="${base}#contact">Contact</a></li>
      <li><a href="${base}demo/"${isDemo ? ' class="active"' : ''}>Demo</a></li>
    </ul>
    <div class="nav-right">
      <div class="lang-toggle">
        <button class="lang-btn${savedLang === 'en' ? ' active' : ''}" data-lang="en">EN</button>
        <button class="lang-btn${savedLang !== 'en' ? ' active' : ''}" data-lang="zh-TW">中文</button>
      </div>
      <a href="https://wa.me/6285183005811" class="btn-cta-sm" target="_blank" rel="noopener noreferrer">
        WhatsApp ↗
      </a>
      <button id="shared-menu-toggle" aria-label="Open menu" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
</nav>
<div id="nav-spacer"></div>`;

  // ── Mobile menu HTML ─────────────────────────────────────────────────
  const mobileMenuHTML = `
<nav id="shared-mobile-menu" aria-label="Mobile navigation">
  <a href="${base}"${!isPricing && !isDemo ? ' class="active"' : ''}>Home</a>
  <a href="${base}pricing/"${isPricing ? ' class="active"' : ''}>Pricing</a>
  <a href="${base}#portfolio">Portfolio</a>
  <a href="${base}#services">Services</a>
  <a href="${base}#features">Features</a>
  <a href="${base}#contact">Contact</a>
  <a href="${base}demo/"${isDemo ? ' class="active"' : ''}>Demo</a>
  <div class="mobile-menu-lang">
    <button class="lang-btn${savedLang === 'en' ? ' active' : ''}" data-lang="en">EN</button>
    <button class="lang-btn${savedLang !== 'en' ? ' active' : ''}" data-lang="zh-TW">中文</button>
  </div>
</nav>
<div id="shared-menu-overlay"></div>`;

  // ── Footer HTML ──────────────────────────────────────────────────────
  const footerHTML = `
<footer id="shared-footer">
  <div class="footer-inner">
    <a href="${base}" class="footer-logo">Web<span>人</span></a>
    <span class="footer-tagline">Built with clean code &amp; attention to detail.</span>
    <span class="footer-copy">&copy; 2025 Webren. All rights reserved.</span>
  </div>
</footer>`;

  // ── Inject into page ────────────────────────────────────────────────
  document.body.insertAdjacentHTML('afterbegin', navHTML + mobileMenuHTML);
  document.body.insertAdjacentHTML('beforeend', footerHTML);

  // ── Mobile menu logic ────────────────────────────────────────────────
  const toggle  = document.getElementById('shared-menu-toggle');
  const menu    = document.getElementById('shared-mobile-menu');
  const overlay = document.getElementById('shared-menu-overlay');

  function openMenu() {
    menu.classList.add('open');
    overlay.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
  }
  function closeMenu() {
    menu.classList.remove('open');
    overlay.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }

  toggle.addEventListener('click', function () {
    menu.classList.contains('open') ? closeMenu() : openMenu();
  });
  overlay.addEventListener('click', closeMenu);

  // Close when a mobile link is clicked
  menu.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', closeMenu);
  });

  // Swipe left from right edge to open, swipe right to close
  var touchStartX = 0;
  var touchStartFromEdge = false;
  document.addEventListener('touchstart', function (e) {
    touchStartX = e.touches[0].clientX;
    // Only allow open-swipe if finger starts within 30px of right edge
    touchStartFromEdge = touchStartX > window.innerWidth - 30;
  }, { passive: true });
  document.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].clientX - touchStartX;
    if (dx < -50 && touchStartFromEdge && !menu.classList.contains('open')) openMenu();
    if (dx >  50 &&  menu.classList.contains('open')) closeMenu();
  }, { passive: true });

  // ── Scroll behavior (hide on down, show on up) ───────────────────────
  var nav = document.getElementById('shared-nav');
  var lastY = 0;
  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    nav.classList.toggle('scrolled', y > 40);
    nav.classList.toggle('hidden-nav', y > lastY + 5 && y > 200);
    nav.classList.toggle('visible-nav', y < lastY - 5);
    lastY = y;
  }, { passive: true });

  // ── Language buttons — dispatch event for page to handle ─────────────
  function setActiveLang(lang) {
    document.querySelectorAll('#shared-nav .lang-btn, #shared-mobile-menu .lang-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    localStorage.setItem('webren_lang', lang);
  }

  document.querySelectorAll('#shared-nav .lang-btn, #shared-mobile-menu .lang-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (btn.classList.contains('active')) return;
      var lang = btn.dataset.lang;
      setActiveLang(lang);
      document.dispatchEvent(new CustomEvent('nav:lang', { detail: lang }));
      closeMenu();
    });
  });
}());
