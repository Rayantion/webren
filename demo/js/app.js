// app.js — Mode switching, transitions, view counter, scroll reveal, Three.js, init

const STORAGE_KEY_CONFIG = 'webren_demo_v2';
let isTransitioning = false;
let currentConfig = {
  mode: 'company',
  theme: { primary: '#0D9488', accent: '#7C3AED', bg: '#FAFAFA', text: '#111827' },
  fonts: { heading: 'Playfair Display', body: 'Inter' },
  bgStyle: 'particles',
  viewCounter: true
};

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
      theme: { primary: '#0D9488', accent: '#7C3AED', bg: '#FAFAFA', text: '#111827' },
      fonts: { heading: 'Playfair Display', body: 'Inter' },
      viewCounter: true
    };
  }
}

// ── Hex helpers ───────────────────────────────────────────────────────────────
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return { r, g, b, str: `${r},${g},${b}` };
}

// ── Apply theme ───────────────────────────────────────────────────────────────
function getLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const toLinear = c => { const v = c / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function applyTheme(theme) {
  const root = document.documentElement;
  root.style.setProperty('--color-primary', theme.primary);
  root.style.setProperty('--color-accent', theme.accent);
  root.style.setProperty('--color-bg', theme.bg);
  root.style.setProperty('--color-text', theme.text);

  // Derive surface/border/muted from text color so they work on any bg
  const t = hexToRgb(theme.text);
  const b = hexToRgb(theme.bg);
  root.style.setProperty('--color-surface',    `rgba(${t.str},0.05)`);
  root.style.setProperty('--color-border',     `rgba(${t.str},0.10)`);
  root.style.setProperty('--color-text-muted', `rgba(${t.str},0.60)`);
  root.style.setProperty('--color-nav-bg',     `rgba(${b.str},0.90)`);

  // Auto-contrast: dark text on bright primary, white text on dark primary
  const onPrimary = getLuminance(theme.primary) > 0.179 ? '#111827' : '#ffffff';
  root.style.setProperty('--color-on-primary', onPrimary);

  if (window._threeUpdate) window._threeUpdate(theme.primary);
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
  await new Promise(r => setTimeout(r, 400));
  await callback();
  overlay.classList.remove('active');
  await new Promise(r => setTimeout(r, 400));
  isTransitioning = false;
}

// ── Show mode ─────────────────────────────────────────────────────────────────
function showMode(mode, withTransition = true) {
  if (isTransitioning) return;

  // Already on this mode — close any sub-page and scroll to top without animating
  if (withTransition && mode === (currentConfig.mode || 'company')) {
    closeSubPage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  closeSubPage();
  document.querySelectorAll('.mode-sections').forEach(el => el.classList.remove('active', 'dropping-in'));
  const target = document.getElementById(`mode-${mode}`);
  if (target) {
    target.classList.add('active');
    if (withTransition) {
      // Dropdown slide-in animation — only inside the demo preview, no full-page overlay
      requestAnimationFrame(() => {
        target.classList.add('dropping-in');
        target.addEventListener('animationend', () => target.classList.remove('dropping-in'), { once: true });
      });
    }
  }
  currentConfig.mode = mode;
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(currentConfig));
  window.scrollTo({ top: 0, behavior: 'auto' });
  target && target.querySelectorAll('.reveal').forEach(el => {
    el.classList.remove('revealed');
    el.style.transitionDelay = '';
  });
  // Update inner demo nav middle link for current mode (desktop + mobile)
  if (window.i18next) {
    const linkKey = { company: 'nav.services', restaurant: 'nav.menu', store: 'nav.products' }[mode] || 'nav.services';
    const subpageMap = { restaurant: 'restaurant-menu-page', store: 'store-products-page' };
    ['demo-nav-services', 'demo-mobile-services'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.dataset.i18n = linkKey;
      el.textContent = window.i18next.t(linkKey);
      if (subpageMap[mode]) {
        el.href = '#';
        el.dataset.showSubpage = subpageMap[mode];
      } else {
        el.href = '#services';
        delete el.dataset.showSubpage;
      }
    });
  }
  // Update nav links to point to mode-prefixed section IDs
  document.querySelectorAll('[data-section]').forEach(el => {
    el.href = `#${mode}-${el.dataset.section}`;
  });
  initScrollReveal();
  if (window._updateModeSwitcher) window._updateModeSwitcher(mode);
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
  // Also respond to nav:lang event dispatched by shared-nav.js outer nav
  document.addEventListener('nav:lang', e => {
    runTransition(async () => { await I18N.switchLanguage(e.detail); });
  });
}

// ── Contact forms ─────────────────────────────────────────────────────────────
function initContactForms() {
  const t = key => window.i18next ? window.i18next.t(key) : '';

  function setFieldError(field, msg) {
    field.classList.add('cf-error');
    let err = field.parentElement.querySelector('.cf-error-msg');
    if (!err) {
      err = document.createElement('span');
      err.className = 'cf-error-msg';
      field.parentElement.appendChild(err);
    }
    err.textContent = msg;
  }

  function clearFieldError(field) {
    field.classList.remove('cf-error');
    const err = field.parentElement.querySelector('.cf-error-msg');
    if (err) err.textContent = '';
  }

  document.querySelectorAll('.demo-contact-form').forEach(form => {
    // Wire i18n placeholders
    form.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      if (window.i18next) el.placeholder = window.i18next.t(el.dataset.i18nPlaceholder);
    });

    // Clear error on input
    form.querySelectorAll('input, textarea').forEach(field => {
      field.addEventListener('input', () => clearFieldError(field));
    });

    form.addEventListener('submit', e => {
      e.preventDefault();
      const btn = form.querySelector('.cf-submit');
      const nameField  = form.querySelector('[name="name"]');
      const emailField = form.querySelector('[name="email"]');
      const msgField   = form.querySelector('[name="message"]');

      let valid = true;
      const required = t('contact.error_required') || 'This field is required.';
      const invalidEmail = t('contact.error_email') || 'Please enter a valid email address.';

      if (!nameField.value.trim())  { setFieldError(nameField, required);      valid = false; }
      if (!emailField.value.trim()) { setFieldError(emailField, required);     valid = false; }
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField.value.trim())) {
        setFieldError(emailField, invalidEmail); valid = false;
      }
      if (!msgField.value.trim())   { setFieldError(msgField, required);       valid = false; }
      if (!valid) return;

      // Demo: show inline success state
      btn.disabled = true;
      btn.textContent = t('configurator.sending') || 'Sending...';
      setTimeout(() => {
        form.reset();
        form.querySelectorAll('input, textarea').forEach(f => clearFieldError(f));
        btn.disabled = false;
        btn.textContent = t('contact.submit') || 'Send Message';
        const toast = document.getElementById('toast');
        if (toast) {
          toast.textContent = t('contact.success') || "Message sent! We'll be in touch soon.";
          toast.classList.add('show');
          setTimeout(() => toast.classList.remove('show'), 4000);
        }
      }, 900);
    });
  });
}

