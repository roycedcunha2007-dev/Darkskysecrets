/* ═══════════════════════════════════════════════════════
   DARK SKY — scroll-cinema engine
   One rAF loop · transform/opacity/canvas writes only ·
   all geometry measured on resize, never in the hot path.
   ═══════════════════════════════════════════════════════ */
'use strict';

const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const MOBILE = window.matchMedia('(max-width: 768px)').matches;
const DPR = Math.min(window.devicePixelRatio || 1, MOBILE ? 1.5 : 2);

if (RM) document.documentElement.classList.add('rm');

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const win = (p, a, b) => clamp01((p - a) / (b - a));
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
const easeInOut = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/* ── star sprite atlas (blurred discs pre-rendered once — no per-frame shadowBlur) ── */
function makeSprite(radius, rgb) {
  const c = document.createElement('canvas');
  c.width = c.height = Math.ceil(radius * 2);
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(radius, radius, 0, radius, radius, radius);
  grd.addColorStop(0, `rgba(${rgb},1)`);
  grd.addColorStop(0.4, `rgba(${rgb},0.5)`);
  grd.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grd;
  g.fillRect(0, 0, c.width, c.height);
  return c;
}
const SPRITES = [
  makeSprite(7, '225,242,255'),
  makeSprite(4.5, '205,228,255'),
  makeSprite(2.6, '190,214,248'),
];

function makeStars(n, skyFraction) {
  const stars = [];
  for (let i = 0; i < n; i++) {
    // magnitude distribution skewed faint, like the real sky
    const mag = 1.4 + 5.9 * Math.pow(Math.random(), 0.38);
    stars.push({
      x: Math.random(),
      y: Math.random() * skyFraction,
      mag,
      sprite: mag < 2.6 ? 0 : mag < 4.6 ? 1 : 2,
      scale: mag < 2.6 ? lerp(0.8, 1.4, Math.random()) : lerp(0.5, 1, Math.random()),
      phase: Math.random() * Math.PI * 2,
      speed: lerp(0.4, 1.6, Math.random()),
    });
  }
  return stars;
}

/* ═══ SkyEngine — draws sky = f(darkness, glow, milkyWay, time) ═══
   Layer caches (magnitude bands, Milky Way, skyline) are offscreen
   canvases rebuilt only on resize; per frame we composite a handful
   of drawImage calls plus ~110 twinkling bright stars. */
