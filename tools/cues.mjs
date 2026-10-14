// node tools/cues.mjs out.json — export the timeline's sound cues
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path'; import fs from 'node:fs';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 480, height: 270 } });
p.on('pageerror', e => console.error('PAGEERROR', e.message));
await p.goto('file://' + path.resolve('src/index.html') + '?scale=0.25');
fs.writeFileSync(process.argv[2], JSON.stringify(await p.evaluate(() => window.ready)));
await b.close();
