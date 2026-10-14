// ─────────────────────────────────────────────────────────────
//  X · ¿Qué está pasando?  — scenes
// ─────────────────────────────────────────────────────────────
const GLITCH = [];      // [t0, dur, amount]
const WIPES = [];       // [t0, dur]
const FLASH = [];       // [t0, dur, amount, color]
const hl = (str, word, base, accent) => { const a = str.indexOf(word), b = a + [...word].length; return i => (i >= a && i < b ? accent : base); };
const hlAll = (str, words, base, accent) => { const r = []; for (const w of words) { const a = str.indexOf(w); if (a >= 0) r.push([a, a + [...w].length]); } return i => r.some(([a, b]) => i >= a && i < b) ? accent : base; };


function header(lt, n, tag) {
  const a = E.outCubic(prog(lt, 0, .4));
  ctx.save(); ctx.globalAlpha *= a;
  font(20, 600, TEXT, 0.02); ctx.fillStyle = C.grey;
  ctx.fillText('X (ex Twitter) · Construcción y Gestión de Marca', 120, 78);
  font(20, 700, TEXT, 0.02); ctx.fillStyle = C.blue;
  const s = `${n}/6 ${tag}`; ctx.fillText(s, W - 120 - tw(s), 78);
  ctx.fillStyle = C.line; ctx.fillRect(120, 96, (W - 240) * E.outExpo(prog(lt, 0, .8)), 1.5);
  ctx.restore();
}
function exitAlpha(lt, dur, len = .3) { return 1 - E.inCubic(prog(lt, dur - len, dur)); }

// ════════════════════════ INTRO ════════════════════════════
// bird → X: two diagonal blades cut the bird, the pieces fly off and the X slams in.
const BLADE_A = 52 * Math.PI / 180, BLADE_B = 128 * Math.PI / 180;
function birdToX(lt, t0, bx, by, bs, xx, xy, xs, s0 = 4.2, wave = 900) {
  const rel = lt - t0;
  // blades
  [[BLADE_A, 0], [BLADE_B, .2]].forEach(([a, d]) => {
    const p = prog(rel, d, d + .12), q = prog(rel, d + .12, d + .45);
    if (p <= 0 || q >= 1) return;
    const L = 2600 * E.outExpo(p), dx = Math.cos(a) * L / 2, dy = Math.sin(a) * L / 2;
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = `rgba(29,155,240,${.5 * (1 - q)})`; ctx.lineWidth = 26 * (1 - q);
    ctx.beginPath(); ctx.moveTo(bx - dx, by - dy); ctx.lineTo(bx + dx, by + dy); ctx.stroke();
    ctx.strokeStyle = `rgba(255,255,255,${1 - q})`; ctx.lineWidth = 6 * (1 - q) + 1;
    ctx.beginPath(); ctx.moveTo(bx - dx, by - dy); ctx.lineTo(bx + dx, by + dy); ctx.stroke();
    ctx.restore();
  });
  if (rel < .4) {
    drawBird(bx, by, bs);
    // the cuts already made
    ctx.save(); ctx.strokeStyle = '#000'; ctx.lineWidth = 9;
    [[BLADE_A, .06], [BLADE_B, .26]].forEach(([a, d]) => {
      if (rel < d) return;
      const dx = Math.cos(a) * 700, dy = Math.sin(a) * 700;
      ctx.beginPath(); ctx.moveTo(bx - dx, by - dy); ctx.lineTo(bx + dx, by + dy); ctx.stroke();
    });
    ctx.restore();
  } else {
    // four pieces, one per sector between the blades
    const p = prog(rel, .4, 1.15);
    const SECT = [[BLADE_A, BLADE_B], [BLADE_B, BLADE_A + Math.PI], [BLADE_A + Math.PI, BLADE_B + Math.PI], [BLADE_B + Math.PI, BLADE_A + 2 * Math.PI]];
    SECT.forEach(([a0, a1], i) => {
      if (p >= 1) return;
      const am = (a0 + a1) / 2, dist = 30 * E.outExpo(clamp(p * 6)) + 900 * E.inQuad(p);
      ctx.save();
      ctx.translate(Math.cos(am) * dist, Math.sin(am) * dist);
      ctx.translate(bx, by); ctx.rotate((i % 2 ? 1 : -1) * .7 * E.inQuad(p)); ctx.translate(-bx, -by);
      ctx.beginPath(); ctx.moveTo(bx, by);
      for (let k = 0; k <= 8; k++) { const a = lerp(a0, a1, k / 8); ctx.lineTo(bx + Math.cos(a) * 2000, by + Math.sin(a) * 2000); }
      ctx.closePath(); ctx.clip();
      drawBird(bx, by, bs, C.celeste, 1 - p * p);
      ctx.restore();
    });
  }
  // X slam with zoom ghosts
  const p = prog(rel, .7, 1.45);
  if (p > 0) {
    const e = E.inCubic(p), s = xs * lerp(s0, 1, e);
    if (p < 1) for (let k = 3; k >= 1; k--) drawX(xx, xy, s * (1 + .18 * k * (1 - p)), '#fff', .1 * clamp(p * 3));
    drawX(xx, xy, s, '#fff', clamp(p * 3));
  }
  shockwave(lt, t0 + 1.45, xx, xy, wave);
}
function shockwave(lt, t0, x, y, max = 900) {
  [[0, '#fff', 8], [.09, C.blue, 5]].forEach(([d, col, w]) => {
    const p = prog(lt, t0 + d, t0 + d + .7);
    if (p <= 0 || p >= 1) return;
    ctx.save(); ctx.strokeStyle = col; ctx.globalAlpha *= 1 - p; ctx.lineWidth = w * (1 - p) + .5;
    ctx.beginPath(); ctx.arc(x, y, max * E.outExpo(p), 0, 7); ctx.stroke(); ctx.restore();
  });
}
function birdToXCues(t0) { cue('zap', t0); cue('zap', t0 + .2, { hi: 1 }); cue('shatter', t0 + .4); cue('riser', t0 + .7, { len: .75 }); cue('impact', t0 + 1.45, { big: 1 }); }

const Q = '¿Qué está pasando?';
const HOOK = [['2006', C.celeste, 300], ['twttr', C.white, 250], ['2023', C.white, 300], ['X', C.white, 300], ['90%', C.blue, 340], ['×2', C.white, 380], ['3,3/5', C.blue, 280], ['¿?', C.white, 420]];
const HOOKPOS = [[-300, -40, -.05], [260, 60, .04], [-140, 50, 0], [0, 0, 0], [240, -70, .05], [-260, 40, -.04], [120, -30, .03], [0, 0, 0]];
scene('intro', 14, (lt) => {
  // 0–2 s: hook montage, one slam every 1/4 beat
  if (lt < 2.0) {
    const i = Math.min(7, Math.floor(lt / .25)), t = lt - i * .25;
    const [w, col, size] = HOOK[i], [ox, oy, r] = HOOKPOS[i];
    const z = lerp(1.35, 1, E.outExpo(prog(t, 0, .2)));
    ctx.save(); ctx.translate(CX + ox, CY + oy); ctx.rotate(r); ctx.scale(z, z);
    for (let k = 1; k <= 2; k++) for (const sg of [-1, 1]) {
      if (w === 'X') drawX(0, sg * k * size * 1.05, size * .45, 'rgba(255,255,255,.14)');
      else text(w, 0, size * .35 + sg * k * size * .95, { size, weight: 900, align: 'center', stroke: 'rgba(255,255,255,.16)', lw: 2 });
    }
    if (w === 'X') drawX(0, 0, size * .45, col);
    else text(w, 0, size * .35, { size, weight: 900, color: col, align: 'center' });
    ctx.restore();
    // corner UI marks
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2;
    for (const [cx, cy, sx, sy] of [[90, 90, 1, 1], [W - 90, 90, -1, 1], [90, H - 90, 1, -1], [W - 90, H - 90, -1, -1]]) { ctx.beginPath(); ctx.moveTo(cx, cy + sy * 40); ctx.lineTo(cx, cy); ctx.lineTo(cx + sx * 40, cy); ctx.stroke(); }
    font(18, 700, TEXT, .14); ctx.fillStyle = C.blue; ctx.fillText('● REC  ' + fmt(lt, 2).padStart(5, '0'), 110, H - 110);
    ctx.restore();
  }
  // 2–4 s: typing
  const T0 = 2.15, DT = .045;
  const ma = E.outCubic(prog(lt, 2.1, 2.5)) * (1 - prog(lt, 3.6, 3.9));
  if (ma > 0) {
    text('UADE · FACE · Construcción y Gestión de Marca', 120, 90, { size: 20, weight: 600, fam: TEXT, color: C.grey, alpha: ma });
    text('2C 2026', W - 120, 90, { size: 20, weight: 600, fam: TEXT, color: C.grey, alpha: ma, align: 'right' });
  }
  if (lt >= 2.0 && lt < 4.4) {
    const z = 1 + .05 * E.inOutCubic(prog(lt, 2.9, 3.75));
    ctx.save(); camera(z);
    font(124, 700);
    const chars = [...Q];
    const total = tw(Q), x0 = CX - total / 2, y = 585;
    const pos = chars.map((_, i) => tw(chars.slice(0, i).join('')));
    const cw = chars.map(c => tw(c));
    const typed = Math.floor((lt - T0) / DT) + 1;
    for (let i = 0; i < chars.length && i < typed; i++) {
      const q = E.inCubic(prog(lt, 3.75 + i * .012, 4.15 + i * .012));
      if (q >= 1) continue;
      ctx.save();
      ctx.translate(x0 + pos[i] + cw[i] / 2 + (i - 9) * 40 * q, y - 44 - 500 * q * (1 + hash1(i) * .6));
      ctx.rotate((hash1(i * 3.1) - .5) * 1.4 * q);
      let s = 1;
      if (i === chars.length - 1 && lt > 3.2) s = 1 + .5 * (1 - E.outElastic(prog(lt, 3.2, 4.0)));
      ctx.scale(s, s); ctx.globalAlpha = 1 - q;
      font(124, 700);
      ctx.fillStyle = (i === chars.length - 1 && lt > 3.2) ? C.blue : C.white;
      ctx.fillText(chars[i], -cw[i] / 2, 44);
      ctx.restore();
    }
    if (lt < 3.75) {
      const on = typed < chars.length ? true : Math.floor(lt * 2.4) % 2 === 0;
      if (on) { const cx = x0 + (typed >= chars.length ? total : pos[Math.max(0, typed)]) + 6; ctx.fillStyle = C.blue; ctx.fillRect(lt < T0 ? CX - 3 : cx, y - 104, 7, 134); }
    }
    ctx.restore();
  }
  // 4–9.5 s: the bird flies in
  const BX = 720, BY = 560, BS = 210;
  if (lt >= 4.0) {
    const fly = E.outExpo(prog(lt, 4.0, 4.9));
    const bob = Math.sin(lt * 2.2) * 8 * clamp((lt - 4.9) * 2);
    const bxy = t => { const e = E.outExpo(prog(t, 4.0, 4.9)); return [lerp(-350, BX, e), lerp(180, BY, e) - Math.sin(Math.PI * e) * 120]; };
    if (lt < 9.55) {
      if (fly < 1) for (let k = 4; k >= 1; k--) { const [gx, gy] = bxy(lt - k * .035); drawBird(gx, gy, BS * lerp(.45, 1, E.outExpo(prog(lt - k * .035, 4.0, 4.9))), C.celeste, .13); }
      const [x, y] = bxy(lt);
      const breathe = 1 + .015 * Math.sin(lt * 4.4);
      ctx.save(); ctx.translate(x, y + bob); ctx.rotate(lerp(-.35, 0, fly)); ctx.translate(-x, -(y + bob));
      drawBird(x, y + bob, BS * lerp(.45, 1, fly) * breathe);
      // light sweep across the bird
      const sp = prog(lt, 5.1, 5.8);
      if (sp > 0 && sp < 1) {
        const k = 2 * BS / 19.5;
        ctx.save(); ctx.translate(x - 11.8 * k, y + bob - 12.1 * k); ctx.scale(k, k); ctx.clip(BIRDPATH);
        const gx = lerp(-10, 34, E.inOutCubic(sp));
        const g = ctx.createLinearGradient(gx - 4, 0, gx + 4, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,.75)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g; ctx.fillRect(-2, -2, 28, 28); ctx.restore();
      }
      ctx.restore();
      shockwave(lt, 4.9, BX, BY, 520);
    } else {
      birdToX(lt, 9.55, BX, BY + bob, BS, CX, 520, 230);
    }
  }
  // Twitter years
  const YEARS = [['2006', 'twttr'], ['2009', 'Pájaro'], ['2010', 'Larry'], ['2012', 'Nuevo pájaro'], ['2021', 'Chirp']];
  label('Twitter', 1180, 330, lt - 5.4, { color: C.celeste, size: 22, alpha: 1 - prog(lt, 9.4, 9.7) });
  label('2006 — 2023', 1180, 365, lt - 5.6, { color: C.grey, size: 18, alpha: 1 - prog(lt, 9.4, 9.7) });
  YEARS.forEach(([yr, nm], j) => {
    const sj = 5.9 + j * .5, last = j === YEARS.length - 1;
    const out = last ? 8.55 - sj : .5;
    kt(yr, 1172, 560, { t: lt - sj - (j ? .08 : 0), size: 200, weight: 900, st: .03, dur: .45, out, outDur: .25, outSt: .015 });
    kt(nm, 1180, 640, { t: lt - sj - .06, size: 46, weight: 700, color: C.celeste, st: .015, dur: .4, out: out - .06, outDur: .2, outSt: .005 });
  });
  ['Cercanía.', 'Liviandad.', 'Humor.'].forEach((w, j) => {
    kt(w, 1172, 470 + j * 110, { t: lt - 8.65 - j * .14, size: 96, weight: 900, color: C.celeste, st: .02, dur: .5, out: 9.55 - 8.65 - j * .14 + j * .05, outMode: 'fall', outDur: .55, outSt: .02 });
  });
  // 11–14 s: the X holds, then we fly through its center
  if (lt >= 11.0) {
    const zz = 1 + E.inExpo(prog(lt, 13.4, 14)) * 40;
    const br = 1 + .012 * Math.sin((lt - 11) * 6.28);
    drawX(CX, 520, 230 * zz * br);
    label('Desde 2023', CX, 860, lt - 11.15, { color: C.grey, align: 'center', size: 20, alpha: 1 - prog(lt, 13.2, 13.5) });
  }
}, { punch: false, beat: false });

