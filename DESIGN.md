# Survey Arrival Predictor — UI/UX Design

## 1. Design Direction

Survey Arrival Predictor menggunakan konsep **Personal Prediction Dashboard** dengan nuansa:

- Clean
- Modern
- Data-focused
- Personal
- Sedikit playful
- Tidak terlalu enterprise
- Tidak terlalu "AI futuristic"

Aplikasi harus terasa seperti:

> **"Dashboard pribadi untuk memahami pola survei dan memperkirakan survei berikutnya."**

Fokus visual utama berada pada **prediksi berikutnya**, bukan pada kompleksitas Machine Learning.

---

# 2. Visual Theme

## Color Direction

Gunakan tema utama **deep indigo / violet dengan neutral background**.

### Primary

```text
Indigo / Violet
```

Digunakan untuk:

- tombol utama
- highlight
- prediction card
- active navigation
- chart accent

### Success

```text
Emerald / Green
```

Digunakan untuk:

- prediction yang cukup reliable
- peningkatan reward
- model performance yang baik

### Warning

```text
Amber / Yellow
```

Digunakan untuk:

- reliability sedang
- data sedikit
- prediction uncertainty

### Danger

```text
Red
```

Digunakan untuk:

- prediction error tinggi
- data invalid
- model performance buruk

### Background

Gunakan:

```text
Light:
White / Very Light Gray

Dark:
Very Dark Gray / Near Black
```

Jangan menggunakan terlalu banyak warna dalam satu halaman.

---

# 3. Typography

Gunakan font modern seperti:

```text
Inter
```

Hierarki:

```text
Page Title
24–32px / Bold

Section Title
18–20px / Semibold

Card Value
24–32px / Bold

Body
14–16px

Secondary
12–14px
```

Nominal reward harus memiliki visual hierarchy tinggi.

Contoh:

```text
Expected Reward

Rp4.320
```

"Rp4.320" jauh lebih dominan dibanding labelnya.

---

# 4. Navigation

Gunakan sidebar desktop.

```text
┌──────────────────────────────┐
│  ◉ Survey Predictor           │
│                              │
│  Overview                    │
│  Prediction                  │
│  Data                        │
│  Analytics                   │
│  History                     │
│  Model                       │
│                              │
│                              │
│  ───────────────────────     │
│  Settings                    │
└──────────────────────────────┘
```

Sidebar:

- fixed
- minimal
- icon + label
- active item memiliki background highlight
- tidak menggunakan gradient berlebihan

---

# 5. Dashboard

Dashboard adalah halaman paling penting.

## Layout

```text
┌────────────────────────────────────────────────────┐
│ Good morning, Haikal 👋                            │
│ Here's what your survey history says today.        │
├────────────────────────────────────────────────────┤
│                                                    │
│ ┌───────────────────────┐ ┌─────────────────────┐ │
│ │ NEXT SURVEY           │ │ EXPECTED REWARD     │ │
│ │                       │ │                     │ │
│ │ ~ 4 days              │ │ Rp4.320             │ │
│ │ Around Aug 28         │ │                     │ │
│ │                       │ │ Range                │ │
│ │ Reliability 72%       │ │ Rp2.500–Rp5.800     │ │
│ └───────────────────────┘ └─────────────────────┘ │
│                                                    │
│ ┌───────────────────────────────────────────────┐ │
│ │ Survey Probability                            │ │
│ │                                               │ │
│ │ 100% ┤                             ╭────      │ │
│ │      │                       ╭─────╯          │ │
│ │  50% ┤             ╭─────────╯                │ │
│ │      │───────╭─────╯                          │ │
│ │   0% └────────────────────────────────────    │ │
│ │       1d      3d      7d      14d             │ │
│ └───────────────────────────────────────────────┘ │
│                                                    │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│ │ 170 Surveys │ │ RpXXX Total │ │ 7d Median   │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ │
│                                                    │
│ Recent Activity                                    │
│ ────────────────────────────────────────────────   │
│ Aug 24    Rp6.546                              →   │
│ Aug 17    Rp5.496                              →   │
│ Aug 14    Rp3.891                              →   │
└────────────────────────────────────────────────────┘
```

---

# 6. Hero Prediction Card

Prediction card harus menjadi visual focal point.

## Next Survey

```text
NEXT SURVEY

~ 4 days

Around August 28

26 Aug — 31 Aug
Estimated window

Reliability
████████░░ 72%
```

Jangan menggunakan terlalu banyak angka sekaligus.

Prioritas:

1. Estimated interval
2. Estimated date/window
3. Reliability

---

# 7. Reward Prediction Card

```text
EXPECTED REWARD

Rp4.320

Likely range
Rp2.500 — Rp5.800

Based on 170 historical surveys
```

Tambahkan indikator sederhana:

```text
Low       Expected       High
●──────────●──────────────●
```

Jangan membuat prediction range terlihat seperti angka pasti.

---

# 8. Prediction Page

