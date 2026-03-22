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

// ── Custom sort dropdown ──────────────────────────────────────────────────────
function initCustomSort(uiId, onchange) {
  const wrap = document.getElementById(uiId);
  if (!wrap) return () => 'relevance';

  const btn   = wrap.querySelector('.custom-sort-btn');
  const label = wrap.querySelector('.custom-sort-label');
  const menu  = wrap.querySelector('.custom-sort-menu');

  btn.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = wrap.classList.toggle('open');
    btn.setAttribute('aria-expanded', isOpen);
  });

  wrap.querySelectorAll('.custom-sort-option').forEach(opt => {
    opt.addEventListener('click', () => {
      wrap.querySelectorAll('.custom-sort-option').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      wrap.dataset.value = opt.dataset.value;
      label.textContent = opt.textContent;
      wrap.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      onchange(opt.dataset.value);
    });
  });

  document.addEventListener('click', () => {
    wrap.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  });

  return () => wrap.dataset.value || 'relevance';
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
  document.querySelectorAll('.sub-page.active').forEach(page => {
    page.classList.remove('active');
    const modeEl = page.closest('.mode-sections');
    if (modeEl) modeEl.classList.remove('sub-page-open');
  });
  window.scrollTo({ top: 0, behavior: 'auto' });
}

// ── Sub-pages init ────────────────────────────────────────────────────────────
function initSubPages() {
  const preview = document.getElementById('demo-preview');
  if (!preview) return;

  // Use both click and touchend to fix mobile tap issues
  function handleCatalogNav(e) {
    const trigger = e.target.closest('[data-show-subpage]');
    if (trigger) { e.preventDefault(); showSubPage(trigger.dataset.showSubpage); return; }
    const back = e.target.closest('[data-close-subpage]');
    if (back) { e.preventDefault(); closeSubPage(); }
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
    const addToCart = window.i18next ? window.i18next.t('store.featured.add_to_cart') : 'Add to Cart';
    return `
      <div class="product-catalog-item">
        <img class="catalog-item-img" src="${item.img}" alt="${item.name}" loading="lazy">
        <div class="catalog-item-body">
          <h3 class="catalog-item-name">${item.name}</h3>
          <p class="catalog-item-desc">${item.desc}</p>
          <div class="catalog-item-footer">
            <span class="catalog-item-price">NT$${item.price.toLocaleString()}</span>
            <button class="btn-primary btn-sm">${addToCart}</button>
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

  // Re-render catalogs when language changes
  document.addEventListener('nav:lang', () => {
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
  initDemoNav();
  initSubPages();
  initDemoBarSwitcher();
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