// big words behind the X (pre-pass, so they sit behind it)
SCENES[SCENES.length - 1].pre = (lt) => {
  const WORDS = ['INCÓGNITA', 'RUPTURA', 'FUTURISTA', 'FRÍO', 'PODER'];
  WORDS.forEach((w, j) => {
    const s = 11.25 + j * .45;
    kt(w, CX, 660, { t: lt - s, size: 300, weight: 900, align: 'center', color: j % 2 ? C.line : 'rgba(29,155,240,.9)', mode: 'stretch', st: .012, dur: .28, out: .4, outDur: .07, outSt: 0 });
  });
};
HOOK.forEach((_, i) => { cue('stab', i * .25, { n: i }); GLITCH.push([i * .25, .06, .5]); });
for (let i = 0; i < [...Q].length; i++) if ([...Q][i] !== ' ') cue('tick', 2.15 + i * .045);
cue('pop', 3.2); cue('swoosh', 3.75); cue('swoosh', 4.0); cue('chirp', 4.85);
[5.9, 6.4, 6.9, 7.4, 7.9].forEach(t => cue('blip', t));
birdToXCues(9.55);
[11.25, 11.7, 12.15, 12.6, 13.05].forEach(t => cue('hit', t));
cue('riser', 12.0, { len: 2.0 });
FLASH.push([11.0, .35, .55, '#fff']);

// ════════════════════════ TITLE ════════════════════════════
const tTitle = scene('title', 6.5, (lt) => {
  const out = 3.35;
  label('Trabajo práctico integrador', 150, 215, lt - .7, { color: C.blue, alpha: 1 - prog(lt, out, out + .3) });
  kt('¿Qué está', 140, 420, { t: lt - .08, size: 200, weight: 900, st: .03, dur: .7, out, outSt: .01 });
  kt('pasando', 140, 610, { t: lt - .3, size: 200, weight: 900, st: .03, dur: .7, out: out - .22, outSt: .01 });
  kt('con X?', 140, 800, { t: lt - .52, size: 200, weight: 900, st: .03, dur: .7, out: out - .44, outSt: .01, color: (i, c) => c === 'X' ? C.blue : C.white });
  // underline sweep under "pasando"
  const u = E.outExpo(prog(lt, 1.3, 1.9)), uo = E.inExpo(prog(lt, out - .1, out + .2));
  if (u > 0 && uo < 1) { ctx.fillStyle = C.blue; ctx.fillRect(150 + 790 * uo, 640, 790 * (u - uo), 12); }
  // the sign
  const sp = E.outBackS(prog(lt, .9, 1.5)) * (1 - E.inBack(prog(lt, out, out + .35)));
  if (sp > 0.001) drawX(1500, 560, 170 * sp);
  text('Análisis de marca · Brand Health Tracker · Brand book', W - 120, 990, { size: 24, weight: 500, fam: TEXT, color: C.grey, align: 'right', alpha: E.outCubic(prog(lt, 1.2, 1.8)) * (1 - prog(lt, out, out + .3)) });

  // post card
  if (lt > 3.5) {
    const cw = 1240, ch = 310, cx = (W - cw) / 2;
    const inP = E.outExpo(prog(lt, 3.55, 4.3)), outP = E.inExpo(prog(lt, 6.0, 6.5));
    const cy = 385 + (1 - inP) * 700 - outP * 1100;
    const draw = (oy, al) => {
      ctx.save(); ctx.globalAlpha *= al; ctx.translate(0, oy);
      rrect(cx, cy, cw, ch, 32); ctx.fillStyle = '#000'; ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.stroke();
      // avatar
      ctx.fillStyle = C.blue; ctx.beginPath(); ctx.arc(cx + 78, cy + 82, 36, 0, 7); ctx.fill();
      text('TP', cx + 78, cy + 92, { size: 26, weight: 800, fam: TEXT, align: 'center' });
      const L1 = 'De Twitter a X: qué ganó, qué perdió', L2 = 'y qué piensa la gente de la marca.';
      const n = Math.floor((lt - 3.95) / .016);
      font(44, 500, TEXT, -0.01); ctx.fillStyle = C.soft;
      ctx.fillText(L1.slice(0, clamp(n, 0, L1.length)), cx + 140, cy + 96);
      ctx.fillText(L2.slice(0, clamp(n - L1.length, 0, L2.length)), cx + 140, cy + 152);
      ctx.fillStyle = C.line; ctx.fillRect(cx + 40, cy + 200, (cw - 80) * E.outExpo(prog(lt, 4.3, 5)), 2);
      // hashtags
      const tags = ['#Contexto', '#Identidad', '#Posicionamiento', '#Mix', '#VCM', '#BrandBook'];
      let hx = cx + 40;
      tags.forEach((tg, j) => {
        const a = E.outCubic(prog(lt, 4.8 + j * .07, 5.1 + j * .07));
        const on = lt > 5.3 + j * .08;
        font(28, 600, TEXT, 0); ctx.globalAlpha = al * a; ctx.fillStyle = on ? C.blue : C.grey;
        ctx.fillText(tg, hx, cy + 262 + (1 - a) * 20); hx += tw(tg) + 18; ctx.globalAlpha = al;
      });
      // button
      const press = Math.sin(Math.PI * prog(lt, 5.85, 6.05));
      const bw = 176, bh = 60, bx = cx + cw - 40 - bw, by = cy + 226;
      ctx.save(); ctx.translate(bx + bw / 2, by + bh / 2); ctx.scale(1 - .1 * press, 1 - .1 * press);
      rrect(-bw / 2, -bh / 2, bw, bh, 30); ctx.fillStyle = C.blue; ctx.fill();
      text('Postear', 0, 10, { size: 28, weight: 800, fam: TEXT, align: 'center' });
      ctx.restore();
      const rp = prog(lt, 5.9, 6.4);
      if (rp > 0 && rp < 1) { ctx.strokeStyle = C.blue; ctx.globalAlpha = al * (1 - rp); ctx.lineWidth = 4; rrect(bx - rp * 40, by - rp * 40, bw + rp * 80, bh + rp * 80, 30 + rp * 40); ctx.stroke(); }
      ctx.restore();
    };
    if (outP > 0) for (let k = 4; k >= 1; k--) draw(k * 70 * outP, .1);
    draw(0, 1);
  }
});
cue('impact', tTitle, { big: 1 }); cue('hit', tTitle + .3); cue('hit', tTitle + .52); cue('pop', tTitle + .9);
cue('whoosh', tTitle + 3.3, { len: .5 }); cue('swoosh', tTitle + 3.55);
for (let i = 0; i < 72; i += 3) cue('tick', tTitle + 3.95 + i * .016, { soft: 1 });
cue('click', tTitle + 5.85); cue('whoosh', tTitle + 6.0, { len: .6 });

// ════════════════════════ THREAD ═══════════════════════════
const TAGS = ['#Contexto', '#Identidad', '#Posicionamiento', '#Mix', '#VCM', '#BrandBook'];
const tThread = scene('thread', 1.5, (lt) => {
  const z = 1 + E.inExpo(prog(lt, .95, 1.5)) * 28;
  ctx.save(); camera(z, 0, 0, 0, 640, 165 + 0);
  const lx = 640;
  ctx.fillStyle = C.line; ctx.fillRect(lx - 1.5, 165, 3, 750 * E.outExpo(prog(lt, 0, .6)));
  TAGS.forEach((tg, i) => {
    const y = 165 + i * 150, s = .05 + i * .07;
    const p = E.outBackS(prog(lt, s, s + .35));
    if (p <= 0) return;
    ctx.save(); ctx.translate(lx, y); ctx.scale(p, p);
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(0, 0, 52, 0, 7); ctx.fill();
    ctx.strokeStyle = i === 0 ? C.blue : C.white; ctx.lineWidth = 3; ctx.stroke();
    text(`${i + 1}/6`, 0, 11, { size: 30, weight: 800, fam: TEXT, align: 'center' });
    ctx.restore();
    kt(tg, lx + 100, y + 22, { t: lt - s - .05, size: 64, weight: 800, mode: 'slide', dist: 300, st: .012, dur: .35, color: i === 0 ? C.blue : C.white });
  });
  ctx.restore();
}, { punch: false });
cue('whoosh', tThread + .9, { len: .6 });

// ════════════════════════ CHAPTER CARDS ═════════════════════
function chapterCard(n, tag, title) {
  const s = scene('card' + n, 1.5, (lt) => {
    ctx.save();
    const drift = lt * 18;
    ctx.translate(-drift, 0);
    const r = kt(String(n), 140, 600, { t: lt, size: 360, weight: 900, st: 0, dur: .55, ls: -0.06 });
    kt('/6', 140 + r.w - 6, 600, { t: lt - .08, size: 360, weight: 900, mode: 'stretch', st: .05, dur: .4, color: C.blue, ls: -0.06 });
    kt(tag, 150, 740, { t: lt - .25, size: 46, weight: 800, mode: 'type', st: .025, color: C.blue, fam: TEXT, ls: -0.01 });
    kt(title, 150, 850, { t: lt - .35, size: 84, weight: 900, st: .012, dur: .55 });
    ctx.restore();
    // progress pips
    for (let i = 0; i < 6; i++) {
      const a = E.outCubic(prog(lt, .1 + i * .04, .4 + i * .04));
      ctx.globalAlpha = a; ctx.fillStyle = i < n - 1 ? C.white : i === n - 1 ? C.blue : C.line;
      rrect(W - 120 - (6 - i) * 44 + 8, 150, 36, 8, 4); ctx.fill(); ctx.globalAlpha = 1;
    }
    label('Post ' + n + ' de 6', W - 120, 125, lt - .2, { align: 'right', size: 16 });
  }, { punch: false });
  WIPES.push([s + 1.12, .76]);
  cue('impact', s); cue('hit', s + .08); cue('whoosh', s + 1.0, { len: .7 });
  return s;
}

