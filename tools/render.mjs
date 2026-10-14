// node tools/render.mjs <scale> <fps> <frameStart> <frameEnd> <out.mp4>
// Renders frames [start, end) deterministically and pipes them to ffmpeg.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
const [scaleS, fpsS, f0S, f1S, out] = process.argv.slice(2);
const S = parseFloat(scaleS), fps = parseInt(fpsS), f0 = parseInt(f0S), f1 = parseInt(f1S);
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1920 * S, height: 1080 * S } });
p.on('pageerror', e => console.error('PAGEERROR', e.message));
await p.goto('file://' + path.resolve('src/index.html') + '?scale=' + S);
const info = await p.evaluate(() => window.ready);
if (process.env.CUES) fs.writeFileSync(process.env.CUES, JSON.stringify(info));
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
  '-c:v', 'libx264', '-preset', process.env.PRESET || 'medium', '-crf', process.env.CRF || '14', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
  '-x264-params', 'keyint=' + fps * 2, '-r', String(fps), out], { stdio: ['pipe', 'inherit', 'inherit'] });
const el = p.locator('#c');
const t0 = Date.now();
for (let f = f0; f < f1; f++) {
  await p.evaluate(t => render(t), f / fps);
  const buf = await p.screenshot({ type: 'png' });
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if ((f - f0) % 120 === 0) console.log(`[${out}] frame ${f} / ${f1}  ${((Date.now() - t0) / 1000 / Math.max(1, f - f0)).toFixed(3)} s/f`);
}
ff.stdin.end();
await new Promise(r => ff.on('close', r));
await b.close();
console.log('done', out, ((Date.now() - t0) / 1000).toFixed(1) + 's');
