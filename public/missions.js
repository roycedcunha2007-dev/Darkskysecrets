/* ═══════════════════════════════════════════════════════
   MISSIONS — mission control
   Live telemetry · single-viewer fleet dossier · reveals
   ═══════════════════════════════════════════════════════ */
'use strict';

const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const MOBILE = window.matchMedia('(max-width: 768px)').matches;
const DPR = Math.min(window.devicePixelRatio || 1, MOBILE ? 1.5 : 2);
if (RM) document.documentElement.classList.add('rm');

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const TAU = Math.PI * 2;
const el = id => document.getElementById(id);

/* ── ambient starfield ───────────────────────── */
const STAR = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 8;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(4, 4, 0, 4, 4, 4);
  grd.addColorStop(0, 'rgba(220,238,255,1)');
  grd.addColorStop(0.4, 'rgba(190,214,248,0.5)');
  grd.addColorStop(1, 'rgba(190,214,248,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 8, 8);
  return c;
})();
const amb = el('ambientCanvas');
const ac = amb.getContext('2d');
const ambStars = [];
for (let i = 0; i < (MOBILE ? 90 : 200); i++) {
  ambStars.push({ x: Math.random(), y: Math.random(), s: Math.pow(Math.random(), 2.2) * 1.6 + 0.3,
    a: Math.random() * 0.5 + 0.2, ph: Math.random() * TAU, sp: Math.random() * 1.4 + 0.3 });
}
let scrollY = window.scrollY;
function sizeAmb() {
  amb.width = Math.round(innerWidth * DPR);
  amb.height = Math.round(innerHeight * DPR);
  ac.setTransform(DPR, 0, 0, DPR, 0, 0);
}
function drawAmb(t) {
  const w = innerWidth, h = innerHeight, drift = scrollY * 0.03;
  ac.clearRect(0, 0, w, h);
  for (const s of ambStars) {
    const y = ((s.y * h - drift) % h + h) % h;
    const size = STAR.width * s.s;
    ac.globalAlpha = s.a * (0.6 + 0.4 * Math.sin(t * 0.001 * s.sp + s.ph));
    ac.drawImage(STAR, s.x * w - size / 2, y - size / 2, size, size);
  }
  ac.globalAlpha = 1;
}

/* ── live telemetry ──────────────────────────── */
const EPOCH = Date.UTC(2026, 0, 1);            // baseline: 2026-01-01
const V1_BASE = 2.500e10, V1_RATE = 16.9;       // km, km/s
const V2_BASE = 2.088e10, V2_RATE = 15.3;
const ISS_CREWED = Date.UTC(2000, 10, 2);       // 2000-11-02
const C_KM_S = 299792.458;

const pad2 = n => String(n).padStart(2, '0');
function telemetry(now) {
  const secs = (now - EPOCH) / 1000;
  const v1 = V1_BASE + V1_RATE * secs;
  const v2 = V2_BASE + V2_RATE * secs;
  el('tV1').textContent = Math.round(v1).toLocaleString('en-US') + ' KM';
  el('tV2').textContent = Math.round(v2).toLocaleString('en-US') + ' KM';

  const up = now - ISS_CREWED;
  const days = Math.floor(up / 86400000);
  const yrs = Math.floor(days / 365.25);
  const rem = days - Math.round(yrs * 365.25);
  const hh = Math.floor(up / 3600000) % 24, mm = Math.floor(up / 60000) % 60, ss = Math.floor(up / 1000) % 60;
  el('tISS').textContent = `${yrs}Y · ${rem}D · ${pad2(hh)}:${pad2(mm)}:${pad2(ss)}`;

  const dSec = v1 / C_KM_S;
  el('tDelay').textContent = `${Math.floor(dSec / 3600)}H ${pad2(Math.floor(dSec / 60) % 60)}M ${pad2(Math.floor(dSec) % 60)}S`;
}