// ════════════════════════ 1/6 CONTEXTO ═════════════════════
chapterCard(1, '#Contexto', 'Contexto de la categoría');

scene('c1-plaza', 2.5, (lt, d) => {
  header(lt, 1, '#Contexto');
  const out = d - .45;
  kt('LA PLAZA', 140, 400, { t: lt - .15, size: 240, weight: 900, st: .025, out, outSt: .01, outDur: .35 });
  kt('PÚBLICA', 140, 640, { t: lt - .3, size: 240, weight: 900, st: .025, mode: 'slide', dist: 700, dur: .5, stroke: C.white, lw: 3.5, out: out + .03, outMode: 'slide', outDur: .35 });
  kt('DIGITAL', 140, 880, { t: lt - .45, size: 240, weight: 900, st: .025, color: C.blue, out: out + .06, outSt: .01, outDur: .35 });
  text('“the town square of the internet”', W - 120, 880, { size: 30, weight: 500, fam: TEXT, color: C.grey, align: 'right', alpha: E.outCubic(prog(lt, .9, 1.4)) * exitAlpha(lt, d) });
  label('Conversación pública en tiempo real', W - 120, 830, lt - 1.0, { align: 'right', color: C.blue, alpha: exitAlpha(lt, d) });
});

scene('c1-dos-lados', 3.5, (lt, d) => {
  header(lt, 1, '#Contexto');
  const ea = exitAlpha(lt, d, .35);
  ctx.save(); ctx.globalAlpha = ea;
  kt('Un mercado de dos lados', 120, 230, { t: lt - .05, size: 76, weight: 900, st: .012 });
  const XC = [CX, 560];
  // flows
  const curve = (a, b, bend, u) => { const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 + bend; const x = (1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * mx + u * u * b[0]; const y = (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * my + u * u * b[1]; return [x, y]; };
  const U_ = [430, 560], A_ = [1490, 560];
  const fa = E.outCubic(prog(lt, .6, 1.1));
  const flows = [[U_, XC, -170, C.white, 'servicio gratuito  →'], [XC, A_, -170, C.blue, 'acceso a la audiencia  →'], [A_, XC, 170, C.blue, '←  pagan'], [XC, U_, 170, C.white, '←  atención y datos']];
  flows.forEach(([a, b, bend, col, lab], f) => {
    ctx.globalAlpha = ea * fa * .35; ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.setLineDash([2, 10]);
    ctx.beginPath(); for (let u = 0; u <= 1.001; u += .05) { const p = curve(a, b, bend, u); u === 0 ? ctx.moveTo(...p) : ctx.lineTo(...p); } ctx.stroke(); ctx.setLineDash([]);
    ctx.globalAlpha = ea * fa;
    for (let k = 0; k < 9; k++) {
      const u = ((lt * .55 + k / 9 + f * .13) % 1);
      const p = curve(a, b, bend, .12 + u * .76);
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(p[0], p[1], 5 * Math.sin(Math.PI * u) + 1, 0, 7); ctx.fill();
    }
    if (f < 2) { const p = curve(a, b, bend, .5); text(lab, p[0], p[1] - 30, { size: 22, weight: 600, fam: TEXT, color: C.grey, align: 'center', alpha: ea * fa }); }
  });
  ctx.globalAlpha = ea;
  // users: circles
  for (let i = 0; i < 7; i++) {
    const ang = i / 7 * Math.PI * 2 + lt * .3, rr = i === 0 ? 0 : 70;
    const p = E.outBackS(prog(lt, .2 + i * .04, .55 + i * .04));
    const x = U_[0] + (i ? Math.cos(ang) * rr : 0), y = U_[1] + (i ? Math.sin(ang) * rr : 0);
    ctx.fillStyle = i ? '#2F3336' : C.soft; ctx.beginPath(); ctx.arc(x, y, (i ? 26 : 34) * p, 0, 7); ctx.fill();
  }
  // advertisers: squares (verified orgs use square avatars)
  for (let i = 0; i < 5; i++) {
    const ang = i / 5 * Math.PI * 2 - lt * .3, rr = i === 0 ? 0 : 74;
    const p = E.outBackS(prog(lt, .35 + i * .05, .7 + i * .05));
    const x = A_[0] + (i ? Math.cos(ang) * rr : 0), y = A_[1] + (i ? Math.sin(ang) * rr : 0), s = (i ? 44 : 60) * p;
    ctx.fillStyle = i ? '#0d4f7c' : C.blue; rrect(x - s / 2, y - s / 2, s, s, 10); ctx.fill();
  }
  label('Lado 1 · Usuarios', U_[0], 720, lt - .5, { align: 'center', color: C.white });
  text('Acceden gratis', U_[0], 760, { size: 26, weight: 500, fam: TEXT, color: C.grey, align: 'center', alpha: ea * E.outCubic(prog(lt, .7, 1.1)) });
  label('Lado 2 · Anunciantes', A_[0], 720, lt - .6, { align: 'center', color: C.blue });
  text('Pagan por la audiencia', A_[0], 760, { size: 26, weight: 500, fam: TEXT, color: C.grey, align: 'center', alpha: ea * E.outCubic(prog(lt, .8, 1.2)) });
  ctx.restore();
  const xp = E.outBackS(prog(lt, .15, .6)) * (1 - E.inBack(prog(lt, d - .35, d)));
  if (xp > .001) drawX(XC[0], XC[1], 100 * xp);
  const s2 = 'Efecto de red = barrera de entrada';
  kt(s2, CX, 950, { t: lt - 1.5, size: 54, weight: 800, align: 'center', st: .01, color: hl(s2, 'Efecto de red', C.white, C.blue), out: d - .5, outSt: .004 });
});

scene('c1-mapa', 3, (lt, d) => {
  header(lt, 1, '#Contexto');
  const zo = 1 + E.inExpo(prog(lt, d - .4, d)) * 2.5;
  ctx.save(); camera(zo); ctx.globalAlpha = 1 - prog(lt, d - .2, d);
  kt('Mapa competitivo', 120, 200, { t: lt, size: 64, weight: 900, st: .012 });
  const ga = ctx.globalAlpha;
  const e1 = E.outExpo(prog(lt, .1, .8)), e2 = E.outExpo(prog(lt, .25, 1));
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(113,118,123,.55)'; ctx.beginPath(); ctx.ellipse(CX, 580, 760 * e2, 380 * e2, 0, 0, 7); ctx.stroke();
  ctx.fillStyle = 'rgba(29,155,240,.07)'; ctx.strokeStyle = 'rgba(29,155,240,.8)';
  ctx.beginPath(); ctx.ellipse(CX, 580, 380 * e1, 210 * e1, 0, 0, 7); ctx.fill(); ctx.stroke();
  const chip = (name, x, y, p, fill, col) => {
    if (p <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(p, p);
    font(28, 700, TEXT, 0); const w = tw(name) + 44;
    rrect(-w / 2, -26, w, 52, 26); ctx.fillStyle = fill; ctx.fill();
    ctx.fillStyle = col; ctx.fillText(name, -w / 2 + 22, 10); ctx.restore();
  };
  ['Threads', 'Bluesky', 'Mastodon'].forEach((n, i) => {
    const a = -Math.PI / 2 + i * Math.PI * 2 / 3 + lt * .35;
    chip(n, CX + Math.cos(a) * 380, 580 + Math.sin(a) * 210, E.outBackS(prog(lt, .5 + i * .08, .85 + i * .08)), C.blue, '#fff');
  });
  ['Instagram', 'TikTok', 'YouTube', 'Reddit'].forEach((n, i) => {
    const a = -Math.PI * .8 + i * Math.PI / 2 - lt * .18;
    chip(n, CX + Math.cos(a) * 760, 580 + Math.sin(a) * 380, E.outBackS(prog(lt, .8 + i * .07, 1.15 + i * .07)), '#202327', '#fff');
  });
  label('Competencia directa', CX, 830, lt - .9, { align: 'center', color: C.blue, size: 18 });
  label('Competencia indirecta', CX, 1010, lt - 1.1, { align: 'center', color: C.grey, size: 18 });
  ctx.globalAlpha = ga;
  drawX(CX, 580, 78 * E.outBackS(prog(lt, 0, .45)));
  ctx.restore();
});

scene('c1-numeros', 4.5, (lt, d) => {
  header(lt, 1, '#Contexto');
  const A = lt < 2.35;
  const bars = (rows, t, maxV, maxW, outT) => {
    rows.forEach(([name, v, col, txt], i) => {
      const y = 470 + i * 140, s = .25 + i * .12;
      const p = E.outExpo(prog(t, s, s + .9)), q = E.inExpo(prog(t, outT, outT + .3));
      const x = 430 - q * 1800;
      text(name, 120 - q * 1800, y + 50, { size: 40, weight: 700, color: C.white, alpha: E.outCubic(prog(t, s - .1, s + .2)) });
      const w = maxW * v / maxV * p;
      rrect(x, y, w, 76, 12); ctx.fillStyle = col; ctx.fill();
      text(txt(v * p), x + w + 22, y + 54, { size: 48, weight: 800, alpha: clamp(p * 3) });
    });
  };
  if (A) {
    label('Mundo', 120, 230, lt - .05, { color: C.grey });
    kt('Threads ya superó a X', 120, 340, { t: lt - .05, size: 96, weight: 900, st: .015, out: 2.0, outMode: 'slide', outDist: 1800, outDur: .3, outSt: .004 });
    bars([['Threads', 141.5, C.soft, v => fmt(v, 1) + ' M'], ['X', 125, C.blue, v => fmt(v, 0) + ' M']], lt, 141.5, 1150, 2.0);
    text('Usuarios diarios desde el celular · enero 2026 · Similarweb', 120, 800, { size: 24, weight: 500, fam: TEXT, color: C.grey, alpha: E.outCubic(prog(lt, .8, 1.2)) * (1 - prog(lt, 1.95, 2.15)) });
  } else {
    const t = lt - 2.35;
    label('Argentina', 120, 230, t, { color: C.blue });
    const s = 'X todavía duplica a Threads';
    kt(s, 120, 340, { t, size: 96, weight: 900, st: .012, mode: 'slide', dist: 900, dur: .45, color: hl(s, 'duplica', C.white, C.blue), out: d - 2.35 - .4, outSt: .004, outDur: .3 });
    bars([['X', 6.7, C.blue, v => fmt(v, 1) + ' M'], ['Threads', 3.35, C.soft, v => fmt(v, 2) + ' M']], t, 6.7, 1000, d - 2.35 - .4);
    const xp = E.outBackS(prog(t, .9, 1.25)) * (1 - E.inBack(prog(t, d - 2.35 - .35, d - 2.35)));
    if (xp > 0.001) { ctx.save(); ctx.translate(1600, 640); ctx.scale(xp, xp); ctx.rotate(-.06); text('×2', 0, 90, { size: 300, weight: 900, color: C.blue, align: 'center' }); ctx.restore(); }
    text('Alcance publicitario · DataReportal, Digital 2026 Argentina', 120, 800, { size: 24, weight: 500, fam: TEXT, color: C.grey, alpha: E.outCubic(prog(t, .6, 1)) * exitAlpha(lt, d) });
  }
});
GLITCH.push([SCENES[SCENES.length - 1].s + 2.35, .14, .9]);
cue('whoosh', SCENES[SCENES.length - 1].s + 2.25, { len: .35 }); cue('hit', SCENES[SCENES.length - 1].s + 2.35); cue('impact', SCENES[SCENES.length - 1].s + 3.3);

// ════════════════════════ 2/6 IDENTIDAD ════════════════════
chapterCard(2, '#Identidad', 'Identidad y arquitectura');

scene('c2-formula', 3, (lt, d) => {
  header(lt, 2, '#Identidad');
  const out = d - .45, ox = -E.inExpo(prog(lt, out, d)) * 2000;
  ctx.save(); ctx.translate(ox, 0);
  const items = [[300, 'Naming', 'Una sola letra'], [820, 'Signo', 'Doble barra matemática'], [1500, 'Claim (de hecho)', 'Heredado de Twitter']];
  items.forEach(([x, l, sub], i) => {
    label(l, x, 350, lt - .1 - i * .4, { align: 'center', color: C.blue });
    text(sub, x, 690, { size: 26, weight: 500, fam: TEXT, color: C.grey, align: 'center', alpha: E.outCubic(prog(lt, .4 + i * .4, .8 + i * .4)) });
  });
  kt('Monograma', 820, 545, { t: lt - .5, size: 76, weight: 900, align: 'center', st: .02, mode: 'pop', dur: .45 });
  kt('“¿Qué está pasando?”', 1500, 540, { t: lt - .9, size: 52, weight: 800, align: 'center', st: .012, mode: 'pop', dur: .4 });
  [[540, .35], [1135, .75]].forEach(([x, s]) => kt('+', x, 545, { t: lt - s, size: 100, weight: 400, color: C.grey, align: 'center', mode: 'pop' }));
  // result pill
  const rp = E.outExpo(prog(lt, 1.45, 2.0));
  if (rp > 0) {
    const w = 900 * rp; rrect(CX - w / 2, 790, w, 116, 58); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.rect(CX - w / 2, 790, w, 116); ctx.clip();
    text('= La plaza pública digital', CX, 866, { size: 54, weight: 900, color: '#000', align: 'center', alpha: clamp(rp * 2 - .6) });
    ctx.restore();
  }
  const xp = E.outBackS(prog(lt, .1, .55));
  ctx.restore();
  if (xp > .001) drawX(300 + ox, 520, 100 * xp);
});
cue('pop', SCENES[SCENES.length - 1].s + .1); cue('pop', SCENES[SCENES.length - 1].s + .5); cue('pop', SCENES[SCENES.length - 1].s + .9); cue('swoosh', SCENES[SCENES.length - 1].s + 1.45);

scene('c2-personalidad', 4, (lt, d) => {
  header(lt, 2, '#Identidad');
  const ea = exitAlpha(lt, d, .4);
  ctx.save(); ctx.globalAlpha = ea;
  kt('El cambio de personalidad', 120, 220, { t: lt, size: 72, weight: 900, st: .012 });
  // legend
  const la = E.outCubic(prog(lt, .3, .7));
  ctx.globalAlpha = ea * la;
  ctx.fillStyle = C.blue; ctx.beginPath(); ctx.arc(W - 330, 200, 11, 0, 7); ctx.fill();
  text('Twitter', W - 310, 209, { size: 26, weight: 600, fam: TEXT, color: C.soft });
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(W - 180, 200, 11, 0, 7); ctx.fill();
  text('X', W - 160, 209, { size: 26, weight: 600, fam: TEXT, color: C.soft });
  ctx.globalAlpha = ea;
  const ROWS = [['Accesible', 'Confrontativa', .14, .88], ['Simpática', 'Desafiante', .18, .84], ['Orgánica', 'Tecnológica', .25, .9], ['Cálida', 'Fría', .2, .86], ['Liviana', 'Poderosa', .15, .81], ['Usuarios protagonistas', 'CEO protagonista', .11, .93]];
  const x0 = 640, x1 = 1330;
  ROWS.forEach(([l, r, a, b], i) => {
    const y = 350 + i * 100, s = .2 + i * .07;
    const ap = E.outExpo(prog(lt, s, s + .5));
    const mv = E.inOutExpo(prog(lt, 1.3 + i * .12, 2.1 + i * .12));
    ctx.globalAlpha = ea * ap;
    ctx.fillStyle = '#202327'; rrect(x0, y - 4, (x1 - x0) * ap, 8, 4); ctx.fill();
    text(l, x0 - 40, y + 13, { size: 36, weight: 700, color: lerpCol([231, 233, 234], [113, 118, 123], mv), align: 'right' });
    text(r, x1 + 40, y + 13, { size: 36, weight: 800, color: lerpCol([60, 64, 68], [255, 255, 255], mv) });
    const px = lerp(x0 + (x1 - x0) * a, x0 + (x1 - x0) * b, mv);
    // trail
    if (mv > 0 && mv < 1) {
      const g = ctx.createLinearGradient(x0 + (x1 - x0) * a, 0, px, 0); g.addColorStop(0, 'rgba(29,155,240,0)'); g.addColorStop(1, 'rgba(29,155,240,.85)');
      ctx.fillStyle = g; rrect(x0 + (x1 - x0) * a, y - 7, px - (x0 + (x1 - x0) * a), 14, 7); ctx.fill();
    }
    ctx.fillStyle = lerpCol([29, 155, 240], [255, 255, 255], mv);
    ctx.beginPath(); ctx.arc(px, y, 19 * E.outBackS(prog(lt, s + .1, s + .45)), 0, 7); ctx.fill();
    if (mv >= 1) { ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px, y, 19 + 10 * E.outCubic(prog(lt, 2.1 + i * .12, 2.6 + i * .12)), 0, 7); ctx.stroke(); }
  });
  ctx.globalAlpha = ea;
  text('El CEO como factor de personalidad: Musk funciona como vocero principal de la marca.', 120, 990, { size: 26, weight: 500, fam: TEXT, color: C.grey, alpha: ea * E.outCubic(prog(lt, 2.7, 3.1)) });
  ctx.restore();
});
function lerpCol(a, b, t) { return `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], t))).join(',')})`; }
{ const s = SCENES[SCENES.length - 1].s; for (let i = 0; i < 6; i++) cue('blip', s + 1.3 + i * .12, { soft: 1 }); cue('whoosh', s + 1.25, { len: .9 }); }

scene('c2-lenguaje', 3, (lt, d) => {
  header(lt, 2, '#Identidad');
  const ea = exitAlpha(lt, d, .35);
  ctx.save(); ctx.globalAlpha = ea;
  kt('El rebranding también cambió el idioma', 120, 220, { t: lt, size: 64, weight: 900, st: .01 });
  const R = [['Tweet', 'Post'], ['Retweet', 'Repost'], ['Tuitear', 'Postear'], ['twitter.com', 'x.com']];
  R.forEach(([a, b], i) => {
    const y = 380 + i * 128, s = .15 + i * .1;
    const r = kt(a, 120, y, { t: lt - s, size: 84, weight: 900, st: .015, color: lt > .65 + i * .15 ? C.grey : C.white });
    const sp = E.outExpo(prog(lt, .6 + i * .15, 1.0 + i * .15));
    if (sp > 0) { ctx.fillStyle = C.blue; ctx.fillRect(116, y - 32, (r.w + 10) * sp, 9); }
    kt('→', 860, y, { t: lt - .65 - i * .15, size: 72, weight: 500, color: C.blue, mode: 'slide', dist: 120 });
    kt(b, 1000, y, { t: lt - .7 - i * .15, size: 84, weight: 900, st: .02, mode: 'rise' });
  });
  const s2 = 'Pero en Argentina se sigue diciendo “tuit”.';
  kt(s2, 120, 960, { t: lt - 1.7, size: 48, weight: 800, st: .008, color: hl(s2, '“tuit”', C.white, C.blue), mode: 'fade' });
  ctx.restore();
});
{ const s = SCENES[SCENES.length - 1].s; for (let i = 0; i < 4; i++) { cue('swoosh', s + .6 + i * .15, { soft: 1 }); } }

scene('c2-arquitectura', 3.5, (lt, d) => {
  header(lt, 2, '#Identidad');
  const ea = exitAlpha(lt, d, .35);
  ctx.save(); ctx.globalAlpha = ea;
  label('Arquitectura de marca · octubre 2026', 120, 170, lt, { color: C.grey });
  const box = (x, y, w, h, top, name, p, fill, stroke, nameCol = '#fff') => {
    if (p <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(lerp(.6, 1, p), lerp(.6, 1, p)); ctx.globalAlpha *= clamp(p * 2);
    rrect(-w / 2, -h / 2, w, h, 18); ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
    font(16, 700, TEXT, .14); ctx.fillStyle = nameCol === '#fff' ? 'rgba(255,255,255,.6)' : C.grey; const tt = top.toUpperCase(); ctx.fillText(tt, -tw(tt) / 2, -10);
    font(44, 900, DISP); ctx.fillStyle = nameCol; ctx.fillText(name, -tw(name) / 2, 36);
    ctx.restore();
  };
  const line = (x1, y1, x2, y2, p) => { if (p <= 0) return; ctx.strokeStyle = C.line; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x1, y1); const my = (y1 + y2) / 2; ctx.lineTo(x1, lerp(y1, my, clamp(p * 3))); if (p > .33) ctx.lineTo(lerp(x1, x2, clamp((p - .33) * 3)), my); if (p > .66) ctx.lineTo(x2, lerp(my, y2, clamp((p - .66) * 3))); ctx.stroke(); };
  const P = (s, du = .5) => E.outExpo(prog(lt, s, s + du));
  line(CX, 300, CX, 400, P(.35)); line(CX, 470, 700, 600, P(.7)); line(CX, 470, 1220, 600, P(.75));
  box(CX, 260, 420, 110, 'Marca corporativa', 'SpaceX', E.outBackS(prog(lt, .1, .5)), '#000', '#fff');
  box(CX, 440, 420, 110, 'Unidad de IA', 'SpaceXSI', E.outBackS(prog(lt, .45, .85)), '#000', C.line);
  box(700, 640, 360, 110, 'Marca individual', 'X', E.outBackS(prog(lt, .9, 1.3)), C.blue, null);
  box(1220, 640, 360, 110, 'Marca individual', 'Grok', E.outBackS(prog(lt, 1.0, 1.4)), '#000', C.line);
  const MODS = ['X Premium', 'X Premium+', 'X Money', 'XChat', 'X Pro', 'X Ads'];
  font(26, 700, TEXT, 0);
  MODS.forEach((m, i) => {
    const row = i < 3 ? 0 : 1, col = i % 3;
    const x = 700 + (col - 1) * 205, y = 775 + row * 72;
    const p = E.outBackS(prog(lt, 1.35 + i * .07, 1.7 + i * .07));
    if (p <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(p, p); font(26, 700, TEXT, 0);
    const w = tw(m) + 40; rrect(-w / 2, -26, w, 52, 26); ctx.fillStyle = '#1d1f23'; ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillText(m, -w / 2 + 20, 9); ctx.restore();
  });
  const s3 = 'X como marca paraguas';
  kt(s3, W - 120, 900, { t: lt - 2.0, size: 56, weight: 900, align: 'right', st: .012, color: hl(s3, 'paraguas', C.white, C.blue) });
  text('Extensión de línea: la X + un descriptor', W - 120, 950, { size: 26, weight: 500, fam: TEXT, color: C.grey, align: 'right', alpha: E.outCubic(prog(lt, 2.3, 2.7)) });
  ctx.restore();
});
{ const s = SCENES[SCENES.length - 1].s; [.1, .45, .9, 1.0].forEach(x => cue('pop', s + x)); for (let i = 0; i < 6; i++) cue('blip', s + 1.35 + i * .07, { soft: 1 }); }

// ════════════════════════ 3/6 POSICIONAMIENTO ══════════════
chapterCard(3, '#Posicionamiento', 'Valor y posicionamiento');

scene('c3-valor', 3, (lt, d) => {
  header(lt, 3, '#Posicionamiento');
  const out = d - .45;
  const COLS = [['Funcional', 'Enterarse', 'primero.', 'Lo que pasa, cuando pasa.'], ['Emocional', 'Estar en', 'el centro.', 'Partido, elección, noticia.'], ['Expresión personal', 'Tener', 'voz.', 'Opinión propia y estatus.']];
  COLS.forEach(([l, a, b, sub], i) => {
    const x = 120 + i * 570, s = .05 + i * .15;
    label(l, x, 300, lt - s, { color: C.blue, alpha: 1 - prog(lt, out, out + .2) });
    kt(a, x, 420, { t: lt - s, size: 96, weight: 900, st: .02, out: out + i * .04, outSt: .01, outDur: .3 });
    kt(b, x, 520, { t: lt - s - .08, size: 96, weight: 900, st: .02, color: i === 2 ? C.blue : C.white, out: out + i * .04 + .03, outSt: .01, outDur: .3 });
    text(sub, x, 600, { size: 30, weight: 500, fam: TEXT, color: C.grey, alpha: E.outCubic(prog(lt, s + .4, s + .8)) * (1 - prog(lt, out, out + .2)) });
  });
  const rp = E.outExpo(prog(lt, 1.25, 1.85)) * (1 - E.inExpo(prog(lt, out, d)));
  if (rp > .001) {
    const w = 1680 * rp; rrect(CX - w / 2, 720, w, 210, 30); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.rect(CX - w / 2, 720, w, 210); ctx.clip();
    const a = clamp(rp * 2 - .8);
    text('La plataforma donde cualquier persona puede enterarse', CX, 812, { size: 50, weight: 900, color: '#000', align: 'center', alpha: a });
    text('primero y decir lo que piensa, sin intermediarios.', CX, 876, { size: 50, weight: 900, color: '#000', align: 'center', alpha: a });
    ctx.restore();
  }
});
cue('swoosh', SCENES[SCENES.length - 1].s + 1.25);

scene('c3-slams', 2.5, (lt, d) => {
  const W3 = [['REBELDE', C.white, 'stretch', null], ['INMEDIATA', C.blue, 'slide', null], ['VANGUARDISTA', null, 'pop', C.white]];
  const idx = Math.min(2, Math.floor(lt / .5));
  if (lt < 1.5) {
    const [w, col, mode, stroke] = W3[idx];
    const t = lt - idx * .5;
    const size = idx === 2 ? 250 : 340;
    // echo rows
    for (let k = -3; k <= 3; k++) {
      if (k === 0) continue;
      const off = k * size * .88 + (idx % 2 ? -1 : 1) * t * 240 * Math.sign(k);
      kt(w, CX, 540 + size * .35 + off, { t: t + .2, size, weight: 900, align: 'center', st: 0, dur: .01, mode: 'type', stroke: 'rgba(255,255,255,.13)', lw: 2, alpha: 1 - Math.abs(k) * .22 });
    }
    const [sx, sy] = shake(lt, idx * .5, 16, .3);
    ctx.save(); ctx.translate(sx, sy);
    kt(w, CX, 540 + size * .35, { t, size, weight: 900, align: 'center', st: .018, dur: .3, mode, dist: 900, color: col || C.white, stroke, lw: 4 });
    ctx.restore();
  } else {
    const t = lt - 1.5;
    ['Rebelde.', 'Inmediata.', 'Vanguardista.'].forEach((w, i) => kt(w, CX, 420 + i * 150, { t: t - i * .07, size: 140, weight: 900, align: 'center', st: .015, dur: .45, color: i === 1 ? C.blue : C.white, out: d - 1.5 - .35, outSt: .006, outDur: .3 }));
    text('Los tres rasgos centrales de la personalidad de X', CX, 890, { size: 30, weight: 500, fam: TEXT, color: C.grey, align: 'center', alpha: E.outCubic(prog(t, .3, .6)) * exitAlpha(lt, d) });
  }
}, { punch: false });
{ const s = SCENES[SCENES.length - 1].s; [0, .5, 1.0].forEach(x => { cue('hit', s + x, { big: 1 }); GLITCH.push([s + x, .1, .8]); }); cue('impact', s + 1.5); }

scene('c3-mapa', 4.5, (lt, d) => {
  header(lt, 3, '#Posicionamiento');
  const ea = exitAlpha(lt, d, .35);
  ctx.save(); ctx.globalAlpha = ea;
  kt('Mapa de posicionamiento', 120, 200, { t: lt, size: 60, weight: 900, st: .012 });
  text('Encuesta Brand Health Tracker · n = 50 · AMBA', 120, 250, { size: 24, weight: 500, fam: TEXT, color: C.grey, alpha: ea * E.outCubic(prog(lt, .3, .6)) });
  const X0 = 640, X1 = 1400, Y0 = 960, Y1 = 300;
  const mx = v => X0 + (v - 1) / 4 * (X1 - X0), my = v => Y0 - (v - 1) / 4 * (Y0 - Y1);
  const ax = E.outExpo(prog(lt, .1, .8));
  ctx.strokeStyle = '#2F3336'; ctx.lineWidth = 2;
  for (let v = 1; v <= 5; v++) { ctx.globalAlpha = ea * .5 * ax; ctx.beginPath(); ctx.moveTo(mx(v), Y0); ctx.lineTo(mx(v), lerp(Y0, Y1, ax)); ctx.stroke(); ctx.beginPath(); ctx.moveTo(X0, my(v)); ctx.lineTo(lerp(X0, X1, ax), my(v)); ctx.stroke(); }
  ctx.globalAlpha = ea; ctx.strokeStyle = C.grey; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(X0, my(3)); ctx.lineTo(lerp(X0, X1 + 30, ax), my(3)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(mx(3), Y0); ctx.lineTo(mx(3), lerp(Y0, Y1 - 30, ax)); ctx.stroke();
  label('Inmediatez →', X1 + 30, my(3) + 40, lt - .6, { align: 'right', color: C.soft, size: 18 });
  label('↑ Clima de respeto', mx(3) + 16, Y1 - 20, lt - .7, { color: C.soft, size: 18 });
  // target zone
  const tz = E.outBackS(prog(lt, 2.0, 2.5));
  if (tz > 0) {
    const pulse = 1 + .06 * Math.sin(lt * 7);
    ctx.save(); ctx.translate(mx(4.6), my(4.55)); ctx.scale(tz * pulse, tz * pulse);
    ctx.fillStyle = 'rgba(29,155,240,.12)'; ctx.strokeStyle = C.blue; ctx.lineWidth = 3; ctx.setLineDash([12, 10]); ctx.lineDashOffset = -lt * 40;
    ctx.beginPath(); ctx.arc(0, 0, 110, 0, 7); ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
    text('?', 0, 30, { size: 90, weight: 900, color: C.blue, align: 'center' });
    ctx.restore();
    const dl = E.outExpo(prog(lt, 2.4, 3.1));
    ctx.strokeStyle = C.blue; ctx.lineWidth = 3; ctx.setLineDash([4, 10]);
    ctx.beginPath(); ctx.moveTo(mx(4.24), my(3.58)); ctx.lineTo(lerp(mx(4.24), mx(4.6), dl), lerp(my(3.58), my(4.55) + 100, dl)); ctx.stroke(); ctx.setLineDash([]);
  }
  label('El lugar vacío', 120, 470, lt - 2.3, { color: C.blue });
  kt('Rápida,', 120, 560, { t: lt - 2.4, size: 72, weight: 900, st: .02 });
  kt('confiable y', 120, 640, { t: lt - 2.5, size: 72, weight: 900, st: .02 });
  kt('segura para', 120, 720, { t: lt - 2.6, size: 72, weight: 900, st: .02 });
  kt('opinar.', 120, 800, { t: lt - 2.7, size: 72, weight: 900, st: .02, color: C.blue });
  // brands
  const pts = [['X', 4.24, 3.58, '#fff', 34, '4,24 · 3,58'], ['Threads', 3.35, 3.34, '#8B98A5', 24, '3,35 · 3,34'], ['Bluesky', 1.92, 2.18, C.celeste, 20, '1,92 · 2,18']];
  pts.forEach(([n, ix, rs, col, r, val], i) => {
    const p = E.outBackS(prog(lt, .7 + i * .15, 1.15 + i * .15));
    if (p <= 0) return;
    const x = lerp(mx(3), mx(ix), E.outExpo(prog(lt, .7 + i * .15, 1.3 + i * .15))), y = lerp(my(3), my(rs), E.outExpo(prog(lt, .7 + i * .15, 1.3 + i * .15)));
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r * p, 0, 7); ctx.fill();
    if (n === 'X') text('X', x, y + 13, { size: 36, weight: 900, color: '#000', align: 'center', alpha: p });
    const left = n === 'Threads';
    text(n === 'X' ? '' : n, left ? x - r - 14 : x + r + 14, y + 10, { size: 30, weight: 800, alpha: clamp(p), align: left ? 'right' : 'left' });
    text(val, left ? x - r - 14 : x + r + 14, y + (n === 'X' ? 10 : 42), { size: 22, weight: 600, fam: TEXT, color: C.grey, alpha: clamp(p), align: left ? 'right' : 'left' });
  });
  ctx.restore();
});
{ const s = SCENES[SCENES.length - 1].s; [.7, .85, 1.0].forEach(x => cue('pop', s + x)); cue('bloop', s + 2.0); cue('swoosh', s + 2.4); }

// ════════════════════════ 4/6 MIX ══════════════════════════
chapterCard(4, '#Mix', 'Estrategia de mix');

scene('c4-4p', 3, (lt, d) => {
  header(lt, 4, '#Mix');
  const out = prog(lt, d - .4, d), oe = E.inExpo(out);
  const Q4 = [['01', 'Producto', 'Red + Grok + Notas de la Comunidad', -1, -1], ['02', 'Precio', 'Freemium · suscripciones en USD', 1, -1], ['03', 'Plaza', '100% digital · App Store › Noticias', -1, 1], ['04', 'Promoción', 'Medios propios y ganados · Musk vocero', 1, 1]];
  const cp = E.outExpo(prog(lt, 0, .5)) * (1 - out);
  ctx.fillStyle = C.line; ctx.fillRect(CX - 1, 600 - 380 * cp, 2, 760 * cp); ctx.fillRect(CX - 860 * cp, 599, 1720 * cp, 2);
  Q4.forEach(([n, w, sub, dx, dy], i) => {
    const x = dx < 0 ? 140 : 1010, y = dy < 0 ? 410 : 820, s = .1 + i * .12;
    ctx.save(); ctx.translate(dx * oe * 1400, dy * oe * 900);
    label(n, x, y - 150, lt - s, { color: C.blue, size: 22 });
    kt(w, x, y - 30, { t: lt - s, size: 120, weight: 900, st: .02, color: i === 1 ? C.blue : C.white });
    text(sub, x, y + 30, { size: 30, weight: 500, fam: TEXT, color: C.grey, alpha: E.outCubic(prog(lt, s + .3, s + .7)) });
    ctx.restore();
  });
});
{ const s = SCENES[SCENES.length - 1].s; [.1, .22, .34, .46].forEach(x => cue('hit', s + x, { soft: 1 })); cue('whoosh', s + 2.6, { len: .4 }); }

scene('c4-precio', 3, (lt, d) => {
  header(lt, 4, '#Mix');
  const ea = exitAlpha(lt, d, .35);
  ctx.save(); ctx.globalAlpha = ea;
  const s1 = 'Freemium en USD';
  kt(s1, 120, 300, { t: lt, size: 130, weight: 900, st: .02, color: hl(s1, 'USD', C.white, C.blue) });
  text('Gratis con publicidad + suscripción paga.', 120, 380, { size: 34, weight: 500, fam: TEXT, color: C.soft, alpha: ea * E.outCubic(prog(lt, .3, .7)) });
  text('Argentina paga en dólares, más impuestos.', 120, 430, { size: 34, weight: 500, fam: TEXT, color: C.grey, alpha: ea * E.outCubic(prog(lt, .45, .85)) });
  const base = 940, k = 13;
  const T = [['Basic', 3, C.soft, 760], ['Premium', 8, '#8ecdf8', 1060], ['Premium+', 40, C.blue, 1360]];
  T.forEach(([n, v, col, x], i) => {
    const s = .3 + i * .15;
    let val = v * E.outExpo(prog(lt, s, s + .8));
    if (i === 2) val = 22 * E.outExpo(prog(lt, s, s + .7)) + 18 * E.outElastic(prog(lt, 1.55, 2.4));
    const h = val * k;
    rrect(x, base - h, 230, h, 14); ctx.fillStyle = col; ctx.fill();
    if (i === 2 && lt > 1.4) { ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.setLineDash([8, 8]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 20, base - 22 * k); ctx.lineTo(x + 250, base - 22 * k); ctx.stroke(); ctx.setLineDash([]); text('antes USD 22', x + 260, base - 22 * k + 8, { size: 22, weight: 600, fam: TEXT, color: C.grey, alpha: ea * prog(lt, 1.4, 1.7) }); }
    text('USD ' + fmt(Math.round(val)), x + 115, base - h - 22, { size: 48, weight: 900, align: 'center', alpha: ea * clamp((lt - s) * 4) });
    text(n, x + 115, base + 50, { size: 30, weight: 700, fam: TEXT, color: C.soft, align: 'center', alpha: ea * clamp((lt - s) * 4) });
  });
  const pp = E.outBackS(prog(lt, 1.75, 2.1));
  if (pp > 0) { ctx.save(); ctx.translate(1590, 330); ctx.scale(pp, pp); rrect(-50, -40, 230, 80, 40); ctx.fillStyle = '#fff'; ctx.fill(); text('+82%', 65, 18, { size: 44, weight: 900, color: '#000', align: 'center' }); ctx.restore(); text('tras Grok 3', 1655, 410, { size: 24, weight: 600, fam: TEXT, color: C.grey, align: 'center', alpha: ea * pp }); }
  ctx.restore();
});
{ const s = SCENES[SCENES.length - 1].s; [.3, .45, .6].forEach(x => cue('blip', s + x)); cue('impact', s + 1.6); cue('pop', s + 1.75); }

scene('c4-everything', 4.5, (lt, d) => {
  header(lt, 4, '#Mix');
  label('Extensión de línea → superapp', 120, 170, lt, { color: C.blue });
  const SAT = ['XChat', 'X Money', 'Grok', 'X Ads', 'Premium'];
  const outS = 1 - E.inBack(prog(lt, d - .35, d));
  const tile = (x, y, sz, fill, stroke, a = 1) => { ctx.save(); ctx.globalAlpha *= a; rrect(x - sz / 2, y - sz / 2, sz, sz, sz * .24); ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2.5; ctx.stroke(); } ctx.restore(); };
  // orbit
  const oa = E.outExpo(prog(lt, .1, .7)) * (1 - prog(lt, 1.8, 2.4));
  if (oa > 0) { ctx.save(); ctx.globalAlpha = oa * .5; ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.setLineDash([3, 12]); ctx.lineDashOffset = -lt * 30; ctx.beginPath(); ctx.ellipse(CX, 520, 475, 380, 0, 0, 7); ctx.stroke(); ctx.restore(); }
  const satPos = (i, t) => {
    const a = -Math.PI / 2 + i * Math.PI * 2 / 5 + t * .6;
    const pin = E.inCubic(prog(t, 1.8 + i * .12, 2.3 + i * .12));
    const R = lerp(380, 0, pin);
    return [CX + Math.cos(a) * R * 1.25, 520 + Math.sin(a) * R, pin];
  };
  SAT.forEach((n, i) => {
    const ap = E.outBackS(prog(lt, .25 + i * .1, .6 + i * .1));
    const [x, y, pin] = satPos(i, lt);
    if (pin >= 1 || ap <= 0) return;
    const sz = 150 * ap * (1 - .65 * pin);
    if (pin > 0) for (let k = 3; k >= 1; k--) { const [gx, gy, gp] = satPos(i, lt - k * .03); tile(gx, gy, 150 * (1 - .65 * gp), C.blue, null, .12); }
    tile(x, y, sz, C.blue, null);
    if (pin < .4) text(n, x, y + 9, { size: 26, weight: 800, fam: TEXT, align: 'center', alpha: 1 - pin * 2.5 });
  });
  // the X app icon absorbs every product
  let pulse = 0; for (let i = 0; i < 5; i++) { const ta = 2.3 + i * .12; if (lt > ta) pulse += .1 * Math.exp(-(lt - ta) / .07); }
  const big = E.outBackS(prog(lt, 2.95, 3.4));
  const csz = 230 * E.outBackS(prog(lt, 0, .5)) * (1 + pulse + .35 * big) * outS;
  if (csz > 1) { tile(CX, 520, csz, '#000', lt > 2.3 ? C.blue : C.line); drawX(CX, 520, csz * .3); }
  shockwave(lt, 2.95, CX, 520, 700);
  const s2 = 'La everything app';
  kt(s2, CX, 880, { t: lt - 3.3, size: 110, weight: 900, align: 'center', st: .02, color: hl(s2, 'everything', C.white, C.blue), out: d - 3.3 - .35, outSt: .006, outDur: .3 });
  text('Red social · mensajería · pagos · IA — en una sola aplicación', CX, 950, { size: 28, weight: 500, fam: TEXT, color: C.grey, align: 'center', alpha: E.outCubic(prog(lt, 3.6, 4)) * exitAlpha(lt, d) });
});
function lerpRGB(a, b, t) { return a.map((v, i) => lerp(v, b[i], t)); }
{ const s = SCENES[SCENES.length - 1].s; [.25, .35, .45, .55, .65].forEach(x => cue('bloop', s + x, { soft: 1 })); [0, 1, 2, 3, 4].forEach(i => cue('blip', s + 2.3 + i * .12, { n: i })); cue('impact', s + 2.95, { big: 1 }); FLASH.push([s + 2.95, .25, .3, '#fff']); }

// ════════════════════════ 5/6 VCM ══════════════════════════
chapterCard(5, '#VCM', 'Valor Capital de Marca');

scene('c5-stats', 4, (lt, d) => {
  header(lt, 5, '#VCM');
  label('Brand Health Tracker · n = 50 · AMBA', 120, 170, lt, { color: C.grey });
  const S = [[90, 0, '%', 'piensan primero en X', 'Top of Mind', C.white, 90], [100, 0, '%', 'conoce X', 'Awareness', C.blue, 100], [3.9, 2, '', 'valor percibido sobre 5 · Threads: 3,15', 'Precio / valor', C.white, 78], [4.24, 2, '', 'inmediatez sobre 5 · el atributo líder', 'Posicionamiento', C.blue, 84.8]];
  const i = Math.min(3, Math.floor(lt));
  const t = lt - i;
  const [v, dec, suf, sub, lab, col, pct] = S[i];
  const cv = v * E.outExpo(prog(t, 0, .6));
  const yy = 640 + (1 - E.outExpo(prog(t, 0, .35))) * 300 - E.inExpo(prog(t, .8, 1)) * (i < 3 ? 300 : 0);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 200, W, 600); ctx.clip();
  // vertical smear during entry
  const ent = 1 - prog(t, 0, .25);
  for (let k = 3; k >= 1 && ent > 0; k--) text(dec === 2 ? fmt(cv, 2) : Math.round(cv) + suf, CX, yy + k * 60 * ent, { size: 400, weight: 900, color: col, align: 'center', alpha: .12 });
  text(dec === 2 ? fmt(cv, 2) : Math.round(cv) + suf, CX, yy, { size: 400, weight: 900, color: col, align: 'center', ls: -0.06 });
  ctx.restore();
  label(lab, CX, 780, t - .1, { align: 'center', color: col === C.white ? C.blue : C.soft });
  kt(sub, CX, 840, { t: t - .15, size: 40, weight: 600, fam: TEXT, align: 'center', st: .006, mode: 'fade', color: C.soft, out: i < 3 ? .8 : d - 3 - .3, outDur: .15 });
  // progress line
  const lp = E.outExpo(prog(t, .05, .7));
  ctx.fillStyle = '#202327'; ctx.fillRect(120, 940, W - 240, 6);
  ctx.fillStyle = col; ctx.fillRect(120, 940, (W - 240) * pct / 100 * lp, 6);
  for (let k = 0; k < 4; k++) { ctx.fillStyle = k === i ? C.blue : C.line; ctx.fillRect(120 + k * 60, 990, 44, 6); }
});
{ const s = SCENES[SCENES.length - 1].s; [0, 1, 2, 3].forEach(x => { cue('hit', s + x); cue('whoosh', s + x - .05, { len: .25, soft: 1 }); }); }

scene('c5-funnel', 5.5, (lt, d) => {
  header(lt, 5, '#VCM');
  const ea = exitAlpha(lt, d, .4);
  ctx.save(); ctx.globalAlpha = ea;
  kt('Funnel marcario', 120, 210, { t: lt, size: 72, weight: 900, st: .015 });
  const LEG = [['X', '#fff'], ['Threads', '#8B98A5'], ['Bluesky', C.celeste]];
  let lx = W - 520;
  LEG.forEach(([n, c], i) => { const a = E.outCubic(prog(lt, .2 + i * .08, .5 + i * .08)); ctx.globalAlpha = ea * a; ctx.fillStyle = c; ctx.fillRect(lx, 185, 22, 22); text(n, lx + 34, 205, { size: 26, weight: 600, fam: TEXT, color: C.soft }); lx += 150; });
  ctx.globalAlpha = ea;
  const ST = ['Awareness', 'Consideration', 'Trial', 'Repurchase', 'Loyalty'];
  const V = [[100, 98, 66, 48, 42], [84, 68, 56, 20, 6], [20, 4, 4, 2, 0]];
  const BX = 560, BW = 1100;
  const focus = prog(lt, 2.4, 2.8) * (1 - prog(lt, 4.6, 5));
  ST.forEach((st, i) => {
    const y = 290 + i * 128, s = .3 + i * .12;
    const dim = (i === 3 || i === 4) ? 1 : 1 - .65 * focus;
    ctx.globalAlpha = ea * dim * E.outCubic(prog(lt, s - .1, s + .3));
    text(st, 120, y + 52, { size: 38, weight: 800 });
    V.forEach((row, b) => {
      const p = E.outExpo(prog(lt, s + b * .06, s + .9 + b * .06));
      const w = BW * row[i] / 100 * p;
      ctx.fillStyle = LEG[b][1]; rrect(BX, y + b * 32, Math.max(w, 3), 24, 6); ctx.fill();
      text(Math.round(row[i] * p) + '%', BX + w + 14, y + b * 32 + 21, { size: 22, weight: 700, fam: TEXT, color: b === 0 ? '#fff' : C.grey });
    });
  });
  ctx.globalAlpha = ea;
  // callouts
  if (lt > 2.4) {
    const s1 = 'Quien la usa, se queda: 88% la elige como principal.';
    kt(s1, 120, 975, { t: lt - 2.5, size: 44, weight: 800, st: .006, mode: 'fade', color: hl(s1, '88%', C.white, C.blue), out: 3.85 - 2.5, outDur: .2, outSt: .002 });
    const s2 = 'El problema no es la lealtad. Es el hábito.';
    kt(s2, 120, 985, { t: lt - 3.95, size: 60, weight: 900, st: .01, color: hl(s2, 'Es el hábito.', C.white, C.blue) });
  }
  ctx.restore();
});
{ const s = SCENES[SCENES.length - 1].s; for (let i = 0; i < 5; i++) cue('blip', s + .3 + i * .12, { soft: 1 }); cue('swoosh', s + 2.4); cue('hit', s + 3.95); }

scene('c5-insight', 4.5, (lt, d) => {
  header(lt, 5, '#VCM');
  const o1 = 2.0;
  const p1 = E.outExpo(prog(lt, .05, .9)), p2 = E.outExpo(prog(lt, .35, 1.2));
  if (lt < o1 + .4) {
    kt(Math.round(82 * p1) + '%', 120, 560, { t: 1, size: 300, weight: 900, mode: 'type', out: o1 - 1 + 1, outSt: .02, outDur: .3, alpha: clamp(lt * 5) });
    kt(Math.round(48 * p2) + '%', 1010, 560, { t: 1, size: 300, weight: 900, mode: 'type', color: C.blue, out: o1 + .05, outSt: .02, outDur: .3, alpha: clamp((lt - .3) * 5) });
    text('dice que X es su red principal', 130, 640, { size: 38, weight: 600, fam: TEXT, color: C.soft, alpha: E.outCubic(prog(lt, .3, .7)) * (1 - prog(lt, o1, o1 + .2)) });
    text('la usó en el último mes', 1020, 640, { size: 38, weight: 600, fam: TEXT, color: C.soft, alpha: E.outCubic(prog(lt, .6, 1)) * (1 - prog(lt, o1, o1 + .2)) });
    const dv = E.outExpo(prog(lt, .2, .8)) * (1 - prog(lt, o1, o1 + .2));
    ctx.fillStyle = C.line; ctx.fillRect(940, 540 - 200 * dv, 2, 400 * dv);
    label('Lealtad declarada vs. lealtad real', 120, 260, lt - .1, { color: C.blue, alpha: 1 - prog(lt, o1, o1 + .2) });
  }
  const t = lt - (o1 + .3);
  const L1 = 'El capital de X está en la mente,', L2 = 'no en el hábito.';
  kt(L1, CX, 520, { t, size: 104, weight: 900, align: 'center', st: .012, color: hl(L1, 'mente', C.white, C.blue), out: d - o1 - .3 - .4, outSt: .004, outDur: .3 });
  kt(L2, CX, 650, { t: t - .2, size: 104, weight: 900, align: 'center', st: .015, out: d - o1 - .3 - .35, outSt: .004, outDur: .3 });
  kt('#LealtadSinUso', CX, 790, { t: t - .6, size: 40, weight: 700, fam: TEXT, align: 'center', mode: 'type', st: .03, color: C.blue, out: d - o1 - .3 - .3, outDur: .2 });
});
{ const s = SCENES[SCENES.length - 1].s; cue('hit', s + .05); cue('hit', s + .35); cue('whoosh', s + 2.0, { len: .4 }); cue('impact', s + 2.3); }

scene('c5-atributos', 5, (lt, d) => {
  header(lt, 5, '#VCM');
  label('Atributos asociados a X · hasta 3 por persona', 120, 170, lt, { color: C.grey, alpha: 1 - prog(lt, 2.5, 2.8) });
  const WD = [['Rápida', 74, 210, CX, 470, C.white], ['Informativa', 58, 128, 610, 650, C.soft], ['Polémica / hostil', 44, 104, 1330, 660, C.blue], ['Humor / memes', 42, 92, 890, 800, C.soft], ['Caótica', 26, 72, 1500, 330, C.grey], ['Confiable', 14, 48, 430, 330, C.grey], ['Innovadora', 14, 48, 1520, 820, C.grey]];
  WD.forEach(([w, p, size, x, y, col], i) => {
    const s = .1 + i * .14;
    const fy = Math.sin(lt * 1.6 + i) * 6;
    kt(w, x, y + fy, { t: lt - s, size, weight: 900, align: 'center', st: .015, mode: 'pop', dur: .45, color: col, out: 2.5 - s + i * .02, outMode: 'scatter', outDur: .5, outSt: .004 });
    kt(p + '%', x, y + fy + size * .38 + 10, { t: lt - s - .15, size: 26, weight: 700, fam: TEXT, align: 'center', mode: 'fade', color: i === 5 ? C.blue : C.grey, out: 2.5 - s - .15, outDur: .2 });
  });
  // 38% finale
  const t = lt - 2.9;
  if (t > 0) {
    const v = 38 * E.outExpo(prog(t, 0, .7));
    const ring = E.outExpo(prog(t, 0, .9));
    ctx.save(); ctx.lineWidth = 18; ctx.lineCap = 'round';
    ctx.strokeStyle = '#202327'; ctx.beginPath(); ctx.arc(560, 560, 230, 0, 7); ctx.stroke();
    ctx.strokeStyle = C.blue; ctx.beginPath(); ctx.arc(560, 560, 230, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * .38 * ring); ctx.stroke(); ctx.restore();
    text(Math.round(v) + '%', 560, 610, { size: 150, weight: 900, align: 'center', alpha: clamp(t * 4) });
    kt('Libertad que', 900, 500, { t: t - .1, size: 96, weight: 900, st: .015 });
    kt('no se siente.', 900, 600, { t: t - .2, size: 96, weight: 900, st: .015, color: C.blue });
    text('Solo el 38% se siente cómodo opinando en X.', 905, 680, { size: 32, weight: 500, fam: TEXT, color: C.soft, alpha: E.outCubic(prog(t, .4, .8)) });
    text('Entre los mayores de 25, apenas el 26%.', 905, 726, { size: 32, weight: 500, fam: TEXT, color: C.grey, alpha: E.outCubic(prog(t, .55, .95)) });
  }
  ctx.globalAlpha = 1;
}, {});
{ const s = SCENES[SCENES.length - 1].s; for (let i = 0; i < 7; i++) cue('bloop', s + .1 + i * .14, { soft: 1 }); cue('whoosh', s + 2.5, { len: .5 }); cue('impact', s + 2.9); }
SCENES[SCENES.length - 1].exitFade = .35;

// ════════════════════════ 6/6 BRAND BOOK ═══════════════════
chapterCard(6, '#BrandBook', 'Signo y sistema visual');

scene('c6-pajaro', 3.5, (lt, d) => {
  header(lt, 6, '#BrandBook');
  const out = d - .45;
  kt('Twitter era un pájaro', 120, 380, { t: lt - .05, size: 104, weight: 900, st: .014, color: C.celeste, out, outSt: .005, outDur: .3 });
  kt('que cantaba.', 120, 490, { t: lt - .2, size: 104, weight: 900, st: .014, color: C.celeste, out: out + .03, outSt: .005, outDur: .3 });
  kt('X es una letra', 120, 690, { t: lt - 1.15, size: 104, weight: 900, st: .014, out: out + .06, outSt: .005, outDur: .3 });
  kt('que no explica nada.', 120, 800, { t: lt - 1.3, size: 104, weight: 900, st: .014, out: out + .09, outSt: .005, outDur: .3 });
  const ap = E.outBackS(prog(lt, .2, .8)) * (1 - E.inBack(prog(lt, out, d)));
  const by = 470 + Math.sin(lt * 2.2) * 8;
  if (lt < .5) drawBird(1530, by, 150 * ap);
  else if (lt < out) birdToX(lt, .5, 1530, by, 150, 1530, 560, 170, 1.9, 420);
  else drawX(1530, 560, 170 * ap);
});
{ const s = SCENES[SCENES.length - 1].s; cue('chirp', s + .2); birdToXCues(s + .5); }

scene('c6-paleta', 3.5, (lt, d) => {
  const bgA = E.outCubic(prog(lt, 0, .35)) * (1 - prog(lt, d - .3, d));
  ctx.fillStyle = `rgba(22,24,28,${bgA})`; ctx.fillRect(0, 0, W, H);
  header(lt, 6, '#BrandBook');
  kt('Una letra, dos colores', 120, 220, { t: lt, size: 72, weight: 900, st: .012, out: d - .4, outSt: .004, outDur: .3 });
  kt('y un azul para la acción.', 120, 300, { t: lt - .12, size: 72, weight: 900, st: .012, color: C.blue, out: d - .37, outSt: .004, outDur: .3 });
  const g = E.outBackS(prog(lt, .1, .6));
  const sp = E.outBackS(prog(lt, .55, 1.25));
  const fall = E.inExpo(prog(lt, d - .45, d));
  const X3 = [520, CX, 1400];
  const cols = [[0, 0, 0], [255, 255, 255], [29, 155, 240]];
  const cm = E.inOutCubic(prog(lt, .6, 1.2));
  [0, 2, 1].forEach(i => {
    const x = lerp(CX, X3[i], sp), y = 620 + fall * (900 + i * 200), r = 155 * g;
    if (r <= 0) return;
    ctx.fillStyle = lerpCol([240, 242, 244], cols[i], cm); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    if (i === 0) { ctx.strokeStyle = `rgba(255,255,255,${.35 * cm})`; ctx.lineWidth = 3; ctx.stroke(); }
    // orbiting accent ring
    const ra = E.outExpo(prog(lt, 1.1 + i * .1, 1.8 + i * .1)) * (1 - fall);
    if (ra > 0) { ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r + 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ra); ctx.stroke(); }
  });
  shockwave(lt, .55, CX, 620, 600);
  const INFO = [['Negro X', '#000000', 'Fondo de marca'], ['Blanco', '#FFFFFF', 'Signo en negativo'], ['Azul acción', '#1D9BF0', 'Botones, enlaces, verificación']];
  INFO.forEach(([n, hx, role], i) => {
    const s = 1.4 + i * .12, x = X3[i];
    const a = E.outCubic(prog(lt, s, s + .4)) * (1 - prog(lt, d - .45, d - .2));
    text(n, x, 860, { size: 40, weight: 900, align: 'center', alpha: a });
    text(hx, x, 905, { size: 28, weight: 600, fam: TEXT, color: i === 2 ? C.blue : C.grey, align: 'center', alpha: a });
    text(role, x, 945, { size: 24, weight: 500, fam: TEXT, color: C.grey, align: 'center', alpha: a });
  });
  text('Tipografía: Chirp (Grilli Type, 2021) · heredada de Twitter', W - 120, 1020, { size: 22, weight: 500, fam: TEXT, color: C.grey, align: 'right', alpha: E.outCubic(prog(lt, 2.0, 2.4)) * (1 - prog(lt, d - .4, d - .2)) });
});
{ const s = SCENES[SCENES.length - 1].s; cue('pop', s + .15); cue('hit', s + .55); [0, 1, 2].forEach(i => cue('blip', s + 1.1 + i * .1, { n: i + 2 })); cue('swoosh', s + 3.05); }

