// app.js — Mode switching, transitions, view counter, scroll reveal, Three.js, init

const STORAGE_KEY_CONFIG = 'webren_demo_v2';
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

  // Update Three.js particle color
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

  const doSwitch = () => {
    document.querySelectorAll('.mode-sections').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(`mode-${mode}`);
    if (target) target.classList.add('active');
    currentConfig.mode = mode;
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(currentConfig));
    window.scrollTo({ top: 0, behavior: 'auto' });
    target && target.querySelectorAll('.reveal').forEach(el => {
      el.classList.remove('revealed');
      el.style.transitionDelay = '';
    });
    // Update inner demo nav middle link for current mode
    const serviceLink = document.getElementById('demo-nav-services');
    if (serviceLink && window.i18next) {
      const linkKey = { company: 'nav.services', restaurant: 'nav.menu', store: 'nav.products' }[mode] || 'nav.services';
      serviceLink.dataset.i18n = linkKey;
      serviceLink.textContent = window.i18next.t(linkKey);
    }
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
  // Also respond to lang:nav event dispatched by shared-nav.js outer nav
  document.addEventListener('nav:lang', e => {
    runTransition(async () => {
      await I18N.switchLanguage(e.detail);
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

// ── Three.js particles ────────────────────────────────────────────────────────
function initThreeJS() {
  if (typeof THREE === 'undefined') return;

  const canvas = document.getElementById('threejs-canvas');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  camera.position.z = 80;

  // Particles
  const COUNT = 80;
  const positions = new Float32Array(COUNT * 3);
  const velocities = [];

  for (let i = 0; i < COUNT; i++) {
    positions[i*3]   = (Math.random() - 0.5) * 160;
    positions[i*3+1] = (Math.random() - 0.5) * 100;
    positions[i*3+2] = (Math.random() - 0.5) * 40;
    velocities.push({
      x: (Math.random() - 0.5) * 0.06,
      y: (Math.random() - 0.5) * 0.04,
    });
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  let primaryColor = new THREE.Color(currentConfig.theme?.primary || '#0D9488');

  const mat = new THREE.PointsMaterial({
    color: primaryColor,
    size: 1.5,
    transparent: true,
    opacity: 0.6,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);

  // Lines between close particles
  const lineMat = new THREE.LineBasicMaterial({ color: primaryColor, transparent: true, opacity: 0.15 });
  let linesMesh = null;

  function buildLines() {
    if (linesMesh) scene.remove(linesMesh);
    const linePositions = [];
    const threshold = 28;
    for (let i = 0; i < COUNT; i++) {
      for (let j = i+1; j < COUNT; j++) {
        const dx = positions[i*3] - positions[j*3];
        const dy = positions[i*3+1] - positions[j*3+1];
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d < threshold) {
          linePositions.push(
            positions[i*3], positions[i*3+1], positions[i*3+2],
            positions[j*3], positions[j*3+1], positions[j*3+2]
          );
        }
      }
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePositions), 3));
    linesMesh = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(linesMesh);
  }

  function resize() {
    const hero = canvas.parentElement;
    if (!hero) return;
    const w = hero.clientWidth;
    const h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });

  let frame = 0;
  function animate() {
    requestAnimationFrame(animate);

    for (let i = 0; i < COUNT; i++) {
      positions[i*3]   += velocities[i].x;
      positions[i*3+1] += velocities[i].y;
      // Wrap around edges
      if (positions[i*3] > 85)   positions[i*3] = -85;
      if (positions[i*3] < -85)  positions[i*3] = 85;
      if (positions[i*3+1] > 55) positions[i*3+1] = -55;
      if (positions[i*3+1] < -55) positions[i*3+1] = 55;
    }

    geo.attributes.position.needsUpdate = true;
    frame++;
    if (frame % 4 === 0) buildLines(); // rebuild lines every 4 frames for perf

    renderer.render(scene, camera);
  }

  buildLines();
  animate();

  // Expose color update
  window._threeUpdate = (hex) => {
    const c = new THREE.Color(hex);
    mat.color.set(c);
    lineMat.color.set(c);
  };
}

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadConfig();
  applyTheme(currentConfig.theme);
  applyFonts(currentConfig.fonts);
  await I18N.init();
  showMode(currentConfig.mode || 'company', false);
  initLangToggle();
  initCounter();
  initMenuTabs();
  // Three.js init — runs after THREE is available (loaded via defer)
  if (typeof THREE !== 'undefined') {
    initThreeJS();
  } else {
    window.addEventListener('load', initThreeJS);
  }
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