/* ── the fleet ───────────────────────────────── */
const FLEET = [
  { file: 'jwst_james_webb_space_telescope.glb', name: 'James Webb Telescope', agency: 'NASA · ESA · CSA',
    year: '2021', status: 'op', where: 'Sun–Earth L2 · 1.5M km out', fame: 'Sees the first galaxies',
    secret: 'Galaxies that ignited 300 million years after time began — light older than the Earth itself.',
    brief: 'The largest telescope ever flown, unfolded in space like origami. It reads the infrared glow of the first galaxies — light that left home 13 billion years before cities existed.' },
  { file: 'hubble_space_telescope.glb', name: 'Hubble Space Telescope', agency: 'NASA · ESA',
    year: '1990', status: 'op', where: 'Low Earth orbit · 515 km', fame: 'Rewrote the universe’s age',
    secret: 'A “blank” pinprick of darkness held 3,000 galaxies. There is no such thing as empty sky.',
    brief: 'Three decades of the deepest images humanity has ever taken. Hubble measured how fast the universe expands and showed us that every dark patch of sky is full of galaxies.' },
  { file: 'la_station_spatiale_internationale_iss.glb', name: 'International Space Station', agency: 'NASA · ROSCOSMOS · ESA · JAXA · CSA',
    year: '1998', status: 'op', where: 'Low Earth orbit · 408 km', fame: '25+ years always crewed', heavy: '36 MB MODEL',
    secret: 'Astronauts say the hardest thing to photograph from orbit is the stars — our cities outshine them.',
    brief: 'The largest structure ever assembled off-world — a million pounds of laboratory circling Earth sixteen times a day. Someone has been living aboard continuously since the year 2000.' },
  { file: 'voyager_i__ii__nasa_interstellar_mission.glb', name: 'Voyager 1 & 2', agency: 'NASA · JPL',
    year: '1977', status: 'inter', where: 'Interstellar space', fame: 'Farthest human-made objects', heavy: '92 MB MODEL',
    secret: 'From 6 billion km out, Earth is a single pale blue pixel — every city light, one dot in the dark.',
    brief: 'Two probes carrying golden records of Earth’s music and greetings. Both crossed into interstellar space and both still whisper home daily — on transmitters weaker than a refrigerator bulb.' },
  { file: 'parker_solar_probe.glb', name: 'Parker Solar Probe', agency: 'NASA · APL',
    year: '2018', status: 'op', where: 'Inside the solar corona', fame: 'Fastest object ever built',
    secret: 'The Sun’s halo burns 300× hotter than its surface — a fire we had to touch to believe.',
    brief: 'It flies through the Sun’s outer atmosphere at 192 km per second behind a carbon shield, taking the temperature of the star that makes every dark sky worth protecting.' },
  { file: 'cassini_huygens.glb', name: 'Cassini–Huygens', agency: 'NASA · ESA · ASI',
    year: '1997', status: 'done', where: 'Ended at Saturn · 2017', fame: 'Landed on Titan',
    secret: 'Beneath a moon’s ice: a warm, salt ocean venting into space — life’s ingredients, hiding in the dark.',
    brief: 'Thirteen years threading Saturn’s rings. It found water geysers on Enceladus, dropped a lander onto Titan, then ended its life diving into the planet it studied — to protect the moons it discovered.' },
  { file: 'chandrayaan-2_in_flight_configuration.glb', name: 'Chandrayaan-2', agency: 'ISRO · INDIA',
    year: '2019', status: 'op', where: 'Lunar orbit · 100 km', fame: 'Mapped lunar water',
    secret: 'Water ice in craters that haven’t seen sunlight in two billion years — treasure kept by darkness.',
    brief: 'India’s orbiter is still circling the Moon, mapping water and minerals — the reconnaissance that made Chandrayaan-3’s historic south-pole landing possible.' },
  { file: 'nasa_curiosity_clean.glb', name: 'Curiosity Rover', agency: 'NASA · JPL',
    year: '2011', status: 'op', where: 'Gale Crater · Mars', fame: 'Found an ancient riverbed',
    secret: 'Gale Crater was once a lake. Mars had rain, rivers and skies before Earth had life.',
    brief: 'A nuclear-powered laboratory on six wheels, lowered to Mars by a rocket sky crane. Fourteen years on, it is still climbing a Martian mountain reading the planet’s history layer by layer.' },
];
const STATUS_LABEL = { op: 'OPERATIONAL', done: 'MISSION COMPLETE', inter: 'INTERSTELLAR' };

