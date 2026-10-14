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
for b in range(4):
    add(music, K, b * BEAT, .8)
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

# ── sound design: tonal, clean, no low-frequency noise ──
# notes in A minor so every "appearance" sound is in key with the music
SCALE = [69, 72, 74, 76, 79, 81, 84, 86, 88]
def tone(f, d, tau, harm=(1, .35, .12)):
    t = t_axis(d)
    return sum(h * np.sin(2 * np.pi * f * (k + 1) * t) for k, h in enumerate(harm)) * np.exp(-t / tau) * np.minimum(t / .002, 1)
def click(d=.004):
    return fft_filter(noise(.02), lo=5000) * np.exp(-t_axis(.02) / d) * .5
def swipe(d=.3, up=True):
    """airy high swipe: only content above 4 kHz plus a thin pitched sweep — no rumble."""
    t = t_axis(d); env = np.sin(np.pi * t / d) ** 2
    air = fft_filter(noise(d), lo=4500, hi=12000) * env * .35
    pit = sweep(900, 3200, d) if up else sweep(3200, 900, d)
    return air + pit * env * .12
def zap(hi=False):
    d = .22; t = t_axis(d)
    x = sweep(4200 if hi else 3000, 160, d) * np.exp(-t / .07)
    x += .3 * np.sign(sweep(2100 if hi else 1500, 80, d)) * np.exp(-t / .03)
    x = np.tanh(x * 1.2) * .8; x[:len(click())] += click(); return x
def shatter():
    d = .7; t = t_axis(d); x = np.zeros_like(t)
    for k in range(14):
        f = rng.uniform(2500, 7500); st = rng.uniform(0, .12); tt = np.maximum(t - st, 0)
        x += np.sin(2 * np.pi * f * tt) * np.exp(-tt / rng.uniform(.04, .14)) * (t >= st) * rng.uniform(.3, 1)
    return x * .18 + fft_filter(noise(d), lo=6000) * np.exp(-t / .05) * .25
def chirp():
    x = np.zeros(int(.3 * SR))
    for st, f0, f1 in ((0, 2600, 4100), (.11, 2900, 4300)):
        y = sweep(f0, f1, .07) * np.sin(np.pi * t_axis(.07) / .07); i = int(st * SR); x[i:i + len(y)] += y
    return x * .6
def stab(n=0):
    """short synth chord stab (A minor family), used for the opening montage and hits."""
    d = .32; t = t_axis(d); ch = [CH[0], CH[1], CH[2], CH[3]][n % 4]
    x = sum(saw(mtof(m + 12), d, det) for m in ch for det in (-.006, .006)) / 6
    x = fft_filter(x * np.exp(-t / .09), hi=2600)
    return x * 1.3 + tone(mtof(ch[0] - 12), d, .12, (1,)) * .6
def impact(big=False):
    d = 2.0 if big else 1.3; t = t_axis(d)
    sub = sweep(85, 32, d) * np.exp(-t / (.5 if big else .32))
    body = tone(mtof(45), d, .25, (1, .5, .25)) * .35
    chord = fft_filter(sum(saw(mtof(m), d, det) for m in (57, 64, 69, 72) for det in (-.004, .004)) / 8 * np.exp(-t / .6), hi=1800) * .5
    x = np.tanh((sub * 1.5 + body) * 1.1) + chord
    x[:len(click())] += click(.006) * 1.4
    return x
def hit(big=False):
    d = .3; t = t_axis(d)
    x = np.tanh(sweep(130, 50, d) * np.exp(-t / .08) * 1.4) + tone(mtof(rng.choice([57, 60, 64])), d, .07) * .25
    x[:len(click())] += click() * .8
    return x * (1.0 if big else .75)