class SkyEngine {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.starCount = opts.starCount || (MOBILE ? 700 : 1900);
    this.skyline = opts.skyline !== false;
    this.skyFraction = this.skyline ? 0.86 : 1;
    this.stars = makeStars(this.starCount, this.skyFraction);
    this.bands = [
      { max: 3.2, canvas: null },   // bright — always first to appear
      { max: 5.2, canvas: null },
      { max: 7.4, canvas: null },   // faint — dark skies only
    ];
    this.w = 0; this.h = 0;
    this.resize();
  }

  resize() {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.w = w; this.h = h;
    this.canvas.width = Math.round(w * DPR);
    this.canvas.height = Math.round(h * DPR);
    this.ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    this.buildBands();
    this.buildMilkyWay();
    if (this.skyline) this.buildSkyline();
  }

  layer() {
    const c = document.createElement('canvas');
    c.width = Math.round(this.w * DPR);
    c.height = Math.round(this.h * DPR);
    const g = c.getContext('2d');
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
    return [c, g];
  }

  buildBands() {
    let lo = 0;
    this.twinklers = [];
    for (const band of this.bands) {
      const [c, g] = this.layer();
      for (const s of this.stars) {
        if (s.mag < lo || s.mag >= band.max) continue;
        // brightest ~110 stars get live twinkle instead of baking
        if (s.mag < 2.9 && this.twinklers.length < 110) { this.twinklers.push(s); continue; }
        const spr = SPRITES[s.sprite];
        const size = spr.width * s.scale;
        g.globalAlpha = clamp01(1.15 - (s.mag - 1.4) / 6.5);
        g.drawImage(spr, s.x * this.w - size / 2, s.y * this.h - size / 2, size, size);
      }
      band.canvas = c;
      lo = band.max;
    }
  }

  buildMilkyWay() {
    const [c, g] = this.layer();
    const w = this.w, h = this.h;
    g.save();
    g.translate(w * 0.5, h * 0.42);
    g.rotate(-0.42);
    // luminous band: overlapping soft blobs along the axis
    const blobs = MOBILE ? 9 : 16;
    for (let i = 0; i < blobs; i++) {
      const bx = lerp(-w * 0.75, w * 0.75, i / (blobs - 1)) + (Math.random() - 0.5) * 40;
      const by = (Math.random() - 0.5) * h * 0.08;
      const r = lerp(h * 0.1, h * 0.26, Math.random());
      const grd = g.createRadialGradient(bx, by, 0, bx, by, r);
      grd.addColorStop(0, 'rgba(190,215,245,0.10)');
      grd.addColorStop(0.5, 'rgba(160,190,230,0.05)');
      grd.addColorStop(1, 'rgba(160,190,230,0)');
      g.fillStyle = grd;
      g.fillRect(bx - r, by - r, r * 2, r * 2);
    }
    // dense faint star dust along the band
    const dust = MOBILE ? 500 : 1300;
    for (let i = 0; i < dust; i++) {
      const dx = (Math.random() - 0.5) * w * 1.5;
      // gaussian-ish vertical spread
      const dy = (Math.random() + Math.random() + Math.random() - 1.5) * h * 0.11;
      g.globalAlpha = Math.random() * 0.55;
      g.fillStyle = 'rgba(205,225,250,1)';
      const sz = Math.random() * 1.1 + 0.2;
      g.fillRect(dx, dy, sz, sz);
    }
    // dark dust lanes carved out
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 4; i++) {
      const lx = lerp(-w * 0.5, w * 0.5, Math.random());
      const grd = g.createRadialGradient(lx, h * 0.015, 0, lx, h * 0.015, h * 0.09);
      grd.addColorStop(0, 'rgba(0,0,0,0.75)');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grd;
      g.fillRect(lx - h * 0.2, -h * 0.1, h * 0.4, h * 0.25);
    }
    g.restore();
    this.milkyWay = c;
  }

  buildSkyline() {
    const [c, g] = this.layer();
    const w = this.w, h = this.h;
    const ground = h * 0.9;
    this.windows = [];
    g.fillStyle = '#030408';
    g.fillRect(0, ground, w, h - ground);
    let x = -10;
    while (x < w + 10) {
      const bw = lerp(28, 90, Math.random());
      const bh = lerp(h * 0.03, h * 0.16, Math.pow(Math.random(), 1.6));
      g.fillRect(x, ground - bh, bw, bh + 2);
      if (Math.random() < 0.18) g.fillRect(x + bw / 2 - 1, ground - bh - h * 0.03, 2, h * 0.03); // antenna
      // lit windows (drawn to a second cache so glow can dim them)
      const cols = Math.floor(bw / 9), rows = Math.floor(bh / 11);
      for (let i = 0; i < cols * rows * 0.16; i++) {
        this.windows.push({
          x: x + 3 + Math.random() * (bw - 6),
          y: ground - bh + 3 + Math.random() * (bh - 6),
        });
      }
      x += bw + lerp(2, 14, Math.random());
    }
    this.skylineCanvas = c;

    const [wc, wg] = this.layer();
    wg.fillStyle = 'rgba(255,190,110,0.9)';
    for (const p of this.windows) wg.fillRect(p.x, p.y, 1.6, 2.2);
    this.windowsCanvas = wc;
  }

  /* darkness 0..1 (0 = Bortle 9, 1 = Bortle 1) · glow 0..1 · mw 0..1 */
  draw(darkness, glow, mw, t) {
    const { ctx: g, w, h } = this;
    if (!w) return;

    // base sky: cold night, warmed near horizon by glow
    const sky = g.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#04050a');
    sky.addColorStop(0.62, `rgba(${Math.round(lerp(6, 26, glow))},${Math.round(lerp(7, 20, glow))},${Math.round(lerp(14, 16, glow))},1)`);
    sky.addColorStop(1, `rgba(${Math.round(lerp(8, 52, glow))},${Math.round(lerp(9, 38, glow))},${Math.round(lerp(16, 18, glow))},1)`);
    g.fillStyle = sky;
    g.fillRect(0, 0, w, h);

    // magnitude bands fade in as the sky darkens
    const limit = lerp(2.1, 7.4, darkness);
    const alphas = [win(limit, 1.8, 3.2), win(limit, 3.4, 5.4), win(limit, 5.4, 7.4)];
    for (let i = 0; i < 3; i++) {
      if (alphas[i] <= 0.005) continue;
      g.globalAlpha = alphas[i];
      g.drawImage(this.bands[i].canvas, 0, 0, w, h);
    }

    // Milky Way
    if (mw > 0.005 && this.milkyWay) {
      g.globalAlpha = mw * 0.95;
      g.drawImage(this.milkyWay, 0, 0, w, h);
    }

    // live twinkling bright stars
    for (const s of this.twinklers) {
      const a = clamp01((limit - s.mag) / 0.9);
      if (a <= 0) continue;
      const spr = SPRITES[s.sprite];
      const size = spr.width * s.scale;
      g.globalAlpha = a * (0.78 + 0.22 * Math.sin(t * 0.001 * s.speed + s.phase));
      g.drawImage(spr, s.x * w - size / 2, s.y * h - size / 2, size, size);
    }
    g.globalAlpha = 1;

    // sodium glow dome — the villain
    if (glow > 0.005) {
      const dome = g.createRadialGradient(w * 0.5, h * 1.12, 0, w * 0.5, h * 1.12, h * 1.05);
      dome.addColorStop(0, `rgba(255,170,60,${0.5 * glow})`);
      dome.addColorStop(0.45, `rgba(255,150,50,${0.22 * glow})`);
      dome.addColorStop(1, 'rgba(255,150,50,0)');
      g.fillStyle = dome;
      g.fillRect(0, 0, w, h);
    }

    // skyline + its lit windows (windows dim as the city switches off)
    if (this.skyline && this.skylineCanvas) {
      g.drawImage(this.skylineCanvas, 0, 0, w, h);
      g.globalAlpha = Math.max(glow, 0.06);
      g.drawImage(this.windowsCanvas, 0, 0, w, h);
      g.globalAlpha = 1;
    }
  }
}