// ── Hero CTA buttons ──────────────────────────────────────────────────────────
function initHeroCTAs() {
  const preview = document.getElementById('demo-preview');
  if (!preview) return;
  preview.addEventListener('click', e => {
    const hero = e.target.closest('.hero');
    if (!hero) return;
    const mode = currentConfig.mode || 'company';
    // Primary button → scroll to contact
    if (e.target.closest('.hero-actions .btn-primary')) {
      e.preventDefault();
      const modeEl = document.getElementById(`mode-${mode}`);
      const contact = modeEl && modeEl.querySelector('#' + mode + '-contact');
      if (contact) contact.scrollIntoView({ behavior: 'smooth' });
    }
    // Secondary button → scroll to services/menu/products
    if (e.target.closest('.hero-actions .btn-secondary')) {
      e.preventDefault();
      const modeEl = document.getElementById(`mode-${mode}`);
      const targetId = { company: 'services', restaurant: 'menu', store: 'products' }[mode] || 'services';
      const section = modeEl && modeEl.querySelector(`#${targetId}`);
      if (section) section.scrollIntoView({ behavior: 'smooth' });
    }
  });
}

// ── Featured menu (restaurant main page) ─────────────────────────────────────
function renderFeaturedMenu() {
  const grid = document.getElementById('featured-menu-grid');
  if (!grid) return;
  const lang = getCurrentLang();
  // Pick 2 from each category as a representative sample of the actual menu data
  const selection = ['main', 'dessert', 'sides'].flatMap(cat =>
    RESTAURANT_MENU.filter(i => i.category === cat).slice(0, 2)
  );
  grid.innerHTML = selection.map(item => {
    const primary   = lang === 'zh' ? item.nameZh : item.name;
    const secondary = lang === 'zh' ? item.name   : item.nameZh;
    return `
      <div class="menu-item card reveal" data-category="${item.category}">
        <div class="menu-item-info">
          <h3>${primary}<span class="item-name-en"> ${secondary}</span></h3>
          <p>${item.desc}</p>
        </div>
        <span class="menu-price">NT$${item.price}</span>
      </div>`;
  }).join('');
  initScrollReveal();
}

// ── Menu category tabs ────────────────────────────────────────────────────────
function initMenuTabs() {
  document.querySelectorAll('.menu-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.menu-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const cat = tab.dataset.category;
      const items = Array.from(document.querySelectorAll('.menu-item'));
      // Phase 1: fade out items that will hide
      items.forEach(item => {
        const willShow = cat === 'all' || item.dataset.category === cat;
        if (!item.classList.contains('hidden') && !willShow) {
          item.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
          item.style.opacity = '0';
          item.style.transform = 'translateY(6px)';
          setTimeout(() => {
            item.classList.add('hidden');
            item.style.transition = '';
            item.style.opacity = '';
            item.style.transform = '';
          }, 190);
        }
      });
      // Phase 2: after fade-out completes, reveal items with stagger
      setTimeout(() => {
        let idx = 0;
        items.forEach(item => {
          const willShow = cat === 'all' || item.dataset.category === cat;
          if (willShow) {
            item.classList.remove('hidden');
            item.style.transition = 'none';
            item.style.opacity = '0';
            item.style.transform = 'translateY(8px)';
            const delay = idx * 45;
            idx++;
            setTimeout(() => {
              item.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
              item.style.opacity = '1';
              item.style.transform = '';
            }, delay);
          }
        });
      }, 200);
    });
  });
}

