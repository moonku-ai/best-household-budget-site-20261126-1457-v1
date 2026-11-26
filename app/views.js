// DompetKeluarga — tampilan lima halaman (route hash).
// Setiap halaman dirender dari state yang sama sehingga angka di dashboard,
// tabel transaksi, anggaran, dan laporan tidak pernah berbeda.

import { CATEGORIES, categoryById, fmtRp, fmtDate, MONTHLY_HISTORY } from './data.js';
import { donutChart, barChart, lineChart } from './charts.js';

export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---- Ringkasan dari state -------------------------------------------------

export function summarize(state) {
  const income = state.transactions.filter((t) => t.type === 'in').reduce((s, t) => s + t.amount, 0);
  const saved = state.transactions
    .filter((t) => t.type === 'out' && t.category === 'tabungan')
    .reduce((s, t) => s + t.amount, 0);
  const expense = state.transactions
    .filter((t) => t.type === 'out' && t.category !== 'tabungan')
    .reduce((s, t) => s + t.amount, 0);
  const byCategory = {};
  for (const c of CATEGORIES) byCategory[c.id] = 0;
  for (const t of state.transactions) {
    if (t.type === 'out' && t.category !== 'tabungan') byCategory[t.category] += t.amount;
  }
  return { income, expense, saved, rest: income - expense - saved, byCategory };
}

export function budgetStatus(spent, budget) {
  const pct = budget > 0 ? spent / budget : 0;
  if (pct > 1) return { pct, label: 'Melewati batas', cls: 'over' };
  if (pct >= 0.85) return { pct, label: 'Hampir habis', cls: 'warn' };
  return { pct, label: 'Aman', cls: 'ok' };
}

// ---- Dashboard ------------------------------------------------------------

export function viewDashboard(state) {
  const s = summarize(state);
  const spent = Object.entries(s.byCategory)
    .filter(([, v]) => v > 0)
    .map(([id, v]) => ({ label: categoryById(id).label, value: v, color: categoryById(id).color }))
    .sort((a, b) => b.value - a.value);
  const donut = donutChart(spent, 'Pengeluaran', fmtRp(s.expense));
  const legend = spent.map((x) => `
    <li><span class="swatch" style="background:${x.color}"></span>
      <span class="legend-name">${esc(x.label)}</span>
      <span class="legend-value">${fmtRp(x.value)}</span></li>`).join('');
  const nearLimit = CATEGORIES
    .map((c) => ({ c, st: budgetStatus(s.byCategory[c.id], state.budgets[c.id]) }))
    .filter(({ st }) => st.cls !== 'ok')
    .sort((a, b) => b.st.pct - a.st.pct);
  const nearHtml = nearLimit.length === 0
    ? '<p class="muted">Semua anggaran bulan ini masih aman.</p>'
    : nearLimit.map(({ c, st }) => `
      <li class="watch-row">
        <a href="#/anggaran">${esc(c.label)}</a>
        <span class="watch-pct ${st.cls}">${Math.round(st.pct * 100)}% terpakai, ${esc(st.label.toLowerCase())}</span>
      </li>`).join('');
  const recent = [...state.transactions]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 5);
  const recentHtml = recent.map((t) => `
    <li>
      <span class="tx-date">${fmtDate(t.date)}</span>
      <span class="tx-note">${esc(t.note)}</span>
      <span class="tx-cat">${esc(categoryById(t.category).label)}</span>
      <span class="tx-amount ${t.type === 'in' ? 'in' : 'out'}">${t.type === 'in' ? '+' : '−'} ${fmtRp(t.amount)}</span>
    </li>`).join('');
  const goal = state.goals[0];
  const goalPct = Math.round((goal.saved / goal.target) * 100);

  return `
  <section class="ledger-head">
    <div>
      <p class="month">November 2026, sampai 26 November</p>
      <h1>Sisa bulan ini <strong>${fmtRp(s.rest)}</strong></h1>
      <p class="lede">Uang yang masih bisa dipakai sampai akhir bulan tanpa
        mengganggu target tabungan.</p>
    </div>
    <dl class="kpi">
      <div><dt>Pemasukan</dt><dd class="in">${fmtRp(s.income)}</dd></div>
      <div><dt>Pengeluaran</dt><dd class="out">${fmtRp(s.expense)}</dd></div>
      <div><dt>Disisihkan</dt><dd>${fmtRp(s.saved)}</dd></div>
    </dl>
  </section>

  <div class="grid-2">
    <section class="card">
      <h2>Ke mana uang pergi</h2>
      <div class="donut-wrap">${donut.outerHTML}
        <ul class="legend">${legend}</ul>
      </div>
      <p class="card-foot"><a href="#/laporan">Lihat laporan lengkap</a></p>
    </section>

    <section class="card">
      <h2>Anggaran yang perlu diperhatikan</h2>
      <ul class="watch-list">${nearHtml}</ul>
      <p class="card-foot"><a href="#/anggaran">Atur semua anggaran</a></p>
    </section>
  </div>

  <div class="grid-2">
    <section class="card">
      <h2>Transaksi terakhir</h2>
      <ul class="tx-list">${recentHtml}</ul>
      <p class="card-foot"><a href="#/transaksi">Semua transaksi</a></p>
    </section>

    <section class="card">
      <h2>Target terdekat: ${esc(goal.name)}</h2>
      <p class="goal-line"><strong>${fmtRp(goal.saved)}</strong> dari ${fmtRp(goal.target)}
        , ${goalPct}% terkumpul</p>
      <div class="progress" role="progressbar" aria-valuenow="${goalPct}" aria-valuemin="0" aria-valuemax="100"
        aria-label="Kemajuan target ${esc(goal.name)}">
        <span style="width:${goalPct}%"></span>
      </div>
      <p class="muted">${esc(goal.note)}</p>
      <p class="card-foot"><a href="#/target">Semua target tabungan</a></p>
    </section>
  </div>`;
}