/* ═══ shared frame state ═══ */
const state = {
  scrollY: window.scrollY,
  vh: window.innerHeight,
  heroP: 0, heroTarget: 0,
  wipeP: 0, wipeTarget: 0,
  bortleD: 0, bortleTargetD: 0, bortleG: 1, bortleTargetG: 1,
  heroVisible: true, wipeVisible: false, bortleVisible: false, satVisible: false,
};

/* geometry cache — measured on load/resize only */
const geo = { hero: null, wipe: null, sat: null, doc: 1 };
function measure() {
  state.vh = window.innerHeight;
  const m = el => { const r = el.getBoundingClientRect(); return { top: r.top + window.scrollY, height: r.height }; };
  geo.hero = m(document.getElementById('hero'));
  geo.wipe = m(document.getElementById('wipe'));
  geo.sat = m(document.querySelector('.satellite'));
  geo.doc = Math.max(1, document.documentElement.scrollHeight - state.vh);
}

/* ═══ engines ═══ */
const heroEngine = new SkyEngine(document.getElementById('heroCanvas'));
const bortleEngine = new SkyEngine(document.getElementById('bortleCanvas'), {
  starCount: MOBILE ? 450 : 1100,
});

/* ambient background — sparse, cheap, site-wide */
const ambient = document.getElementById('ambientCanvas');
const ambCtx = ambient.getContext('2d');
const ambStars = makeStars(MOBILE ? 60 : 150, 1);
function sizeAmbient() {
  ambient.width = Math.round(innerWidth * DPR);
  ambient.height = Math.round(innerHeight * DPR);
  ambCtx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
function drawAmbient(t) {
  const w = innerWidth, h = innerHeight;
  ambCtx.clearRect(0, 0, w, h);
  const drift = state.scrollY * 0.04;
  for (const s of ambStars) {
    const y = ((s.y * h - drift) % h + h) % h;
    const spr = SPRITES[s.sprite];
    const size = spr.width * s.scale * 0.8;
    ambCtx.globalAlpha = 0.5 * clamp01(1.1 - (s.mag - 1.4) / 6.5) * (0.7 + 0.3 * Math.sin(t * 0.0008 * s.speed + s.phase));
    ambCtx.drawImage(spr, s.x * w - size / 2, y - size / 2, size, size);
  }
  ambCtx.globalAlpha = 1;
}

/* ═══ hero DOM refs + act choreography ═══ */
const heroLine1 = document.getElementById('heroLine1');
const heroLine2 = document.getElementById('heroLine2');
const heroCounter = document.getElementById('heroCounter');
const starCount = document.getElementById('starCount');
const heroOutro = document.getElementById('heroOutro');
const scrollHint = document.getElementById('scrollHint');
let lastCount = -1;

function heroFrame(t) {
  const p = state.heroP;
  const darkness = easeInOut(win(p, 0.12, 0.72));
  const glow = 1 - win(p, 0.08, 0.68);
  const mw = win(p, 0.6, 0.94);
  heroEngine.draw(darkness, glow, mw, t);

  heroLine1.classList.toggle('in', p < 0.4);
  heroLine1.classList.toggle('out', p >= 0.4);
  heroLine2.classList.toggle('in', p >= 0.46);
  heroCounter.classList.toggle('in', p > 0.12);
  heroOutro.classList.toggle('in', p > 0.8);
  scrollHint.classList.toggle('gone', p > 0.04);

  const n = Math.round(lerp(25, 4500, easeOutCubic(win(p, 0.18, 0.78))));
  if (n !== lastCount) {
    lastCount = n;
    starCount.textContent = '≈ ' + n.toLocaleString('en-IN');
  }
}

/* ═══ wipe ═══ */
const wipePolluted = document.getElementById('wipePolluted');
const wipeSeam = document.getElementById('wipeSeam');
const wipeLabelDark = document.getElementById('wipeLabelDark');
const wipeLabelCity = document.getElementById('wipeLabelCity');

function wipeFrame() {
  const p = easeInOut(state.wipeP);
  const x = lerp(2, 98, p);
  wipePolluted.style.clipPath = `inset(0 0 0 ${x}%)`;
  wipeSeam.style.left = x + '%';
  wipeLabelDark.style.opacity = win(p, 0.15, 0.45);
  wipeLabelCity.style.opacity = 1 - win(p, 0.55, 0.85);
}

/* ═══ Bortle scrubber ═══ */
const BORTLE = {
  9: { name: 'Inner-city sky', mag: '4.0', stars: 25, desc: 'Only the Moon, the planets and a few dozen stars survive the glow.' },
  8: { name: 'City sky', mag: '4.5', stars: 80, desc: 'The sky glows grey-orange. Familiar constellations are missing pieces.' },
  7: { name: 'Suburban–urban', mag: '5.0', stars: 200, desc: 'The whole sky has a washed-out, light grey dome over it.' },
  6: { name: 'Bright suburban', mag: '5.5', stars: 400, desc: 'The Milky Way is invisible. The sky within 35° of the horizon glows.' },
  5: { name: 'Suburban sky', mag: '6.0', stars: 800, desc: 'The Milky Way is faint, washed out near the horizon.' },
  4: { name: 'Rural–suburban', mag: '6.4', stars: 1300, desc: 'Light domes sit over cities on the horizon. The Milky Way begins to show structure.' },
  3: { name: 'Rural sky', mag: '6.8', stars: 2500, desc: 'The Milky Way looks complex. Clouds appear as dark holes against the sky.' },
  2: { name: 'Truly dark site', mag: '7.2', stars: 3500, desc: 'The summer Milky Way casts visible structure. Airglow appears near the horizon.' },
  1: { name: 'Excellent dark sky', mag: '7.8', stars: 4500, desc: 'The Milky Way is bright enough to cast shadows. This is the sky as it always was — Hanle is one of the last places like it.' },
};
const bortleRange = document.getElementById('bortleRange');
const bortleClassEl = document.getElementById('bortleClass');
const bortleName = document.getElementById('bortleName');
const bortleStats = document.getElementById('bortleStats');
const bortleDesc = document.getElementById('bortleDesc');

function setBortle(cls) {
  const d = BORTLE[cls];
  state.bortleTargetD = (9 - cls) / 8;
  state.bortleTargetG = (cls - 1) / 8;
  bortleClassEl.textContent = cls;
  bortleName.textContent = d.name;
  bortleStats.textContent = `LIMITING MAG ${d.mag} · ≈ ${d.stars.toLocaleString('en-IN')} STARS`;
  bortleDesc.textContent = d.desc;
  bortleRange.setAttribute('aria-valuetext', `Bortle class ${cls} — ${d.name}`);
}
bortleRange.addEventListener('input', () => setBortle(10 - Number(bortleRange.value)));
setBortle(9);

function bortleFrame(t) {
  state.bortleD = lerp(state.bortleD, state.bortleTargetD, RM ? 1 : 0.07);
  state.bortleG = lerp(state.bortleG, state.bortleTargetG, RM ? 1 : 0.07);
  const mw = clamp01((state.bortleD - 0.45) / 0.55);
  bortleEngine.draw(state.bortleD, state.bortleG, mw, t);
}

/* ═══ versus drag slider ═══ */
const versusStage = document.getElementById('versusStage');
const versusHandle = document.getElementById('versusHandle');
const capMumbai = document.getElementById('capMumbai');
const capHanle = document.getElementById('capHanle');
let versusX = 0.5;

function setVersus(x) {
  versusX = Math.min(0.96, Math.max(0.04, x));
  versusStage.style.setProperty('--x', (versusX * 100).toFixed(2) + '%');
  versusHandle.setAttribute('aria-valuenow', Math.round(versusX * 100));
  capMumbai.style.opacity = 0.35 + 0.65 * win(versusX, 0.15, 0.4);
  capHanle.style.opacity = 0.35 + 0.65 * win(1 - versusX, 0.15, 0.4);
}
setVersus(0.5);

let dragging = false;
versusStage.addEventListener('pointerdown', e => {
  dragging = true;
  versusStage.setPointerCapture(e.pointerId);
  setVersus((e.clientX - versusStage.getBoundingClientRect().left) / versusStage.clientWidth);
});
versusStage.addEventListener('pointermove', e => {
  if (!dragging) return;
  setVersus((e.clientX - versusStage.getBoundingClientRect().left) / versusStage.clientWidth);
});
addEventListener('pointerup', () => { dragging = false; });
versusHandle.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') { setVersus(versusX - 0.04); e.preventDefault(); }
  if (e.key === 'ArrowRight') { setVersus(versusX + 0.04); e.preventDefault(); }
});