// ── Hero Background Engine (Canvas 2D, 5 styles) ─────────────────────────────
class HeroBg {
  constructor(canvas, color, style) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');
    this.color  = color || '#0D9488';
    this.style  = style || 'particles';
    this._raf   = null;
    this._t     = 0;
    this._state = null;
    this._w     = 0;
    this._h     = 0;
    this._ro = new ResizeObserver(() => this._resize());
    this._ro.observe(canvas.parentElement || canvas);
    this._resize();
    this._mx = -9999; this._my = -9999;
    this._isTouching = false;
    this._burstPts = [];
    this._bindMouse();
  }

  _resize() {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    if (w === this._w && h === this._h) return;
    this._w = w; this._h = h;
    this.canvas.width  = w;
    this.canvas.height = h;
    this._initState();
  }

  _initState() {
    const w = this._w, h = this._h;
    if (this.style === 'particles') {
      this._state = {
        pts: Array.from({ length: 70 }, () => ({
          x:  Math.random() * w,
          y:  Math.random() * h,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.3,
        }))
      };
    } else if (this.style === 'blobs') {
      this._state = {
        blobs: Array.from({ length: 5 }, () => ({
          x:     Math.random() * w,
          y:     Math.random() * h,
          r:     80 + Math.random() * 120,
          vx:    (Math.random() - 0.5) * 0.25,
          vy:    (Math.random() - 0.5) * 0.18,
          phase: Math.random() * Math.PI * 2,
        }))
      };
    } else if (this.style === 'stars') {
      this._state = {
        pts: Array.from({ length: 150 }, () => ({
          x:     Math.random() * w,
          y:     Math.random() * h,
          vx:    (Math.random() - 0.5) * 0.12,
          vy:    (Math.random() - 0.5) * 0.08,
          phase: Math.random() * Math.PI * 2,
          size:  0.5 + Math.random() * 1.2,
        }))
      };
    } else if (this.style === 'geometric') {
      this._state = {
        shapes: Array.from({ length: 10 }, () => ({
          x:        Math.random() * w,
          y:        Math.random() * h,
          vx:       (Math.random() - 0.5) * 0.2,
          vy:       (Math.random() - 0.5) * 0.15,
          rot:      Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.008,
          sides:    [3, 4, 5, 6][Math.floor(Math.random() * 4)],
          size:     20 + Math.random() * 50,
          phase:    Math.random() * Math.PI * 2,
        }))
      };
    } else if (this.style === 'ripple') {
      this._state = {
        rings: Array.from({ length: 5 }, () => ({
          x:         Math.random() * w,
          y:         Math.random() * h,
          radius:    Math.random() * 100,
          maxRadius: 80 + Math.random() * 120,
          speed:     0.5 + Math.random() * 0.5,
        }))
      };
    } else if (this.style === 'aurora') {
      this._state = { auroraClicks: [] };
    } else if (this.style === 'fireflies') {
      this._state = {
        fireflies: Array.from({ length: 22 }, () => ({
          baseX:      Math.random() * w,
          baseY:      Math.random() * h,
          speedX:     0.6 + Math.random() * 1.2,
          speedY:     0.6 + Math.random() * 1.2,
          phaseX:     Math.random() * Math.PI * 2,
          phaseY:     Math.random() * Math.PI * 2,
          pulsePhase: Math.random() * Math.PI * 2,
        }))
      };
    } else {
      this._state = {};
    }
  }

  setStyle(style) {
    if (this.style === style) return;
    this.style = style;
    this._initState();
  }

  setColor(color) { this.color = color; }

  _bindMouse() {
    const el = this.canvas.parentElement || this.canvas;
    const toXY = (cx, cy) => {
      const r = this.canvas.getBoundingClientRect();
      if (!r.width) return [-9999, -9999];
      return [(cx - r.left) * this._w / r.width, (cy - r.top) * this._h / r.height];
    };
    el.addEventListener('mousemove', e => {
      [this._mx, this._my] = toXY(e.clientX, e.clientY);
    }, { passive: true });
    el.addEventListener('mouseleave', () => { this._mx = -9999; this._my = -9999; }, { passive: true });
    el.addEventListener('click', e => {
      const [bx, by] = toXY(e.clientX, e.clientY);
      if (bx > -999) {
        this._burstPts.push({ x: bx, y: by, r: 0, max: 65 + Math.random() * 55, a: 0.7 });
        if (this.style === 'aurora' && this._state.auroraClicks) {
          this._state.auroraClicks.push({ x: bx, t: 0 });
        }
      }
    });
    el.addEventListener('touchstart', e => {
      const t = e.touches[0];
      const [bx, by] = toXY(t.clientX, t.clientY);
      this._isTouching = true;
      if (bx > -999) {
        this._burstPts.push({ x: bx, y: by, r: 0, max: 65 + Math.random() * 55, a: 0.7 });
        [this._mx, this._my] = [bx, by];
        if (this.style === 'aurora' && this._state.auroraClicks) {
          this._state.auroraClicks.push({ x: bx, t: 0 });
        }
      }
    }, { passive: true });
    el.addEventListener('touchmove', e => {
      const t = e.touches[0];
      [this._mx, this._my] = toXY(t.clientX, t.clientY);
    }, { passive: true });
    el.addEventListener('touchend', () => { this._mx = -9999; this._my = -9999; this._isTouching = false; }, { passive: true });
  }

  _drawOverlay(ctx, rgb) {
    const mx = this._mx, my = this._my;
    // Very subtle ambient warmth where the cursor is — not a visible tracker
    if (mx > -999) {
      const g = ctx.createRadialGradient(mx, my, 0, mx, my, 110);
      g.addColorStop(0, `rgba(${rgb},0.09)`);
      g.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(mx, my, 110, 0, Math.PI * 2); ctx.fill();
    }
    // Click/touch burst rings
    this._burstPts = this._burstPts.filter(b => b.r < b.max);
    for (const b of this._burstPts) {
      b.r += 2.8;
      const alpha = (1 - b.r / b.max) * b.a;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${rgb},${alpha})`; ctx.lineWidth = 1.5; ctx.stroke();
      const da = Math.max(0, (1 - b.r / 25) * 0.5);
      if (da > 0) {
        ctx.beginPath(); ctx.arc(b.x, b.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb},${da})`; ctx.fill();
      }
    }
  }

  _rgb() {
    const h = this.color.replace('#', '');
    return `${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)}`;
  }

  _tick() {
    const { ctx, _w: w, _h: h, style } = this;
    const rgb = this._rgb();
    this._t++;
    ctx.clearRect(0, 0, w, h);
    if      (style === 'particles') this._particles(ctx, rgb, w, h);
    else if (style === 'waves')     this._waves(ctx, rgb, w, h, this._t);
    else if (style === 'grid')      this._grid(ctx, rgb, w, h, this._t);
    else if (style === 'blobs')     this._blobs(ctx, rgb, w, h, this._t);
    else if (style === 'stars')     this._stars(ctx, rgb, w, h, this._t);
    else if (style === 'geometric') this._geometric(ctx, rgb, w, h, this._t);
    else if (style === 'ripple')    this._ripple(ctx, rgb, w, h, this._t);
    else if (style === 'fireflies') this._fireflies(ctx, rgb, w, h, this._t);
    else if (style === 'aurora')    this._aurora(ctx, rgb, w, h, this._t);
    // 'none' → canvas stays clear
    this._drawOverlay(ctx, rgb);
    this._raf = requestAnimationFrame(() => this._tick());
  }

  _particles(ctx, rgb, w, h) {
    const pts = this._state.pts;
    const mx = this._mx, my = this._my;
    const hasMouse = mx > -999;
    // Particles gently repel from cursor — creates an ambient parting effect
    for (const p of pts) {
      if (hasMouse) {
        const dx = p.x - mx, dy = p.y - my;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 100 && d > 0) {
          p.vx += (dx / d) * 0.022 * (1 - d / 100);
          p.vy += (dy / d) * 0.022 * (1 - d / 100);
          const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          if (spd > 1.2) { p.vx *= 0.9; p.vy *= 0.9; }
        }
      }
      p.x = (p.x + p.vx + w) % w;
      p.y = (p.y + p.vy + h) % h;
    }
    const THRESH = 120;
    ctx.lineWidth = 1;
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x;
        const dy = pts[i].y - pts[j].y;
        const d2 = dx * dx + dy * dy;
        if (d2 < THRESH * THRESH) {
          ctx.strokeStyle = `rgba(${rgb},${(1 - Math.sqrt(d2) / THRESH) * 0.25})`;
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.stroke();
        }
      }
    }
    // Draw lines from nearby particles to cursor + color-shift those particles
    if (hasMouse) {
      const CURSOR_THRESH = 140;
      for (const p of pts) {
        const dx = p.x - mx, dy = p.y - my;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < CURSOR_THRESH) {
          const alpha = (1 - d / CURSOR_THRESH) * 0.55;
          ctx.strokeStyle = `rgba(${rgb},${alpha})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mx, my); ctx.stroke();
        }
      }
    }
    for (const p of pts) {
      let near = false;
      if (hasMouse) {
        const dx = p.x - mx, dy = p.y - my;
        near = Math.sqrt(dx * dx + dy * dy) < 140;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, near ? 3 : 2, 0, Math.PI * 2);
      ctx.fillStyle = near ? `rgba(${rgb},1)` : `rgba(${rgb},0.7)`;
      ctx.fill();
    }
  }

  _waves(ctx, rgb, w, h, t) {
    const mx = this._mx, my = this._my, hasMouse = mx > -999;
    for (let l = 0; l < 4; l++) {
      const amp   = 18 + l * 12;
      const freq  = 0.007 + l * 0.003;
      const speed = (l + 1) * 0.25;
      const yBase = h * (0.42 + l * 0.16);
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 3) {
        let y = yBase
          + Math.sin(x * freq + t * 0.018 * speed) * amp
          + Math.sin(x * freq * 1.8 + t * 0.012 * speed) * (amp * 0.4);
        // Bend wave toward cursor — Gaussian pull at cursor X
        if (hasMouse) {
          const dx = x - mx;
          const pull = Math.exp(-dx * dx / 9000);
          y += pull * (my - yBase) * 0.4;
        }
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fillStyle = `rgba(${rgb},${0.06 + l * 0.04})`;
      ctx.fill();
    }
  }

  _grid(ctx, rgb, w, h, t) {
    const sp = 38;
    const cols = Math.ceil(w / sp) + 1;
    const rows = Math.ceil(h / sp) + 1;
    const mx = this._mx, my = this._my, hasMouse = mx > -999;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * sp;
        const y = r * sp;
        const d = Math.sqrt((x - w / 2) ** 2 + (y - h / 2) ** 2);
        const pulse = (Math.sin(t * 0.02 - d * 0.035) + 1) * 0.5;
        // Dots near cursor glow brighter
        let mBoost = 0;
        if (hasMouse) {
          const md = Math.sqrt((x - mx) ** 2 + (y - my) ** 2);
          mBoost = Math.max(0, 1 - md / 90) * 0.5;
        }
        ctx.beginPath();
        ctx.arc(x, y, 1.2 + pulse * 1.8 + mBoost * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb},${0.08 + pulse * 0.35 + mBoost * 0.45})`;
        ctx.fill();
      }
    }
  }

  _blobs(ctx, rgb, w, h, t) {
    const mx = this._mx, my = this._my, hasMouse = mx > -999;
    for (const b of this._state.blobs) {
      // Blobs drift gently away from cursor
      if (hasMouse) {
        const dx = b.x - mx, dy = b.y - my;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 180 && d > 0) {
          b.vx += (dx / d) * 0.008;
          b.vy += (dy / d) * 0.008;
          const spd = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
          if (spd > 0.5) { b.vx *= 0.95; b.vy *= 0.95; }
        }
      }
      b.x += b.vx;
      b.y += b.vy;
      if (b.x < -b.r) b.x = w + b.r;
      if (b.x > w + b.r) b.x = -b.r;
      if (b.y < -b.r) b.y = h + b.r;
      if (b.y > h + b.r) b.y = -b.r;
      const pulse = (Math.sin(t * 0.014 + b.phase) + 1) * 0.5;
      const r = b.r * (0.8 + pulse * 0.3);
      const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r);
      grad.addColorStop(0, `rgba(${rgb},0.22)`);
      grad.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _stars(ctx, rgb, w, h, t) {
    const mx = this._mx, my = this._my, hasMouse = mx > -999;
    for (const s of this._state.pts) {
      // Stars shimmer brighter near cursor
      if (hasMouse) {
        const dx = s.x - mx, dy = s.y - my;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 80 && d > 0) {
          s.vx += (dx / d) * 0.006;
          s.vy += (dy / d) * 0.006;
        }
      }
      s.x = (s.x + s.vx + w) % w;
      s.y = (s.y + s.vy + h) % h;
      const twinkle = (Math.sin(t * 0.05 + s.phase) + 1) * 0.5;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size * (0.5 + twinkle * 0.8), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb},${0.15 + twinkle * 0.75})`;
      ctx.fill();
    }
  }

  _geometric(ctx, rgb, w, h, t) {
    const mx = this._mx, my = this._my, hasMouse = mx > -999;
    for (const s of this._state.shapes) {
      // Shapes attract toward cursor when nearby
      if (hasMouse) {
        const dx = mx - s.x, dy = my - s.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 160 && d > 0) {
          s.vx += (dx / d) * 0.038;
          s.vy += (dy / d) * 0.038;
          const spd = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
          if (spd > 0.9) { s.vx *= 0.86; s.vy *= 0.86; }
        }
      }
      s.x = (s.x + s.vx + w) % w;
      s.y = (s.y + s.vy + h) % h;
      // Spin faster near cursor
      let spinBoost = 1;
      if (hasMouse) {
        const d = Math.sqrt((s.x - mx) ** 2 + (s.y - my) ** 2);
        spinBoost = 1 + Math.max(0, 1 - d / 130) * 5;
      }
      s.rot += s.rotSpeed * spinBoost;
      const pulse = (Math.sin(t * 0.018 + s.phase) + 1) * 0.5;
      const alpha = 0.06 + pulse * 0.14;
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rot);
      ctx.beginPath();
      for (let i = 0; i <= s.sides; i++) {
        const a = (i / s.sides) * Math.PI * 2;
        i === 0
          ? ctx.moveTo(Math.cos(a) * s.size, Math.sin(a) * s.size)
          : ctx.lineTo(Math.cos(a) * s.size, Math.sin(a) * s.size);
      }
      ctx.strokeStyle = `rgba(${rgb},${alpha + 0.1})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }
  }

  _ripple(ctx, rgb, w, h, t) {
    const mx = this._mx, my = this._my, hasMouse = mx > -999;
    for (const r of this._state.rings) {
      r.radius += r.speed;
      if (r.radius >= r.maxRadius) {
        r.radius = 0;
        r.x = Math.random() * w;
        r.y = Math.random() * h;
      }
      // Desktop: rings drift toward cursor. Mobile tap: rings flee.
      if (hasMouse) {
        const dx = mx - r.x, dy = my - r.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 180 && d > 0) {
          const dir = this._isTouching ? -1 : 1;
          r.x += (dx / d) * 0.4 * dir;
          r.y += (dy / d) * 0.4 * dir;
        }
      }
      const alpha = (1 - r.radius / r.maxRadius) * 0.45;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${rgb},${alpha})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  _fireflies(ctx, rgb, w, h, t) {
    const mx = this._mx, my = this._my, hasMouse = mx > -999;
    for (const f of this._state.fireflies) {
      // Fireflies flee from cursor / tap
      if (hasMouse) {
        const dx = mx - f.baseX, dy = my - f.baseY;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 200 && d > 0) {
          f.baseX -= (dx / d) * 0.45;
          f.baseY -= (dy / d) * 0.45;
        }
      }
      f.baseX = (f.baseX + 0.08 + w) % w;
      const x = f.baseX + Math.sin(t * 0.01 * f.speedX + f.phaseX) * 45;
      const y = f.baseY + Math.cos(t * 0.008 * f.speedY + f.phaseY) * 30;
      const glow = (Math.sin(t * 0.05 + f.pulsePhase) + 1) * 0.5;
      const r = 2 + glow * 3;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r * 3.5);
      grad.addColorStop(0, `rgba(${rgb},${0.25 + glow * 0.5})`);
      grad.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r * 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, r * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb},${0.6 + glow * 0.4})`;
      ctx.fill();
    }
  }

  _aurora(ctx, rgb, w, h, t) {
    const mx = this._mx, my = this._my, hasMouse = mx > -999;
    const clicks = this._state.auroraClicks || [];
    // Age click events; remove expired ones
    for (const ev of clicks) ev.t++;
    this._state.auroraClicks = clicks.filter(ev => ev.t < 70);

    for (let b = 0; b < 4; b++) {
      const yBase = h * (0.18 + b * 0.22);
      const amp   = 22 + b * 12;
      const thick = 35 + b * 15;
      const alpha = 0.06 + b * 0.02;
      ctx.beginPath();
      ctx.moveTo(0, yBase - thick);
      for (let x = 0; x <= w; x += 4) {
        const wave = Math.sin(x * 0.006 + t * 0.007 + b * 1.8) * amp
                   + Math.sin(x * 0.013 + t * 0.004 + b) * (amp * 0.4);
        let bend = 0;
        if (hasMouse) {
          const dx = x - mx;
          bend = Math.exp(-dx * dx / 12000) * (my - yBase) * 0.32;
        }
        // Click-wave: ripple outward from click X, time-decaying
        for (const ev of this._state.auroraClicks) {
          const dx = x - ev.x;
          const strength = Math.max(0, 1 - ev.t / 70) * 38;
          bend += Math.exp(-dx * dx / 9000) * strength * Math.sin(ev.t * 0.18);
        }
        ctx.lineTo(x, yBase - thick + wave + bend);
      }
      for (let x = w; x >= 0; x -= 4) {
        const wave = Math.sin(x * 0.006 + t * 0.007 + b * 1.8) * amp
                   + Math.sin(x * 0.013 + t * 0.004 + b) * (amp * 0.4);
        let bend = 0;
        if (hasMouse) {
          const dx = x - mx;
          bend = Math.exp(-dx * dx / 12000) * (my - yBase) * 0.32;
        }
        for (const ev of this._state.auroraClicks) {
          const dx = x - ev.x;
          const strength = Math.max(0, 1 - ev.t / 70) * 38;
          bend += Math.exp(-dx * dx / 9000) * strength * Math.sin(ev.t * 0.18);
        }
        ctx.lineTo(x, yBase + thick + wave + bend);
      }
      ctx.closePath();
      ctx.fillStyle = `rgba(${rgb},${alpha})`;
      ctx.fill();
    }
  }

  start() {
    if (this._raf) return;
    this._initState();
    this._raf = requestAnimationFrame(() => this._tick());
  }

  stop() {
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    this._ro.disconnect();
  }
}

function initHeroBackgrounds() {
  const style = currentConfig.bgStyle || 'particles';
  const color = currentConfig.theme?.primary || '#0D9488';
  window._heroBgs = Array.from(document.querySelectorAll('.hero-canvas')).map(canvas => {
    const bg = new HeroBg(canvas, color, style);
    bg.start();
    return bg;
  });
  window._bgStyleUpdate = (s) => window._heroBgs?.forEach(bg => bg.setStyle(s));
  window._threeUpdate   = (hex) => window._heroBgs?.forEach(bg => bg.setColor(hex));
}

// ── Inner demo nav scroll hide/show ──────────────────────────────────────────
function initDemoNavScroll() {
  const nav = document.getElementById('demo-site-nav');
  if (!nav) return;
  let lastY = window.scrollY;
  let stopTimer = null;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    clearTimeout(stopTimer);
    if (y < 60) {
      nav.classList.remove('demo-nav-hidden'); // always show near top
    } else if (y > lastY + 4) {
      nav.classList.add('demo-nav-hidden');    // hide scrolling down
      stopTimer = setTimeout(() => nav.classList.remove('demo-nav-hidden'), 80);
    } else if (y < lastY - 4) {
      nav.classList.remove('demo-nav-hidden'); // show scrolling up
    }
    lastY = y;
  }, { passive: true });
  window.addEventListener('scrollend', () => {
    clearTimeout(stopTimer);
    if (window.scrollY > 60) nav.classList.remove('demo-nav-hidden');
  }, { passive: true });
}

// ── Inner demo nav hamburger (slide-in, same behaviour as outer shared nav) ───
function initDemoNav() {
  const toggle  = document.getElementById('demo-menu-toggle');
  const menu    = document.getElementById('demo-mobile-menu');
  const overlay = document.getElementById('demo-mobile-overlay');
  if (!toggle || !menu) return;

  function openDemoMenu() {
    menu.classList.add('open');
    if (overlay) overlay.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
  }
  function closeDemoMenu() {
    menu.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }

  toggle.addEventListener('click', () => {
    menu.classList.contains('open') ? closeDemoMenu() : openDemoMenu();
  });
  if (overlay) overlay.addEventListener('click', closeDemoMenu);
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeDemoMenu));

  // Intercept anchor nav clicks — scroll to section within the ACTIVE mode only
  // (multiple modes share the same IDs; browser would find the first, which may be hidden)
  document.querySelectorAll('#demo-site-nav a[href^="#"], #demo-mobile-menu a[href^="#"]')
    .forEach(link => {
      link.addEventListener('click', e => {
        const hash = link.getAttribute('href');
        if (!hash || hash === '#') return;
        const id = hash.slice(1);
        const mode = currentConfig.mode || 'company';
        const modeEl = document.getElementById(`mode-${mode}`);
        const target = modeEl && modeEl.querySelector(`#${id}`);
        if (target) {
          e.preventDefault();
          closeSubPage();
          closeDemoMenu();
          target.scrollIntoView({ behavior: 'smooth' });
        } else {
          closeSubPage();
        }
      });
    });
}

