// node tools/preview.mjs out_dir scale t1 t2 ...   → PNG stills
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const [out, scale, ...ts] = process.argv.slice(2);
const S = parseFloat(scale);
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1920 * S, height: 1080 * S } });
p.on('console', m => console.log('console:', m.text())); p.on('pageerror', e => console.log('PAGEERROR', e.message));
await p.goto('file://' + path.resolve('src/index.html') + '?scale=' + S);
const info = await p.evaluate(() => window.ready);
console.log('TOTAL', info.total, 'cues', info.cues.length);
for (const t of ts) {
  await p.evaluate(t => render(t), parseFloat(t));
  await p.locator('#c').screenshot({ path: `${out}/f_${String(t).padStart(6, '0')}.png` });
}
await b.close();