// ---- Transaksi --------------------------------------------------------------

export function txRowsHTML(state, filter) {
  const q = (filter.q || '').toLowerCase();
  const rows = [...state.transactions]
    .filter((t) => (!filter.type || t.type === filter.type))
    .filter((t) => (!filter.cat || t.category === filter.cat))
    .filter((t) => !q || t.note.toLowerCase().includes(q) || fmtRp(t.amount).toLowerCase().includes(q))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  if (rows.length === 0) {
    return `<tr><td colspan="5" class="empty">Tidak ada transaksi yang cocok. Ubah pencarian atau
      filter, atau tambah transaksi baru di atas.</td></tr>`;
  }
  return rows.map((t) => `
    <tr>
      <td>${fmtDate(t.date)}</td>
      <td>${esc(t.note)}</td>
      <td>${esc(categoryById(t.category).label)}</td>
      <td class="num ${t.type === 'in' ? 'in' : 'out'}">${t.type === 'in' ? '+' : '−'} ${fmtRp(t.amount)}</td>
      <td class="row-actions">
        <button type="button" class="link-btn" data-action="edit-tx" data-id="${t.id}">Ubah</button>
        <button type="button" class="link-btn danger" data-action="delete-tx" data-id="${t.id}">Hapus</button>
      </td>
    </tr>`).join('');
}