scene('c6-scores', 4, (lt, d) => {
  header(lt, 6, '#BrandBook');
  const ea = exitAlpha(lt, d, .35);
  const dim = 1 - .93 * E.outCubic(prog(lt, 2.2, 2.6));
  ctx.save(); ctx.globalAlpha = ea * dim;
  kt('Evaluación del sistema visual', 120, 200, { t: lt, size: 64, weight: 900, st: .01 });
  const CR = [['a', 'Elementos visuales clave', 4], ['b', 'Coherencia visual', 4], ['c', 'Alineación con los valores', 3], ['d', 'Reconocimiento', 4], ['e', 'Atractivo visual', 3], ['f', 'Consistencia cultural', 3], ['g', 'Flexibilidad y adaptabilidad', 5], ['h', 'Competencia visual', 2], ['i', 'Evolución y cambio', 3], ['j', 'Impacto emocional', 2]];
  CR.forEach(([l, n, sc], i) => {
    const col = i < 5 ? 0 : 1, row = i % 5;
    const x = col ? 1000 : 120, y = 320 + row * 140, s = .15 + i * .07;
    const a = E.outCubic(prog(lt, s, s + .3));
    ctx.globalAlpha = ea * dim * a;
    text(l, x, y, { size: 26, weight: 800, fam: TEXT, color: C.blue });
    text(n, x + 40, y, { size: 36, weight: 800, color: '#fff' });
    for (let k = 0; k < 5; k++) {
      const f = E.outExpo(prog(lt, s + .15 + k * .05, s + .45 + k * .05));
      ctx.fillStyle = '#202327'; rrect(x + 40 + k * 112, y + 26, 100, 14, 7); ctx.fill();
      if (k < sc) { ctx.fillStyle = sc >= 5 ? C.blue : sc <= 2 ? '#F4212E' : '#fff'; rrect(x + 40 + k * 112, y + 26, 100 * f, 14, 7); ctx.fill(); }
    }
    text(sc + '/5', x + 640, y + 40, { size: 30, weight: 900, color: sc <= 2 ? '#F4212E' : '#fff' });
  });
  ctx.restore();
  const t = lt - 2.25;
  if (t > 0) {
    ctx.save(); ctx.globalAlpha = ea;
    label('Promedio del sistema visual', CX, 360, t, { align: 'center', color: C.blue });
    const v = 3.3 * E.outExpo(prog(t, 0, .8));
    const zs = 1 + .25 * (1 - E.outExpo(prog(t, 0, .4)));
    ctx.translate(CX, 600); ctx.scale(zs, zs);
    text(fmt(v, 1), -40, 160, { size: 420, weight: 900, align: 'right', ls: -0.06 });
    text('/5', -10, 160, { size: 160, weight: 900, color: C.grey });
    ctx.restore();
  }
});
{ const s = SCENES[SCENES.length - 1].s; for (let i = 0; i < 10; i++) cue('blip', s + .15 + i * .07, { soft: 1 }); cue('impact', s + 2.25, { big: 1 }); }

