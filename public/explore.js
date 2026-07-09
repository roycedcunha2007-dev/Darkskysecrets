/* ═══════════════════════════════════════════════════════
   EXPLORE — ambient sky · reveals · orrery · cosmic web
   Vanilla · one rAF for canvases · IO for reveals
   ═══════════════════════════════════════════════════════ */
'use strict';

const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const MOBILE = window.matchMedia('(max-width: 768px)').matches;
const DPR = Math.min(window.devicePixelRatio || 1, MOBILE ? 1.5 : 2);
if (RM) document.documentElement.classList.add('rm');

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const TAU = Math.PI * 2;

/* ── star sprite (soft disc) ─────────────────── */
function sprite(r) {
  const c = document.createElement('canvas');
  c.width = c.height = Math.ceil(r * 2);
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(r, r, 0, r, r, r);
  grd.addColorStop(0, 'rgba(220,238,255,1)');
  grd.addColorStop(0.4, 'rgba(190,214,248,0.5)');
  grd.addColorStop(1, 'rgba(190,214,248,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, c.width, c.height);
  return c;
}
const STAR = sprite(4);
const STAR_RED = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 8;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(4, 4, 0, 4, 4, 4);
  grd.addColorStop(0, 'rgba(255,190,160,1)');
  grd.addColorStop(0.4, 'rgba(255,95,70,0.6)');
  grd.addColorStop(1, 'rgba(255,95,70,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 8, 8);
  return c;
})();