export function viewTransactions(state) {
  const s = summarize(state);
  const catOptions = CATEGORIES.map((c) => `<option value="${c.id}">${esc(c.label)}</option>`).join('');
  return `
  <h1>Transaksi</h1>
  <p class="lede">Semua pemasukan dan pengeluaran keluarga bulan ini. Perubahan langsung
    tersimpan di peramban ini, jadi catatan tidak hilang saat halaman ditutup.</p>

  <section class="card form-card" aria-labelledby="form-title">
    <h2 id="form-title">Tambah transaksi</h2>
    <form id="tx-form" novalidate>
      <input type="hidden" id="tx-id" value="">
      <div class="form-grid">
        <div class="field">
          <label for="tx-date">Tanggal</label>
          <input type="date" id="tx-date" name="date" value="2026-11-26" required data-error="tx-date-error">
          <div id="tx-date-error" class="error-msg">Pilih tanggal transaksi.</div>
        </div>
        <div class="field">
          <label for="tx-type">Jenis</label>
          <select id="tx-type" name="type">
            <option value="out">Pengeluaran</option>
            <option value="in">Pemasukan</option>
          </select>
        </div>
        <div class="field">
          <label for="tx-cat">Kategori</label>
          <select id="tx-cat" name="category">${catOptions}</select>
        </div>
        <div class="field">
          <label for="tx-amount">Jumlah (Rp)</label>
          <span id="tx-amount-hint" class="hint">Angka saja, tanpa titik atau koma. Minimal Rp 1.000.</span>
          <input type="number" id="tx-amount" name="amount" min="1000" step="1000" inputmode="numeric" required
            autocomplete="off" aria-describedby="tx-amount-hint" data-error="tx-amount-error" placeholder="150000">
          <div id="tx-amount-error" class="error-msg">Masukkan jumlah minimal Rp 1.000.</div>
        </div>
        <div class="field wide">
          <label for="tx-note">Keterangan</label>
          <input type="text" id="tx-note" name="note" maxlength="80" required autocomplete="off"
            data-error="tx-note-error" placeholder="Belanja mingguan di pasar\u2026">
          <div id="tx-note-error" class="error-msg">Tulis keterangan singkat supaya mudah dicari.</div>
        </div>
      </div>
      <div class="form-actions">
        <button type="submit" class="btn-primary" id="tx-submit">Simpan transaksi</button>
        <button type="button" class="btn-ghost" id="tx-cancel" hidden>Batal mengubah</button>
        <span class="form-status" id="tx-status" aria-live="polite"></span>
      </div>
    </form>
  </section>

  <section class="card" aria-labelledby="list-title">
    <h2 id="list-title">Daftar transaksi</h2>
    <div class="filters">
      <div class="field">
        <label for="tx-q">Cari</label>
        <input type="search" id="tx-q" name="q" autocomplete="off" placeholder="Cari keterangan atau jumlah\u2026">
      </div>
      <div class="field">
        <label for="tx-filter-type">Jenis</label>
        <select id="tx-filter-type" name="filter-type">
          <option value="">Semua jenis</option>
          <option value="in">Pemasukan</option>
          <option value="out">Pengeluaran</option>
        </select>
      </div>
      <div class="field">
        <label for="tx-filter-cat">Kategori</label>
        <select id="tx-filter-cat" name="filter-category">
          <option value="">Semua kategori</option>
          ${catOptions}
        </select>
      </div>
      <div class="field align-end">
        <button type="button" class="btn-ghost" id="tx-csv">Unduh CSV</button>
      </div>
    </div>
    <p class="muted" id="tx-count"></p>
    <div class="table-wrap">
      <table class="tx-table">
        <thead><tr><th>Tanggal</th><th>Keterangan</th><th>Kategori</th><th class="num">Jumlah</th><th></th></tr></thead>
        <tbody id="tx-body">${txRowsHTML(state, {})}</tbody>
        <tfoot><tr>
          <td colspan="3">Total tampil</td>
          <td class="num" id="tx-total"></td><td></td>
        </tr></tfoot>
      </table>
    </div>
    <p class="muted">Total bulan ini: pemasukan ${fmtRp(s.income)}, pengeluaran
      ${fmtRp(s.expense)}, disisihkan ${fmtRp(s.saved)}.
      <button type="button" class="link-btn" id="tx-reset">Kembalikan data contoh</button></p>
  </section>`;
}

// ---- Anggaran ---------------------------------------------------------------

