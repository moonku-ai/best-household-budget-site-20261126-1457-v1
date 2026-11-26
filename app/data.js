// DompetKeluarga — data contoh keluarga Indonesia, November 2026.
// Semua angka realistis dan konsisten satu sama lain: total transaksi di bawah
// sama dengan ringkasan yang ditampilkan dashboard. Data ini hanya titik awal:
// pengguna bisa menambah, mengubah, dan menghapusnya; perubahan tersimpan di
// localStorage dan tombol "Kembalikan data contoh" mengembalikan angka ini.

export const HOUSEHOLD = {
  name: 'Keluarga Rahmawati',
  members: 'Budi, Sari, dan dua anak',
  city: 'Surabaya',
  monthLabel: 'November 2026',
  monthKey: '2026-11',
};

export const CATEGORIES = [
  { id: 'kebutuhan', label: 'Kebutuhan', color: '#166B4A' },
  { id: 'makanan', label: 'Makanan', color: '#B45309' },
  { id: 'transport', label: 'Transport', color: '#2F5D8A' },
  { id: 'tagihan', label: 'Tagihan', color: '#6B5B8A' },
  { id: 'hiburan', label: 'Hiburan', color: '#8A4B3C' },
  { id: 'kesehatan', label: 'Kesehatan', color: '#4A7A5C' },
  { id: 'pendidikan', label: 'Pendidikan', color: '#7C5A2E' },
  { id: 'tabungan', label: 'Tabungan', color: '#3E6B5A' },
];

export const categoryById = (id) => CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];

// Anggaran bulanan per kategori (rupiah). "Tabungan" di sini adalah alokasi
// yang disisihkan tiap bulan, bukan pengeluaran.
export const BUDGETS = {
  kebutuhan: 2500000,
  makanan: 2200000,
  transport: 900000,
  tagihan: 1450000,
  hiburan: 500000,
  kesehatan: 600000,
  pendidikan: 800000,
  tabungan: 1500000,
};

