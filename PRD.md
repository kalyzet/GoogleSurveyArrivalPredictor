# Survey Arrival Predictor — Full Requirements V1

## 1. Konsep Aplikasi

**Survey Arrival Predictor** adalah aplikasi berbasis Machine Learning yang memanfaatkan histori penerimaan survei untuk memperkirakan:

1. **kapan survei berikutnya kemungkinan diterima**
2. **berapa nominal reward survei berikutnya**
3. **seberapa yakin model terhadap prediksi tersebut**
4. **seberapa baik performa model berdasarkan prediksi sebelumnya**

Aplikasi **tidak mengakses API/internal system penyedia survei**. Seluruh prediksi hanya berdasarkan data historis yang dimasukkan pengguna.

---

# 2. Data Input

Data mentah minimal:

| Field    | Tipe    | Keterangan              |
| -------- | ------- | ----------------------- |
| `date`   | Date    | Tanggal survei diterima |
| `reward` | Integer | Nominal reward          |

Contoh:

```text
2026-08-24 | 6546
```

### Input data

Aplikasi menyediakan:

- Tambah data manual
- Edit data
- Hapus data
- Import CSV
- Import Excel
- Export data
- Validasi data

### Validasi

Sistem harus menangani:

- tanggal kosong
- reward kosong
- reward negatif
- format tanggal tidak valid
- duplikasi tanggal
- data tidak terurut
- file import dengan format salah

Tanggal boleh memiliki lebih dari satu survei pada hari yang sama jika data aktual memang memungkinkan.

---

# 3. Dashboard

Dashboard menjadi halaman utama.

### Summary Cards

Menampilkan:

- Total survei
- Total reward
- Rata-rata reward
- Median reward
- Survei terakhir
- Reward terakhir
- Rata-rata interval
- Median interval

Contoh:

```text
Total Survey       170
Total Reward       RpXXX.XXX
Average Reward     RpX.XXX
Median Reward      RpX.XXX

Last Survey        24 Aug 2026
Last Reward        Rp6.546

Median Interval    6 days
```

---

# 4. Next Survey Prediction

Bagian utama aplikasi.

Model memprediksi **interval sampai survei berikutnya**.

Contoh:

```text
NEXT SURVEY

Estimated:
~ 4 days

Expected Date:
28 August 2026

Prediction Range:
26 – 31 August

Reliability:
72%
```

Selain tanggal, sistem juga dapat menampilkan probabilitas berdasarkan horizon:

```text
Within 1 day     18%
Within 3 days    46%
Within 7 days    79%
Within 14 days   93%
```

Ini lebih berguna daripada hanya mengatakan:

> "Survei datang tanggal 28."

Karena survei bersifat probabilistik.

---

# 5. Reward Prediction

Model kedua memprediksi nominal reward survei berikutnya.

Contoh:

```text
EXPECTED REWARD

Rp4.320

Estimated Range
Rp2.500 – Rp5.800

Reliability
64%
```

Prediksi utama berupa angka, tetapi UI juga menampilkan **range** agar pengguna tidak menganggap angka tersebut sebagai kepastian.

---

# 6. Historical Analytics

Halaman analytics untuk memahami pola dataset.

### Survey Frequency

Grafik:

- survei per bulan
- survei per minggu
- survei berdasarkan hari
- interval antar survei

### Reward Analytics

Grafik:

- reward dari waktu ke waktu
- distribusi reward
- rata-rata reward per bulan
- reward minimum/maksimum
- median reward

### Interval Analytics

Menampilkan:

- average interval
- median interval
- minimum interval
- maximum interval
- distribution interval
- longest gap

---

# 7. Feature Engineering

Data asli hanya:

```text
date
reward
```

Tetapi sistem membuat fitur tambahan.

### Temporal Features

```text
day_of_week
day_of_month
week_of_year
month
year
```

### Previous Survey Features

```text
days_since_previous_survey
previous_reward
```

### Rolling Features

Misalnya:

```text
avg_reward_last_3
avg_reward_last_5
avg_reward_last_10

avg_interval_last_3
avg_interval_last_5
avg_interval_last_10

survey_count_last_7_days
survey_count_last_30_days
```

### Trend Features

Jika memang terbukti berguna:

```text
reward_trend
interval_trend
survey_frequency_trend
```

**Catatan penting:** fitur harus dibuat hanya menggunakan informasi yang tersedia **sebelum target terjadi**, supaya tidak terjadi data leakage.

---

# 8. Machine Learning Pipeline

Pipeline:

```text
Raw Data
   ↓
Validation
   ↓
Sorting
   ↓
Feature Engineering
   ↓
Train / Validation / Test
   ↓
Model Training
   ↓
Evaluation
   ↓
Model Selection
   ↓
Prediction
```

---

# 9. Model Prediction — Arrival

Target:

```text
days_until_next_survey
```