export function viewBudget(state) {
  const s = summarize(state);
  const totalBudget = Object.values(state.budgets).reduce((a, b) => a + b, 0);
  const totalSpent = Object.values(s.byCategory).reduce((a, b) => a + b, 0) + s.saved;
  const cards = CATEGORIES.map((c) => {
    const spent = c.id === 'tabungan' ? s.saved : s.byCategory[c.id];
    const budget = state.budgets[c.id];
    const st = budgetStatus(spent, budget);
    const rest = budget - spent;
    return `
    <article class="card budget-card">
      <div class="budget-head">
        <h2>${esc(c.label)}</h2>
        <span class="status ${st.cls}">${esc(st.label)}</span>
      </div>
      <p class="budget-nums"><strong>${fmtRp(spent)}</strong> dari ${fmtRp(budget)}</p>
      <div class="progress ${st.cls}" role="progressbar" aria-valuenow="${Math.min(100, Math.round(st.pct * 100))}"
        aria-valuemin="0" aria-valuemax="100" aria-label="Anggaran ${esc(c.label)}">
        <span style="width:${Math.min(100, st.pct * 100)}%"></span>
      </div>
      <p class="muted">${rest >= 0
        ? `Sisa ${fmtRp(rest)} (${Math.round(st.pct * 100)}% terpakai)`
        : `Lebih ${fmtRp(-rest)} dari anggaran`}</p>
      <form class="budget-form" data-cat="${c.id}">
        <label for="budget-${c.id}">Ubah anggaran (Rp)</label>
        <input type="number" id="budget-${c.id}" name="budget" min="0" step="50000" value="${budget}" required autocomplete="off">
        <button type="submit" class="btn-ghost">Simpan</button>
      </form>
    </article>`;
  }).join('');
  return `
  <h1>Anggaran</h1>
  <p class="lede">Batas belanja tiap kategori untuk November 2026. Total anggaran
    ${fmtRp(totalBudget)}; terpakai ${fmtRp(totalSpent)} termasuk yang disisihkan ke tabungan.
    Anggaran yang melewati 85% ditandai hampir habis, yang lewat batas ditandai merah.</p>
  <div class="grid-2">${cards}</div>`;
}

// ---- Laporan ----------------------------------------------------------------

export function viewReport(state) {
  const s = summarize(state);
  const rows = Object.entries(s.byCategory)
    .filter(([, v]) => v > 0)
    .map(([id, v]) => ({ label: categoryById(id).label, value: v, color: categoryById(id).color }))
    .sort((a, b) => b.value - a.value);
  const bars = barChart(rows);
  const hist = MONTHLY_HISTORY.map((m) => m.key === '2026-11'
    ? { ...m, income: s.income, expense: s.expense + s.saved }
    : m);
  const lines = lineChart(
    hist.map((m) => m.label),
    hist.map((m) => m.income),
    hist.map((m) => m.expense),
  );
  const oct = MONTHLY_HISTORY.find((m) => m.key === '2026-10');
  // Bandingkan apel-dengan-apel: angka Oktober di riwayat sudah mencakup
  // pengeluaran + tabungan, jadi November dihitung dengan cara yang sama.
  const novExpenseTotal = s.expense + s.saved;
  const octRest = oct.income - oct.expense;
  const deltaIncome = s.income - oct.income;
  const deltaExpense = novExpenseTotal - oct.expense;
  const pct = (d, base) => `${d >= 0 ? '+' : '−'}${Math.abs(Math.round((d / base) * 100))}%`;
  return `
  <h1>Laporan</h1>
  <p class="lede">Pengeluaran November 2026 (sampai tanggal 26) dibandingkan dengan
    Oktober, dan tren enam bulan terakhir. Perbandingan memakai pengeluaran
    ditambah tabungan supaya sebanding dengan angka Oktober.</p>

  <section class="card">
    <h2>Pengeluaran per kategori</h2>
    <div class="chart-block">${bars.outerHTML}</div>
  </section>

  <section class="card">
    <h2>Tren enam bulan terakhir</h2>
    <div class="chart-block">${lines.outerHTML}</div>
    <p class="legend-inline"><span class="swatch" style="background:#166B4A"></span> Pemasukan
      <span class="swatch" style="background:#B45309"></span> Pengeluaran + tabungan</p>
  </section>

  <section class="card">
    <h2>Bulan ini dibanding Oktober</h2>
    <div class="table-wrap">
      <table class="tx-table compare">
        <thead><tr><th></th><th class="num">Oktober 2026</th><th class="num">November 2026</th><th class="num">Selisih</th></tr></thead>
        <tbody>
          <tr><td>Pemasukan</td><td class="num">${fmtRp(oct.income)}</td><td class="num">${fmtRp(s.income)}</td>
            <td class="num ${deltaIncome >= 0 ? 'in' : 'out'}">${deltaIncome >= 0 ? '+' : '−'} ${fmtRp(Math.abs(deltaIncome))} (${pct(deltaIncome, oct.income)})</td></tr>
          <tr><td>Pengeluaran + tabungan</td><td class="num">${fmtRp(oct.expense)}</td><td class="num">${fmtRp(novExpenseTotal)}</td>
            <td class="num ${deltaExpense <= 0 ? 'in' : 'out'}">${deltaExpense >= 0 ? '+' : '−'} ${fmtRp(Math.abs(deltaExpense))} (${pct(deltaExpense, oct.expense)})</td></tr>
          <tr><td>Sisa (pemasukan − pengeluaran − tabungan)</td><td class="num">${fmtRp(octRest)}</td>
            <td class="num">${fmtRp(s.rest)}</td>
            <td class="num ${s.rest - octRest >= 0 ? 'in' : 'out'}">${s.rest - octRest >= 0 ? '+' : '−'} ${fmtRp(Math.abs(s.rest - octRest))}</td></tr>
        </tbody>
      </table>
    </div>
    <p class="muted">Catatan: November baru berjalan sampai tanggal 26, jadi pengeluaran
      November wajar terlihat lebih kecil dari Oktober yang sudah penuh sebulan.</p>
  </section>`;
}

