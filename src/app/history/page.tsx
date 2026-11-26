"use client";

import { useEffect, useState } from "react";
import { formatDate, formatRupiah, EmptyState } from "@/components/ui";
import type { PredictionRecord } from "@/lib/types";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  evaluated: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  missed: "bg-red-500/10 text-red-600 dark:text-red-400",
};

export default function HistoryPage() {
  const [rows, setRows] = useState<PredictionRecord[] | null>(null);

  useEffect(() => {
    fetch("/api/predictions")
      .then((r) => r.json())
      .then((d) => setRows(d.predictions))
      .catch(() => setRows([]));
  }, []);

  if (rows === null) return <div className="text-sm text-muted animate-pulse">Loading history…</div>;

  return (
    <div className="space-y-5 animate-fade-up">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold">Prediction History</h1>
        <p className="text-sm text-muted mt-1">
          Seberapa bagus prediksi kita selama ini? Prediksi = estimasi. Actual = data nyata.
        </p>
      </header>

      {rows.length === 0 ? (
        <EmptyState
          title="Belum ada prediksi tersimpan"
          description="Jalankan Jalankan Prediksi di halaman Prediksi untuk mulai melacak akurasi."
        />
      ) : (
        <div className="space-y-3">
          {rows.map((p) => (
            <div key={p.id} className="card p-4">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <span className="text-xs text-muted">Dibuat: {p.created_at.slice(0, 10)}</span>
                <div className="flex items-center gap-1.5">
                  {p.status === "evaluated" &&
                    (p.arrival_error ?? 0) === 0 &&
                    (p.reward_error ?? 0) === 0 && (
                      <span className="rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        Perfect
                      </span>
                    )}
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_STYLE[p.status]}`}>
                    {p.status === "pending" ? "Menunggu" : p.status === "evaluated" ? "Dievaluasi" : "Terlewat"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <div className="space-y-1">
                  <div className="text-[11px] uppercase tracking-wide text-muted font-medium">Prediksi</div>
                  <div>
                    Survei: <b>{formatDate(p.predicted_date)}</b>{" "}
                    <span className="text-muted text-xs">(~{p.predicted_interval} hari)</span>
                  </div>
                  <div>
                    Reward: <b className="text-indigo-600 dark:text-indigo-400">{formatRupiah(Math.round(p.predicted_reward))}</b>{" "}
                    <span className="text-muted text-xs">
                      ({formatRupiah(p.range_low_reward)} – {formatRupiah(p.range_high_reward)})
                    </span>
                  </div>
                  <div className="text-[11px] text-muted">
                    Model: {p.model_version_arrival} / {p.model_version_reward}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] uppercase tracking-wide text-muted font-medium">Aktual</div>
                  {p.status === "pending" ? (
                    <div className="text-muted italic">Menunggu…</div>
                  ) : (
                    <>
                      <div>Survei: <b>{formatDate(p.actual_date)}</b></div>
                      <div>Reward: <b>{formatRupiah(p.actual_reward)}</b></div>
                      <div className="flex gap-4 pt-1">
                        <span
                          className={
                            (p.arrival_error ?? 0) <= 3 && (p.arrival_error ?? 0) >= -3
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-amber-600 dark:text-amber-400"
                          }
                        >
                          Selisih tanggal: {(p.arrival_error ?? 0) > 0 ? "+" : ""}
                          {p.arrival_error} hari
                        </span>
                        <span className="text-muted">
                          Selisih reward:{" "}
                          {(p.reward_error ?? 0) > 0 ? "+" : ""}
                          {formatRupiah(p.reward_error)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