// ── Catalog data ──────────────────────────────────────────────────────────────
const RESTAURANT_MENU = [
  { name: 'Beef Noodle Soup',        nameZh: '牛肉麵',   desc: 'Slow-braised beef, rich broth, hand-pulled noodles',       category: 'main',    sub: 'noodle', price: 180 },
  { name: 'Pork Chop Rice',          nameZh: '排骨飯',   desc: 'Crispy pork chop, steamed rice, pickled vegetables',       category: 'main',    sub: 'rice',   price: 160 },
  { name: 'Braised Pork Rice',       nameZh: '滷肉飯',   desc: 'Slow-braised fatty pork over steamed white rice',          category: 'main',    sub: 'rice',   price: 90  },
  { name: 'Three Cup Chicken',       nameZh: '三杯雞',   desc: 'Soy sauce, sesame oil, basil — a Taiwanese classic',       category: 'main',    sub: 'rice',   price: 220 },
  { name: 'Fried Rice',              nameZh: '蛋炒飯',   desc: 'Wok-tossed with egg and scallions',                        category: 'main',    sub: 'rice',   price: 130 },
  { name: 'Dry Noodles',             nameZh: '乾麵',     desc: 'Sesame paste, soy sauce, scallion oil',                    category: 'main',    sub: 'noodle', price: 100 },
  { name: 'Rice Noodle Soup',        nameZh: '米粉湯',   desc: 'Clear broth, silky rice noodles, fish cake',               category: 'main',    sub: 'mifen',  price: 120 },
  { name: 'Stir-fried Rice Noodles', nameZh: '炒米粉',   desc: 'Dry-fried with pork, cabbage, and dried shrimp',           category: 'main',    sub: 'mifen',  price: 150 },
  { name: 'Mango Shaved Ice',        nameZh: '芒果冰',   desc: 'Fresh mango, condensed milk, mango sorbet',                category: 'dessert', sub: null,     price: 150 },
  { name: 'Tofu Pudding',            nameZh: '豆花',     desc: 'Silky tofu pudding with sweet ginger syrup',               category: 'dessert', sub: null,     price: 80  },
  { name: 'Sweet Rice Balls',        nameZh: '湯圓',     desc: 'Glutinous rice balls in sweet ginger broth',               category: 'dessert', sub: null,     price: 100 },
  { name: 'Bubble Tea',              nameZh: '珍珠奶茶', desc: 'Creamy milk tea with tapioca pearls',                      category: 'dessert', sub: null,     price: 60  },
  { name: 'Braised Egg',             nameZh: '滷蛋',     desc: 'Soy-braised, soft-cooked egg',                             category: 'sides',   sub: null,     price: 20  },
  { name: 'Pickled Cucumber',        nameZh: '小黃瓜',   desc: 'Crisp cucumber in garlic and chili dressing',              category: 'sides',   sub: null,     price: 30  },
  { name: 'Dried Tofu',              nameZh: '豆乾',     desc: 'Savory braised firm tofu',                                 category: 'sides',   sub: null,     price: 30  },
  { name: 'Seaweed',                 nameZh: '海帶',     desc: 'Tender braised kelp in soy and five-spice',                category: 'sides',   sub: null,     price: 35  },
  { name: 'Pig Blood Cake',          nameZh: '豬血糕',   desc: 'Sticky rice cake with peanut powder and cilantro',         category: 'sides',   sub: null,     price: 40  },
];