/* ═══ solutions — turn the lights off ═══ */
const solRows = document.querySelectorAll('.sol-row');
const solScore = document.getElementById('solScore');
const solutionsSky = document.getElementById('solutionsSky');
// star cluster via one-time box-shadow starfield (zero per-frame cost)
(() => {
  const dot = document.createElement('span');
  const shadows = [];
  for (let i = 0; i < 70; i++) {
    const x = (Math.random() * 100).toFixed(1), y = (Math.random() * 100).toFixed(1);
    const b = Math.random() < 0.25 ? 2 : 1;
    shadows.push(`${x}vw ${y}%  0 ${b}px rgba(210,232,255,${(Math.random() * 0.7 + 0.2).toFixed(2)})`);
  }
  dot.style.cssText = `position:absolute;width:1px;height:1px;border-radius:50%;box-shadow:${shadows.join(',')}`;
  solutionsSky.appendChild(dot);
})();
solRows.forEach(row => {
  row.addEventListener('click', () => {
    row.classList.toggle('off');
    const n = document.querySelectorAll('.sol-row.off').length;
    solScore.textContent = `${n} / 6 LIGHTS OFF`;
    solutionsSky.style.opacity = 0.12 + (n / 6) * 0.88;
  });
});

/* ═══ IntersectionObservers — visibility gates + reveals ═══ */
const io = new IntersectionObserver(entries => {
  for (const e of entries) {
    const el = e.target;
    if (el.classList.contains('hero-stage')) state.heroVisible = e.isIntersecting;
    else if (el.classList.contains('wipe-stage')) state.wipeVisible = e.isIntersecting;
    else if (el.classList.contains('bortle-viewport')) state.bortleVisible = e.isIntersecting;
    else if (el.classList.contains('satellite')) {
      state.satVisible = e.isIntersecting;
      if (e.isIntersecting) el.classList.add('in');
    }
  }
}, { rootMargin: '60px' });
io.observe(document.querySelector('.hero-stage'));
io.observe(document.querySelector('.wipe-stage'));
io.observe(document.querySelector('.bortle-viewport'));
io.observe(document.querySelector('.satellite'));

