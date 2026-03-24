// app.js — Main application logic
// Handles: Three.js hero animation, scroll reveals, nav, interactions

// ─── Three.js Hero Canvas ─────────────────────────────────────────────────────
function initHeroCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
  camera.position.z = 30;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);

  // Floating geometric shapes
  const shapes = [];
  const geometries = [
    new THREE.OctahedronGeometry(1.2, 0),
    new THREE.TetrahedronGeometry(1.0, 0),
    new THREE.IcosahedronGeometry(0.9, 0),
    new THREE.BoxGeometry(1.4, 1.4, 1.4),
  ];

  const colors = [0x0D9488, 0x7C3AED, 0x06B6D4, 0xA855F7, 0x10B981, 0x8B5CF6];

  for (let i = 0; i < 22; i++) {
    const geo = geometries[i % geometries.length];
    const mat = new THREE.MeshBasicMaterial({
      color: colors[i % colors.length],
      wireframe: true,
      transparent: true,
      opacity: 0.25 + Math.random() * 0.3
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      (Math.random() - 0.5) * 60,
      (Math.random() - 0.5) * 35,
      (Math.random() - 0.5) * 20 - 5
    );
    const s = 0.4 + Math.random() * 1.6;
    mesh.scale.set(s, s, s);
    mesh.userData = {
      rotX: (Math.random() - 0.5) * 0.008,
      rotY: (Math.random() - 0.5) * 0.012,
      floatSpeed: 0.3 + Math.random() * 0.7,
      floatOffset: Math.random() * Math.PI * 2,
      baseY: mesh.position.y
    };
    scene.add(mesh);
    shapes.push(mesh);
  }

  // Particle field
  const particleCount = 120;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 80;
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particleMat = new THREE.PointsMaterial({
    color: 0x0D9488,
    size: 0.15,
    transparent: true,
    opacity: 0.5
  });
  scene.add(new THREE.Points(particleGeo, particleMat));

  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', e => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 0.8;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 0.5;
  });

  let animId;
  function animate() {
    animId = requestAnimationFrame(animate);
    const t = Date.now() * 0.001;

    shapes.forEach(m => {
      m.rotation.x += m.userData.rotX;
      m.rotation.y += m.userData.rotY;
      m.position.y = m.userData.baseY + Math.sin(t * m.userData.floatSpeed + m.userData.floatOffset) * 0.8;
    });

    camera.position.x += (mouseX * 4 - camera.position.x) * 0.04;
    camera.position.y += (-mouseY * 3 - camera.position.y) * 0.04;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }
  animate();

  const ro = new ResizeObserver(() => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
  ro.observe(canvas);
}

// ─── Scroll Reveal ────────────────────────────────────────────────────────────
function initScrollReveal() {
  const els = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  els.forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 80}ms`;
    io.observe(el);
  });
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function initNav() {
  const nav = document.getElementById('navbar');
  let lastY = 0;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 40);
    nav.classList.toggle('hidden-nav', y > lastY + 5 && y > 200);
    nav.classList.toggle('visible-nav', y < lastY - 5);
    lastY = y;
  }, { passive: true });

  // Smooth scroll for anchor links with page transition
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      // close mobile menu if open
      mobileMenu.classList.remove('open');
      menuOverlay.classList.remove('open');

      const overlay = document.getElementById('page-transition');
      if (overlay) {
        overlay.classList.add('active');
        setTimeout(() => {
          // instant scroll under the overlay
          document.documentElement.style.scrollBehavior = 'auto';
          target.scrollIntoView({ block: 'start' });
          document.documentElement.style.scrollBehavior = '';
          setTimeout(() => overlay.classList.remove('active'), 50);
        }, 200);
      } else {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// ─── Mobile Menu ─────────────────────────────────────────────────────────────
let mobileMenu, menuOverlay;
function initMobileMenu() {
  mobileMenu = document.getElementById('mobile-menu');
  menuOverlay = document.getElementById('menu-overlay');
  const toggle = document.getElementById('menu-toggle');

  toggle?.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('open');
    menuOverlay.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open);
  });

  menuOverlay?.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    menuOverlay.classList.remove('open');
  });
}

// ─── Counter Animation ────────────────────────────────────────────────────────
function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';
      const duration = 1500;
      const start = performance.now();

      function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target) + suffix;
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      io.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(c => io.observe(c));
}

// ─── Language Toggle ──────────────────────────────────────────────────────────
function initLangToggle() {
  const overlay = document.getElementById('lang-overlay');

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('active')) return;

      // Trigger dropdown fill animation
      overlay.classList.add('active');

      I18N.switchLanguage(btn.dataset.lang).then(() => {
        setTimeout(() => {
          overlay.classList.remove('active');
        }, 300);
      });
    });
  });
}

// ─── Gradient cursor glow ─────────────────────────────────────────────────────
function initCursorGlow() {
  const glow = document.getElementById('cursor-glow');
  if (!glow || window.matchMedia('(pointer: coarse)').matches) {
    glow?.remove();
    return;
  }
  let cx = 0, cy = 0, tx = 0, ty = 0;
  document.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });
  (function lerp() {
    cx += (tx - cx) * 0.1;
    cy += (ty - cy) * 0.1;
    glow.style.transform = `translate(${cx - 200}px, ${cy - 200}px)`;
    requestAnimationFrame(lerp);
  })();
}

// ─── Service card hover tilt ──────────────────────────────────────────────────
function initCardTilt() {
  document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(600px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await I18N.init();
  initNav();
  initMobileMenu();
  initScrollReveal();
  initCounters();
  initLangToggle();
  initCursorGlow();
  initCardTilt();

  // Three.js loads async via CDN — wait for it
  if (typeof THREE !== 'undefined') {
    initHeroCanvas();
  } else {
    window.addEventListener('three-loaded', initHeroCanvas, { once: true });
    // Fallback: poll briefly
    let tries = 0;
    const poll = setInterval(() => {
      if (typeof THREE !== 'undefined') {
        clearInterval(poll);
        initHeroCanvas();
      }
      if (++tries > 30) clearInterval(poll);
    }, 100);
  }
});