const fleetList = el('fleetList');
const fleetModel = el('fleetModel');
const fleetPlate = el('fleetPlate');
let fleetSel = -1;

function selectMission(i) {
  if (i === fleetSel) return;
  fleetSel = i;
  const m = FLEET[i];
  [...fleetList.children].forEach((b, k) => b.setAttribute('aria-selected', k === i));
  el('fName').textContent = m.name;
  el('fBrief').textContent = m.brief;
  el('fAgency').textContent = m.agency;
  el('fLaunch').textContent = m.year;
  el('fWhere').textContent = m.where;
  el('fFame').textContent = m.fame;
  el('fSecret').textContent = m.secret;
  const chip = el('fStatus');
  chip.textContent = STATUS_LABEL[m.status];
  chip.className = 'status-chip mono ' + m.status;
  el('plateStatus').innerHTML = '<span class="pulse"></span>' + m.name.toUpperCase() + ' · DRAG TO INSPECT';
  // swap the single viewer — only one GLB in memory at a time
  fleetPlate.classList.add('swapping');
  fleetModel.setAttribute('alt', '3D model of ' + m.name);
  fleetModel.src = m.file;
}
fleetModel.addEventListener('load', () => fleetPlate.classList.remove('swapping'));
fleetModel.addEventListener('error', () => {
  fleetPlate.classList.remove('swapping');
  el('plateStatus').innerHTML = '<span class="pulse"></span>MODEL UNAVAILABLE · TELEMETRY ONLY';
});

FLEET.forEach((m, i) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'fleet-item';
  b.setAttribute('aria-selected', 'false');
  b.innerHTML = `
    <span class="fi-idx">${String(i + 1).padStart(2, '0')}</span>
    <span class="fi-body">
      <span class="fi-name">${m.name}</span>
      <span class="fi-meta">${m.agency.split(' · ')[0]} · ${m.year}${m.heavy ? ' · ' + m.heavy : ''}</span>
    </span>
    <span class="fi-led ${m.status}"></span>`;
  b.addEventListener('click', () => selectMission(i));
  fleetList.appendChild(b);
});
selectMission(0);

/* ── the ascent — hold LAUNCH, leave the glow ──────────────────
   Continuous altitude 0..1 (log scale, 14 m → 1.5M km) driven by
   held buttons with momentum; scenes crossfade, an altimeter spins,
   milestone stamps fire at real thresholds. */
