// ─────────────────────────────────────────────────────────────
//  X · Motion engine  — deterministic render(t) for frame-by-frame export
//  Logical canvas 1920×1080, rendered at SCALE (2 → 3840×2160)
// ─────────────────────────────────────────────────────────────
const W = 1920, H = 1080, CX = W / 2, CY = H / 2;
const params = new URLSearchParams(location.search);
const SCALE = parseFloat(params.get('scale') || '1');

const C = {
  black: '#000000', white: '#FFFFFF', blue: '#1D9BF0', celeste: '#1DA1F2',
  grey: '#71767B', line: '#2F3336', dark: '#16181C', soft: '#E7E9EA',
};
const RGB = {
  white: [1, 1, 1], blue: [29 / 255, 155 / 255, 240 / 255], celeste: [29 / 255, 161 / 255, 242 / 255],
  black: [0, 0, 0], grey: [113 / 255, 118 / 255, 123 / 255], dark: [22 / 255, 24 / 255, 28 / 255],
};

const canvas = document.getElementById('c');
canvas.width = W * SCALE; canvas.height = H * SCALE;
const ctx = canvas.getContext('2d', { alpha: false });

// ── math / easing ────────────────────────────────────────────
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const E = {
  lin: x => x,
  inQuad: x => x * x,
  outQuad: x => 1 - (1 - x) * (1 - x),
  inCubic: x => x * x * x,
  outCubic: x => 1 - Math.pow(1 - x, 3),
  inOutCubic: x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,
  outQuint: x => 1 - Math.pow(1 - x, 5),
  inExpo: x => x === 0 ? 0 : Math.pow(2, 10 * x - 10),
  outExpo: x => x === 1 ? 1 : 1 - Math.pow(2, -10 * x),
  inOutExpo: x => x === 0 ? 0 : x === 1 ? 1 : x < .5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2,
  outBack: x => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
  outBackS: x => { const c1 = 2.6, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
  inBack: x => { const c1 = 1.70158; return (c1 + 1) * x * x * x - c1 * x * x; },
  outElastic: x => x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - .75) * (2 * Math.PI) / 3) + 1,
};
function rng(seed) { // mulberry32
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const hash1 = n => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };
const fmt = (v, dec = 0) => {
  const s = v.toFixed(dec).split('.');
  s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return s.join(',');
};

// ── typography ───────────────────────────────────────────────
const DISP = 'Inter Display', TEXT = 'Inter';
function font(size, weight = 800, fam = DISP, ls = null) {
  ctx.font = `${weight} ${size}px "${fam}"`;
  const l = ls === null ? (size > 60 ? -0.045 : size > 30 ? -0.02 : 0) : ls;
  ctx.letterSpacing = (l * size).toFixed(2) + 'px';
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
}
function tw(str) { return ctx.measureText(str).width; }

// plain text with alignment
function text(str, x, y, o = {}) {
  ctx.save();
  font(o.size || 40, o.weight || 600, o.fam || DISP, o.ls ?? null);
  ctx.globalAlpha *= (o.alpha ?? 1);
  const w = tw(str);
  const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
  if (o.stroke) { ctx.strokeStyle = o.stroke; ctx.lineWidth = o.lw || 2; ctx.lineJoin = 'round'; ctx.strokeText(str, x0, y); }
  else { ctx.fillStyle = o.color || C.white; ctx.fillText(str, x0, y); }
  ctx.restore();
  return w;
}

// small-caps style label (like "CONSIGNA" in the brand book)
function label(str, x, y, t, o = {}) {
  const p = E.outExpo(prog(t, 0, .5));
  if (p <= 0) return;
  ctx.save();
  ctx.globalAlpha *= p * (o.alpha ?? 1);
  font(o.size || 20, o.weight || 700, TEXT, 0.16);
  ctx.fillStyle = o.color || C.grey;
  str = str.toUpperCase();
  const w = tw(str);
  const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
  ctx.beginPath(); ctx.rect(x0 - 4, y - (o.size || 20) * 1.1, w * p + 8, (o.size || 20) * 1.5); ctx.clip();
  ctx.fillText(str.toUpperCase(), x0 + (1 - p) * -30, y);
  ctx.restore();
}

