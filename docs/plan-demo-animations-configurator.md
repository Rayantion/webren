# Plan: Demo Animations + Configurator Mobile UX

## 1. Configurator Mobile: Close Button + Scroll Lock
**Files:** `demo/js/configurator.js`, `demo/css/style.css`

**Changes:**
- In `initDrawer()`, add `document.body.style.overflow = 'hidden'` on open and `document.body.style.overflow = ''` on close — prevents page scroll while drawer is open.
- Make `#config-close` more visible on mobile: larger tap target, visible label ("Back" / "back arrow") on small screens via CSS.
- No structural HTML changes needed — the close button already exists.

---

## 2. Fireflies: Flee Cursor (Desktop) / Flee Tap (Mobile)
**File:** `demo/js/app.js` — `_fireflies()` method (line ~769)

**Current behavior:** Fireflies drift _toward_ cursor when within 200px.

**Change:** Invert direction: repel instead of attract.
```js
// old: f.baseX += (dx / d) * 0.35;
// new:
f.baseX -= (dx / d) * 0.35;
f.baseY -= (dy / d) * 0.35;
```
Mobile tap already updates `_mx/_my` via existing `touchstart` handler, so flee works on mobile automatically.

---

## 3. Ripple: Attract to Cursor (Desktop) / Flee Tap (Mobile)
**File:** `demo/js/app.js` — `_ripple()` method (line ~752)

**Current behavior:** Rings spawn at random positions and expand — no cursor interaction.

**Change:**
- When cursor is within 180px of a ring's center, drift the ring center toward the cursor (same strength as firefly attract: ~0.35/frame).
- On mobile tap (`touchstart`), invert — push rings away from tap point.

**Implementation note:** Need to track whether interaction is from touch vs mouse. Add `_isTouching` flag in `_bindMouse()`: set true on touchstart, false on touchend.

```js
// In _ripple(), after r.radius += r.speed:
if (hasMouse) {
  const dx = mx - r.x, dy = my - r.y;
  const d = Math.sqrt(dx*dx + dy*dy);
  if (d < 180 && d > 0) {
    const dir = this._isTouching ? -1 : 1;
    r.x += (dx / d) * 0.4 * dir;
    r.y += (dy / d) * 0.4 * dir;
  }
}
```

---

## 4. Mode Switcher Dropdown: Appear Animation
**File:** `demo/css/style.css` — `.mode-switcher-dropdown` (line ~613)

**Current behavior:** Dropdown has a basic opacity + transform transition (0.2s). This is functional but subtle.

**Clarification needed from Aaron:** Does "dropdown box appear animations" mean:
- (a) Enhance the mode-switcher-dropdown open animation (e.g., add a spring/bounce feel)?
- (b) Add a fade-in transition on the canvas when switching hero background styles?
- (c) Something else?

**Default plan (option a):** Enhance to a snappier cubic-bezier spring animation on open, with a slight scale effect on the list items staggering in.

---

## 5. Aurora Click-Wave (Same as Waves)
**File:** `demo/js/app.js` — `_aurora()` method (line ~800) + `_bindMouse()` (line ~481)

**Current behavior:** Aurora bends toward cursor position. Click does nothing special (only generic burst ring via `_burstPts`).

**Change:** On click/tap, record the click X coordinate and start a time-decaying wave distortion in the aurora bands from that X, same concept as waves bending toward cursor.

**Implementation:**
- Add `_auroraClicks: []` to state init for aurora style.
- In `_bindMouse()` click/touchstart handler, if current style is 'aurora', push `{ x: bx, t: 0 }` to `this._state.auroraClicks`.
- In `_aurora()`, for each click event, compute a Gaussian distortion centered at click.x, amplitude decaying over ~60 frames:
```js
for (const ev of this._state.auroraClicks) {
  const dx = x - ev.x;
  const strength = Math.max(0, 1 - ev.t / 60) * 40;
  bend += Math.exp(-dx * dx / 8000) * strength * Math.sin(ev.t * 0.15);
}
// After loop: ev.t++; filter out t > 60
```

---

## 6. Language Switch Delay (Already Fixed)
**File:** `demo/js/app.js` — `nav:lang` handler (line ~193)

**Root cause:** Handler wrapped `I18N.switchLanguage()` in `runTransition()`, adding an 800ms page-cover animation.

**Fix (already committed):** Removed `runTransition` wrapper — language now switches instantly.

---

## Commit order
1. ~~Fix lang switch delay~~ (done in demo/js/app.js)
2. Configurator scroll lock + mobile close button
3. Fireflies repel
4. Ripple attract/repel + aurora click-wave
5. Dropdown animation (pending Aaron's clarification on item 4)
6. Cache-bust to v29 on demo/index.html
7. Push
