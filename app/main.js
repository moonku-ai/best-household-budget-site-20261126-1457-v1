// DompetKeluarga — router hash, penyimpanan lokal, dan semua interaksi.
// Satu-satunya file yang menyentuh DOM di luar views.js. Tidak ada request
// jaringan: data tinggal di localStorage peramban ini.

import {
  HOUSEHOLD, SEED_TRANSACTIONS, BUDGETS, SEED_GOALS, fmtRp,
} from './data.js';
import {
  viewDashboard, viewTransactions, viewBudget, viewReport, viewGoals,
  txRowsHTML, summarize,
} from './views.js';

const STORE_KEY = 'dompetkeluarga-v1';
const root = document.getElementById('app');
const navLinks = [...document.querySelectorAll('.main-nav a')];

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.transactions) && parsed.budgets && Array.isArray(parsed.goals)) {
        return parsed;
      }
    }
  } catch { /* data rusak: mulai dari contoh */ }
  return seedState();
}

function seedState() {
  return {
    transactions: structuredClone(SEED_TRANSACTIONS),
    budgets: { ...BUDGETS },
    goals: structuredClone(SEED_GOALS),
  };
}

function saveState() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

let state = loadState();

// ---- Router -----------------------------------------------------------------

const ROUTES = {
  '/dashboard': { render: viewDashboard, title: 'Dashboard' },
  '/transaksi': { render: viewTransactions, title: 'Transaksi' },
  '/anggaran': { render: viewBudget, title: 'Anggaran' },
  '/laporan': { render: viewReport, title: 'Laporan' },
  '/target': { render: viewGoals, title: 'Target tabungan' },
};

function currentRoute() {
  const hash = location.hash.replace(/^#/, '') || '/dashboard';
  return ROUTES[hash] ? hash : '/dashboard';
}

function render() {
  const route = currentRoute();
  const view = ROUTES[route];
  document.title = `${view.title} – DompetKeluarga`;
  root.innerHTML = view.render(state);
  for (const a of navLinks) {
    const href = a.getAttribute('href');
    if (href === `#${route}`) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }
  if (route === '/transaksi') wireTransactions();
  if (route === '/anggaran') wireBudgets();
  if (route === '/target') wireGoals();
  window.__shotReady = true;
}

window.addEventListener('hashchange', render);

// ---- Transaksi: form, filter, edit, hapus ------------------------------------

function txFilter() {
  return {
    q: document.getElementById('tx-q')?.value ?? '',
    type: document.getElementById('tx-filter-type')?.value ?? '',
    cat: document.getElementById('tx-filter-cat')?.value ?? '',
  };
}

function refreshTxList() {
  const body = document.getElementById('tx-body');
  if (!body) return;
  const f = txFilter();
  body.innerHTML = txRowsHTML(state, f);
  const shown = [...state.transactions]
    .filter((t) => (!f.type || t.type === f.type))
    .filter((t) => (!f.cat || t.category === f.cat))
    .filter((t) => !f.q || t.note.toLowerCase().includes(f.q.toLowerCase()));
  document.getElementById('tx-count').textContent =
    `Menampilkan ${shown.length} dari ${state.transactions.length} transaksi.`;
  const total = shown.reduce((s, t) => s + (t.type === 'in' ? t.amount : -t.amount), 0);
  document.getElementById('tx-total').textContent =
    `${total >= 0 ? '+' : '−'} ${fmtRp(Math.abs(total))}`;
}

function wireTransactions() {
  refreshTxList();
  const form = document.getElementById('tx-form');
  const status = document.getElementById('tx-status');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const id = document.getElementById('tx-id').value;
    const tx = {
      id: id || `t${Date.now().toString(36)}`,
      date: document.getElementById('tx-date').value,
      type: document.getElementById('tx-type').value,
      category: document.getElementById('tx-cat').value,
      amount: Math.round(Number(document.getElementById('tx-amount').value)),
      note: document.getElementById('tx-note').value.trim(),
    };
    if (id) {
      const i = state.transactions.findIndex((t) => t.id === id);
      if (i >= 0) state.transactions[i] = tx;
      status.textContent = 'Transaksi diperbarui.';
    } else {
      state.transactions.push(tx);
      status.textContent = 'Transaksi disimpan.';
    }
    saveState();
    form.reset();
    document.getElementById('tx-id').value = '';
    document.getElementById('tx-date').value = '2026-11-26';
    document.getElementById('tx-submit').textContent = 'Simpan transaksi';
    document.getElementById('tx-cancel').hidden = true;
    refreshTxList();
  });

  document.getElementById('tx-cancel').addEventListener('click', () => {
    form.reset();
    document.getElementById('tx-id').value = '';
    document.getElementById('tx-date').value = '2026-11-26';
    document.getElementById('tx-submit').textContent = 'Simpan transaksi';
    document.getElementById('tx-cancel').hidden = true;
    status.textContent = '';
  });

  for (const id of ['tx-q', 'tx-filter-type', 'tx-filter-cat']) {
    document.getElementById(id).addEventListener('input', refreshTxList);
  }

  document.getElementById('tx-csv').addEventListener('click', () => {
    const lines = ['Tanggal,Keterangan,Kategori,Jenis,Jumlah (Rp)'];
    for (const t of [...state.transactions].sort((a, b) => (a.date < b.date ? -1 : 1))) {
      lines.push([t.date, `"${t.note.replace(/"/g, '""')}"`, t.category, t.type, t.amount].join(','));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'transaksi-november-2026.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  document.getElementById('tx-reset').addEventListener('click', () => {
    if (window.confirm('Kembalikan semua data ke contoh awal? Perubahan Anda akan hilang.')) {
      state = seedState();
      saveState();
      render();
    }
  });

  // Delegasi tombol Ubah / Hapus di tabel.
  document.getElementById('tx-body').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const tx = state.transactions.find((t) => t.id === btn.dataset.id);
    if (!tx) return;
    if (btn.dataset.action === 'delete-tx') {
      if (window.confirm(`Hapus transaksi "${tx.note}" (${fmtRp(tx.amount)})?`)) {
        state.transactions = state.transactions.filter((t) => t.id !== tx.id);
        saveState();
        refreshTxList();
      }
    } else if (btn.dataset.action === 'edit-tx') {
      document.getElementById('tx-id').value = tx.id;
      document.getElementById('tx-date').value = tx.date;
      document.getElementById('tx-type').value = tx.type;
      document.getElementById('tx-cat').value = tx.category;
      document.getElementById('tx-amount').value = tx.amount;
      document.getElementById('tx-note').value = tx.note;
      document.getElementById('tx-submit').textContent = 'Simpan perubahan';
      document.getElementById('tx-cancel').hidden = false;
      document.getElementById('tx-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
      document.getElementById('tx-note').focus();
    }
  });
}