def riser(d):
    t = t_axis(d); x = np.zeros_like(t)
    for k, m in enumerate((45, 52, 57, 64)):
        f0, f1 = mtof(m), mtof(m + 24)
        x += saw(1, d) * 0 + np.sin(2 * np.pi * np.cumsum(f0 * (f1 / f0) ** (t / d)) / SR) * (.6 - k * .1)
    shimmer = np.sin(2 * np.pi * 11 * t) * .5 + .5
    return x * (t / d) ** 2.5 * (.7 + .3 * shimmer) * .5
def tick():
    x = tone(3200, .03, .006, (1,)) * .25; c = click(.003)[:len(x)]; x[:len(c)] += c * .9; return x
def pop(n=None): f = mtof(SCALE[n % len(SCALE)] if n is not None else rng.choice(SCALE)); return tone(f, .25, .07) * .9
def bloop(n=None):
    d = .14; f = mtof(rng.choice(SCALE[:5]))
    return sweep(f * .7, f * 1.3, d) * np.sin(np.pi * t_axis(d) / d) * .6
def blip(n=None): f = mtof(SCALE[(n if n is not None else rng.integers(0, 9)) % len(SCALE)] + 12); return tone(f, .1, .03, (1, .2)) * .7
def fall(): d = 1.0; t = t_axis(d); return sweep(1200, 140, d) * np.exp(-t / .45) * .5
def chime():
    d = 4.0; t = t_axis(d)
    return sum(np.sin(2 * np.pi * mtof(m) * t) * np.exp(-t / 1.4) * g for m, g in ((81, .3), (76, .25), (69, .3), (88, .1)))

for c in cues['cues']:
    ty, t = c['type'], c['t']; soft = c.get('soft', 0); big = c.get('big', 0); n = c.get('n')
    g = .5 if soft else 1.0
    pan = float(rng.uniform(-.35, .35))
    if ty == 'tick': add(sfx, tick(), t, .45 * g, pan)
    elif ty == 'click': add(sfx, tick(), t, .9); add(sfx, pop(5), t, .4)
    elif ty == 'pop': add(sfx, pop(n), t, .4 * g, pan)
    elif ty == 'bloop': add(sfx, bloop(n), t, .4 * g, pan)
    elif ty == 'blip': add(sfx, blip(n), t, .32 * g, pan)
    elif ty == 'whoosh': d = c.get('len', .5); add(sfx, swipe(min(d, .6)), t - min(d, .6) * .6, .45 * g, pan)
    elif ty == 'swoosh': add(sfx, swipe(.3), t - .18, .4 * g, pan)
    elif ty == 'cut': add(sfx, swipe(.16, up=False), t - .06, .22, pan)
    elif ty == 'impact': add(sfx, impact(bool(big)), t, .8 if big else .6)
    elif ty == 'hit': add(sfx, hit(bool(big)), t, .55 * g)
    elif ty == 'stab': add(sfx, stab(n or 0), t, .55); add(sfx, hit(), t, .35)
    elif ty == 'zap': add(sfx, zap(bool(c.get('hi'))), t, .45, -.4 if not c.get('hi') else .4)
    elif ty == 'shatter': add(sfx, shatter(), t, .7)
    elif ty == 'chirp': add(sfx, chirp(), t, .35, .2)
    elif ty == 'riser': add(sfx, riser(c.get('len', 2)), t, .35)
    elif ty == 'fall': add(sfx, fall(), t, .45)
    elif ty == 'stretch': add(sfx, swipe(.5), t, .3)
    elif ty == 'end': add(sfx, chime(), t, .35)

# simple convolution reverb on the sfx bus
irl = int(1.6 * SR); ir = rng.standard_normal(irl) * np.exp(-np.arange(irl) / SR / .35)
ir = fft_filter(ir, hi=5000); ir /= np.sqrt((ir ** 2).sum())
def conv(x):
    n = len(x) + irl; L = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, L) * np.fft.rfft(ir, L), L)[: len(x)]
wet = np.stack([conv(sfx[0]), conv(np.roll(sfx[1], 300))])
mix = music * .8 + sfx * .9 + wet * .1

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