Contoh:

```text
24 Aug → 27 Aug

target = 3
```

Model yang dapat dibandingkan:

### Baseline

- Median historical interval
- Moving average interval

### ML

- Linear Regression
- Random Forest Regressor
- Gradient Boosting Regressor

Model tambahan hanya digunakan jika memang diperlukan.

---

# 10. Model Prediction — Reward

Target:

```text
next_reward
```

### Baseline

- Median reward
- Moving average reward

### ML

- Linear Regression
- Random Forest Regressor
- Gradient Boosting Regressor

Model terbaik dipilih berdasarkan hasil evaluasi, **bukan karena modelnya lebih kompleks**.

---

# 11. Time-Series Validation

Ini salah satu requirement penting.

**Tidak menggunakan random train/test split.**

Karena data memiliki urutan waktu.

Contoh:

```text
Past ───────────────────────→ Future

Train Train Train | Test
Train Train Train Train | Test
Train Train Train Train Train | Test
```

Bisa menggunakan pendekatan:

**Walk-Forward Validation / Time Series Split**

Tujuannya memastikan model hanya belajar dari masa lalu untuk memprediksi masa depan.

---

# 12. Model Evaluation

## Arrival Prediction

Metrics:

### MAE

Contoh:

```text
MAE = 2.4 days
```

Artinya prediksi rata-rata meleset sekitar 2,4 hari.

### RMSE

Untuk melihat dampak error besar.

### Accuracy Within Tolerance

Misalnya:

```text
Within ±1 day : 42%
Within ±3 days: 78%
Within ±7 days: 94%
```

Ini menurut gw sangat cocok untuk aplikasi ini.

---

# 13. Reward Evaluation

Metrics:

### MAE

```text
MAE = Rp650
```

### RMSE

Melihat error besar.

### R²

Sebagai indikator seberapa baik model menjelaskan variasi reward.

Selain itu:

```text
Within ±Rp500
Within ±Rp1.000
Within ±Rp2.000
```

juga bisa ditampilkan.

---

# 14. Baseline vs ML

Aplikasi harus dapat membandingkan:

```text
                    MAE
────────────────────────────
Median Baseline      3.1 days
Moving Average       2.8 days
Linear Regression    2.7 days
Random Forest        2.4 days
Gradient Boosting    2.5 days
```

Dan:

```text
Reward

Median Baseline      Rp910
Moving Average       Rp840
Linear Regression    Rp790
Random Forest        Rp650
Gradient Boosting    Rp680
```

Kalau baseline menang:

> **Baseline dipilih sebagai model produksi.**

Tidak ada pemaksaan ML.

---

# 15. Prediction Reliability

Reliability bukan sekadar angka random.

Sistem harus menghitung berdasarkan performa historis model.

Contoh:

```text
Arrival Reliability
████████░░ 78%

Reward Reliability
██████░░░░ 61%
```

Dasarnya bisa berasal dari:

- historical prediction error
- prediction interval
- consistency model
- jumlah data training

Semakin besar error dan semakin sedikit data relevan → reliability semakin rendah.

---

# 16. Prediction History

Setiap kali prediction dibuat, disimpan:

| Field                  | Keterangan           |
| ---------------------- | -------------------- |
| Prediction Date        | tanggal prediksi     |
| Predicted Survey Date  | estimasi tanggal     |
| Predicted Interval     | estimasi hari        |
| Predicted Reward       | estimasi reward      |
| Prediction Range       | range prediksi       |
| Model Version          | model yang digunakan |
| Confidence/Reliability | tingkat kepercayaan  |
| Actual Date            | tanggal aktual       |
| Actual Reward          | reward aktual        |
| Arrival Error          | selisih prediksi     |
| Reward Error           | selisih nominal      |

---

# 17. Automatic Evaluation

Setelah survei baru dimasukkan:

```text
New Survey
    ↓
Check Previous Prediction
    ↓
Compare Actual vs Prediction
    ↓
Calculate Error
    ↓
Save Evaluation
```

Contoh:

```text
Prediction:
28 Aug

Actual:
30 Aug

Error:
+2 days
```

Dan:

```text
Predicted Reward:
Rp4.200

Actual:
Rp4.762

Error:
Rp562
```

---

# 18. Model Management

Halaman khusus model.

Menampilkan:

```text
Arrival Model
────────────────────
Model: Random Forest
MAE: 2.4 days
RMSE: 3.8 days
Evaluated: 32 predictions

Reward Model
────────────────────
Model: Gradient Boosting
MAE: Rp680
RMSE: Rp920
Evaluated: 32 predictions
```

### Retrain

User dapat menjalankan:

**Retrain Model**

Setelah data baru ditambahkan.

Model menyimpan:

```text
Model Version
Training Date
Training Dataset Size
Features Used
Metrics
```

---

# 19. Model Comparison

User dapat membandingkan model:

