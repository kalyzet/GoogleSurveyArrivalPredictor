"use client";

import { useCallback, useEffect, useState } from "react";
import { Database, Download, Trash2 } from "lucide-react";
import { useToast } from "@/components/Toast";

interface Health {
  records: number;
  dateRange: { start: string; end: string } | null;
  duplicates: number;
  invalidRewards: number;
  warnings: string[];
}

export default function SettingsPage() {
  const toast = useToast();
  const [health, setHealth] = useState<Health | null>(null);
  const [coldstartApplied, setColdstartApplied] = useState(false);

  const load = useCallback(
    () =>
      fetch("/api/settings")
        .then((r) => r.json())
        .then((json) => {
          setHealth(json.health);
          setColdstartApplied(json.coldstartApplied);
        })
        .catch(() => {}),
    [],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const clearModels = async () => {
    if (!confirm("Hapus semua versi model? Prediksi tidak akan tersedia sampai retrain.")) return;
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clear-models" }),
    });
    toast("Semua model dihapus", "success");
    load();
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold">Pengaturan</h1>
        <p className="text-sm text-muted mt-1">Konfigurasi dataset dan preferensi aplikasi.</p>
      </header>

      <div className="card p-5">
        <div className="font-semibold mb-3 flex items-center gap-2 text-sm">
          <Database className="h-4 w-4 text-indigo-500" /> Kesehatan Dataset
        </div>
        {health ? (
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div><span className="text-muted text-xs block">Record</span><b>{health.records}</b></div>
              <div><span className="text-muted text-xs block">Duplikat</span><b>{health.duplicates}</b></div>
              <div><span className="text-muted text-xs block">Tidak valid</span><b>{health.invalidRewards}</b></div>
              <div>
                <span className="text-muted text-xs block">Seed cold-start</span>
                <b className={coldstartApplied ? "text-emerald-500" : ""}>{coldstartApplied ? "Aktif" : "Belum"}</b>
              </div>
            </div>
            {health.dateRange && (
              <p className="text-xs text-muted pt-1">
                Rentang tanggal: {health.dateRange.start} → {health.dateRange.end}
              </p>
            )}
          </div>
        ) : (
          <div className="text-sm text-muted animate-pulse">Memuat…</div>
        )}
      </div>

      <div className="card p-5">
        <div className="font-semibold mb-3 text-sm">Export Data</div>
        <p className="text-xs text-muted mb-3">Backup seluruh histori survei ke file.</p>
        <div className="flex gap-2">
          <a
            href="/api/export?format=csv"
            className="flex items-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm hover:border-indigo-400 transition-colors"
          >
            <Download className="h-4 w-4" /> Export CSV
          </a>
          <a
            href="/api/export?format=xlsx"
            className="flex items-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm hover:border-indigo-400 transition-colors"
          >
            <Download className="h-4 w-4" /> Export XLSX
          </a>
        </div>
      </div>

      <div className="card p-5 border-red-500/30">
        <div className="font-semibold mb-3 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <Trash2 className="h-4 w-4" /> Zona Berbahaya
        </div>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-muted">
            Menghapus semua versi model (data survei tetap aman).
          </p>
          <button
            onClick={clearModels}
            className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
          >
            Hapus Semua Model
          </button>
        </div>
      </div>

      <div className="card p-5">
        <div className="font-semibold mb-2 text-sm">Tentang</div>
        <p className="text-xs text-muted leading-relaxed">
          Survey Arrival Predictor memprediksi kapan survei berikutnya datang dan perkiraan reward-nya,
          murni dari data historis yang kamu masukkan sendiri. Model mengikuti data: jika baseline lebih akurat
          daripada ML, baseline yang dipakai sebagai model produksi.
        </p>
      </div>
    </div>
  );
}
