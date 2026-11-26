// Screenshot driver untuk DompetKeluarga (tulisan sendiri).
// Serve dulu: node serve.ts --port 8080 (dari repo ini).
// Lalu: node shots.mjs  — mengambil 4 screenshot dari shots.json.
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const BASE = 'http://localhost:8080';
const EXE = `${process.env.HOME}/.cache/ms-playwright/chromium-1148/chrome-linux/chrome`;

const browser = await chromium.launch({
  executablePath: EXE,
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--disable-dev-shm-usage'],
});

const errors = [];
const shots = JSON.parse(readFileSync(join(here, 'shots.json'), 'utf8'));
for (const shot of shots) {
  const page = await browser.newPage({ viewport: shot.viewport });
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`${shot.file}: console: ${msg.text()}`);
  });
  page.on('pageerror', (err) => errors.push(`${shot.file}: pageerror: ${err.message}`));
  page.on('requestfailed', (req) => errors.push(`${shot.file}: requestfailed: ${req.url()}`));
  await page.goto(`${BASE}/${shot.path}`, { waitUntil: 'load' });
  await page.waitForFunction('window.__shotReady === true', null, { timeout: 30000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(here, 'screenshots', shot.file), type: 'jpeg', quality: 82 });
  console.log(`shot ${shot.file} OK`);
  await page.close();
}
await browser.close();
if (errors.length) {
  console.log('ERRORS:');
  for (const e of errors) console.log(' -', e);
  process.exitCode = 1;
} else {
  console.log('no console/page errors');
}