// ---- Anggaran: ubah batas ------------------------------------------------------

function wireBudgets() {
  for (const form of document.querySelectorAll('.budget-form')) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const cat = form.dataset.cat;
      const input = form.querySelector('input');
      if (!input.checkValidity()) {
        input.reportValidity();
        return;
      }
      state.budgets[cat] = Math.round(Number(input.value));
      saveState();
      render();
    });
  }
}

// ---- Target: setoran + kalkulator ---------------------------------------------

function wireGoals() {
  for (const form of document.querySelectorAll('.goal-form')) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const goal = state.goals.find((g) => g.id === form.dataset.goal);
      const input = form.querySelector('input');
      if (!goal || !input.checkValidity()) {
        input.reportValidity();
        return;
      }
      const amount = Math.round(Number(input.value));
      goal.saved += amount;
      state.transactions.push({
        id: `t${Date.now().toString(36)}`,
        date: '2026-11-26',
        type: 'out',
        category: 'tabungan',
        amount,
        note: `Setoran target ${goal.name}`,
      });
      saveState();
      render();
    });
  }

  const calc = document.getElementById('calc-form');
  calc.addEventListener('submit', (e) => {
    e.preventDefault();
    const target = Number(document.getElementById('calc-target').value);
    const saved = Number(document.getElementById('calc-saved').value);
    const monthly = Number(document.getElementById('calc-monthly').value);
    const out = document.getElementById('calc-result');
    if (!calc.checkValidity()) {
      calc.reportValidity();
      return;
    }
    const rest = target - saved;
    if (rest <= 0) {
      out.textContent = 'Target sudah tercapai, tidak perlu setoran lagi.';
      return;
    }
    const months = Math.ceil(rest / monthly);
    const done = new Date(2026, 10 + months, 1);
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    out.textContent = `Butuh ${months} bulan dengan setoran ${fmtRp(monthly)} per bulan, ` +
      `tercapai sekitar ${monthNames[done.getMonth()]} ${done.getFullYear()}.`;
  });
}

// ---- Validasi yang ramah: aria-invalid mengikuti :user-invalid ------------------
// (modern-web-guidance: validate-input-after-interaction)

function syncAria(el) {
  if (!el.matches?.('input, select, textarea')) return;
  const invalid = el.matches(':user-invalid');
  el.setAttribute('aria-invalid', invalid ? 'true' : 'false');
}

document.addEventListener('blur', (e) => syncAria(e.target), true);
document.addEventListener('input', (e) => {
  if (e.target.hasAttribute('aria-invalid')) syncAria(e.target);
});
document.addEventListener('invalid', (e) => syncAria(e.target), true);

document.querySelector('.household-name').textContent = HOUSEHOLD.name;
document.querySelector('.household-meta').textContent =
  `${HOUSEHOLD.members}, ${HOUSEHOLD.city}`;

render();