Halaman Prediction memberikan informasi lebih lengkap daripada Dashboard.

```text
Prediction

┌───────────────────────────────────────────┐
│ Next Survey                               │
│                                           │
│ Around August 28                          │
│                                           │
│ Estimated interval: 4.2 days              │
│ Window: Aug 26 – Aug 31                   │
│ Reliability: 72%                          │
└───────────────────────────────────────────┘

Probability

1 day       18%
3 days      46%
7 days      79%
14 days     93%

───────────────────────────────────────────

Reward Prediction

Expected
Rp4.320

Range
Rp2.500 – Rp5.800
```

Tambahkan tombol:

```text
[ Run Prediction ]
```

---

# 9. Prediction Explanation

Jangan menyembunyikan semuanya di balik "AI".

Berikan bagian:

```text
Why this prediction?

• Recent surveys arrive every 5–8 days
• Recent average reward is around Rp4.100
• Survey frequency has increased during the last 30 days
• Model confidence is moderate
```

Tujuannya membuat prediction lebih understandable.

---

# 10. Reliability Indicator

Reliability menggunakan tiga level:

### High

```text
72–100%
```

### Medium

```text
40–71%
```

### Low

```text
0–39%
```

Visual:

```text
● High reliability
● Medium reliability
● Low reliability
```

Jangan membuat reliability terlihat seperti probabilitas pasti bahwa prediksi benar.

Gunakan tooltip:

> Reliability represents historical model performance and prediction uncertainty. It is not a guarantee.

---

# 11. Analytics Page

Fokus pada eksplorasi histori.

## Survey Frequency

```text
Survey Frequency

│
│       █
│   █   █
│   █ █ █
│ █ █ █ █
└────────────────
 Apr May Jun Jul Aug
```

## Reward Trend

Line chart:

```text
Reward
6000 ┤                    ╭─╮
5000 ┤       ╭────╮      ╯
4000 ┤──╮────╯    ╰──────
3000 ┤  ╰──╮
2000 ┤
1000 ┤
     └──────────────────────
```

## Interval Distribution

Histogram:

```text
1–2 days      ███████
3–5 days      ███████████
6–8 days      ███████████████
9–14 days     ███████
15+ days      ███
```

---

# 12. Data Page

Gunakan table yang clean.

```text
Survey History

[ Import ] [ Add Survey ] [ Export ]

┌────────────┬────────────┬─────────────┐
│ Date       │ Reward     │ Interval    │
├────────────┼────────────┼─────────────┤
│ Aug 24     │ Rp6.546    │ 7 days      │
│ Aug 17     │ Rp5.496    │ 3 days      │
│ Aug 14     │ Rp3.891    │ 13 days     │
│ Aug 10     │ Rp4.717    │ 4 days      │
└────────────┴────────────┴─────────────┘
```

Interval adalah derived data dan tidak perlu diinput manual.

---

# 13. Add Survey Modal

Simple.

```text
Add Survey

Date
[ 24/08/2026 ]

Reward
[ Rp 6.546 ]

──────────────

[ Cancel ] [ Save Survey ]
```

Setelah save:

```text
✓ Survey added successfully
```

Jika prediction sebelumnya tersedia, sistem otomatis mengevaluasi prediction tersebut.

---

# 14. Analytics Summary

Di bagian atas Analytics:

```text
┌────────────┐
│ 170        │
│ Surveys    │
└────────────┘

┌────────────┐
│ Rp3.453    │
│ Avg Reward │
└────────────┘

┌────────────┐
│ 7 days     │
│ Median Gap │
└────────────┘

┌────────────┐
│ Rp6.546    │
│ Best Reward│
└────────────┘
```

---

# 15. Prediction History

Gunakan timeline/table hybrid.

```text
Prediction History

Aug 24
────────────────────────────
Predicted:
Survey: Aug 28
Reward: Rp4.320

Actual:
Pending

Status:
Waiting
```

Setelah actual muncul:

```text
Aug 17
────────────────────────────
Predicted:
Survey: Aug 22
Reward: Rp4.100

Actual:
Aug 24
Rp6.546

Arrival Error:
+2 days

Reward Error:
+Rp2.446
```

Gunakan status:

- Pending
- Evaluated
- Missed

---

# 16. Model Page

Model page dibuat lebih technical.

## Active Models

```text
ACTIVE MODEL

Arrival
Random Forest Regressor
MAE: 2.4 days

Reward
Gradient Boosting
MAE: Rp680
```

## Model Comparison

Table:

```text
Model              MAE       RMSE
────────────────────────────────────
Median Baseline    3.1d      4.7d
Moving Average     2.8d      4.3d
Linear Regression  2.7d      4.1d
Random Forest      2.4d      3.8d
```

Model terbaik diberikan badge:

```text
✓ Selected
```

---

# 17. Training UI

Jangan membuat proses training terasa seperti developer console.

Gunakan:

```text
Model Training

Dataset
170 records

Validation
Time Series Split

Features
18

────────────────────────

Arrival Model

[ Train Models ]

```

