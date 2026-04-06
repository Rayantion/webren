// shared-nav.js — Injects the main Web人 nav + footer into any page.
// Matches the headpage style exactly. Pages listen for 'nav:lang' event
// to handle language switching in their own way.

(function () {
  // ── Detect base path (depth from webren root) ────────────────────────
  const path = window.location.pathname;
  // e.g. /webren/ → depth 0, /webren/pricing/ → depth 1
  const isDemo    = path.includes('/demo/');
  const isPricing = path.includes('/pricing/');
  const isJoin    = path.includes('/join/');
  const isPrivacy = path.includes('/privacy/');
  const base = (isDemo || isPricing || isJoin || isPrivacy) ? '../' : './';

  // ── Current lang (used to set active button) ─────────────────────────
  const savedLang = localStorage.getItem('webren_lang') ||
    (new URLSearchParams(location.search).get('lang')) || 'en';

  // ── Nav link translations ─────────────────────────────────────────────
  const NAV_TEXT = {
    en:      { home: 'Home', pricing: 'Pricing', features: 'Features', contact: 'Contact', demo: 'Demo', join: 'Join Us', portal: 'Portal', tagline: 'Built with clean code & attention to detail.', privacy: 'Privacy Policy', copyright: '\u00a9 ' + new Date().getFullYear() + ' Webren. All rights reserved.' },
    'zh-TW': { home: '\u9996\u9801', pricing: '\u50f9\u683c\u65b9\u6848', features: '\u529f\u80fd\u7279\u8272', contact: '\u806f\u7d61\u6211\u5011', demo: '\u793a\u7bc4', join: '\u52a0\u5165\u6211\u5011', portal: '\u4ee3\u7406\u5f8c\u53f0', tagline: '\u4ee5\u7cbe\u7c21\u7a0b\u5f0f\u78bc\u8207\u7d30\u7bc0\u6253\u9020\u3002', privacy: '\u96b1\u79c1\u653f\u7b56', copyright: '\u00a9 ' + new Date().getFullYear() + ' Web\u4eba\u3002\u4fdd\u7559\u6240\u6709\u6b0a\u5229\u3002' }
  };

  // ── Nav HTML ─────────────────────────────────────────────────────────
  const navHTML = `
<nav id="shared-nav">
  <div class="nav-inner">
    <a href="${base}" class="nav-logo">
      <div class="logo-dot"></div>
      Web<span>人</span>
    </a>
    <ul class="nav-links">
      <li><a href="${base}"${!isPricing && !isDemo && !isJoin && !isPrivacy ? ' class="active"' : ''} data-nav-key="home">Home</a></li>
      <li><a href="${base}pricing/"${isPricing ? ' class="active"' : ''} data-nav-key="pricing">Pricing</a></li>
      <li><a href="${base}#features" data-nav-key="features">Features</a></li>
      <li><a href="${base}#contact" data-nav-key="contact">Contact</a></li>
      <li><a href="${base}demo/"${isDemo ? ' class="active"' : ''} data-nav-key="demo">Demo</a></li>
      <li><a href="${base}join/"${isJoin ? ' class="active"' : ''} data-nav-key="join">Join Us</a></li>
      ${!isDemo ? `<li><a href="${base}portal/" class="nav-portal-link" data-nav-key="portal">Portal</a></li>` : ''}
    </ul>
    <div class="nav-right">
      <div class="lang-toggle">
        <button class="lang-btn${savedLang === 'en' ? ' active' : ''}" data-lang="en" aria-label="Switch to English">EN</button>
        <button class="lang-btn${savedLang !== 'en' ? ' active' : ''}" data-lang="zh-TW" aria-label="Switch to Traditional Chinese">中文</button>
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
  <a href="${base}"${!isPricing && !isDemo && !isJoin && !isPrivacy ? ' class="active"' : ''} data-nav-key="home">Home</a>
  <a href="${base}pricing/"${isPricing ? ' class="active"' : ''} data-nav-key="pricing">Pricing</a>
  <a href="${base}#features" data-nav-key="features">Features</a>
  <a href="${base}#contact" data-nav-key="contact">Contact</a>
  <a href="${base}demo/"${isDemo ? ' class="active"' : ''} data-nav-key="demo">Demo</a>
  <a href="${base}join/"${isJoin ? ' class="active"' : ''} data-nav-key="join">Join Us</a>
  ${!isDemo ? `<a href="${base}portal/" data-nav-key="portal">Portal</a>` : ''}
  <div class="mobile-menu-lang">
    <button class="lang-btn${savedLang === 'en' ? ' active' : ''}" data-lang="en" aria-label="Switch to English">EN</button>
    <button class="lang-btn${savedLang !== 'en' ? ' active' : ''}" data-lang="zh-TW" aria-label="Switch to Traditional Chinese">中文</button>
  </div>
</nav>
<div id="shared-menu-overlay"></div>`;

  // ── Footer HTML ──────────────────────────────────────────────────────
  const footerHTML = `
<footer id="shared-footer">
  <div class="footer-inner">
    <a href="${base}" class="footer-logo">Web<span>人</span></a>
    <span class="footer-tagline" data-nav-key="tagline">Built with clean code &amp; attention to detail.</span>
    <div class="footer-links">
      <a href="${base}privacy/" data-nav-key="privacy">Privacy Policy</a>
    </div>
    <span class="footer-copy" data-nav-key="copyright">&copy; 2025 Webren. All rights reserved.</span>
  </div>
</footer>`;

  // ── Inject into page ────────────────────────────────────────────────
  document.body.insertAdjacentHTML('afterbegin', navHTML + mobileMenuHTML);
  document.body.insertAdjacentHTML('beforeend', footerHTML);

  // ── Apply nav text translations ──────────────────────────────────────
  function updateNavText(lang) {
    var t = NAV_TEXT[lang] || NAV_TEXT['en'];
    document.querySelectorAll('[data-nav-key]').forEach(function (el) {
      var key = el.getAttribute('data-nav-key');
      if (t[key] !== undefined) el.textContent = t[key];
    });
  }
  updateNavText(savedLang);

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

  // ── Scroll behavior (hide on down, show on up or stop) ──────────────
  var nav = document.getElementById('shared-nav');
  var lastY = 0;
  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    nav.classList.toggle('scrolled', y > 40);
    if (y > lastY + 2 && y > 120) {
      nav.classList.add('hidden-nav');
      nav.classList.remove('visible-nav');
    } else if (y < lastY - 2) {
      nav.classList.remove('hidden-nav');
      nav.classList.add('visible-nav');
    }
    // tiny movement → keep current state (prevents decel twitch)
    lastY = y;
  }, { passive: true });
  window.addEventListener('scrollend', function () {
    if (isDemo) {
      nav.classList.remove('visible-nav'); // undo any brief show from decel twitch
      return;
    }
    nav.classList.remove('hidden-nav');
    nav.classList.add('visible-nav');
  }, { passive: true });

  // ── Page transition on nav link clicks ───────────────────────────────
  document.querySelectorAll('#shared-nav .nav-links a, #shared-mobile-menu a').forEach(function (link) {
    try {
      var url = new URL(link.href, window.location.href);
      if (url.hostname !== window.location.hostname) return; // external
      if (url.pathname === window.location.pathname) return; // same page
    } catch (e) { return; }
    link.addEventListener('click', function (e) {
      var pt = document.getElementById('page-transition');
      if (!pt) return;
      e.preventDefault();
      closeMenu();
      pt.classList.add('active');
      var dest = link.href;
      setTimeout(function () { window.location.href = dest; }, 400);
    });
  });

  // ── Entry curtain animation (retract overlay on page load) ───────────
  document.addEventListener('DOMContentLoaded', function () {
    var pt = document.getElementById('page-transition');
    if (!pt) return;
    // Ensure overlay is fully opaque before fading out
    pt.style.transition = 'none';
    pt.classList.add('active');
    void pt.offsetHeight; // force reflow — ensures opacity:1 is painted before transition starts
    pt.style.transition = '';
    pt.classList.remove('active');
  });

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
      closeMenu();
      document.dispatchEvent(new CustomEvent('nav:lang', { detail: btn.dataset.lang }));
    });
  });

  // Keep nav text + active state in sync whenever any part of the page switches language
  document.addEventListener('nav:lang', function (e) {
    setActiveLang(e.detail);
    updateNavText(e.detail);
  });
}());