scene('c6-veredicto', 3.5, (lt, d) => {
  header(lt, 6, '#BrandBook');
  const out = d - .4;
  kt('Ganó en sistema.', CX, 470, { t: lt - .05, size: 176, weight: 900, align: 'center', st: .02, out, outSt: .005, outDur: .3 });
  font(176, 900); const w1 = tw('Perdió en '), w2 = tw('afecto.'), xs = CX - (w1 + w2) / 2;
  kt('Perdió en ', xs, 680, { t: lt - .5, size: 176, weight: 900, st: .02, color: C.blue, out, outSt: .005, outDur: .3 });
  kt('afecto.', xs + w1, 680, { t: lt - .75, size: 176, weight: 900, st: .02, color: C.blue, out: 1.75, outMode: 'fall', outDur: .9, outSt: .08 });
  text('Flexible, coherente y reconocible — pero no expresa la conversación que promete.', CX, 860, { size: 32, weight: 500, fam: TEXT, color: C.grey, align: 'center', alpha: E.outCubic(prog(lt, 2.2, 2.6)) * exitAlpha(lt, d) });
});
{ const s = SCENES[SCENES.length - 1].s; cue('hit', s + .05, { big: 1 }); cue('hit', s + .5, { big: 1 }); cue('fall', s + 1.75); }