const ZONES = [
  { chip: '01 · CITY', name: 'A Mumbai rooftop', idx: 'ZONE 01 / 04 · BORTLE 9 · GROUND LEVEL',
    tag: 'REAL PHOTO · MUMBAI · GROUND LEVEL',
    desc: 'The sky most of us own: an amber haze, the Moon, and two dozen survivors. Hold LAUNCH and leave it behind.',
    stars: 'STARS: ≈ 25', who: '1.4 BILLION OF US WATCH FROM HERE' },
  { chip: '02 · HANLE', name: 'Hanle, Ladakh', idx: 'ZONE 02 / 04 · BORTLE 1 · 4,500 M',
    tag: 'REAL PHOTO · HANLE OBSERVATORY · 4,500 M',
    desc: 'India’s darkest sky — the Milky Way bright enough to cast a shadow. The only stop on this climb you can visit.',
    stars: 'STARS: ≈ 4,500', who: 'INDIAN ASTRONOMICAL OBSERVATORY' },
  { chip: '03 · ORBIT', name: 'Hubble’s orbit', idx: 'ZONE 03 / 04 · 515 KM · ABOVE THE AIR',
    tag: 'HUBBLE · REAL 3D MODEL · OVER THE BLUE MARBLE', model: 'hubble_space_telescope.glb',
    desc: 'Above the atmosphere nothing blurs the view. The stars stop twinkling — they simply burn.',
    stars: 'NO AIR · NO TWINKLE', who: 'HUBBLE · SINCE 1990' },
  { chip: '04 · L2', name: 'JWST at L2', idx: 'ZONE 04 / 04 · 1.5 MILLION KM · L2',
    tag: 'JWST · REAL 3D MODEL · OVER ITS FIRST DEEP FIELD', model: 'jwst_james_webb_space_telescope.glb',
    desc: 'A million miles from the nearest streetlight, reading light from the dawn of time. The darkest seat we own.',
    stars: 'SEES THE FIRST GALAXIES', who: 'JAMES WEBB · SINCE 2021' },
];
const Z_START = [0, 0.28, 0.55, 0.8];
const Z_END = [0.28, 0.55, 0.8, 1.01];
const Z_CENTER = [0.08, 0.4, 0.68, 0.93];
const STAMPS = [
  { at: 0.28, text: 'BORTLE 9 — LEFT BEHIND' },
  { at: 0.48, text: '100 KM · KÁRMÁN LINE — SPACE BEGINS' },
  { at: 0.57, text: 'ATMOSPHERE CLEARED — STARS STOP TWINKLING' },
  { at: 0.86, text: '1.5M KM — THE DARKEST SEAT WE OWN' },
];
const ALT_LO = Math.log10(14), ALT_HI = Math.log10(1.5e9); // metres

const ascViewport = el('ascViewport');
const stairsModel = el('stairsModel');
const ascLayers = [...document.querySelectorAll('.stairs-layer')];
const railShip = el('railShip');
const ascStamp = el('ascStamp');
const ascAltEl = el('ascAlt');
const stairChips = el('stairChips');

let ascP = 0, ascV = 0, holdDir = 0, tweenTarget = null;
let ascZone = -1, ascPrevP = 0, lastAltText = '';
let stampTimer = 0;

function fmtAlt(p) {
  const m = Math.pow(10, ALT_LO + (ALT_HI - ALT_LO) * p);
  if (m < 1000) return Math.round(m) + ' M';
  const km = m / 1000;
  if (km < 100) return km.toFixed(1) + ' KM';
  return Math.round(km).toLocaleString('en-US') + ' KM';
}
function showStamp(text) {
  ascStamp.textContent = text;
  ascStamp.classList.remove('show');
  void ascStamp.offsetWidth;               // restart the animation
  ascStamp.classList.add('show');
  clearTimeout(stampTimer);
  stampTimer = setTimeout(() => ascStamp.classList.remove('show'), 2000);
}
const zoneOf = p => (p < 0.28 ? 0 : p < 0.55 ? 1 : p < 0.8 ? 2 : 3);

function updateZone(z) {
  ascZone = z;
  const s = ZONES[z];
  el('stIndex').textContent = s.idx;
  el('stName').textContent = s.name;
  el('stDesc').textContent = s.desc;
  el('stStars').textContent = s.stars;
  el('stWho').textContent = s.who;
  el('stairsTag').textContent = s.tag;
  [...stairChips.children].forEach((b, k) => b.setAttribute('aria-pressed', k === z));
  if (s.model) {
    if (stairsModel.getAttribute('src') !== s.model) stairsModel.setAttribute('src', s.model);
  }
}