const STORE_PRODUCTS = [
  { name: 'Classic Tee',           desc: '100% organic cotton, available in 8 colours',      category: 'apparel',     price: 590,  img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=225&fit=crop&q=80' },
  { name: 'Linen Shirt',           desc: 'Breathable summer linen, relaxed fit',              category: 'apparel',     price: 980,  img: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=300&h=225&fit=crop&q=80' },
  { name: 'Denim Jacket',          desc: 'Vintage-wash denim, timeless style',                category: 'apparel',     price: 2200, img: 'https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef?w=300&h=225&fit=crop&q=80' },
  { name: 'Oversized Hoodie',      desc: 'Heavyweight fleece, drop shoulder',                 category: 'apparel',     price: 1400, img: 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=300&h=225&fit=crop&q=80' },
  { name: 'Canvas Tote',           desc: 'Durable, spacious, and stylish',                    category: 'accessories', price: 380,  img: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=300&h=225&fit=crop&q=80' },
  { name: 'Leather Wallet',        desc: 'Slim bi-fold, genuine full-grain leather',          category: 'accessories', price: 850,  img: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300&h=225&fit=crop&q=80' },
  { name: 'Baseball Cap',          desc: 'Adjustable, 6-panel structured cap',                category: 'accessories', price: 480,  img: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=300&h=225&fit=crop&q=80' },
  { name: 'Sunglasses',            desc: 'UV400 polarized lenses, matte frame',               category: 'accessories', price: 1200, img: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=300&h=225&fit=crop&q=80' },
  { name: 'Ceramic Mug',           desc: 'Hand-thrown, dishwasher safe, 350ml',               category: 'home',        price: 320,  img: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=300&h=225&fit=crop&q=80' },
  { name: 'Scented Candle',        desc: 'Soy wax, 40-hour burn, cedarwood & vanilla',        category: 'home',        price: 450,  img: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=300&h=225&fit=crop&q=80' },
  { name: 'Throw Blanket',         desc: 'Chunky knit, 100% merino wool blend',               category: 'home',        price: 890,  img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&h=225&fit=crop&q=80' },
  { name: 'Bamboo Desk Organizer', desc: 'Eco-friendly, 5-compartment desk tidy',             category: 'home',        price: 650,  img: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=300&h=225&fit=crop&q=80' },
  { name: 'Gift Set Bundle',       desc: 'Curated bundle: mug, candle, and tote',             category: 'gifts',       price: 1490, img: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=300&h=225&fit=crop&q=80' },
  { name: 'Greeting Cards Pack',   desc: '10 hand-illustrated cards with envelopes',          category: 'gifts',       price: 180,  img: 'https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=300&h=225&fit=crop&q=80' },
  { name: 'Custom Tote Bag',       desc: 'Personalized with your name or message',            category: 'gifts',       price: 580,  img: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=300&h=225&fit=crop&q=80' },
];

// ── Current language helper ───────────────────────────────────────────────────
function getCurrentLang() {
  return (window.i18next?.language || 'en').startsWith('zh') ? 'zh' : 'en';
}

// ── Native sort select ────────────────────────────────────────────────────────
function initCustomSort(uiId, onchange) {
  const el = document.getElementById(uiId);
  if (!el) return () => 'relevance';
  el.addEventListener('change', () => onchange(el.value));
  return () => el.value || 'relevance';
}

// ── Generic catalog (search + sort + filter) ──────────────────────────────────
function initCatalog({ data, gridId, searchId, categoryTabsId, subcategoryTabsId, sortUiId, countId, renderItem }) {
  const grid = document.getElementById(gridId);
  if (!grid) return () => {};
  const searchEl = document.getElementById(searchId);
  const countEl  = document.getElementById(countId);
  const catTabs  = document.getElementById(categoryTabsId);
  const subTabs  = subcategoryTabsId ? document.getElementById(subcategoryTabsId) : null;

  let activeCat  = 'all';
  let activeSub  = 'all';
  let activeSort = 'relevance';

  const getSort  = initCustomSort(sortUiId, val => { activeSort = val; render(); });

  function render() {
    activeSort = getSort();
    const q = searchEl ? searchEl.value.toLowerCase().trim() : '';

    let items = data.filter(item => {
      const matchCat = activeCat === 'all' || item.category === activeCat;
      const matchSub = !subTabs || activeSub === 'all' || item.sub === activeSub;
      const matchQ   = !q || item.name.toLowerCase().includes(q) ||
                       (item.nameZh && item.nameZh.includes(q)) ||
                       item.desc.toLowerCase().includes(q);
      return matchCat && matchSub && matchQ;
    });

    if (activeSort === 'price_asc')  items.sort((a, b) => a.price - b.price);
    if (activeSort === 'price_desc') items.sort((a, b) => b.price - a.price);

    grid.innerHTML = items.map(renderItem).join('');
    // Stagger-animate new items in
    Array.from(grid.children).forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(12px)';
      const delay = Math.min(i * 35, 210);
      setTimeout(() => {
        el.style.transition = 'opacity 0.28s ease, transform 0.28s ease';
        el.style.opacity = '1';
        el.style.transform = '';
      }, delay);
    });
    if (countEl) countEl.textContent = items.length + ' item' + (items.length !== 1 ? 's' : '');
  }

  if (catTabs) {
    catTabs.addEventListener('click', e => {
      const tab = e.target.closest('[data-category]');
      if (!tab) return;
      activeCat = tab.dataset.category;
      activeSub = 'all';
      catTabs.querySelectorAll('.filter-tab').forEach(t => t.classList.toggle('active', t === tab));
      if (subTabs) {
        const show = activeCat === 'main';
        subTabs.classList.toggle('visible', show);
        if (!show) subTabs.querySelectorAll('.filter-tab').forEach(t => t.classList.toggle('active', t.dataset.subcategory === 'all'));
      }
      render();
    });
  }

  if (subTabs) {
    subTabs.addEventListener('click', e => {
      const tab = e.target.closest('[data-subcategory]');
      if (!tab) return;
      activeSub = tab.dataset.subcategory;
      subTabs.querySelectorAll('.filter-tab').forEach(t => t.classList.toggle('active', t === tab));
      render();
    });
  }

  if (searchEl) searchEl.addEventListener('input', render);

  render();
  return render; // expose re-render for language changes
}

// ── Sub-page open / close ─────────────────────────────────────────────────────
function showSubPage(pageId) {
  const page = document.getElementById(pageId);
  if (!page) return;
  const modeEl = page.closest('.mode-sections');
  if (modeEl) modeEl.classList.add('sub-page-open');
  page.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function closeSubPage() {
  window.scrollTo({ top: 0, behavior: 'auto' });
  document.querySelectorAll('.sub-page.active').forEach(page => {
    page.classList.add('exiting');
    const modeEl = page.closest('.mode-sections');
    setTimeout(() => {
      page.classList.remove('active', 'exiting');
      if (modeEl) {
        modeEl.classList.remove('sub-page-open');
        modeEl.classList.add('sub-page-returning');
        setTimeout(() => modeEl.classList.remove('sub-page-returning'), 300);
      }
    }, 220);
  });
}

// ── Sub-pages init ────────────────────────────────────────────────────────────
function initSubPages() {
  const preview = document.getElementById('demo-preview');
  if (!preview) return;

  function handleCatalogNav(e) {
    const trigger = e.target.closest('[data-show-subpage]');
    if (trigger) {
      e.preventDefault();
      e.stopPropagation(); // prevent click reaching mode-switch listeners
      const pageId = trigger.dataset.showSubpage;
      const filterCat = trigger.dataset.filterCategory;
      showSubPage(pageId);
      // If a category filter was requested, activate that tab and re-render
      if (filterCat && pageId === 'store-products-page') {
        const tabsEl = document.getElementById('products-category-tabs');
        if (tabsEl) {
          tabsEl.querySelectorAll('.filter-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.category === filterCat);
          });
          tabsEl.dispatchEvent(Object.assign(new MouseEvent('click', { bubbles: true }), {
            _filterCategory: filterCat
          }));
          // Find the matching tab and click it to trigger the catalog's own listener
          const matchTab = tabsEl.querySelector(`[data-category="${filterCat}"]`);
          if (matchTab) matchTab.click();
        }
      }
      return;
    }
    const back = e.target.closest('[data-close-subpage]');
    if (back) {
      e.preventDefault();
      e.stopPropagation();
      closeSubPage();
    }
  }
  preview.addEventListener('click', handleCatalogNav);

  function menuRenderItem(item) {
    const lang = getCurrentLang();
    const primary   = lang === 'zh' ? item.nameZh : item.name;
    const secondary = lang === 'zh' ? item.name   : item.nameZh;
    return `
      <div class="menu-catalog-item">
        <div class="catalog-item-info">
          <h3 class="catalog-item-name">${primary}<span class="item-name-en">${secondary}</span></h3>
          <p class="catalog-item-desc">${item.desc}</p>
        </div>
        <span class="catalog-item-price">NT$${item.price}</span>
      </div>`;
  }

  function productRenderItem(item) {
    return `
      <div class="product-catalog-item">
        <img class="catalog-item-img" src="${item.img}" alt="${item.name}" loading="lazy">
        <div class="catalog-item-body">
          <h3 class="catalog-item-name">${item.name}</h3>
          <p class="catalog-item-desc">${item.desc}</p>
          <div class="catalog-item-footer">
            <span class="catalog-item-price">NT$${item.price.toLocaleString()}</span>
          </div>
        </div>
      </div>`;
  }

  const rerenderMenu = initCatalog({
    data: RESTAURANT_MENU,
    gridId: 'menu-grid', searchId: 'menu-search',
    categoryTabsId: 'menu-category-tabs', subcategoryTabsId: 'menu-subcategory-tabs',
    sortUiId: 'menu-sort-ui', countId: 'menu-results-count',
    renderItem: menuRenderItem
  });

  const rerenderProducts = initCatalog({
    data: STORE_PRODUCTS,
    gridId: 'products-grid', searchId: 'products-search',
    categoryTabsId: 'products-category-tabs', subcategoryTabsId: null,
    sortUiId: 'products-sort-ui', countId: 'products-results-count',
    renderItem: productRenderItem
  });

  // Re-render catalogs + featured menu when language changes
  document.addEventListener('nav:lang', () => {
    renderFeaturedMenu();
    if (rerenderMenu) rerenderMenu();
    if (rerenderProducts) rerenderProducts();
  });
}

// ── Demo bar mode switcher ────────────────────────────────────────────────────
const MODE_META = {
  company:    { icon: '🏢', i18nKey: 'demo_bar.company' },
  restaurant: { icon: '🍽️', i18nKey: 'demo_bar.restaurant' },
  store:      { icon: '🛍️', i18nKey: 'demo_bar.store' },
};

function initDemoBarSwitcher() {
  const btn      = document.getElementById('mode-switcher-btn');
  const dropdown = document.getElementById('mode-switcher-dropdown');
  const iconEl   = document.getElementById('mode-switcher-icon');
  const labelEl  = document.getElementById('mode-switcher-label');
  if (!btn || !dropdown) return;

  function updateSwitcherUI(mode) {
    const meta = MODE_META[mode] || MODE_META.company;
    iconEl.textContent = meta.icon;
    labelEl.textContent = window.i18next ? window.i18next.t(meta.i18nKey) : mode;
    dropdown.querySelectorAll('.mode-switcher-option').forEach(opt => {
      opt.classList.toggle('active', opt.dataset.mode === mode);
    });
  }

  function closeDropdown() {
    dropdown.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  }

  btn.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = dropdown.classList.toggle('open');
    btn.setAttribute('aria-expanded', isOpen);
  });

  dropdown.querySelectorAll('.mode-switcher-option').forEach(opt => {
    opt.addEventListener('click', () => {
      AppState.showMode(opt.dataset.mode);
      updateSwitcherUI(opt.dataset.mode);
      closeDropdown();
    });
  });

  document.addEventListener('click', closeDropdown);

  // Sync when mode changes externally (e.g. from configurator drawer)
  window._updateModeSwitcher = updateSwitcherUI;

  updateSwitcherUI(currentConfig.mode || 'company');
}

// ── Move demo controls into shared nav + force solid background ───────────────
function initDemoNavControls() {
  const navRight = document.querySelector('#shared-nav .nav-right');
  const sharedNav = document.getElementById('shared-nav');
  const demoBar = document.getElementById('demo-bar');
  if (!navRight || !sharedNav) return;

  // Force nav to always show solid background on the demo page
  sharedNav.classList.add('demo-nav-solid');

  // Expose outer nav height so inner demo nav sticks just below it.
  // When outer nav auto-hides (hidden-nav), set offset to 0 so demo nav fills top.
  let _navH = 0;
  const setNavOffset = () => {
    const h = sharedNav.getBoundingClientRect().height;
    if (h > 0) _navH = h;
    const hidden = sharedNav.classList.contains('hidden-nav');
    document.documentElement.style.setProperty('--outer-nav-h', hidden ? '0px' : _navH + 'px');
  };
  setNavOffset();
  setTimeout(setNavOffset, 200); // re-check after fonts settle
  new MutationObserver(setNavOffset).observe(sharedNav, { attributes: true, attributeFilter: ['class'] });

  const badge = document.querySelector('#demo-bar .demo-badge');
  const switcher = document.getElementById('mode-switcher-wrap');
  if (!badge || !switcher) return;

  const wrap = document.createElement('div');
  wrap.className = 'demo-nav-controls';
  wrap.appendChild(badge);
  wrap.appendChild(switcher);
  navRight.insertBefore(wrap, navRight.firstChild);

  if (demoBar) demoBar.style.display = 'none';
}

// ── Customize button: hide while scrolling ────────────────────────────────────
function initScrollHideToggle() {
  const btn = document.getElementById('config-toggle');
  if (!btn) return;
  let scrollTimer;
  window.addEventListener('scroll', () => {
    btn.classList.add('scroll-hidden');
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => btn.classList.remove('scroll-hidden'), 80);
  }, { passive: true });
  // scrollend fires exactly when momentum scroll stops (Chrome 114+, Firefox 109+)
  window.addEventListener('scrollend', () => {
    clearTimeout(scrollTimer);
    btn.classList.remove('scroll-hidden');
  }, { passive: true });
}

// ── Whole-page cursor glow ────────────────────────────────────────────────────
function initCursorGlow() {
  const el = document.createElement('div');
  el.id = 'cursor-glow';
  el.style.cssText = 'position:fixed;pointer-events:none;z-index:9999;width:320px;height:320px;border-radius:50%;transform:translate(-50%,-50%);opacity:0;transition:opacity 0.3s;will-change:transform,left,top;';
  document.body.appendChild(el);
  let active = false;
  document.addEventListener('mousemove', e => {
    el.style.left = e.clientX + 'px';
    el.style.top  = e.clientY + 'px';
    const rgb = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim();
    el.style.background = `radial-gradient(circle, ${rgb}18 0%, transparent 70%)`;
    if (!active) { el.style.opacity = '1'; active = true; }
  }, { passive: true });
  document.addEventListener('mouseleave', () => { el.style.opacity = '0'; active = false; }, { passive: true });
}

// ── BFCache restore: clear frozen animation state ─────────────────────────────
window.addEventListener('pageshow', e => {
  if (e.persisted) {
    document.querySelectorAll('.mode-sections.dropping-in').forEach(el => el.classList.remove('dropping-in'));
    document.querySelectorAll('.custom-font-select.open').forEach(el => {
      el.classList.remove('open');
      const btn = el.querySelector('.custom-font-btn');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    });
    isTransitioning = false;
  }
});

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadConfig();
  applyTheme(currentConfig.theme);
  applyFonts(currentConfig.fonts);
  await I18N.init();
  showMode(currentConfig.mode || 'company', false);
  initLangToggle();
  initCounter();
  renderFeaturedMenu();
  initMenuTabs();
  initContactForms();
  initHeroCTAs();
  initDemoNavControls();
  initDemoNavScroll();
  initDemoNav();
  initSubPages();
  initDemoBarSwitcher();
  initScrollHideToggle();
  initHeroBackgrounds();
  initCursorGlow();
  // initScrollReveal() is called inside showMode()
});

// ── Expose for configurator.js ────────────────────────────────────────────────
window.AppState = {
  get: () => currentConfig,
  showMode,
  applyTheme,
  applyFonts,
  applyBgStyle: (style) => {
    currentConfig.bgStyle = style;
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(currentConfig));
    if (window._bgStyleUpdate) window._bgStyleUpdate(style);
  },
  runTransition,
  saveConfig: () => localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(currentConfig))
};