/* Kinetic per-letter text.
   o: size, weight, fam, ls, color (string | fn(i,ch)), align, t (local time),
      st (stagger), dur, mode ('rise'|'pop'|'slide'|'drop'|'stretch'|'type'|'flip'|'fade'|'spread'),
      out (exit time), outDur, outMode, outSt, stroke, lw, alpha, dist, ease               */
function kt(str, x, y, o) {
  const size = o.size || 100, t = o.t;
  ctx.save();
  font(size, o.weight || 800, o.fam || DISP, o.ls ?? null);
  const chars = [...str];
  const pos = chars.map((_, i) => tw(chars.slice(0, i).join('')));
  const total = tw(str);
  const x0 = o.align === 'center' ? x - total / 2 : o.align === 'right' ? x - total : x;
  const st = o.st ?? 0.028, dur = o.dur ?? 0.6, mode = o.mode || 'rise';
  const outMode = o.outMode || (mode === 'rise' ? 'rise' : 'fade');
  const ease = o.ease || E.outExpo;
  ctx.globalAlpha *= (o.alpha ?? 1);
  if (mode === 'rise' || outMode === 'rise') {
    ctx.beginPath(); ctx.rect(x0 - size, y - size * 1.08, total + size * 2, size * 1.4); ctx.clip();
  }
  const ga = ctx.globalAlpha;
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (ch === ' ') continue;
    const ord = o.reverse ? chars.length - 1 - i : (o.order ? o.order(i, chars.length) : i);
    const p = clamp((t - ord * st) / dur);
    if (p <= 0) continue;
    const e = mode === 'type' ? 1 : ease(p);
    let q = 0;
    if (o.out != null) q = clamp((t - o.out - ord * (o.outSt ?? st * .6)) / (o.outDur ?? .45));
    if (q >= 1) continue;
    const qe = E.inExpo(q) * 0.5 + E.inCubic(q) * 0.5;
    const cw = tw(ch);
    let dx = 0, dy = 0, sx = 1, sy = 1, a = 1, rot = 0, smear = 0;
    switch (mode) {
      case 'rise': dy = (1 - e) * size * 1.15; break;
      case 'pop': sx = sy = E.outBackS(p); a = clamp(p * 4); break;
      case 'slide': dx = (1 - e) * (o.dist ?? 420); a = clamp(p * 3); smear = (1 - p) * (o.dist ?? 420) * 0.18; break;
      case 'drop': dy = -(1 - E.outBack(p)) * size * 1.4; a = clamp(p * 3); break;
      case 'stretch': sy = lerp(2.6, 1, e); sx = lerp(0.4, 1, e); a = clamp(p * 3); break;
      case 'flip': sy = E.outBack(p); a = clamp(p * 3); break;
      case 'fade': a = e; dy = (1 - e) * size * 0.25; break;
      case 'spread': dx = (1 - e) * ((pos[i] + cw / 2) - total / 2) * -0.9; a = clamp(p * 2.5); break;
      case 'type': break;
    }
    if (q > 0) {
      switch (outMode) {
        case 'rise': dy -= qe * size * 1.15; break;
        case 'fade': a *= 1 - q; break;
        case 'pop': sx *= 1 - qe; sy *= 1 - qe; break;
        case 'slide': dx -= qe * (o.outDist ?? 600); a *= 1 - q * q; smear = -q * 60; break;
        case 'fall': dy += qe * size * 1.5; rot = qe * (hash1(i + 3) - .5) * 1.2; a *= 1 - q; break;
        case 'scatter': dx += (hash1(i * 7.1) - .5) * qe * 700; dy += (hash1(i * 3.3) - .5) * qe * 500; rot = (hash1(i) - .5) * qe * 3; a *= 1 - q; break;
      }
    }
    const col = typeof o.color === 'function' ? o.color(i, ch) : (o.color || C.white);
    const px = x0 + pos[i] + dx, py = y + dy;
    const draw = (ox, al) => {
      ctx.save();
      ctx.globalAlpha = ga * a * al;
      ctx.translate(px + cw / 2 + ox, py - size * 0.35);
      if (rot) ctx.rotate(rot);
      ctx.scale(sx, sy);
      if (o.stroke) { ctx.strokeStyle = typeof o.stroke === 'function' ? o.stroke(i) : o.stroke; ctx.lineWidth = o.lw || 2; ctx.lineJoin = 'round'; ctx.strokeText(ch, -cw / 2, size * 0.35); }
      else { ctx.fillStyle = col; ctx.fillText(ch, -cw / 2, size * 0.35); }
      ctx.restore();
    };
    if (Math.abs(smear) > 2) for (let k = 4; k >= 1; k--) draw(smear * k * 0.4, 0.07);
    draw(0, 1);
  }
  ctx.restore();
  return { x0, w: total };
}