// ---- Target tabungan ----------------------------------------------------------

export function viewGoals(state) {
  const cards = state.goals.map((g) => {
    const pct = Math.min(100, Math.round((g.saved / g.target) * 100));
    const rest = g.target - g.saved;
    return `
    <article class="card goal-card">
      <h2>${esc(g.name)}</h2>
      <p class="goal-line"><strong>${fmtRp(g.saved)}</strong> dari ${fmtRp(g.target)}, ${pct}%</p>
      <div class="progress" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"
        aria-label="Kemajuan target ${esc(g.name)}">
        <span style="width:${pct}%"></span>
      </div>
      <p class="muted">${rest > 0 ? `Kurang ${fmtRp(rest)} lagi.` : 'Target tercapai.'} ${esc(g.note)}</p>
      <form class="goal-form" data-goal="${g.id}">
        <label for="add-${g.id}">Tambah setoran (Rp)</label>
        <input type="number" id="add-${g.id}" name="deposit" min="10000" step="10000" placeholder="200000" required autocomplete="off">
        <button type="submit" class="btn-ghost">Tambah</button>
      </form>
    </article>`;
  }).join('');
  return `
  <h1>Target tabungan</h1>
  <p class="lede">Tiga hal yang sedang ditabung keluarga Rahmawati. Setoran dicatat di
    sini dan langsung mengubah kemajuan target; setoran juga tercatat sebagai
    transaksi "Tabungan" di halaman Transaksi.</p>
  <div class="grid-2">${cards}</div>

  <section class="card">
    <h2>Kalkulator target baru</h2>
    <p class="muted">Hitung berapa bulan yang dibutuhkan untuk mencapai sebuah target,
      dari uang yang sudah terkumpul dan setoran tiap bulan.</p>
    <form id="calc-form">
      <div class="form-grid">
        <div class="field">
          <label for="calc-target">Target (Rp)</label>
          <input type="number" id="calc-target" name="target" min="100000" step="50000" value="8000000" required autocomplete="off">
        </div>
        <div class="field">
          <label for="calc-saved">Sudah terkumpul (Rp)</label>
          <input type="number" id="calc-saved" name="saved" min="0" step="50000" value="1500000" required autocomplete="off">
        </div>
        <div class="field">
          <label for="calc-monthly">Setoran tiap bulan (Rp)</label>
          <input type="number" id="calc-monthly" name="monthly" min="10000" step="10000" value="500000" required autocomplete="off">
        </div>
      </div>
      <div class="form-actions">
        <button type="submit" class="btn-primary">Hitung</button>
        <span class="form-status" id="calc-result" aria-live="polite"></span>
      </div>
    </form>
  </section>`;
}
