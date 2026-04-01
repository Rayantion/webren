// configurator.js — Config drawer: presets, color picker, auto-theme, fonts, form, Supabase lead capture

const SUPABASE_URL = 'https://gfcncubcurtnzupycwnf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmY25jdWJjdXJ0bnp1cHljd25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMzQ4MzYsImV4cCI6MjA4OTgxMDgzNn0.Hbuo8Zl1MNjq8bUlc7Ed_HSBmGQiNHc9wDqKd4XDdOE';

const GOOGLE_FONTS = [
  'Inter', 'DM Sans', 'Plus Jakarta Sans', 'Nunito', 'Poppins',
  'Lato', 'Open Sans', 'Raleway', 'Work Sans', 'Quicksand',
  'Playfair Display', 'Lora', 'Merriweather', 'Cormorant Garamond',
  'EB Garamond', 'Libre Baskerville', 'Crimson Text', 'Source Serif 4',
  'Josefin Sans', 'Montserrat'
];

// ── 10 Preset Themes ─────────────────────────────────────────────────────────
const PRESET_THEMES = [
  { id: 'ivory',     name: 'Ivory',     primary: '#0D9488', accent: '#7C3AED', bg: '#FAFAFA', text: '#111827' },
  { id: 'midnight',  name: 'Midnight',  primary: '#38BDF8', accent: '#818CF8', bg: '#0D1117', text: '#F9FAFB' },
  { id: 'ocean',     name: 'Ocean',     primary: '#06B6D4', accent: '#38BDF8', bg: '#0F1F3D', text: '#E0F2FE' },
  { id: 'forest',    name: 'Forest',    primary: '#10B981', accent: '#FCD34D', bg: '#0F2318', text: '#D1FAE5' },
  { id: 'sunset',    name: 'Sunset',    primary: '#F97316', accent: '#EF4444', bg: '#1C0A00', text: '#FEF3C7' },
  { id: 'rose',      name: 'Rose',      primary: '#EC4899', accent: '#8B5CF6', bg: '#FFF1F5', text: '#1F0010' },
  { id: 'arctic',    name: 'Arctic',    primary: '#0284C7', accent: '#6366F1', bg: '#F0F9FF', text: '#0C4A6E' },
  { id: 'obsidian',  name: 'Obsidian',  primary: '#A1A1AA', accent: '#71717A', bg: '#09090B', text: '#FAFAFA'  },
  { id: 'amethyst',  name: 'Amethyst', primary: '#A855F7', accent: '#EC4899', bg: '#1A0A2E', text: '#EDE9FE' },
  { id: 'marigold',  name: 'Marigold', primary: '#D97706', accent: '#EF4444', bg: '#FFFBEB', text: '#422006' },
];

// ── Drawer open / close ───────────────────────────────────────────────────────
function initDrawer(onOpen) {
  const toggle = document.getElementById('config-toggle');
  const drawer = document.getElementById('config-drawer');
  const backdrop = document.getElementById('config-backdrop');
  const close = document.getElementById('config-close');
  const back = document.getElementById('config-back');

  const open = () => {
    drawer.classList.add('open');
    backdrop.classList.add('open');
    if (onOpen) onOpen();
  };
  const closeDrawer = () => {
    drawer.classList.remove('open');
    backdrop.classList.remove('open');
  };

  toggle.addEventListener('click', open);
  close.addEventListener('click', closeDrawer);
  if (back) back.addEventListener('click', closeDrawer);
  backdrop.addEventListener('click', closeDrawer);
}

// ── Preset themes ─────────────────────────────────────────────────────────────
function getActivePresetId(theme) {
  return PRESET_THEMES.find(p =>
    p.primary === theme.primary &&
    p.accent  === theme.accent  &&
    p.bg      === theme.bg      &&
    p.text    === theme.text
  )?.id || null;
}