function applyAscent() {
  // layer crossfade + parallax (feathered zone membership)
  const f = 0.05;
  for (let i = 0; i < 4; i++) {
    const s = i === 0 ? -1 : Z_START[i], e = i === 3 ? 2 : Z_END[i];
    const op = clamp01((ascP - (s - f)) / (2 * f)) * clamp01(((e + f) - ascP) / (2 * f));
    const l = ascLayers[i];
    l.style.opacity = op.toFixed(3);
    l.style.transform = `translateY(${((ascP - Z_CENTER[i]) * 7).toFixed(2)}%) scale(1.08)`;
  }
  // spacecraft model appears once we reach orbit
  const modelOp = clamp01((ascP - 0.52) / 0.1);
  stairsModel.classList.toggle('on', modelOp > 0.4);
  // altimeter + rail
  const altText = fmtAlt(ascP);
  if (altText !== lastAltText) { lastAltText = altText; ascAltEl.textContent = altText; }
  railShip.style.bottom = (ascP * 100).toFixed(2) + '%';
  // zone panel
  const z = zoneOf(ascP);
  if (z !== ascZone) updateZone(z);
  // milestone stamps (both directions)
  for (const st of STAMPS) {
    if ((ascPrevP < st.at && ascP >= st.at) || (ascPrevP > st.at && ascP <= st.at)) showStamp(st.text);
  }
  ascPrevP = ascP;
}

const MAXV = 0.26, ACC = 0.55, DRAG = 3.2;   // per-second units
function ascentFrame(dt) {
  const s = dt / 1000;
  if (tweenTarget != null) {
    ascP += (tweenTarget - ascP) * Math.min(1, 6 * s);
    if (Math.abs(tweenTarget - ascP) < 0.002) { ascP = tweenTarget; tweenTarget = null; }
    ascV = 0;
  } else {
    if (holdDir) ascV = Math.max(-MAXV, Math.min(MAXV, ascV + holdDir * ACC * s));
    else ascV *= Math.max(0, 1 - DRAG * s);
    ascP += ascV * s;
    if (ascP <= 0) { ascP = 0; ascV = 0; }
    if (ascP >= 1) { ascP = 1; ascV = 0; }
  }
  // launch rumble, scaled to velocity
  if (!RM) {
    const sh = Math.min(1, Math.abs(ascV) / 0.2);
    ascViewport.style.transform = sh > 0.03
      ? `translate(${((Math.random() - 0.5) * 5 * sh).toFixed(1)}px, ${((Math.random() - 0.5) * 5 * sh).toFixed(1)}px)`
      : '';
  }
  applyAscent();
}

function bindHold(btn, dir) {
  const start = e => { holdDir = dir; tweenTarget = null; if (e.pointerId != null) try { btn.setPointerCapture(e.pointerId); } catch (_) {} };
  const stop = () => { if (holdDir === dir) holdDir = 0; };
  btn.addEventListener('pointerdown', start);
  btn.addEventListener('pointerup', stop);
  btn.addEventListener('pointercancel', stop);
  btn.addEventListener('lostpointercapture', stop);
  btn.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { start(e); e.preventDefault(); } });
  btn.addEventListener('keyup', stop);
  btn.addEventListener('blur', stop);
}
bindHold(el('btnAscend'), 1);
bindHold(el('btnDescend'), -1);

ZONES.forEach((z, i) => {
  const b = document.createElement('button');
  b.type = 'button'; b.textContent = z.chip;
  b.setAttribute('aria-pressed', 'false');
  b.addEventListener('click', () => {
    tweenTarget = Z_CENTER[i];
    if (RM) { ascP = Z_CENTER[i]; tweenTarget = null; applyAscent(); }
  });
  stairChips.appendChild(b);
});

/* reduced motion: buttons step zone-by-zone instead of continuous flight */
if (RM) {
  el('btnAscend').addEventListener('click', () => { ascP = Z_CENTER[Math.min(3, zoneOf(ascP) + 1)]; applyAscent(); });
  el('btnDescend').addEventListener('click', () => { ascP = Z_CENTER[Math.max(0, zoneOf(ascP) - 1)]; applyAscent(); });
}

let ascVisible = false;
new IntersectionObserver(es => es.forEach(e => { ascVisible = e.isIntersecting; }), { rootMargin: '80px' })
  .observe(ascViewport);

