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
    btn.textContent = I18N.t('configurator.sending');

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