const revealIO = new IntersectionObserver(entries => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    e.target.classList.add('in');
    revealIO.unobserve(e.target);
  }
}, { threshold: 0.35 });
document.querySelectorAll('.reveal-item, .manifesto-title .line-mask').forEach(el => revealIO.observe(el));

/* instrument HUD — reads out the section under the viewport centre */
const hudText = document.getElementById('hudText');
const hudIO = new IntersectionObserver(entries => {
  for (const e of entries) {
    if (e.isIntersecting && e.target.dataset.hud) hudText.textContent = e.target.dataset.hud;
  }
}, { rootMargin: '-45% 0px -45% 0px' });
document.querySelectorAll('[data-hud]').forEach(s => hudIO.observe(s));

/* ═══ the loop ═══ */
const navProgress = document.querySelector('.nav-progress');
let lastNavP = -1;

addEventListener('scroll', () => { state.scrollY = window.scrollY; }, { passive: true });

let resizeTimer;
addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    sizeAmbient();
    heroEngine.resize();
    bortleEngine.resize();
    measure();
  }, 150);
});

/* self-heal: if the window was hidden/tiny at boot no resize event ever
   fires, leaving stale canvas backing stores — verify cheaply every ~32 frames */
let sizeTick = 0;
function checkSizes() {
  if (ambient.clientWidth && Math.round(ambient.clientWidth * DPR) !== ambient.width) {
    sizeAmbient();
    heroEngine.resize();
    bortleEngine.resize();
    measure();
  }
}