applyAscent();   // paint the ground state

/* ── the deep field ──────────────────────────── */
const dfCanvas = el('dfCanvas');
const dctx = dfCanvas.getContext('2d');
const DF_N = MOBILE ? 280 : 460;
const GAL_TINTS = ['255,238,214', '206,222,255', '255,214,178', '228,234,255', '255,246,235'];
const galaxies = [];
for (let i = 0; i < DF_N; i++) {
  const big = Math.random() < 0.06;
  galaxies.push({
    x: 0.03 + Math.random() * 0.94, y: 0.03 + Math.random() * 0.94,
    rx: big ? 4 + Math.random() * 9 : 0.7 + Math.random() * 3,
    ell: 0.3 + Math.random() * 0.7,
    rot: Math.random() * Math.PI,
    tint: GAL_TINTS[i % GAL_TINTS.length],
    bright: 0.35 + Math.random() * 0.65,
    at: Math.pow(Math.random(), 0.75) * 0.9,   // brighter epochs reveal earlier
  });
}
galaxies.sort((a, b) => b.rx - a.rx).forEach((g, i) => { g.at = (i / DF_N) * 0.88; });

let dfP = 0, dfRunning = false, dfStart = 0, dfDone = false;
const DF_DUR = 9000;
function sizeDF() {
  // the plate may be height-capped into a non-square box — size to both axes
  const w = dfCanvas.clientWidth, h = dfCanvas.clientHeight;
  if (!w || !h) return;
  dfCanvas.width = Math.round(w * DPR);
  dfCanvas.height = Math.round(h * DPR);
  dctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
function drawDF() {
  const w = dfCanvas.clientWidth, h = dfCanvas.clientHeight;
  if (!w || !h) return;
  dctx.fillStyle = '#000';
  dctx.fillRect(0, 0, w, h);
  let found = 0;
  for (const g2 of galaxies) {
    const a = Math.max(0, Math.min(1, (dfP - g2.at) * 6)) * g2.bright;
    if (a <= 0.01) continue;
    found++;
    dctx.save();
    dctx.translate(g2.x * w, g2.y * h);
    dctx.rotate(g2.rot);
    dctx.scale(1, g2.ell);
    const grd = dctx.createRadialGradient(0, 0, 0, 0, 0, g2.rx * 2);
    grd.addColorStop(0, `rgba(${g2.tint},${a})`);
    grd.addColorStop(0.4, `rgba(${g2.tint},${a * 0.4})`);
    grd.addColorStop(1, `rgba(${g2.tint},0)`);
    dctx.fillStyle = grd;
    dctx.fillRect(-g2.rx * 2, -g2.rx * 2, g2.rx * 4, g2.rx * 4);
    dctx.restore();
  }
  return found;
}
function dfFrame(now) {
  if (!dfRunning) return;
  dfP = Math.min(1, (now - dfStart) / DF_DUR);
  const eased = 1 - Math.pow(1 - dfP, 2.4);
  const shown = drawDF();
  el('dfDay').textContent = `DAY ${Math.max(1, Math.ceil(dfP * 10))} / 10`;
  el('dfCount').textContent = Math.round(eased * 3000).toLocaleString('en-US');
  if (dfP >= 1) {
    dfRunning = false; dfDone = true;
    el('dfPunch').hidden = false;
    el('dfBtn').innerHTML = 'Stare again <span aria-hidden="true">◉</span>';
  }
}
el('dfBtn').addEventListener('click', () => {
  el('dfPunch').hidden = true;
  el('dfPlate').classList.add('exposing');
  if (RM) {  // no animation: full reveal at once
    dfP = 1; drawDF();
    el('dfDay').textContent = 'DAY 10 / 10';
    el('dfCount').textContent = '3,000';
    el('dfPunch').hidden = false;
    return;
  }
  dfP = 0; dfDone = false; dfRunning = true; dfStart = performance.now();
});

/* ── reveals + HUD + nav ─────────────────────── */
const revealIO = new IntersectionObserver(entries => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); }
}, { threshold: 0.25 });
document.querySelectorAll('.reveal-item, .line-mask, .sec-head').forEach(x => revealIO.observe(x));