function renderPresets() {
  const grid = document.getElementById('preset-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const activeName = getActivePresetId(AppState.get().theme);

  PRESET_THEMES.forEach(preset => {
    const wrap = document.createElement('div');
    wrap.className = 'preset-swatch-wrap';

    const swatch = document.createElement('div');
    swatch.className = `preset-swatch${preset.id === activeName ? ' active' : ''}`;
    swatch.title = I18N.t(`configurator.preset_${preset.id}`);
    swatch.setAttribute('aria-label', I18N.t(`configurator.preset_${preset.id}`));
    swatch.innerHTML = `
      <div class="preset-swatch-inner">
        <div class="preset-swatch-bg" style="background:${preset.bg}"></div>
        <div class="preset-swatch-bar" style="background:${preset.primary}"></div>
      </div>
    `;
    swatch.addEventListener('click', () => {
      applyAndSaveTheme(preset);
      document.querySelectorAll('.preset-swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
    });

    const label = document.createElement('div');
    label.className = 'preset-name';
    label.textContent = I18N.t(`configurator.preset_${preset.id}`);

    wrap.appendChild(swatch);
    wrap.appendChild(label);
    grid.appendChild(wrap);
  });
}

function initPresetThemes() {
  renderPresets();
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
  // Toggle between dark and light based on current background
  const currentBgHex = AppState.get().theme.bg;
  const [,,currentBgL] = hexToHsl(currentBgHex);
  const goLight = currentBgL < 50; // if currently dark, switch to light
  const bg = goLight ? hslToHex(h, 15, 97) : hslToHex(h, 10, 8);
  const text = goLight ? '#111827' : '#F9FAFB';
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
  AppState.get().theme = { ...theme };
  AppState.applyTheme(theme);
  AppState.saveConfig();
  ['primary','accent','bg','text'].forEach(key => {
    const pick = document.getElementById(`cp-${key}`);
    const hex = document.getElementById(`hex-${key}`);
    if (pick) pick.value = theme[key];
    if (hex) hex.value = theme[key];
  });
  // Refresh preset active state
  renderPresets();
}

function initColorPickers() {
  ['primary','accent','bg','text'].forEach(key => {
    const picker = document.getElementById(`cp-${key}`);
    if (picker) {
      picker.addEventListener('click', () => {
        // Snap to vivid version of current hue so picker opens with full S+V
        const [h] = hexToHsl(picker.value);
        const vivid = hslToHex(h, 100, 50);
        picker.value = vivid;
        // Don't fire onchange — just pre-position the picker; actual change fires on 'input'
      });
    }
    syncColorPair(`cp-${key}`, `hex-${key}`, val => {
      AppState.get().theme[key] = val;
      AppState.applyTheme(AppState.get().theme);
      AppState.saveConfig();
      renderPresets(); // deselect preset if custom color chosen
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
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet'; link.href = href;
  document.head.appendChild(link);
}

function initCustomFontSelect(id, onSelect) {
  const wrap = document.getElementById(id);
  if (!wrap) return;
  const btn   = wrap.querySelector('.custom-font-btn');
  const label = wrap.querySelector('.custom-font-label');
  const list  = wrap.querySelector('.custom-font-list');

  // Populate list
  GOOGLE_FONTS.forEach(font => {
    const li = document.createElement('li');
    li.className = 'custom-font-option';
    li.textContent = font;
    li.style.fontFamily = `'${font}', sans-serif`;
    li.dataset.value = font;
    li.setAttribute('role', 'option');
    li.addEventListener('click', () => {
      list.querySelectorAll('.custom-font-option').forEach(o => o.classList.remove('active'));
      li.classList.add('active');
      label.textContent = font;
      wrap.dataset.value = font;
      wrap.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      onSelect(font);
    });
    list.appendChild(li);
  });

  btn.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = wrap.classList.toggle('open');
    btn.setAttribute('aria-expanded', isOpen);
    // Scroll active option into view
    if (isOpen) {
      const active = list.querySelector('.custom-font-option.active');
      if (active) active.scrollIntoView({ block: 'nearest' });
    }
  });

  document.addEventListener('click', () => {
    wrap.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  });

  // Expose value setter
  wrap._setValue = font => {
    label.textContent = font;
    wrap.dataset.value = font;
    list.querySelectorAll('.custom-font-option').forEach(o => {
      o.classList.toggle('active', o.dataset.value === font);
    });
  };
}

function initFontSelectors() {
  const config = AppState.get();

  initCustomFontSelect('sel-heading-font', font => {
    loadGoogleFont(font);
    AppState.get().fonts.heading = font;
    AppState.applyFonts(AppState.get().fonts);
    AppState.saveConfig();
  });

  initCustomFontSelect('sel-body-font', font => {
    loadGoogleFont(font);
    AppState.get().fonts.body = font;
    AppState.applyFonts(AppState.get().fonts);
    AppState.saveConfig();
  });

  // Set initial values
  const headingEl = document.getElementById('sel-heading-font');
  const bodyEl    = document.getElementById('sel-body-font');
  if (headingEl?._setValue) headingEl._setValue(config.fonts.heading);
  if (bodyEl?._setValue)    bodyEl._setValue(config.fonts.body);

  loadGoogleFont(config.fonts.heading);
  loadGoogleFont(config.fonts.body);
}

// ── Background style selector ─────────────────────────────────────────────────
function initBgSelector() {
  const tiles = document.querySelectorAll('.bg-style-tile');
  const current = AppState.get().bgStyle || 'particles';
  tiles.forEach(tile => {
    tile.classList.toggle('active', tile.dataset.bg === current);
    tile.addEventListener('click', () => {
      tiles.forEach(t => t.classList.remove('active'));
      tile.classList.add('active');
      AppState.applyBgStyle(tile.dataset.bg);
    });
  });
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

  const mode = AppState.get().mode || 'company';
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
}

// ── Validation ────────────────────────────────────────────────────────────────
function showFormErrors(errors) {
  const errEl = document.getElementById('form-errors');
  errEl.textContent = '';
  errors.forEach(msg => {
    const span = document.createElement('span');
    span.textContent = msg;
    errEl.appendChild(span);
  });
}

function validateForm() {
  const name = document.getElementById('contact-name').value.trim();
  const email = document.getElementById('contact-email').value.trim();
  const phone = document.getElementById('contact-phone').value.trim();
  const codename = document.getElementById('contact-codename').value.trim();
  const errors = [];

  if (name.length < 2) errors.push(I18N.t('configurator.error_name'));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push(I18N.t('configurator.error_email_invalid'));
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length < 8) errors.push(I18N.t('configurator.error_phone'));
  if (codename.length < 1) errors.push(I18N.t('configurator.error_codename_required'));

  showFormErrors(errors);
  return errors.length === 0;
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast show ${type}`;
  setTimeout(() => { toast.className = 'toast'; }, 3500);
}

// ── Supabase helpers ──────────────────────────────────────────────────────────
async function sbFetch(path, options = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
}

// ── Lead submission ───────────────────────────────────────────────────────────
function initSendButton() {
  const btn = document.getElementById('btn-send');
  btn.addEventListener('click', async () => {
    if (!validateForm()) return;

    const name     = document.getElementById('contact-name').value.trim();
    const email    = document.getElementById('contact-email').value.trim();
    const phone    = document.getElementById('contact-phone').value.trim();
    const codename = document.getElementById('contact-codename').value.trim();
    const config   = AppState.get();

    btn.disabled = true;
    btn.textContent = I18N.t('configurator.sending');

    try {
      // Look up agent by codename
      const agentRes = await sbFetch(`/agents?codename=eq.${encodeURIComponent(codename)}&select=id`);
      if (!agentRes.ok) throw new Error('agent_lookup');
      const agents = await agentRes.json();
      if (!agents.length) {
        showFormErrors([I18N.t('configurator.error_codename')]);
        return;
      }

      // Insert lead into clients
      const insertRes = await sbFetch('/clients', {
        method: 'POST',
        headers: { 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          client_name: name,
          agent_id: agents[0].id,
          type: config.mode,
          status: 'possible_client',
          description: `Email: ${email} | Phone: ${phone}`,
          demo_data: {
            contact: { name, email, phone },
            config: {
              mode: config.mode,
              theme: config.theme,
              fonts: config.fonts,
              bgStyle: config.bgStyle || 'particles',
              viewCounter: config.viewCounter
            }
          }
        })
      });
      if (!insertRes.ok) throw new Error('insert_failed');
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
  renderPresets();
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initDrawer(syncPickersFromConfig);
  initPresetThemes();
  initColorPickers();
  initFontSelectors();
  initBgSelector();
  initModeButtons();
  initSendButton();
});