// ════════════════════════ OUTRO ════════════════════════════
scene('o-propuestas', 4.5, (lt, d) => {
  label('Tres líneas de trabajo', 120, 220, lt, { color: C.blue, alpha: exitAlpha(lt, d) });
  const P3 = [['01', 'Darle significado a la letra.'], ['02', 'Recuperar calidez sin volver atrás.'], ['03', 'Diferenciarse de Threads.']];
  P3.forEach(([n, s], i) => {
    const st = .15 + i * 1.0, y = 420 + i * 200;
    const nextOn = i < 2 ? E.outCubic(prog(lt, st + 1.0, st + 1.3)) : 0;
    const a = 1 - .62 * nextOn;
    kt(n, 120, y, { t: lt - st, size: 64, weight: 900, color: C.blue, st: .04, alpha: a, out: d - .4, outDur: .3 });
    kt(s, 260, y, { t: lt - st - .05, size: 92, weight: 900, st: .012, alpha: a, out: d - .4 + i * .03, outSt: .004, outDur: .3 });
  });
});
{ const s = SCENES[SCENES.length - 1].s; [.15, 1.15, 2.15].forEach(x => cue('hit', s + x)); }

const tEnd = scene('o-final', 7.5, (lt, d) => {
  const fadeAll = 1 - E.inCubic(prog(lt, d - .9, d - .1));
  ctx.save(); ctx.globalAlpha = fadeAll;
  const conv = E.inOutCubic(prog(lt, .1, 1.25));
  const dot = (t) => { const c = E.inOutCubic(prog(t, .1, 1.25)); return c; };
  if (lt < 1.3) for (let i = 0; i < 9; i++) {
    const a = i / 9 * Math.PI * 2 + .4;
    for (let k = 4; k >= 0; k--) {
      const c = dot(lt - k * .03), R = lerp(900, 0, c);
      ctx.fillStyle = k ? 'rgba(29,155,240,.18)' : C.blue;
      ctx.beginPath(); ctx.arc(CX + Math.cos(a + c * 2.4) * R, 450 + Math.sin(a + c * 2.4) * R * .6, lerp(26, 8, c), 0, 7); ctx.fill();
    }
  }
  const p = prog(lt, 1.15, 1.9);
  if (p > 0) {
    const sx = 210 * lerp(4.2, 1, E.inCubic(p));
    if (p < 1) for (let k = 3; k >= 1; k--) drawX(CX, 450, sx * (1 + .18 * k * (1 - p)), '#fff', .1);
    drawX(CX, 450, sx * (1 + .01 * Math.sin(lt * 5) * (p >= 1 ? 1 : 0)), '#fff', clamp(p * 3));
  }
  shockwave(lt, 1.9, CX, 450);
  // typing
  const QS = '¿Qué está pasando?';
  const n = Math.floor((lt - 2.2) / .055) + 1;
  if (lt > 2.1) {
    font(70, 700); const w = tw(QS), x0 = CX - w / 2;
    ctx.fillStyle = '#fff'; ctx.fillText([...QS].slice(0, clamp(n, 0, 18)).join(''), x0, 820);
    const typedW = tw([...QS].slice(0, clamp(n, 0, 18)).join(''));
    if (Math.floor(lt * 2.4) % 2 === 0 || n < 18) { ctx.fillStyle = C.blue; ctx.fillRect(x0 + typedW + 6, 755, 5, 80); }
  }
  // button
  const bp = E.outBackS(prog(lt, 3.4, 3.8));
  if (bp > 0) {
    const press = Math.sin(Math.PI * prog(lt, 4.1, 4.3));
    ctx.save(); ctx.translate(CX, 925); ctx.scale(bp * (1 - .1 * press), bp * (1 - .1 * press));
    rrect(-110, -34, 220, 68, 34); ctx.fillStyle = C.blue; ctx.fill();
    text('Postear', 0, 11, { size: 32, weight: 800, fam: TEXT, align: 'center' }); ctx.restore();
    const rp = prog(lt, 4.15, 4.8);
    if (rp > 0 && rp < 1) { ctx.strokeStyle = C.blue; ctx.globalAlpha = fadeAll * (1 - rp); ctx.lineWidth = 4; rrect(CX - 110 - rp * 60, 891 - rp * 60, 220 + rp * 120, 68 + rp * 120, 34 + rp * 60); ctx.stroke(); ctx.globalAlpha = fadeAll; }
  }
  // credits
  const ca = E.outCubic(prog(lt, 4.6, 5.2));
  text('UADE · FACE · Construcción y Gestión de Marca · 2C 2026', 120, 1020, { size: 20, weight: 600, fam: TEXT, color: C.grey, alpha: ca });
  text('Docente: Ángeles Diaz Saubidet', W - 120, 1020, { size: 20, weight: 600, fam: TEXT, color: C.grey, align: 'right', alpha: ca });
  ctx.restore();
}, { punch: false });
cue('swoosh', tEnd + .1); cue('riser', tEnd + 1.15, { len: .75 }); cue('impact', tEnd + 1.9, { big: 1 }); FLASH.push([tEnd + 1.9, .4, .5, '#fff']);
for (let i = 0; i < 18; i++) if (i !== 4 && i !== 9) cue('tick', tEnd + 2.2 + i * .055);
cue('pop', tEnd + 3.4); cue('click', tEnd + 4.1); cue('end', tEnd + 4.15);