/* ═══ ambient starfield ═══ */
const amb = document.getElementById('ambientCanvas');
const ac = amb.getContext('2d');
const ambStars = [];
for (let i = 0; i < (MOBILE ? 90 : 200); i++) {
  ambStars.push({
    x: Math.random(), y: Math.random(),
    s: Math.pow(Math.random(), 2.2) * 1.6 + 0.3,
    a: Math.random() * 0.5 + 0.2,
    ph: Math.random() * TAU, sp: Math.random() * 1.4 + 0.3,
  });
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

/* ═══ cosmic-web canvas ═══ */
const webCanvas = document.querySelector('.viz-web');
let web = null;
if (webCanvas) {
  const wc = webCanvas.getContext('2d');
  const N = MOBILE ? 26 : 42;
  const nodes = [];
  for (let i = 0; i < N; i++) {
    nodes.push({ x: Math.random(), y: Math.random(), r: Math.pow(Math.random(), 2) * 3 + 0.8, ph: Math.random() * TAU });
  }
  // connect each node to its 2 nearest neighbours → filament web
  const links = [];
  for (let i = 0; i < N; i++) {
    const d = [];
    for (let j = 0; j < N; j++) if (i !== j) d.push([j, (nodes[i].x - nodes[j].x) ** 2 + (nodes[i].y - nodes[j].y) ** 2]);
    d.sort((a, b) => a[1] - b[1]);
    for (let k = 0; k < 2; k++) links.push([i, d[k][0]]);
  }
  function sizeWeb() {
    const s = webCanvas.clientWidth || 340;
    webCanvas.width = webCanvas.height = Math.round(s * DPR);
    wc.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  web = { draw(t) {
    const s = webCanvas.clientWidth || 340;
    wc.clearRect(0, 0, s, s);
    wc.lineWidth = 0.6;
    for (const [a, b] of links) {
      const na = nodes[a], nb = nodes[b];
      const g = wc.createLinearGradient(na.x * s, na.y * s, nb.x * s, nb.y * s);
      g.addColorStop(0, 'rgba(95,212,244,0.22)');
      g.addColorStop(1, 'rgba(95,212,244,0.03)');
      wc.strokeStyle = g;
      wc.beginPath(); wc.moveTo(na.x * s, na.y * s); wc.lineTo(nb.x * s, nb.y * s); wc.stroke();
    }
    for (const n of nodes) {
      const tw = 0.6 + 0.4 * Math.sin(t * 0.0012 + n.ph);
      const size = STAR.width * (n.r * 0.6);
      wc.globalAlpha = tw;
      wc.drawImage(STAR, n.x * s - size / 2, n.y * s - size / 2, size, size);
    }
    wc.globalAlpha = 1;
  }, size: sizeWeb };
  sizeWeb();
}

/* ═══ orrery ═══ */
const PLANETS = [
  { name: 'Mercury', r: 0.15, sz: 3.0, sp: 1.60, col: '#b9a389', dia: '4,879 km', au: '0.39 AU', yr: '88 days', moons: '0', fact: 'The swiftest planet — a whole year passes in just 88 Earth days.' },
  { name: 'Venus',   r: 0.23, sz: 5.0, sp: 1.17, col: '#e6c07a', dia: '12,104 km', au: '0.72 AU', yr: '225 days', moons: '0', fact: 'A runaway greenhouse, hot enough at the surface to melt lead.' },
  { name: 'Earth',   r: 0.32, sz: 5.4, sp: 1.00, col: '#5fd4f4', dia: '12,742 km', au: '1.00 AU', yr: '365 days', moons: '1', fact: 'The only world we know of where someone is looking back up at the stars.' },
  { name: 'Mars',    r: 0.41, sz: 4.2, sp: 0.81, col: '#d9714b', dia: '6,779 km', au: '1.52 AU', yr: '687 days', moons: '2', fact: 'Home to Olympus Mons — the tallest volcano in the solar system.' },
  { name: 'Jupiter', r: 0.57, sz: 12,  sp: 0.44, col: '#c9a97e', dia: '139,820 km', au: '5.20 AU', yr: '12 years', moons: '95', fact: 'So vast it could swallow over 1,300 Earths whole.' },
  { name: 'Saturn',  r: 0.71, sz: 10,  sp: 0.32, col: '#e3d6a3', ring: true, dia: '116,460 km', au: '9.58 AU', yr: '29 years', moons: '146', fact: 'Its rings are mostly ice — some chunks the size of houses.' },
  { name: 'Uranus',  r: 0.85, sz: 7.0, sp: 0.23, col: '#a9e0e6', dia: '50,724 km', au: '19.2 AU', yr: '84 years', moons: '28', fact: 'Tipped fully on its side — it orbits the Sun rolling like a ball.' },
  { name: 'Neptune', r: 0.98, sz: 7.0, sp: 0.18, col: '#4f7cff', dia: '49,244 km', au: '30.1 AU', yr: '165 years', moons: '16', fact: 'Supersonic winds tear across it at up to 2,000 km/h.' },
];

const orrery = document.getElementById('orrery');
const octx = orrery.getContext('2d');
let oc = { w: 0, h: 0, cx: 0, cy: 0, maxR: 0 };
let selected = 2, hover = -1;
const angles = PLANETS.map(() => Math.random() * TAU);

function sizeOrrery() {
  const w = orrery.clientWidth, h = orrery.clientHeight;
  if (!w || !h) return;
  orrery.width = Math.round(w * DPR);
  orrery.height = Math.round(h * DPR);
  octx.setTransform(DPR, 0, 0, DPR, 0, 0);
  oc = { w, h, cx: w / 2, cy: h / 2, maxR: Math.min(w, h) * 0.46 };
}

function planetXY(i) {
  return [oc.cx + Math.cos(angles[i]) * PLANETS[i].r * oc.maxR,
          oc.cy + Math.sin(angles[i]) * PLANETS[i].r * oc.maxR];
}

function drawOrrery(dt) {
  const { w, h, cx, cy, maxR } = oc;
  if (!w) return;
  octx.clearRect(0, 0, w, h);

  // orbit rings
  for (let i = 0; i < PLANETS.length; i++) {
    octx.beginPath();
    octx.arc(cx, cy, PLANETS[i].r * maxR, 0, TAU);
    octx.strokeStyle = i === selected ? 'rgba(95,212,244,0.35)' : 'rgba(154,163,178,0.10)';
    octx.lineWidth = 1;
    octx.stroke();
  }

  // sun
  const sun = octx.createRadialGradient(cx, cy, 0, cx, cy, 22);
  sun.addColorStop(0, '#fff');
  sun.addColorStop(0.4, '#ffe08a');
  sun.addColorStop(1, 'rgba(255,160,60,0)');
  octx.fillStyle = sun;
  octx.beginPath(); octx.arc(cx, cy, 22, 0, TAU); octx.fill();

  // planets
  for (let i = 0; i < PLANETS.length; i++) {
    if (!RM) angles[i] += dt * 0.00018 * PLANETS[i].sp;
    const [x, y] = planetXY(i);
    const p = PLANETS[i];
    const on = i === selected || i === hover;

    if (p.ring) {
      octx.save();
      octx.translate(x, y); octx.rotate(-0.5); octx.scale(1, 0.38);
      octx.beginPath(); octx.arc(0, 0, p.sz + 6, 0, TAU);
      octx.strokeStyle = 'rgba(227,214,163,0.6)'; octx.lineWidth = 2; octx.stroke();
      octx.restore();
    }
    if (on) {
      octx.beginPath(); octx.arc(x, y, p.sz + 7, 0, TAU);
      octx.strokeStyle = 'rgba(95,212,244,0.8)'; octx.lineWidth = 1.4; octx.stroke();
    }
    octx.beginPath(); octx.arc(x, y, p.sz, 0, TAU);
    octx.fillStyle = p.col;
    octx.shadowColor = p.col; octx.shadowBlur = on ? 16 : 6;
    octx.fill();
    octx.shadowBlur = 0;

    if (on) {
      octx.font = '600 11px "IBM Plex Mono", monospace';
      octx.fillStyle = '#f2f4f8';
      octx.textAlign = 'center';
      octx.fillText(p.name.toUpperCase(), x, y - p.sz - 12);
    }
  }
}

/* panel + chips */
const el = id => document.getElementById(id);
function selectPlanet(i) {
  selected = i;
  const p = PLANETS[i];
  el('pIndex').textContent = `PLANET ${String(i + 1).padStart(2, '0')} / 08`;
  el('pName').textContent = p.name;
  el('pFact').textContent = p.fact;
  el('pDia').textContent = p.dia;
  el('pDist').textContent = p.au;
  el('pYear').textContent = p.yr;
  el('pMoons').textContent = p.moons;
  [...chips.children].forEach((c, k) => c.setAttribute('aria-selected', k === i));
}

const chips = document.getElementById('planetChips');
PLANETS.forEach((p, i) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = p.name;
  b.setAttribute('role', 'tab');
  b.setAttribute('aria-selected', i === selected);
  b.addEventListener('click', () => selectPlanet(i));
  chips.appendChild(b);
});
selectPlanet(2);

// hit-test the canvas
function pick(e) {
  const rect = orrery.getBoundingClientRect();
  const mx = e.clientX - rect.left, my = e.clientY - rect.top;
  let best = -1, bd = 22 * 22;
  for (let i = 0; i < PLANETS.length; i++) {
    const [x, y] = planetXY(i);
    const d = (x - mx) ** 2 + (y - my) ** 2;
    if (d < bd) { bd = d; best = i; }
  }
  return best;
}
orrery.addEventListener('mousemove', e => {
  hover = pick(e);
  orrery.style.cursor = hover >= 0 ? 'pointer' : 'crosshair';
});
orrery.addEventListener('mouseleave', () => { hover = -1; });
orrery.addEventListener('click', e => { const i = pick(e); if (i >= 0) selectPlanet(i); });

/* ═══ hero planet — a world whose cities glow too ═══ */
const planetCanvas = document.getElementById('heroPlanet');
const pctx = planetCanvas.getContext('2d');
let planetTex = null, planetLights = null, planetTmp = null;

function buildPlanetTex() {
  const w = 720, h = 360;
  planetTex = document.createElement('canvas');
  planetTex.width = w; planetTex.height = h;
  const g = planetTex.getContext('2d');
  g.fillStyle = '#0b1626';
  g.fillRect(0, 0, w, h);
  // cloud bands
  for (let i = 0; i < 46; i++) {
    const y = Math.random() * h, bh = 6 + Math.random() * 26;
    g.fillStyle = ['#122640', '#1c3a56', '#0e1b2c', '#16304a'][i % 4];
    g.globalAlpha = 0.25 + Math.random() * 0.4;
    g.fillRect(-20, y, w + 40, bh);
  }
  // faint storms
  for (let i = 0; i < 14; i++) {
    const x = Math.random() * w, y = Math.random() * h, r = 8 + Math.random() * 22;
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, 'rgba(95,212,244,0.16)');
    grd.addColorStop(1, 'rgba(95,212,244,0)');
    g.globalAlpha = 1;
    g.fillStyle = grd;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  g.globalAlpha = 1;
  // night lights — clustered amber settlements
  planetLights = document.createElement('canvas');
  planetLights.width = w; planetLights.height = h;
  const lg = planetLights.getContext('2d');
  for (let c = 0; c < 26; c++) {
    const cx = Math.random() * w, cy = h * 0.15 + Math.random() * h * 0.7;
    for (let i = 0; i < 16; i++) {
      const x = cx + (Math.random() + Math.random() - 1) * 26;
      const y = cy + (Math.random() + Math.random() - 1) * 14;
      lg.fillStyle = `rgba(255,${170 + Math.random() * 50 | 0},70,${0.35 + Math.random() * 0.6})`;
      const s = Math.random() < 0.12 ? 2.2 : 1.2;
      lg.fillRect(x, y, s, s);
    }
  }
}
buildPlanetTex();

function sizePlanet() {
  const s = planetCanvas.clientWidth;
  if (!s) return;
  planetCanvas.width = planetCanvas.height = Math.round(s * DPR);
  pctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  planetTmp = document.createElement('canvas');
  planetTmp.width = planetTmp.height = Math.round(s * DPR);
}
function drawPlanet(t) {
  const s = planetCanvas.clientWidth;
  if (!s || !planetTmp) return;
  const r = s / 2;
  const off = (t * 0.006) % planetTex.width;
  pctx.clearRect(0, 0, s, s);
  pctx.save();
  pctx.beginPath(); pctx.arc(r, r, r - 2, 0, TAU); pctx.clip();
  // scrolling surface
  const scale = s / planetTex.height;
  pctx.drawImage(planetTex, -off * scale, 0, planetTex.width * scale, s);
  pctx.drawImage(planetTex, (planetTex.width - off) * scale, 0, planetTex.width * scale, s);
  // day-side sheen
  let grd = pctx.createRadialGradient(r * 0.55, r * 0.6, 0, r * 0.55, r * 0.6, s);
  grd.addColorStop(0, 'rgba(190,225,255,0.10)');
  grd.addColorStop(0.5, 'rgba(190,225,255,0)');
  pctx.fillStyle = grd; pctx.fillRect(0, 0, s, s);
  // terminator shadow (right side = night)
  grd = pctx.createLinearGradient(0, 0, s, 0);
  grd.addColorStop(0, 'rgba(2,3,8,0)');
  grd.addColorStop(0.52, 'rgba(2,3,8,0.05)');
  grd.addColorStop(0.78, 'rgba(2,3,8,0.82)');
  grd.addColorStop(1, 'rgba(2,3,8,0.96)');
  pctx.fillStyle = grd; pctx.fillRect(0, 0, s, s);
  pctx.restore();

  // night-side city lights, masked to the shadowed half
  const tg = planetTmp.getContext('2d');
  tg.setTransform(DPR, 0, 0, DPR, 0, 0);
  tg.clearRect(0, 0, s, s);
  tg.save();
  tg.beginPath(); tg.arc(r, r, r - 2, 0, TAU); tg.clip();
  tg.drawImage(planetLights, -off * scale, 0, planetTex.width * scale, s);
  tg.drawImage(planetLights, (planetTex.width - off) * scale, 0, planetTex.width * scale, s);
  tg.restore();
  tg.globalCompositeOperation = 'destination-in';
  const mg = tg.createLinearGradient(0, 0, s, 0);
  mg.addColorStop(0, 'rgba(0,0,0,0)');
  mg.addColorStop(0.55, 'rgba(0,0,0,0)');
  mg.addColorStop(0.8, 'rgba(0,0,0,1)');
  tg.fillStyle = mg; tg.fillRect(0, 0, s, s);
  tg.globalCompositeOperation = 'source-over';
  pctx.drawImage(planetTmp, 0, 0, s, s);

  // atmosphere rim
  pctx.beginPath(); pctx.arc(r, r, r - 2, 0, TAU);
  pctx.strokeStyle = 'rgba(95,212,244,0.5)';
  pctx.lineWidth = 1.2;
  pctx.shadowColor = 'rgba(95,212,244,0.8)';
  pctx.shadowBlur = 14;
  pctx.stroke();
  pctx.shadowBlur = 0;
}

/* ═══ constellation atlas ═══ */
const CONST = [
  { name: 'Orion', meaning: 'The Hunter', season: 'January', star: 'Rigel', key: 'The 3-star belt',
    story: 'The most recognisable figure in the sky, visible from every inhabited place on Earth. His belt points to half the winter sky.',
    stars: [[0.36,0.24],[0.62,0.28],[0.44,0.50],[0.51,0.485],[0.58,0.47],[0.40,0.78],[0.68,0.74],[0.49,0.12]],
    links: [[0,2],[1,4],[2,3],[3,4],[2,5],[4,6],[0,7],[7,1]] },
  { name: 'Ursa Major', meaning: 'The Great Bear', season: 'April', star: 'Alioth', key: 'The Big Dipper',
    story: 'The Dipper’s two edge stars point straight to Polaris — for centuries, the escape route north was written in this bear.',
    stars: [[0.74,0.30],[0.72,0.46],[0.56,0.50],[0.56,0.36],[0.43,0.34],[0.32,0.29],[0.20,0.37]],
    links: [[0,1],[1,2],[2,3],[3,0],[3,4],[4,5],[5,6]] },
  { name: 'Cassiopeia', meaning: 'The Queen', season: 'November', star: 'Schedar', key: 'The bright W shape',
    story: 'A vain queen chained to her throne, circling the pole forever. Her unmistakable W never sets from northern latitudes.',
    stars: [[0.20,0.44],[0.35,0.54],[0.50,0.40],[0.65,0.52],[0.79,0.38]],
    links: [[0,1],[1,2],[2,3],[3,4]] },
  { name: 'Scorpius', meaning: 'The Scorpion', season: 'July', star: 'Antares', key: 'Red Antares, its heart',
    story: 'The scorpion that killed Orion — the gods placed them on opposite sides of the sky so they would never meet again.',
    stars: [[0.62,0.14],[0.55,0.22],[0.46,0.32],[0.42,0.46],[0.44,0.60],[0.52,0.71],[0.63,0.77],[0.72,0.71],[0.74,0.62]],
    links: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8]], red: 2 },
  { name: 'Cygnus', meaning: 'The Swan', season: 'September', star: 'Deneb', key: 'The Northern Cross',
    story: 'A swan flying down the Milky Way itself. Deneb, its tail, shines from 2,600 light-years away — one of the most luminous stars known.',
    stars: [[0.50,0.14],[0.50,0.44],[0.50,0.80],[0.26,0.54],[0.74,0.34]],
    links: [[0,1],[1,2],[1,3],[1,4]] },
  { name: 'Leo', meaning: 'The Lion', season: 'April', star: 'Regulus', key: 'The backwards question mark',
    story: 'One of the oldest constellations — the lion was already stalking Mesopotamian skies 6,000 years ago.',
    stars: [[0.62,0.64],[0.62,0.50],[0.64,0.39],[0.57,0.30],[0.47,0.27],[0.41,0.34],[0.30,0.56],[0.16,0.52],[0.28,0.42]],
    links: [[0,1],[1,2],[2,3],[3,4],[4,5],[0,6],[6,7],[7,8],[8,2]] },
];
const constCanvas = document.getElementById('constCanvas');
const cctx = constCanvas.getContext('2d');
let cSel = 0, cLineP = 1, cBg = [];
for (let i = 0; i < 120; i++) cBg.push([Math.random(), Math.random(), Math.random() * 0.8 + 0.3, Math.random() * TAU]);