const hudText = el('hudText');
const hudIO = new IntersectionObserver(entries => {
  for (const e of entries) if (e.isIntersecting && e.target.dataset.hud) hudText.textContent = e.target.dataset.hud;
}, { rootMargin: '-45% 0px -45% 0px' });
document.querySelectorAll('[data-hud]').forEach(s => hudIO.observe(s));

/* ── history — the ignition line ──────────────
   Comet position is scroll-linked; each milestone ignites
   as the comet reaches its dot. Giant era year ticks behind. */
const histWrap = el('histWrap');
const histYear = el('histYear');
const msList = el('milestonesList');
const msItems = [...document.querySelectorAll('.milestone')];
let msPos = [];
function measureHist() {
  const h = Math.max(1, histWrap.offsetHeight);
  msPos = msItems.map(li => (li.offsetTop + 36) / h);
}
let histVisible = false, lastYearTxt = '';
new IntersectionObserver(es => es.forEach(e => { histVisible = e.isIntersecting; }), { rootMargin: '120px' })
  .observe(histWrap);

function histFrame() {
  const r = histWrap.getBoundingClientRect();
  const p = clamp01((innerHeight * 0.72 - r.top) / Math.max(1, r.height));
  histWrap.style.setProperty('--fill', (p * 100).toFixed(2) + '%');
  let year = '1948';
  msItems.forEach((li, i) => {
    const lit = p >= msPos[i];
    li.classList.toggle('lit', lit);
    if (lit) year = li.querySelector('.ms-year').textContent;
  });
  if (year !== lastYearTxt) {
    lastYearTxt = year;
    histYear.textContent = year;
    histYear.classList.remove('tick');
    void histYear.offsetWidth;             // restart the tick animation
    histYear.classList.add('tick');
  }
}

const scrollHint = el('scrollHint');
const navProgress = document.querySelector('.nav-progress');
let lastNav = -1;
addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

function sizeAll() { sizeAmb(); sizeDF(); if (dfP > 0) drawDF(); measureHist(); }

let rt;
addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(sizeAll, 150); });

/* self-heal sizing (window may boot hidden) */
let sizeTick = 0;
function checkSizes() {
  if (amb.clientWidth && Math.round(amb.clientWidth * DPR) !== amb.width) sizeAll();
}

let lastTele = 0, lastFrameT = performance.now();
function frame(t) {
  const dt = Math.min(t - lastFrameT, 50); lastFrameT = t;
  if ((sizeTick++ & 31) === 0) checkSizes();
  drawAmb(t);
  if (ascVisible) ascentFrame(dt);
  if (histVisible) histFrame();
  dfFrame(t);
  if (t - lastTele > 120) { lastTele = t; telemetry(Date.now()); }  // ~8×/s is plenty
  if (scrollHint) scrollHint.style.opacity = scrollY > 80 ? '0' : '';
  const doc = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  const np = clamp01(scrollY / doc);
  if (Math.abs(np - lastNav) > 0.001) { lastNav = np; navProgress.style.transform = `scaleX(${np})`; }
  requestAnimationFrame(frame);
}

/* boot */
sizeAll();
telemetry(Date.now());
if (RM) {
  drawAmb(0);
  setInterval(() => telemetry(Date.now()), 1000);
  // static, fully-lit timeline
  msItems.forEach(li => li.classList.add('lit'));
  histWrap.style.setProperty('--fill', '100%');
  histYear.textContent = 'NOW';
}
else requestAnimationFrame(frame);
addEventListener('load', sizeAll);

/* release GPU resources when leaving */
addEventListener('beforeunload', () => { try { fleetModel.src = ''; } catch (e) {} });