const TOTAL = cursor;
window.TOTAL = TOTAL;

// auto cues: a short tonal swipe on every content cut
SCENES.forEach(s => { if (s.punch !== false && !/^card/.test(s.name)) cue('cut', s.s); });

// ── post FX: punches, wipes, flashes, glitches ──
POST.push(t => {
  for (const [t0, du] of WIPES) slashWipe(prog(t, t0, t0 + du));
  for (const [t0, du, amt, col] of FLASH) { const p = prog(t, t0, t0 + du); if (p > 0 && p < 1) flash(amt * (1 - p) * (1 - p), col); }
  for (const [t0, du, amt] of GLITCH) { const p = prog(t, t0, t0 + du); if (p > 0 && p < 1) glitch(amt * (1 - p), Math.floor(t * 60)); }
});

// ── global dynamism layer ──
const BEAT0 = 14, BEAT1 = 116.5;
let glowCanvas = null;
function bgLayer(t) {
  if (t < BEAT0 + .3) return;
  const a = clamp((t - BEAT0 - .3) * 2) * (1 - prog(t, TOTAL - 1.2, TOTAL - .2));
  // drifting blue glow
  if (!glowCanvas) {
    glowCanvas = document.createElement('canvas'); glowCanvas.width = glowCanvas.height = 512;
    const g = glowCanvas.getContext('2d'); const gr = g.createRadialGradient(256, 256, 0, 256, 256, 256);
    gr.addColorStop(0, 'rgba(29,155,240,.22)'); gr.addColorStop(.5, 'rgba(29,155,240,.07)'); gr.addColorStop(1, 'rgba(29,155,240,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  }
  ctx.save(); ctx.globalAlpha = a;
  const gx = CX + Math.sin(t * .23) * 620, gy = CY + Math.cos(t * .31) * 280;
  ctx.drawImage(glowCanvas, gx - 750, gy - 750, 1500, 1500);
  // dot grid with a ripple on every beat
  const inBeat = t >= BEAT0 && t < BEAT1;
  const ph = ((t - BEAT0) % .5) / .5, ring = ph * 1500;
  for (let y = 24; y < H; y += 48) for (let x = 24; x < W; x += 48) {
    const dd = Math.hypot(x - CX, y - CY);
    const wv = inBeat ? Math.exp(-(((dd - ring) / 70) ** 2)) * (1 - ph) : 0;
    const al = .07 + .22 * wv;
    ctx.fillStyle = wv > .3 ? `rgba(29,155,240,${al})` : `rgba(255,255,255,${al})`;
    ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
  }
  ctx.restore();
}
function progressBar(t) {
  if (t < BEAT0) return;
  const a = clamp((t - BEAT0) * 2) * (1 - prog(t, TOTAL - 1, TOTAL - .3));
  ctx.save(); ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0); ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(0, H - 5, W, 5);
  ctx.fillStyle = C.blue; ctx.fillRect(0, H - 5, W * (t - BEAT0) / (TOTAL - BEAT0), 5);
  ctx.restore();
}
// entrance transitions vary per cut: punch-zoom / whip / tilt-zoom / drop
let cutIdx = 0;
SCENES.forEach(s => { if (s.punch !== false) { s.tr = cutIdx % 4; s.dir = (cutIdx % 2) ? 1 : -1; if (s.tr === 1) GLITCH.push([s.s, .08, .55]); cutIdx++; } });
window.render = function (t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = C.black; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save(); ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0); bgLayer(t); ctx.restore();
  const beat = (t >= BEAT0 && t < BEAT1) ? Math.exp(-(((t - BEAT0) % .5)) / .07) : 0;
  for (const s of SCENES) {
    if (t >= s.s && t < s.e) {
      const lt = t - s.s;
      ctx.save(); ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
      if (s.beat !== false) camera(1 + .012 * beat);
      if (s.punch !== false) {
        const k = 1 - E.outExpo(prog(lt, 0, .5));
        if (s.tr === 0) camera(1 + .08 * k);
        else if (s.tr === 1) camera(1, 0, s.dir * 360 * k, 0);
        else if (s.tr === 2) camera(1 + .14 * k, s.dir * -.06 * k);
        else camera(1 + .04 * k, 0, 0, -240 * k);
      }
      if (s.pre) { ctx.save(); s.pre(lt, s.dur, t); ctx.restore(); }
      s.draw(lt, s.dur, t);
      ctx.restore();
    }
  }
  for (const fx of POST) fx(t);
  progressBar(t);
  vignette();
};
