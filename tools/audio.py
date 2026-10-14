"""Procedural soundtrack + sound design for the X motion piece.
usage: python3 tools/audio.py cues.json out.wav
Music at 120 BPM (beat = 0.5 s) so every scene cut lands on the grid; SFX are placed from the
cue list exported by the animation timeline (src/scenes.js)."""
import json, sys
import numpy as np

SR = 48000
cues = json.load(open(sys.argv[1]))
TOTAL = cues['total']
N = int(SR * TOTAL)
rng = np.random.default_rng(7)
BEAT = 0.5
DRUMS_ON, DRUMS_OFF = 14.0, 116.5

def t_axis(d): return np.arange(int(d * SR)) / SR
def add(buf, x, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= N: return
    x = x[: N - i]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[0, i:i + len(x)] += x * gain * l * 1.414
    buf[1, i:i + len(x)] += x * gain * r * 1.414
def fft_filter(x, lo=None, hi=None, order=2):
    n = len(x); X = np.fft.rfft(x); f = np.fft.rfftfreq(n, 1 / SR)
    g = np.ones_like(f)
    if hi: g *= 1 / np.sqrt(1 + (f / hi) ** (2 * order))
    if lo: g *= 1 / np.sqrt(1 + (lo / np.maximum(f, 1e-3)) ** (2 * order))
    return np.fft.irfft(X * g, n)
def env_exp(d, tau): t = t_axis(d); return np.exp(-t / tau)
def noise(d): return rng.standard_normal(int(d * SR))
def sweep(f0, f1, d, curve='exp'):
    t = t_axis(d)
    f = f0 * (f1 / f0) ** (t / d) if curve == 'exp' else f0 + (f1 - f0) * t / d
    return np.sin(2 * np.pi * np.cumsum(f) / SR)

music = np.zeros((2, N)); sfx = np.zeros((2, N)); duck = np.ones(N)

# ── drums ──
def kick():
    d = .45; t = t_axis(d)
    body = sweep(160, 42, d) * np.exp(-t / .16)
    click = fft_filter(noise(.01), lo=2000) * np.exp(-t_axis(.01) / .002) * .4
    body[:len(click)] += click
    return np.tanh(body * 1.6)
def clap():
    d = .3; n = fft_filter(noise(d), lo=900, hi=6000)
    e = np.exp(-t_axis(d) / .07)
    for k in (0.0, .012, .024): e += np.exp(-np.maximum(t_axis(d) - k, 0) / .006) * (t_axis(d) >= k) * .6
    return n * e * .5
def hat(open_=False):
    d = .25 if open_ else .06; n = fft_filter(noise(d), lo=7000)
    return n * np.exp(-t_axis(d) / (.08 if open_ else .015)) * .35
K, CL, HC, HO = kick(), clap(), hat(), hat(True)
nb = int((DRUMS_OFF - DRUMS_ON) / BEAT)
for b in range(nb):
    t = DRUMS_ON + b * BEAT
    add(music, K, t, .9)
    i = int(t * SR); L = int(.32 * SR)
    duck[i:i + L] = np.minimum(duck[i:i + L], 1 - .6 * np.exp(-np.arange(L) / SR / .09))
    if b % 2 == 1: add(music, CL, t, .55, pan=.1)
    add(music, HO, t + BEAT / 2, .45, pan=-.2)
    for s in (1, 3): add(music, HC, t + s * BEAT / 4, .35, pan=.25)
# a snare roll into the drop
for k in range(16):
    add(music, CL, 12.0 + k * .125, .1 + .4 * k / 16)

# ── harmony: Am – F – C – G (one chord per bar) ──
CH = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]
ROOT = [45, 41, 48, 43]
mtof = lambda m: 440 * 2 ** ((m - 69) / 12)
def saw(f, d, det=0.0):
    t = t_axis(d); ph = (t * f * (1 + det)) % 1
    return 2 * ph - 1