function frame(t) {
  const { scrollY, vh } = state;
  if ((sizeTick++ & 31) === 0) checkSizes();

  state.heroTarget = clamp01((scrollY - geo.hero.top) / Math.max(1, geo.hero.height - vh));
  state.wipeTarget = clamp01((scrollY - geo.wipe.top) / Math.max(1, geo.wipe.height - vh));
  // cinematic lag
  state.heroP = lerp(state.heroP, state.heroTarget, 0.09);
  state.wipeP = lerp(state.wipeP, state.wipeTarget, 0.09);

  drawAmbient(t);
  if (state.heroVisible) heroFrame(t);
  if (state.wipeVisible) wipeFrame();
  if (state.bortleVisible) bortleFrame(t);

  const navP = clamp01(scrollY / geo.doc);
  if (Math.abs(navP - lastNavP) > 0.001) {
    lastNavP = navP;
    navProgress.style.transform = `scaleX(${navP})`;
  }
  requestAnimationFrame(frame);
}

/* ═══ boot ═══ */
sizeAmbient();
measure();

if (RM) {
  // static, fully-readable page: final-state hero, mid-wipe, class-9 sky, one ambient frame
  heroEngine.draw(1, 0.06, 1, 0);
  bortleFrame(0);
  drawAmbient(0);
  heroLine1.classList.add('in');
  heroLine2.classList.add('in');
  starCount.textContent = '≈ 4,500';
  bortleRange.addEventListener('input', () => bortleFrame(0));
} else {
  requestAnimationFrame(frame);
}

// re-measure once everything (images, fonts) has settled
addEventListener('load', () => { measure(); heroEngine.resize(); bortleEngine.resize(); });