// Transaksi bulan berjalan. type: 'in' pemasukan, 'out' pengeluaran.
export const SEED_TRANSACTIONS = [
  { id: 't01', date: '2026-11-01', type: 'in', category: 'kebutuhan', amount: 8500000, note: 'Gaji Budi, PT Cahaya Timur' },
  { id: 't02', date: '2026-11-01', type: 'out', category: 'tagihan', amount: 385000, note: 'Listrik PLN' },
  { id: 't03', date: '2026-11-01', type: 'out', category: 'tagihan', amount: 210000, note: 'Air PDAM' },
  { id: 't04', date: '2026-11-02', type: 'out', category: 'makanan', amount: 486000, note: 'Belanja mingguan Pasar Wonokromo' },
  { id: 't05', date: '2026-11-03', type: 'out', category: 'transport', amount: 150000, note: 'Bensin motor (2 minggu)' },
  { id: 't06', date: '2026-11-04', type: 'out', category: 'kebutuhan', amount: 320000, note: 'Sabun, sampo, deterjen' },
  { id: 't07', date: '2026-11-05', type: 'out', category: 'pendidikan', amount: 450000, note: 'SPP Dimas bulan November' },
  { id: 't08', date: '2026-11-06', type: 'out', category: 'makanan', amount: 125000, note: 'Sayur dan lauk harian' },
  { id: 't09', date: '2026-11-07', type: 'out', category: 'hiburan', amount: 85000, note: 'Langganan streaming keluarga' },
  { id: 't10', date: '2026-11-08', type: 'out', category: 'makanan', amount: 212000, note: 'Makan bersama di luar' },
  { id: 't11', date: '2026-11-09', type: 'out', category: 'transport', amount: 95000, note: 'Ojek online ke sekolah' },
  { id: 't12', date: '2026-11-10', type: 'out', category: 'kesehatan', amount: 275000, note: 'Periksa gigi Sari' },
  { id: 't13', date: '2026-11-11', type: 'out', category: 'makanan', amount: 398000, note: 'Belanja mingguan + buah' },
  { id: 't14', date: '2026-11-12', type: 'out', category: 'kebutuhan', amount: 540000, note: 'Beras 25 kg + minyak goreng' },
  { id: 't15', date: '2026-11-13', type: 'in', category: 'kebutuhan', amount: 1250000, note: 'Jasa servis laptop (sampingan Budi)' },
  { id: 't16', date: '2026-11-14', type: 'out', category: 'tagihan', amount: 325000, note: 'Internet rumah 50 Mbps' },
  { id: 't17', date: '2026-11-15', type: 'out', category: 'pendidikan', amount: 180000, note: 'Buku latihan dan alat tulis' },
  { id: 't18', date: '2026-11-16', type: 'out', category: 'makanan', amount: 142000, note: 'Sayur dan lauk harian' },
  { id: 't19', date: '2026-11-17', type: 'out', category: 'transport', amount: 200000, note: 'Servis ringan motor' },
  { id: 't20', date: '2026-11-18', type: 'out', category: 'hiburan', amount: 160000, note: 'Tiket bioskop keluarga' },
  { id: 't21', date: '2026-11-19', type: 'out', category: 'makanan', amount: 365000, note: 'Belanja mingguan Pasar Wonokromo' },
  { id: 't22', date: '2026-11-20', type: 'out', category: 'tagihan', amount: 145000, note: 'Iuran RT + kebersihan' },
  { id: 't23', date: '2026-11-21', type: 'out', category: 'kesehatan', amount: 120000, note: 'Vitamin dan obat flu' },
  { id: 't24', date: '2026-11-22', type: 'out', category: 'kebutuhan', amount: 285000, note: 'Peralatan dapur (wajan)' },
  { id: 't25', date: '2026-11-23', type: 'out', category: 'makanan', amount: 158000, note: 'Sayur dan lauk harian' },
  { id: 't26', date: '2026-11-24', type: 'out', category: 'pendidikan', amount: 95000, note: 'Les renang Nadia (2x)' },
  { id: 't27', date: '2026-11-25', type: 'out', category: 'transport', amount: 120000, note: 'Bensin motor (2 minggu)' },
  { id: 't28', date: '2026-11-26', type: 'out', category: 'makanan', amount: 98000, note: 'Sarapan dan bekal anak' },
  { id: 't29', date: '2026-11-26', type: 'out', category: 'tabungan', amount: 1500000, note: 'Pindah ke rekening tabungan' },
];

// Ringkasan bulan-bulan sebelumnya (untuk tren dan perbandingan).
export const MONTHLY_HISTORY = [
  { key: '2026-06', label: 'Jun', income: 9200000, expense: 7450000 },
  { key: '2026-07', label: 'Jul', income: 9350000, expense: 7980000 },
  { key: '2026-08', label: 'Agu', income: 9600000, expense: 7620000 },
  { key: '2026-09', label: 'Sep', income: 9450000, expense: 8110000 },
  { key: '2026-10', label: 'Okt', income: 9600000, expense: 7980000 },
  { key: '2026-11', label: 'Nov', income: null, expense: null }, // dihitung dari transaksi
];

// Target tabungan keluarga.
export const SEED_GOALS = [
  { id: 'g1', name: 'Dana darurat', target: 10000000, saved: 6400000, note: 'Enam bulan biaya hidup, disimpan terpisah.' },
  { id: 'g2', name: 'Liburan keluarga', target: 5000000, saved: 2150000, note: 'Liburan ke Yogyakarta, rencana Juni 2027.' },
  { id: 'g3', name: 'DP motor baru', target: 12000000, saved: 3000000, note: 'Mengganti motor lama yang sering mogok.' },
];

export const fmtRp = (n) =>
  'Rp ' + Math.round(n).toLocaleString('id-ID');

export const fmtDate = (iso) =>
  new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    .format(new Date(`${iso}T00:00:00`));