pad = np.zeros(N)
bar = 2.0
for k in range(int(TOTAL / bar) + 1):
    t0 = k * bar; ch = CH[k % 4]
    d = bar + .6; t = t_axis(d)
    e = np.minimum(t / .4, 1) * np.minimum(np.maximum(d - t, 0) / .6, 1)
    x = sum(saw(mtof(m), d, det) for m in ch for det in (-.004, .0, .005)) / 9
    i = int(t0 * SR); x = x[: max(0, N - i)]
    pad[i:i + len(x)] += x * e[:len(x)]
pad = fft_filter(pad, hi=1400, order=2) * .22
# pad swell: quieter under the dense middle, fuller in intro/outro
tt = np.arange(N) / SR
padg = np.where(tt < DRUMS_ON, 1.9 * np.clip(tt / 4, 0, 1), np.where(tt < DRUMS_OFF, .6, 1.6))
music[0] += pad * padg * .95; music[1] += np.roll(pad, 240) * padg * .95

# sub bass: offbeat 8ths on root
bass = np.zeros(N)
for b in range(int(TOTAL / BEAT)):
    t = b * BEAT
    if t < 4.0: continue
    root = ROOT[int(t / bar) % 4]
    f = mtof(root)
    for off, ln in ((BEAT / 2, .22),) if t < DRUMS_ON or t >= DRUMS_OFF else ((BEAT / 2, .22), (0, .12)):
        d = ln; tt2 = t_axis(d)
        x = np.sin(2 * np.pi * f * tt2) + .3 * np.sin(4 * np.pi * f * tt2)
        x *= np.minimum(tt2 / .005, 1) * np.exp(-tt2 / .18)
        i = int((t + off) * SR); x = x[: max(0, N - i)]
        bass[i:i + len(x)] += np.tanh(x * 1.5) * (.6 if t >= DRUMS_ON and t < DRUMS_OFF else .35)
music += bass * .55

# arp plucks (16ths) during the body
arp = np.zeros(N)
pl = lambda f: (np.sin(2 * np.pi * f * t_axis(.18)) * np.exp(-t_axis(.18) / .05))
for s in range(int(TOTAL / (BEAT / 4))):
    t = s * BEAT / 4
    if t < 6.0 or t >= 118: continue
    ch = CH[int(t / bar) % 4]
    note = ch[[0, 1, 2, 1, 0, 2, 1, 2][s % 8]] + 12
    x = pl(mtof(note)); i = int(t * SR); x = x[: max(0, N - i)]
    arp[i:i + len(x)] += x * (.5 if s % 2 == 0 else .3)
arp = fft_filter(arp, hi=3500)
arpg = np.clip((tt - 6) / 8, 0, 1) * .16
music[0] += arp * arpg * 1.1; music[1] += np.roll(arp, 2400) * arpg * .9   # ping-pong-ish

music *= duck

# ── sound design ──
def whoosh(d, bright=1.0):
    n = noise(d); t = t_axis(d); x = np.zeros_like(n)
    # time-varying one-pole lowpass (cutoff sweeps up then down)
    fc = 300 + 5000 * bright * np.sin(np.pi * t / d) ** 2
    a = np.exp(-2 * np.pi * fc / SR); y = 0.0
    for i in range(len(n)):
        y = a[i] * y + (1 - a[i]) * n[i]; x[i] = y
    return x * np.sin(np.pi * t / d) ** 1.5 * 1.6
def impact(big=False):
    d = 2.2 if big else 1.4; t = t_axis(d)
    boom = sweep(90, 28, d) * np.exp(-t / (.45 if big else .3))
    crack = fft_filter(noise(d), hi=3000) * np.exp(-t / .12) * .5
    tail = fft_filter(noise(d), lo=200, hi=2500) * np.exp(-t / .7) * .12
    return np.tanh((boom * 1.4 + crack + tail) * 1.2)
def hit(big=False):
    d = .35; t = t_axis(d)
    return np.tanh(sweep(140, 50, d) * np.exp(-t / .09) * 1.3 + fft_filter(noise(d), lo=800, hi=7000) * np.exp(-t / .05) * .6) * (1.1 if big else .8)
