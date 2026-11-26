// DompetKeluarga — grafik SVG buatan sendiri, tanpa library.
// Tiga jenis grafik: donat (pengeluaran per kategori), batang (per kategori),
// garis (tren pemasukan vs pengeluaran). Semua memakai angka yang sama dengan
// tabel dan kartu di halaman, supaya grafik dan teks tidak pernah berbeda.

import { fmtRp } from './data.js';

const NS = 'http://www.w3.org/2000/svg';

function el(tag, attrs = {}, text = null) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (text !== null) node.textContent = text;
  return node;
}

// Donat: slices = [{label, value, color}]. Lubang tengah menampilkan total.
export function donutChart(slices, totalLabel, totalValue) {
  const size = 220;
  const r = 82;
  const cx = size / 2;
  const cy = size / 2;
  const svg = el('svg', {
    viewBox: `0 0 ${size} ${size}`,
    class: 'chart donut',
    role: 'img',
    'aria-label': `Pengeluaran per kategori, total ${totalValue}`,
  });
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (total <= 0) {
    svg.appendChild(el('circle', { cx, cy, r, fill: 'none', stroke: '#DCD5C2', 'stroke-width': 26 }));
  } else {
    let start = -Math.PI / 2;
    for (const s of slices) {
      const frac = s.value / total;
      const end = start + frac * Math.PI * 2;
      const large = frac > 0.5 ? 1 : 0;
      const x1 = cx + r * Math.cos(start);
      const y1 = cy + r * Math.sin(start);
      const x2 = cx + r * Math.cos(end);
      const y2 = cy + r * Math.sin(end);
      // Celah tipis antar potongan supaya batasnya terbaca.
      const gap = frac >= 1 ? 0 : 0.012;
      const a1 = start + gap;
      const a2 = end - gap;
      const gx1 = cx + r * Math.cos(a1);
      const gy1 = cy + r * Math.sin(a1);
      const gx2 = cx + r * Math.cos(a2);
      const gy2 = cy + r * Math.sin(a2);
      svg.appendChild(el('path', {
        d: `M ${gx1.toFixed(2)} ${gy1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${gx2.toFixed(2)} ${gy2.toFixed(2)}`,
        fill: 'none',
        stroke: s.color,
        'stroke-width': 26,
        'stroke-linecap': 'butt',
      }));
      start = end;
    }
  }
  const t1 = el('text', { x: cx, y: cy - 4, 'text-anchor': 'middle', class: 'donut-total' }, totalValue);
  const t2 = el('text', { x: cx, y: cy + 18, 'text-anchor': 'middle', class: 'donut-label' }, totalLabel);
  svg.appendChild(t1);
  svg.appendChild(t2);
  return svg;
}

// Batang horizontal per kategori, terurut dari yang terbesar.
// rows: [{label, value (angka rupiah), color}]
export function barChart(rows, maxValue) {
  const w = 640;
  const rowH = 34;
  const h = rows.length * rowH + 8;
  const labelW = 110;
  const valueW = 96;
  const svg = el('svg', {
    viewBox: `0 0 ${w} ${h}`,
    class: 'chart bars',
    role: 'img',
    'aria-label': 'Pengeluaran per kategori dalam bentuk batang',
  });
  const max = maxValue || Math.max(...rows.map((r) => r.value), 1);
  const trackW = w - labelW - valueW - 12;
  rows.forEach((row, i) => {
    const y = 8 + i * rowH;
    const barW = Math.max(2, (row.value / max) * trackW);
    svg.appendChild(el('text', { x: 0, y: y + 15, class: 'bar-label' }, row.label));
    svg.appendChild(el('rect', {
      x: labelW, y: y + 2, width: trackW, height: 18, rx: 3, class: 'bar-track',
    }));
    svg.appendChild(el('rect', {
      x: labelW, y: y + 2, width: barW, height: 18, rx: 3, fill: row.color,
    }));
    svg.appendChild(el('text', {
      x: labelW + trackW + 10, y: y + 15, class: 'bar-value',
    }, fmtRp(row.value)));
  });
  return svg;
}

// Garis tren dua seri (pemasukan dan pengeluaran) per bulan.
export function lineChart(months, income, expense) {
  // months: ['Jun', ...]; income/expense: angka per bulan (null = belum ada).
  const w = 640;
  const h = 260;
  const padL = 64;
  const padR = 16;
  const padT = 18;
  const padB = 30;
  const svg = el('svg', {
    viewBox: `0 0 ${w} ${h}`,
    class: 'chart lines',
    role: 'img',
    'aria-label': 'Tren pemasukan dan pengeluaran enam bulan terakhir',
  });
  const vals = [...income, ...expense].filter((v) => v !== null && v !== undefined);
  const max = Math.max(...vals) * 1.1;
  const min = 0;
  const x = (i) => padL + (i * (w - padL - padR)) / (months.length - 1);
  const y = (v) => padT + ((max - v) / (max - min)) * (h - padT - padB);
  // Garis grid + label sumbu.
  for (let g = 0; g <= 4; g++) {
    const gv = min + ((max - min) * g) / 4;
    const gy = y(gv);
    svg.appendChild(el('line', { x1: padL, y1: gy, x2: w - padR, y2: gy, class: 'grid-line' }));
    svg.appendChild(el('text', { x: padL - 8, y: gy + 4, 'text-anchor': 'end', class: 'axis-label' },
      gv >= 1000000 ? `Rp ${(gv / 1000000).toFixed(1)} jt` : `Rp ${Math.round(gv / 1000)} rb`));
  }
  const series = (values, cls) => {
    const pts = values.map((v, i) => (v === null || v === undefined ? null : [x(i), y(v)])).filter(Boolean);
    if (pts.length < 2) return;
    const d = pts.map(([px, py], i) => `${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`).join(' ');
    svg.appendChild(el('path', { d, fill: 'none', class: `line ${cls}` }));
    for (const [px, py] of pts) {
      svg.appendChild(el('circle', { cx: px, cy: py, r: 4, class: `dot ${cls}` }));
    }
  };
  series(income, 'line-income');
  series(expense, 'line-expense');
  months.forEach((m, i) => {
    svg.appendChild(el('text', { x: x(i), y: h - 8, 'text-anchor': 'middle', class: 'axis-label' }, m));
  });
  return svg;
}