```text
Arrival Prediction

Model              MAE      RMSE
─────────────────────────────────
Median              3.1      4.7
Moving Average      2.8      4.3
Linear Regression   2.7      4.1
Random Forest       2.4      3.8
Gradient Boosting   2.5      3.9
```

Begitu juga untuk reward.

---

# 20. Data Explorer

Menampilkan tabel seluruh histori:

```text
Date        Reward      Interval
─────────────────────────────────
12 Apr      Rp1.500       -
01 Dec      Rp1.500      233
26 Dec      Rp3.238       25
...
24 Aug      Rp6.546        7
```

Fitur:

- search
- filter tanggal
- sort
- edit
- delete
- pagination

---

# 21. Import / Export

### Import

Support:

```text
CSV
XLSX
```

Format minimal:

```text
Tanggal | Hadiah
```

Sistem melakukan preview sebelum import:

```text
Valid records: 167
Invalid records: 3
Duplicate records: 2

[Cancel] [Import]
```

### Export

Export histori:

```text
CSV
XLSX
```

---

# 22. Data Quality

Dashboard dataset:

```text
Dataset Health

Records             170
Date Range          ...
Missing Values      0
Duplicates          0
Invalid Rewards     0
```

Warning jika:

- data terlalu sedikit
- banyak missing values
- terlalu banyak duplicate
- gap histori terlalu besar
- reward terlalu sedikit variasinya

---

# 23. Teknologi

Untuk stack, gw sarankan tetap simpel:

```text
Frontend
Next.js
TypeScript
Tailwind CSS

Backend
Next.js API / Python service

Database
Supabase / PostgreSQL

ML
Python
scikit-learn
pandas
numpy

Visualization
Recharts
```

Kalau lu mau eksperimen ML lebih bebas, **Python untuk ML lebih masuk akal** daripada mencoba menjalankan seluruh model di TypeScript.

---

# 24. Struktur Sistem

```text
                    ┌───────────────┐
                    │   User Input  │
                    └───────┬───────┘
                            ↓
                    ┌───────────────┐
                    │ Data Manager  │
                    └───────┬───────┘
                            ↓
                    ┌───────────────┐
                    │ Feature Eng.  │
                    └───────┬───────┘
                            ↓
             ┌──────────────┴──────────────┐
             ↓                             ↓
   ┌──────────────────┐          ┌──────────────────┐
   │ Arrival Predictor│          │ Reward Predictor │
   └────────┬─────────┘          └────────┬─────────┘
            ↓                             ↓
            └─────────────┬───────────────┘
                          ↓
                  ┌───────────────┐
                  │  Prediction   │
                  └───────┬───────┘
                          ↓
                  ┌───────────────┐
                  │ Actual Result │
                  └───────┬───────┘
                          ↓
                  ┌───────────────┐
                  │   Evaluation  │
                  └───────────────┘
```

---

# 25. Halaman Aplikasi

Minimal:

```text
Dashboard
│
├── Data
│
├── Analytics
│
├── Prediction
│
├── Prediction History
│
├── Model Evaluation
│
└── Settings
```

### Dashboard

Fokus pada:

> **"Kapan survei berikutnya dan kira-kira dapat berapa?"**

### Data

Manajemen histori.

### Analytics

Memahami pola.

### Prediction

Menjalankan prediksi.

### Prediction History

Melihat prediksi sebelumnya.

### Model Evaluation

Melihat performa model.

### Settings

Konfigurasi model, dataset, dan preferensi aplikasi.

---

# 26. V1 Scope

Biar nggak melebar, **V1 wajib punya**:

- [x] Input manual
- [x] CSV/XLSX import
- [x] Data validation
- [x] Historical data table
- [x] Dashboard
- [x] Historical analytics
- [x] Feature engineering
- [x] Arrival baseline
- [x] Reward baseline
- [x] Arrival ML
- [x] Reward ML
- [x] Time-series validation
- [x] Model comparison
- [x] Prediction
- [x] Reliability
- [x] Prediction history
- [x] Actual vs prediction evaluation
- [x] Model retraining
- [x] Model versioning

### Belum V1

- ❌ Scraping otomatis
- ❌ Integrasi langsung ke Google Opinion Rewards
- ❌ Prediksi berdasarkan lokasi
- ❌ Prediksi berdasarkan jenis survei
- ❌ Weather
- ❌ Deep Learning
- ❌ LSTM
- ❌ Transformer
- ❌ AI chatbot
- ❌ Multi-user system

---

## Prinsip utama project

Ada satu aturan yang gw pengen kita pegang dari awal:

> **Model harus mengikuti data, bukan data dipaksa mengikuti model.**

Jadi kalau setelah eksperimen ternyata:

```text
Median Baseline
MAE = 2.3 hari

Random Forest
MAE = 2.7 hari
```

maka **Median Baseline yang menang.**