// rounded rect helper
function rrect(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, Math.max(0, w), h, Math.min(r, Math.abs(w) / 2, h / 2)); }

// ── camera / post ────────────────────────────────────────────
function camera(zoom = 1, rot = 0, dx = 0, dy = 0, ox = CX, oy = CY) {
  ctx.translate(ox + dx, oy + dy); ctx.rotate(rot); ctx.scale(zoom, zoom); ctx.translate(-ox, -oy);
}
function shake(t, t0, amt = 14, dur = .35) {
  const p = prog(t, t0, t0 + dur);
  if (p <= 0 || p >= 1) return [0, 0];
  const k = (1 - p) * (1 - p) * amt;
  return [Math.sin(t * 91.7) * k, Math.cos(t * 77.3) * k];
}
function flash(a, col = '#fff') { if (a <= 0) return; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = clamp(a); ctx.fillStyle = col; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.restore(); }

let vignetteCanvas = null;
function vignette() {
  if (!vignetteCanvas) {
    vignetteCanvas = document.createElement('canvas'); vignetteCanvas.width = W; vignetteCanvas.height = H;
    const v = vignetteCanvas.getContext('2d');
    const g = v.createRadialGradient(CX, CY, H * .55, CX, CY, H * 1.15);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.28)');
    v.fillStyle = g; v.fillRect(0, 0, W, H);
  }
  ctx.save(); ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0); ctx.drawImage(vignetteCanvas, 0, 0); ctx.restore();
}

// horizontal slice glitch on the already-drawn frame
const glitchBuf = document.createElement('canvas');
function glitch(amount, seed) {
  if (amount <= 0.001) return;
  glitchBuf.width = canvas.width; glitchBuf.height = canvas.height;
  const g = glitchBuf.getContext('2d'); g.drawImage(canvas, 0, 0);
  const r = rng(seed | 0);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  const n = 7 + Math.floor(r() * 6);
  for (let i = 0; i < n; i++) {
    const y = Math.floor(r() * canvas.height), h = Math.floor((8 + r() * 90) * SCALE);
    const off = (r() - .5) * 260 * amount * SCALE;
    ctx.drawImage(glitchBuf, 0, y, canvas.width, h, off, y, canvas.width, h);
    if (r() < .35) { ctx.globalAlpha = .5 * amount; ctx.fillStyle = r() < .5 ? C.blue : '#fff'; ctx.fillRect(0, y, canvas.width, Math.max(1, h * .08)); ctx.globalAlpha = 1; }
  }
  ctx.restore();
}

// blue slash wipe (the "/" of 1/6 as transition device). p: 0→1
function slashWipe(p, col = C.blue) {
  if (p <= 0 || p >= 1) return;
  const e = E.inOutExpo(p);
  const x = lerp(-W * 0.9, W * 1.9, e);
  const skew = 420;
  ctx.save(); ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  ctx.fillStyle = col;
  const w = W * 0.95;
  ctx.beginPath();
  ctx.moveTo(x - w / 2 + skew, -10); ctx.lineTo(x + w / 2 + skew, -10);
  ctx.lineTo(x + w / 2 - skew, H + 10); ctx.lineTo(x - w / 2 - skew, H + 10); ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 0.35;
  ctx.beginPath(); const x2 = x - w / 2 - 90;
  ctx.moveTo(x2 + skew - 40, -10); ctx.lineTo(x2 + skew, -10); ctx.lineTo(x2 - skew, H + 10); ctx.lineTo(x2 - skew - 40, H + 10); ctx.fill();
  ctx.restore();
}