Saat training:

```text
Training...

Preparing features
██████████░░░░

Training models
██████░░░░░░░░

Evaluating
████████████░░
```

Setelah selesai:

```text
Training complete ✓

Best model:
Random Forest

MAE:
2.4 days
```

---

# 18. Model Evaluation

Gunakan cards + charts.

```text
MODEL PERFORMANCE

Arrival Prediction

MAE
2.4 days

RMSE
3.8 days

±3 Day Accuracy
78%
```

Reward:

```text
Reward Prediction

MAE
Rp680

RMSE
Rp920

±Rp1.000 Accuracy
81%
```

---

# 19. Empty States

Jangan tampilkan dashboard kosong.

Jika belum ada data:

```text
No survey history yet

Import your existing survey history
to start making predictions.

[ Import Data ]
```

Jika data belum cukup:

```text
Not enough data

Add more survey history to train
a reliable prediction model.

Current records: 12
Recommended: 50+
```

---

# 20. Responsive Design

Desktop adalah primary target.

### Desktop

```text
Sidebar + Content
```

### Tablet

Sidebar dapat mengecil menjadi icon-only.

### Mobile

Sidebar berubah menjadi:

```text
Bottom Navigation
```

Prioritas mobile:

```text
Overview
Prediction
Data
Analytics
More
```

---

# 21. Dark Mode

Dark mode harus didukung.

Dark theme:

- background near-black
- cards slightly lighter
- border subtle
- text high contrast
- chart tetap readable

Jangan menggunakan pure black untuk semua elemen.

---

# 22. Micro-interactions

Gunakan animasi ringan:

- card hover
- chart tooltip
- page transition
- prediction loading
- success toast
- modal transition

Hindari:

- animasi berlebihan
- particle effects
- glowing neon
- loading spinner tanpa informasi

Aplikasi harus terasa cepat dan calm.

---

# 23. Iconography

Gunakan icon library seperti:

```text
Lucide Icons
```

Contoh:

```text
Overview      LayoutDashboard
Prediction    Sparkles / Brain
Data          Database
Analytics     ChartNoAxesCombined
History       History
Model         Cpu
Settings      Settings
```

Icon harus konsisten dan tidak terlalu dekoratif.

---

# 24. Important UX Principle

Aplikasi harus selalu membedakan:

```text
ACTUAL
```

dan

```text
PREDICTED
```

Prediction menggunakan visual treatment berbeda dari actual data.

Contoh:

```text
Predicted
Aug 28
──────────────
Actual
Pending
```

Jangan membuat user mengira prediction adalah data aktual.

---

# 25. Dashboard Information Hierarchy

Urutan informasi:

```text
1. Next Survey Prediction
2. Expected Reward
3. Reliability
4. Probability
5. Historical Overview
6. Recent Surveys
```

Bukan:

```text
1. Model Details
2. MAE
3. RMSE
4. Dataset
5. Prediction
```

Karena pengguna datang untuk melihat:

> **"Kapan kira-kira survei berikutnya dan dapat berapa?"**

bukan untuk melihat Random Forest.

---

# 26. Overall Visual Layout

Konsep final:

```text
┌───────────────┬──────────────────────────────────────┐
│               │                                      │
│  SURVEY       │  Overview                            │
│  PREDICTOR    │                                      │
│               │  Good morning 👋                     │
│  Overview     │                                      │
│  Prediction   │  ┌──────────────┐ ┌──────────────┐  │
│  Data         │  │ NEXT SURVEY  │ │ REWARD       │  │
│  Analytics    │  │              │ │              │  │
│  History      │  │ ~4 days      │ │ Rp4.320      │  │
│  Model        │  │ Aug 28       │ │ ± range      │  │
│               │  └──────────────┘ └──────────────┘  │
│               │                                      │
│               │  Survey Probability                 │
│               │  ┌────────────────────────────────┐ │
│               │  │              ╭──────             │ │
│               │  │       ╭──────╯                   │ │
│               │  │  ─────╯                          │ │
│               │  └────────────────────────────────┘ │
│               │                                      │
│  Settings     │  Recent Surveys                     │
│               │  ────────────────────────────────   │
└───────────────┴──────────────────────────────────────┘
```

---

# 27. Design Philosophy

UI harus mengikuti tiga prinsip:

### Predict

Menjawab:

> "Kapan survei berikutnya?"

### Understand

Menjawab:

> "Kenapa model memperkirakan begitu?"

### Learn

Menjawab:

> "Seberapa bagus prediksi kita selama ini?"

Ketiga hal tersebut menjadi identitas utama aplikasi.

---

# 28. Visual Personality

Target akhirnya:

**70% Personal Analytics**

**20% ML Dashboard**

**10% Playful**

Bukan:

**70% Enterprise Dashboard**

**20% AI gimmick**

**10% Personal**

Aplikasi harus terasa seperti tools pribadi yang memang dibuat untuk mengamati pola akun sendiri.