def riser(d):
    t = t_axis(d)
    tone = sweep(180, 1800, d) * .25 + sweep(181.5, 1815, d) * .25
    nz = fft_filter(noise(d), lo=1200) * .5
    return (tone + nz) * (t / d) ** 2.2
def tick(): d = .03; return fft_filter(noise(d), lo=2500, hi=9000) * np.exp(-t_axis(d) / .004)
def pop(): d = .12; t = t_axis(d); return sweep(900, 260, d) * np.exp(-t / .04)
def bloop(): d = .16; t = t_axis(d); return sweep(240, 900, d) * np.sin(np.pi * t / d) * .9
def blip(): d = .06; t = t_axis(d); return np.sin(2 * np.pi * 1320 * t) * np.exp(-t / .018)
def fall(): d = 1.0; t = t_axis(d); return sweep(900, 90, d) * np.exp(-t / .5) * .6
def stretch(): d = 1.0; t = t_axis(d); f = 200 + 120 * np.sin(2 * np.pi * 3 * t) * np.exp(-t / .4); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .5) * .5
def chime():
    d = 4.0; t = t_axis(d)
    return sum(np.sin(2 * np.pi * mtof(m) * t) * np.exp(-t / 1.4) * g for m, g in ((81, .3), (76, .25), (69, .3), (88, .1)))

cache = {}
for c in cues['cues']:
    ty, t = c['type'], c['t']; soft = c.get('soft', 0); big = c.get('big', 0)
    g = .5 if soft else 1.0
    if ty == 'tick': add(sfx, tick(), t, .35 * g, pan=rng.uniform(-.3, .3))
    elif ty == 'click': add(sfx, tick(), t, .8); add(sfx, pop(), t, .35)
    elif ty == 'pop': add(sfx, pop(), t, .45 * g)
    elif ty == 'bloop': add(sfx, bloop(), t, .45 * g, pan=rng.uniform(-.4, .4))
    elif ty == 'blip': add(sfx, blip(), t, .3 * g, pan=rng.uniform(-.3, .3))
    elif ty in ('whoosh', 'swoosh', 'cut'):
        d = c.get('len', .4 if ty == 'swoosh' else .22 if ty == 'cut' else .6)
        key = (ty, round(d, 2))
        if key not in cache: cache[key] = whoosh(d, 1.0 if ty != 'cut' else .6)
        gg = {'whoosh': .55, 'swoosh': .4, 'cut': .22}[ty] * g
        add(sfx, cache[key], t - d * .55, gg, pan=rng.uniform(-.5, .5))
    elif ty == 'impact': add(sfx, impact(bool(big)), t, .85 if big else .6)
    elif ty == 'hit': add(sfx, hit(bool(big)), t, .55 * g)
    elif ty == 'riser': add(sfx, riser(c.get('len', 2)), t, .35)
    elif ty == 'fall': add(sfx, fall(), t, .5)
    elif ty == 'stretch': add(sfx, stretch(), t, .5)
    elif ty == 'end': add(sfx, chime(), t, .35)

# simple convolution reverb on the sfx bus
irl = int(1.6 * SR); ir = rng.standard_normal(irl) * np.exp(-np.arange(irl) / SR / .35)
ir = fft_filter(ir, hi=5000); ir /= np.sqrt((ir ** 2).sum())
def conv(x):
    n = len(x) + irl; L = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, L) * np.fft.rfft(ir, L), L)[: len(x)]
wet = np.stack([conv(sfx[0]), conv(np.roll(sfx[1], 300))])
mix = music * .8 + sfx * .9 + wet * .18

# master: gentle fades, soft clip, normalize
fade = np.ones(N); fi = int(.05 * SR); fade[:fi] = np.linspace(0, 1, fi)
fo0 = int((TOTAL - 3.0) * SR); fade[fo0:] = np.linspace(1, 0, N - fo0) ** 1.5
mix *= fade
mix = np.tanh(mix / np.abs(mix).max() * 1.6)
mix *= 0.78 / np.abs(mix).max()
pcm = (mix.T * 32767).astype('<i2')
import wave
with wave.open(sys.argv[2], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('wrote', sys.argv[2], TOTAL, 's')
