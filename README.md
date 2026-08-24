# Survey Arrival Predictor

Dashboard pribadi berbasis Machine Learning untuk memperkirakan **kapan survei Google Opinion Rewards berikutnya datang** dan **berapa perkiraan reward-nya**, murni dari data historis yang kamu masukkan sendiri.

> Aplikasi ini tidak mengakses API atau sistem internal penyedia survei. Seluruh prediksi hanya berdasarkan data historis milikmu.

## Fitur

- **Dashboard** — ringkasan prediksi survei & reward berikutnya, probabilitas horizon (1/3/7/14 hari), dan aktivitas terbaru
- **Prediksi** — estimasi interval, tanggal perkiraan, window range, expected reward + range, reliability score
- **Manajemen Data** — tambah/edit/hapus manual, import CSV & XLSX dengan pratinjau (valid/tidak valid/duplikat), export CSV/XLSX
- **Analitik** — frekuensi survei per bulan, tren reward, distribusi interval, statistik lengkap
- **Riwayat Prediksi** — setiap prediksi dievaluasi otomatis saat survei baru masuk (selisih tanggal & reward)
- **Model** — training 4 model × 2 target dengan walk-forward validation; model terbaik dipilih otomatis berdasarkan MAE terendah

## Prinsip Utama

> **Model mengikuti data, bukan data dipaksa mengikuti model.**

Baseline sederhana (Median, Moving Average) bersaing adil dengan ML (Linear Regression, Random Forest). Jika baseline lebih akurat, baseline yang dipakai sebagai model produksi. Gradient Boosting sengaja tidak disertakan di V1.

## Tech Stack

| Bagian    | Teknologi |
| --------- | --------- |
| Frontend  | Next.js 16 (App Router), TypeScript, Tailwind CSS v4 |
| Backend   | Next.js API Routes (satu proses, tanpa service terpisah) |
| Database  | SQLite via `better-sqlite3` (file lokal `data/app.db`) |
| ML        | Murni TypeScript — implementasi sendiri untuk baseline & OLS, `ml-random-forest` untuk RF |
| Visual    | Recharts, Lucide Icons |

## Menjalankan Project

```bash
# install dependencies
npm install

# jalankan development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

### Produksi

```bash
npm run build
npm start
```

## Memulai

1. Saat pertama dijalankan, database otomatis dibuat di `data/app.db` dan di-seed dengan 30 record histori dari `COLDSTART.md`
2. Buka halaman **Model → Latih Model** untuk melatih semua model
3. Buka **Prediction → Jalankan Prediksi** untuk melihat perkiraan survei berikutnya
4. Setiap kali kamu menambahkan survei baru, prediksi yang masih pending otomatis dievaluasi

## Struktur Project

```
src/
├── app/                  # Halaman UI (dashboard, prediction, data,
│                         # analytics, history, model, settings)
├── app/api/              # Route handlers (CRUD, import/export,
│                         # train, predict, analytics, models)
├── components/           # AppShell (sidebar/bottom-nav), Toast, komponen UI
├── lib/
│   ├── db/               # Koneksi SQLite, schema, seed cold-start
│   ├── ml/
│   │   ├── models.ts     # Median, Moving Average, OLS, Random Forest
│   │   ├── validation.ts # Walk-forward split & evaluasi semua model
│   │   ├── metrics.ts    # MAE, RMSE, R², within-tolerance accuracy
│   │   ├── train.ts      # Orkestrasi training & seleksi model aktif
│   │   └── predict.ts    # Prediksi, reliability, probability horizon
│   ├── features.ts       # Feature engineering anti data-leakage
│   ├── dataService.ts    # CRUD + validasi input
│   └── evaluate.ts       # Auto-evaluasi prediksi vs aktual
└── types.ts              # Tipe data bersama
```

## Model & Validasi

- **Target**: `days_until_next_survey` (arrival) dan `next_reward` (reward)
- **Fitur** (17): temporal (hari, minggu, bulan), survey sebelumnya, rolling average reward/interval (3/5/10), survey count 7/30 hari, trend — semuanya hanya menggunakan informasi **sebelum** target terjadi (anti-leakage)
- **Validasi**: walk-forward / expanding window — tidak ada random split, model hanya belajar dari masa lalu
- **Metrik**: MAE, RMSE, R², akurasi within-tolerance (±1/±3/±7 hari untuk arrival; ±Rp500/1.000/2.000 untuk reward)
- **Reliability**: dihitung dari akurasi historis ±3 hari / ±Rp1.000 × faktor kecukupan data — bukan jaminan

## Catatan

- File `xlsx` (npm) memiliki advisory keamanan tanpa fix resmi; risiko rendah karena tool personal dan file import hanya berasal dari pengguna sendiri
- Data tersimpan lokal di `data/app.db` (sudah di-gitignore); backup kapan saja lewat **Pengaturan → Export Data**