// ── WebGL liquid renderer (SDF metaballs + X monogram morph) ─
const glc = document.createElement('canvas');
glc.width = W * SCALE; glc.height = H * SCALE;
const gl = glc.getContext('webgl2', { premultipliedAlpha: true, preserveDrawingBuffer: true, antialias: false });
const MAXB = 32;
const FS = `#version 300 es
precision highp float;
uniform vec2 uRes; uniform float uScale;
uniform vec4 uB[${MAXB}]; uniform vec3 uBC[${MAXB}]; uniform int uN; uniform float uUseBC;
uniform float uK; uniform vec4 uX; uniform float uXR;
uniform float uNoise, uTime, uNScale;
uniform vec3 uC1, uC2; uniform float uCM, uAlpha, uGloss, uRim;
out vec4 o;
float smin(float a, float b, float k){ float h = clamp(.5+.5*(b-a)/k, 0., 1.); return mix(b, a, h) - k*h*(1.-h); }
float sdPoly(vec2 p, vec2 v0, vec2 v1, vec2 v2, vec2 v3){
  vec2 v[4]; v[0]=v0; v[1]=v1; v[2]=v2; v[3]=v3;
  float d = dot(p-v[0],p-v[0]); float s = 1.0;
  for(int i=0, j=3; i<4; j=i, i++){
    vec2 e = v[j]-v[i]; vec2 w = p-v[i];
    vec2 b = w - e*clamp(dot(w,e)/dot(e,e),0.,1.);
    d = min(d, dot(b,b));
    bvec3 c = bvec3(p.y>=v[i].y, p.y<v[j].y, e.x*w.y>e.y*w.x);
    if(all(c) || all(not(c))) s*=-1.0;
  }
  return s*sqrt(d);
}
float sdX(vec2 p){
  // thick hollow band: top-left -> bottom-right
  float a = sdPoly(p, vec2(-0.98,-1.0), vec2(-0.47,-1.0), vec2(0.98,1.0), vec2(0.47,1.0));
  float ring = abs(a + 0.042) - 0.042;
  // thin stroke: bottom-left -> top-right, interrupted by the band
  float b = sdPoly(p, vec2(0.80,-1.0), vec2(0.95,-1.0), vec2(-0.80,1.0), vec2(-0.95,1.0));
  b = max(b, -(a - 0.055));
  return min(ring, b);
}
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
void main(){
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uScale;
  vec2 q = p;
  if(uNoise > 0.){
    vec2 np = p*uNScale;
    q += uNoise*(vec2(noise(np+vec2(uTime*.7, 0.)), noise(np+vec2(5.2, 1.3-uTime*.6)))-.5)*2.;
  }
  float d = 1e5; vec3 bc = vec3(0.); float wsum = 0.;
  for(int i=0;i<${MAXB};i++){
    if(i>=uN) break;
    vec4 b = uB[i];
    float di = length(q-b.xy) - b.z;
    d = smin(d, di, uK);
    if(uUseBC > .5){ float w = 1./pow(max(di + uK*1.5, 1.), 3.); bc += uBC[i]*w; wsum += w; }
  }
  if(uX.w > 0.){
    vec2 xp = (q - uX.xy) / uX.z;
    float dx = sdX(xp) * uX.z;
    d = (uN==0) ? dx : mix(d, dx, uX.w);
  }
  float aa = 0.9/uScale;
  float a = 1. - smoothstep(-aa, aa, d);
  if(a <= 0.){ o = vec4(0.); return; }
  vec3 col = mix(uC1, uC2, uCM);
  if(uUseBC > .5 && wsum > 0.) col = bc/wsum;
  float h = clamp(-d/34., 0., 1.); h = 1. - (1.-h)*(1.-h);
  vec2 g = vec2(dFdx(h), -dFdy(h)) * uScale * 26.;
  vec3 n = normalize(vec3(-g, 1.));
  vec3 L = normalize(vec3(-.55, -.65, .55));
  float diff = clamp(dot(n, L), 0., 1.);
  vec3 hv = normalize(L + vec3(0,0,1));
  float spec = pow(clamp(dot(n, hv), 0., 1.), 40.);
  col = col * mix(1., .72 + .38*diff, uGloss) + uGloss * spec * .85;
  float rim = (1. - smoothstep(0., 2.2, -d)) * uRim;
  col = mix(col, vec3(1.), rim);
  o = vec4(col * a * uAlpha, a * uAlpha);
}`;
const VS = `#version 300 es
in vec2 pos; void main(){ gl_Position = vec4(pos,0.,1.); }`;
function mkShader(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
const prog_ = gl.createProgram();
gl.attachShader(prog_, mkShader(gl.VERTEX_SHADER, VS)); gl.attachShader(prog_, mkShader(gl.FRAGMENT_SHADER, FS));
gl.linkProgram(prog_); if (!gl.getProgramParameter(prog_, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog_));
gl.useProgram(prog_);
const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
const pl = gl.getAttribLocation(prog_, 'pos'); gl.enableVertexAttribArray(pl); gl.vertexAttribPointer(pl, 2, gl.FLOAT, false, 0, 0);
const U = {}; ['uRes', 'uScale', 'uB', 'uBC', 'uN', 'uUseBC', 'uK', 'uX', 'uXR', 'uNoise', 'uTime', 'uNScale', 'uC1', 'uC2', 'uCM', 'uAlpha', 'uGloss', 'uRim'].forEach(n => U[n] = gl.getUniformLocation(prog_, n));
gl.viewport(0, 0, glc.width, glc.height);

/* liquid({balls:[{x,y,r,c?}], k, x:{x,y,s,m}, c1, c2, cm, noise, nscale, time, alpha, gloss, rim}) */
function liquid(o) {
  const balls = (o.balls || []).filter(b => b.r > 0.01).slice(0, MAXB);
  const B = new Float32Array(MAXB * 4), BC = new Float32Array(MAXB * 3);
  balls.forEach((b, i) => { B.set([b.x, b.y, b.r, 0], i * 4); BC.set(b.c || o.c1 || RGB.white, i * 3); });
  const xm = o.x ? o.x.m : 0;
  if (!balls.length && xm <= 0) return;
  gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
  gl.uniform2f(U.uRes, glc.width, glc.height); gl.uniform1f(U.uScale, SCALE);
  gl.uniform4fv(U.uB, B); gl.uniform3fv(U.uBC, BC); gl.uniform1i(U.uN, balls.length);
  gl.uniform1f(U.uUseBC, o.useBC ? 1 : 0);
  gl.uniform1f(U.uK, o.k ?? 30);
  gl.uniform4f(U.uX, o.x ? o.x.x : 0, o.x ? o.x.y : 0, o.x ? o.x.s : 1, xm);
  gl.uniform1f(U.uNoise, o.noise || 0); gl.uniform1f(U.uTime, o.time || 0); gl.uniform1f(U.uNScale, o.nscale || 0.008);
  gl.uniform3fv(U.uC1, o.c1 || RGB.white); gl.uniform3fv(U.uC2, o.c2 || o.c1 || RGB.white); gl.uniform1f(U.uCM, o.cm || 0);
  gl.uniform1f(U.uAlpha, o.alpha ?? 1); gl.uniform1f(U.uGloss, o.gloss ?? 0.5); gl.uniform1f(U.uRim, o.rim || 0);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  // composite with the current 2D transform (camera aware)
  ctx.save();
  const m = ctx.getTransform();
  ctx.setTransform(m.a / SCALE, m.b / SCALE, m.c / SCALE, m.d / SCALE, m.e, m.f);
  ctx.drawImage(glc, 0, 0);
  ctx.restore();
}

// ── timeline ────────────────────────────────────────────────
const SCENES = []; const CUES = [];
let cursor = 0;
function scene(name, dur, draw, opt = {}) { SCENES.push({ name, s: cursor, e: cursor + dur, dur, draw, ...opt }); const s = cursor; cursor += dur; return s; }
function cue(type, t, extra = {}) { CUES.push({ type, t: +t.toFixed(4), ...extra }); }

function render(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
  ctx.fillStyle = C.black; ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (const s of SCENES) {
    if (t >= s.s && t < s.e) {
      ctx.save(); ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
      s.draw(t - s.s, s.dur, t);
      ctx.restore();
    }
  }
  for (const fx of POST) fx(t);
  vignette();
}
const POST = [];
window.render = render;
window.CUES = CUES;
