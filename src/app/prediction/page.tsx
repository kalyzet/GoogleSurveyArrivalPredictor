"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { formatDate, formatRupiah, ReliabilityBar, EmptyState } from "@/components/ui";
import type { PredictionResult } from "@/lib/types";

export default function PredictionPage() {
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [recordCount, setRecordCount] = useState<number | null>(null);

  const runPrediction = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/predict", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Prediksi gagal");
      setResult(json.result);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : "Prediksi gagal");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => setRecordCount(d.totalSurveys))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6 animate-fade-up">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Prediction</h1>
          <p className="text-sm text-muted mt-1">Perkiraan survei dan reward berikutnya.</p>
        </div>
        <button
          onClick={runPrediction}
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Predicting…" : "Run Prediction"}
        </button>
      </header>

      {error && (
        <div className="card border-red-500/40 bg-red-500/5 p-4 text-sm text-red-600 dark:text-red-400">
          {error}
          <div className="text-xs text-muted mt-1">
            Pastikan model sudah di-training di halaman Model.
          </div>
        </div>
      )}

      {!result && !error && (
        <EmptyState
          title="Belum ada prediksi"
          description={
            recordCount !== null && recordCount > 0
              ? "Tekan Run Prediction untuk menghitung perkiraan survei berikutnya berdasarkan model aktif."
              : "Tambahkan data survei terlebih dahulu, lalu train model."
          }
        />
      )}

      {result && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card p-5 bg-gradient-to-br from-indigo-500/10 to-violet-500/10">
              <div className="text-xs font-medium tracking-wide text-indigo-600 dark:text-indigo-400">
                NEXT SURVEY
              </div>
              <div className="mt-2 text-3xl font-bold">{formatDate(result.predictedDate)}</div>
              <div className="text-sm text-muted mt-1">
                Estimasi interval: ~{result.predictedIntervalDays} hari
              </div>
              <div className="text-xs text-muted mt-3">
                Window: {formatDate(result.windowLow)} — {formatDate(result.windowHigh)}
              </div>
              <div className="mt-4 text-xs text-muted mb-1.5">
                Reliability · model {result.modelArrival}
              </div>
              <ReliabilityBar value={result.reliabilityArrival} />
            </div>

            <div className="card p-5">
              <div className="text-xs font-medium tracking-wide text-muted">EXPECTED REWARD</div>
              <div className="mt-2 text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500 dark:from-indigo-400 dark:to-violet-400">
                {formatRupiah(result.predictedReward)}
              </div>
              <div className="text-sm text-muted mt-1">
                Likely range: {formatRupiah(result.rewardLow)} — {formatRupiah(result.rewardHigh)}
              </div>
              <div className="flex items-center gap-2 mt-4 text-[11px] text-muted">
                <span>{formatRupiah(result.rewardLow)}</span>
                <span>●───────────●</span>
                <span>{formatRupiah(result.rewardHigh)}</span>
              </div>
              <div className="mt-3 text-xs text-muted mb-1.5">
                Reliability · model {result.modelReward}
              </div>
              <ReliabilityBar value={result.reliabilityReward} />
            </div>
          </div>

          <div className="card p-5">
            <div className="font-semibold mb-3">Probability Horizon</div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart
                data={result.horizonProbabilities.map((p) => ({
                  label: `${p.days}d`,
                  probability: p.probability,
                }))}
                margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="var(--muted)" />
                <YAxis unit="%" tick={{ fontSize: 12 }} domain={[0, 100]} stroke="var(--muted)" />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v) => [`${v}%`, "Within"]}
                />
                <Line
                  type="monotone"
                  dataKey="probability"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-4 gap-2 mt-3 text-center text-xs">
              {result.horizonProbabilities.map((p) => (
                <div key={p.days} className="rounded-lg bg-indigo-500/5 py-2">
                  <div className="text-muted">Within {p.days}d</div>
                  <div className="font-semibold">{p.probability}%</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <div className="font-semibold mb-2">Why this prediction?</div>
            <ul className="space-y-1.5 text-sm text-muted list-disc list-inside">
              {result.explanations.map((ex, i) => (
                <li key={i}>{ex}</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
