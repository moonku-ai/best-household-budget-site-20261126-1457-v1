// Playtest fungsional DompetKeluarga (tulisan sendiri).
// Mengunjungi kelima route, memeriksa error, lalu menguji interaksi:
// tambah transaksi, cari/filter, ubah anggaran, setoran target, kalkulator.
import { chromium } from 'playwright-core';

const BASE = 'http://localhost:8080';
const EXE = `${process.env.HOME}/.cache/ms-playwright/chromium-1148/chrome-linux/chrome`;
const browser = await chromium.launch({
  executablePath: EXE,
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--disable-dev-shm-usage'],
});
const errors = [];
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('requestfailed', (r) => errors.push(`requestfailed: ${r.url()}`));

const check = (name, ok, extra = '') => console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`);

for (const route of ['#/dashboard', '#/transaksi', '#/anggaran', '#/laporan', '#/target']) {
  await page.goto(`${BASE}/${route}`, { waitUntil: 'load' });
  await page.waitForFunction('window.__shotReady === true', null, { timeout: 30000 });
  const h1 = await page.textContent('h1');
  check(`route ${route} renders`, !!h1, h1);
}

// Tambah transaksi baru.
await page.goto(`${BASE}/#/transaksi`, { waitUntil: 'load' });
await page.waitForFunction('window.__shotReady === true', null, { timeout: 30000 });
const before = await page.locator('#tx-body tr').count();
await page.fill('#tx-amount', '75000');
await page.fill('#tx-note', 'Playtest: kopi susu');
await page.click('#tx-submit');
await page.waitForTimeout(300);
const after = await page.locator('#tx-body tr').count();
check('add transaction increases rows', after === before + 1, `${before} -> ${after}`);
const status = await page.textContent('#tx-status');
check('add transaction status shown', /disimpan/i.test(status), status);

// Cari transaksi yang baru ditambah.
await page.fill('#tx-q', 'kopi susu');
await page.waitForTimeout(200);
const found = await page.locator('#tx-body tr').count();
check('search finds new transaction', found === 1, `rows=${found}`);

// Dashboard ikut berubah (sisa berkurang 75.000).
await page.goto(`${BASE}/#/dashboard`, { waitUntil: 'load' });
await page.waitForFunction('window.__shotReady === true', null, { timeout: 30000 });
const h1 = await page.textContent('h1');
check('dashboard rest reflects new expense', h1.includes('2.051.000'), h1.trim());

// Ubah anggaran Makanan dari 2.200.000 ke 2.000.000.
await page.goto(`${BASE}/#/anggaran`, { waitUntil: 'load' });
await page.waitForFunction('window.__shotReady === true', null, { timeout: 30000 });
await page.fill('#budget-makanan', '2000000');
await page.locator('form[data-cat="makanan"] button[type="submit"]').click();
await page.waitForTimeout(300);
const budgetText = await page.locator('.budget-card', { hasText: 'Makanan' }).textContent();
check('budget edit saved', budgetText.includes('Rp 2.000.000'), budgetText.slice(0, 80));

// Kalkulator target.
await page.goto(`${BASE}/#/target`, { waitUntil: 'load' });
await page.waitForFunction('window.__shotReady === true', null, { timeout: 30000 });
await page.fill('#calc-target', '8000000');
await page.fill('#calc-saved', '1500000');
await page.fill('#calc-monthly', '500000');
await page.click('#calc-form button[type="submit"]');
await page.waitForTimeout(200);
const calc = await page.textContent('#calc-result');
check('calculator computes 13 months', /13 bulan/.test(calc), calc);

// Setoran ke target Dana darurat menambah saldo.
const goalBefore = await page.locator('.goal-card', { hasText: 'Dana darurat' }).textContent();
await page.fill('#add-g1', '100000');
await page.locator('form[data-goal="g1"] button[type="submit"]').click();
await page.waitForTimeout(300);
const goalAfter = await page.locator('.goal-card', { hasText: 'Dana darurat' }).textContent();
check('goal contribution increases saved', goalAfter.includes('Rp 6.500.000'), goalAfter.slice(0, 90));

// Validasi form: jumlah di bawah minimum ditolak browser.
await page.goto(`${BASE}/#/transaksi`, { waitUntil: 'load' });
await page.waitForFunction('window.__shotReady === true', null, { timeout: 30000 });
const rowsBeforeInvalid = await page.locator('#tx-body tr').count();
await page.fill('#tx-amount', '100');
await page.fill('#tx-note', 'Tes invalid');
await page.click('#tx-submit');
await page.waitForTimeout(200);
const rowsAfterInvalid = await page.locator('#tx-body tr').count();
check('invalid amount rejected (no new row)', rowsAfterInvalid === rowsBeforeInvalid, `rows=${rowsBeforeInvalid} -> ${rowsAfterInvalid}`);

// localStorage bertahan setelah reload.
await page.reload({ waitUntil: 'load' });
await page.waitForFunction('window.__shotReady === true', null, { timeout: 30000 });
await page.fill('#tx-q', 'kopi susu');
await page.waitForTimeout(200);
const persisted = await page.locator('#tx-body tr').count();
check('transaction persists after reload', persisted === 1, `rows=${persisted}`);

await browser.close();
if (errors.length) {
  console.log('ERRORS:');
  for (const e of errors) console.log(' -', e);
  process.exitCode = 1;
} else {
  console.log('no console/page/request errors');
}