function sizeConst() {
  const w = constCanvas.clientWidth, h = constCanvas.clientHeight;
  if (!w) return;
  constCanvas.width = Math.round(w * DPR);
  constCanvas.height = Math.round(h * DPR);
  cctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
function drawConst(t) {
  const w = constCanvas.clientWidth, h = constCanvas.clientHeight;
  if (!w) return;
  cctx.clearRect(0, 0, w, h);
  // faint field
  for (const [x, y, s, ph] of cBg) {
    cctx.globalAlpha = 0.25 * (0.6 + 0.4 * Math.sin(t * 0.001 + ph));
    const sz = STAR.width * s * 0.5;
    cctx.drawImage(STAR, x * w - sz / 2, y * h - sz / 2, sz, sz);
  }
  cctx.globalAlpha = 1;
  const c = CONST[cSel];
  const pad = 0.12;
  const px = v => (pad + v * (1 - pad * 2)) * w;
  const py = v => (pad + v * (1 - pad * 2)) * h;
  // lines draw themselves
  if (!RM && cLineP < 1) cLineP = Math.min(1, cLineP + 0.016);
  const per = c.links.length;
  c.links.forEach(([a, b], i) => {
    const f = clamp01(cLineP * per - i);
    if (f <= 0) return;
    const ax = px(c.stars[a][0]), ay = py(c.stars[a][1]);
    const bx = px(c.stars[b][0]), by = py(c.stars[b][1]);
    cctx.strokeStyle = 'rgba(95,212,244,0.45)';
    cctx.lineWidth = 1;
    cctx.beginPath();
    cctx.moveTo(ax, ay);
    cctx.lineTo(lerp(ax, bx, f), lerp(ay, by, f));
    cctx.stroke();
  });
  // constellation stars
  c.stars.forEach(([x, y], i) => {
    const isRed = c.red === i;
    const sz = STAR.width * (i === 0 || isRed ? 2.4 : 1.7);
    cctx.globalAlpha = 0.85 + 0.15 * Math.sin(t * 0.002 + i);
    cctx.drawImage(isRed ? STAR_RED : STAR, px(x) - sz / 2, py(y) - sz / 2, sz, sz);
  });
  cctx.globalAlpha = 1;
}
function selectConst(i) {
  cSel = i;
  cLineP = RM ? 1 : 0;
  const c = CONST[i];
  el('cIndex').textContent = `CONSTELLATION ${String(i + 1).padStart(2, '0')} / 06`;
  el('cName').textContent = c.name;
  el('cStory').textContent = c.story;
  el('cMeaning').textContent = c.meaning;
  el('cSeason').textContent = c.season;
  el('cStar').textContent = c.star;
  el('cKey').textContent = c.key;
  [...constChips.children].forEach((b, k) => b.setAttribute('aria-selected', k === i));
}
const constChips = document.getElementById('constChips');
CONST.forEach((c, i) => {
  const b = document.createElement('button');
  b.type = 'button'; b.textContent = c.name;
  b.setAttribute('role', 'tab');
  b.addEventListener('click', () => selectConst(i));
  constChips.appendChild(b);
});

/* ═══ ride a photon ═══ */
const DESTS = [
  { n: 'THE MOON', lt: 1.28, speed: 'REAL TIME', dur: 1.28 },
  { n: 'MARS · CLOSEST', lt: 182, speed: '×60 SPEED', dur: 3.0 },
  { n: 'THE SUN', lt: 499, speed: '×120 SPEED', dur: 4.2 },
  { n: 'JUPITER', lt: 2520, speed: '×600 SPEED', dur: 4.2 },
  { n: 'NEPTUNE', lt: 14400, speed: '×3,600 SPEED', dur: 4.0 },
  { n: 'VOYAGER 1', lt: 82800, speed: '×20,000 SPEED', dur: 4.1 },
  { n: 'PROXIMA CENTAURI', lt: 1.338e8, speed: '×40 MILLION SPEED', dur: 3.4 },
  { n: 'ANDROMEDA', lt: 7.89e13, speed: '×25 TRILLION SPEED', dur: 3.2 },
];
function fmtLT(s) {
  if (s < 60) return s.toFixed(2) + ' s';
  if (s < 3600) return `${Math.floor(s / 60)} min ${Math.round(s % 60)} s`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ${Math.round((s % 3600) / 60)} min`;
  if (s < 3.15e7 * 2) return `${(s / 86400).toFixed(1)} days`;
  return `${Math.round(s / 3.156e7).toLocaleString('en-IN')} years`;
}
const photonDot = el('photonDot');
const photonProgress = el('photonProgress');
let flight = null; // {d, start}
function setPhotonPos(p) {
  photonDot.style.left = (p * 100) + '%';
  photonProgress.style.width = (p * 100) + '%';
}
function launchPhoton(i) {
  const d = DESTS[i];
  el('photonDestLabel').textContent = d.n;
  el('photonSpeed').textContent = d.speed;
  [...photonChips.children].forEach((b, k) => b.setAttribute('aria-pressed', k === i));
  photonDot.classList.add('flying');
  if (RM) { // no animation: report the answer directly
    setPhotonPos(1);
    el('photonTime').textContent = fmtLT(d.lt);
    el('photonStatus').textContent = `ARRIVED · ${fmtLT(d.lt)} OF LIGHT-TIME`;
    flight = null;
    return;
  }
  el('photonStatus').textContent = 'IN FLIGHT → ' + d.n;
  flight = { d, start: performance.now() };
}
function photonFrame(now) {
  if (!flight) return;
  const { d, start } = flight;
  const p = clamp01((now - start) / (d.dur * 1000));
  setPhotonPos(p);
  el('photonTime').textContent = fmtLT(p * d.lt);
  if (p >= 1) {
    el('photonStatus').textContent = `ARRIVED · ${fmtLT(d.lt)} OF LIGHT-TIME`;
    flight = null;
  }
}
const photonChips = document.getElementById('photonChips');
DESTS.forEach((d, i) => {
  const b = document.createElement('button');
  b.type = 'button'; b.textContent = d.n.toLowerCase();
  b.style.textTransform = 'capitalize';
  b.setAttribute('aria-pressed', 'false');
  b.addEventListener('click', () => launchPhoton(i));
  photonChips.appendChild(b);
});

/* ═══ cosmic calendar ═══ */
const CAL = [
  { date: 'JANUARY 1 · 00:00:00', short: 'BIG BANG', frac: 0, ago: '13.8 BILLION YEARS AGO', t: 'The Big Bang',
    d: 'Space, time, matter and energy all begin at once. The universe is a searing, formless fog.' },
  { date: 'JANUARY 10', short: 'FIRST STARS', frac: 0.026, ago: '13.6 BILLION YEARS AGO', t: 'The First Stars',
    d: 'Gravity gathers primordial hydrogen into the first stars. For the first time, there is light.' },
  { date: 'MARCH 16', short: 'MILKY WAY', frac: 0.205, ago: '11 BILLION YEARS AGO', t: 'The Milky Way Forms',
    d: 'Our galaxy assembles from smaller ones — a slow spiral of billions of stars taking shape.' },
  { date: 'AUGUST 31', short: 'THE SUN', frac: 0.663, ago: '4.6 BILLION YEARS AGO', t: 'The Sun Ignites',
    d: 'An ordinary star switches on in a quiet spiral arm, two-thirds of the way through the year. Ours.' },
  { date: 'SEPTEMBER 6', short: 'EARTH', frac: 0.678, ago: '4.5 BILLION YEARS AGO', t: 'Earth Forms',
    d: 'Dust and rock clump into a molten young world, still being hammered by everything left over.' },
  { date: 'SEPTEMBER 21', short: 'FIRST LIFE', frac: 0.723, ago: '3.8 BILLION YEARS AGO', t: 'First Life',
    d: 'Single cells appear in the young oceans — remarkably soon after the planet cools.' },
  { date: 'DECEMBER 5', short: 'COMPLEX LIFE', frac: 0.928, ago: '800 MILLION YEARS AGO', t: 'Complex Life',
    d: 'After billions of years of microbes, cells finally band together into the first larger life.' },
  { date: 'DECEMBER 17', short: 'CAMBRIAN', frac: 0.962, ago: '540 MILLION YEARS AGO', t: 'The Cambrian Explosion',
    d: 'In a geological instant, animal life erupts into a riot of new forms — eyes, shells, spines.' },
  { date: 'DECEMBER 25', short: 'DINOSAURS', frac: 0.984, ago: '230 MILLION YEARS AGO', t: 'The Dinosaurs',
    d: 'Reptiles rise to rule the land, sea and air — and hold that reign for 165 million years.' },
  { date: 'DECEMBER 30', short: 'EXTINCTION', frac: 0.9975, ago: '66 MILLION YEARS AGO', t: 'The Dinosaurs Vanish',
    d: 'A single asteroid ends their reign in an afternoon — and clears the stage for mammals.' },
  { date: 'DECEMBER 31 · 22:24', short: 'FIRST HUMANS', frac: 0.99934, ago: '2.5 MILLION YEARS AGO', t: 'The First Humans',
    d: 'The genus Homo appears in Africa — in the last ninety minutes of the entire cosmic year.' },
  { date: 'DECEMBER 31 · 23:52', short: 'US', frac: 0.99993, ago: '300,000 YEARS AGO', t: 'Us',
    d: 'Homo sapiens. Every empire, every name you know, all of recorded history — the final 14 seconds before midnight.' },
];

const calTrack = el('calTrack'), calScrub = el('calScrub'), calFill = el('calFill'), calEvents = el('calEvents');
const MONTHS = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
function cosmicDate(frac) {
  const dayF = Math.min(frac * 365, 364.999);
  const d = new Date(2025, 0, 1); d.setDate(d.getDate() + Math.floor(dayF));
  let s = `${MONTHS[d.getMonth()]} ${d.getDate()}`;
  if (frac >= 363 / 365) { // final day → tick down to midnight
    const secs = (dayF - Math.floor(dayF)) * 86400;
    const hh = String(Math.floor(secs / 3600)).padStart(2, '0');
    const mm = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
    const ss = String(Math.floor(secs % 60)).padStart(2, '0');
    s += ` · ${hh}:${mm}:${ss}`;
  }
  return s;
}
function setCal(frac, isEvent) {
  frac = clamp01(frac);
  calScrub.style.left = (frac * 100) + '%';
  calFill.style.width = (frac * 100) + '%';
  calTrack.setAttribute('aria-valuenow', Math.round(frac * 100));
  let idx = 0;
  for (let i = 0; i < CAL.length; i++) if (frac >= CAL[i].frac - 1e-7) idx = i;
  const e = CAL[idx];
  el('calTitle').textContent = e.t;
  el('calDesc').textContent = e.d;
  el('calAgo').textContent = e.ago;
  el('calDate').textContent = isEvent ? e.date : cosmicDate(frac);
  calTrack.setAttribute('aria-valuetext', `${e.date} — ${e.t}`);
  [...calEvents.children].forEach((b, k) => b.classList.toggle('on', k === idx));
}
CAL.forEach((e, i) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'cal-ev';
  b.style.left = (e.frac * 100) + '%';
  b.dataset.short = e.short;
  b.setAttribute('aria-label', `${e.date}: ${e.t}`);
  b.addEventListener('pointerdown', ev => ev.stopPropagation());
  b.addEventListener('click', ev => { ev.stopPropagation(); setCal(e.frac, true); });
  calEvents.appendChild(b);
});
let calDrag = false;
const calFrac = e => (e.clientX - calTrack.getBoundingClientRect().left) / calTrack.clientWidth;
calTrack.addEventListener('pointerdown', e => { calDrag = true; calTrack.setPointerCapture(e.pointerId); setCal(calFrac(e), false); });
calTrack.addEventListener('pointermove', e => { if (calDrag) setCal(calFrac(e), false); });
addEventListener('pointerup', () => { calDrag = false; });
calTrack.addEventListener('keydown', e => {
  const cur = Number(calTrack.getAttribute('aria-valuenow')) / 100;
  if (e.key === 'ArrowRight') { setCal(cur + 0.02, false); e.preventDefault(); }
  if (e.key === 'ArrowLeft') { setCal(cur - 0.02, false); e.preventDefault(); }
});

/* ═══ reveals + HUD + nav progress ═══ */
const revealIO = new IntersectionObserver(entries => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); }
}, { threshold: 0.28 });
document.querySelectorAll('.reveal-item, .line-mask, .sec-head').forEach(x => revealIO.observe(x));

const inviewIO = new IntersectionObserver(entries => {
  for (const e of entries) if (e.isIntersecting) e.target.classList.add('in');
}, { threshold: 0.15 });
document.querySelectorAll('[data-inview]').forEach(x => inviewIO.observe(x));

const hudText = document.getElementById('hudText');
const hudIO = new IntersectionObserver(entries => {
  for (const e of entries) if (e.isIntersecting && e.target.dataset.hud) hudText.textContent = e.target.dataset.hud;
}, { rootMargin: '-45% 0px -45% 0px' });
document.querySelectorAll('[data-hud]').forEach(s => hudIO.observe(s));

// visibility gates for the heavy canvases
let orreryVisible = false, webVisible = false, planetVisible = true, constVisible = false;
const gateIO = new IntersectionObserver(es => es.forEach(e => {
  if (e.target === orrery) orreryVisible = e.isIntersecting;
  else if (e.target === webCanvas) webVisible = e.isIntersecting;
  else if (e.target === planetCanvas) planetVisible = e.isIntersecting;
  else if (e.target === constCanvas) constVisible = e.isIntersecting;
}), { rootMargin: '80px' });
gateIO.observe(orrery);
if (webCanvas) gateIO.observe(webCanvas);
gateIO.observe(planetCanvas);
gateIO.observe(constCanvas);

const scrollHint = document.getElementById('scrollHint');
const navProgress = document.querySelector('.nav-progress');
let lastNav = -1;

addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

let rt;
function sizeAll() { sizeAmb(); sizeOrrery(); sizePlanet(); sizeConst(); if (web) web.size(); }
addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(sizeAll, 150); });

/* self-heal: window may boot hidden/tiny — verify sizes every ~32 frames */
let sizeTick = 0;
function checkSizes() {
  if (amb.clientWidth && Math.round(amb.clientWidth * DPR) !== amb.width) sizeAll();
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(now - last, 50); last = now;
  if ((sizeTick++ & 31) === 0) checkSizes();
  drawAmb(now);
  if (planetVisible) drawPlanet(now);
  if (orreryVisible) drawOrrery(dt);
  if (constVisible) drawConst(now);
  if (web && webVisible) web.draw(now);
  photonFrame(now);

  if (scrollHint) scrollHint.style.opacity = scrollY > 80 ? '0' : '';
  const doc = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  const np = clamp01(scrollY / doc);
  if (Math.abs(np - lastNav) > 0.001) { lastNav = np; navProgress.style.transform = `scaleX(${np})`; }
  requestAnimationFrame(frame);
}

/* boot */
sizeAll();
selectConst(0);
setCal(0, true);
if (RM) { drawAmb(0); drawPlanet(0); drawOrrery(0); drawConst(0); if (web) web.draw(0); }
else requestAnimationFrame(frame);

addEventListener('load', sizeAll);
