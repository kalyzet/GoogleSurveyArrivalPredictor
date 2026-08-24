"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { formatRupiah, formatDate, ReliabilityBar, StatCard, EmptyState } from "@/components/ui";

interface LatestPrediction {
  predictedIntervalDays: number;
  predictedDate: string;
  predictedReward: number;
  rangeLowReward: number;
  rangeHighReward: number;
  reliabilityArrival: number;
  reliabilityReward: number;
}

interface DashboardData {
  totalSurveys: number;
  totalReward: number;
  avgReward: number;
  medianReward: number;
  lastSurvey: string | null;
  lastReward: number | null;
  avgInterval: number | null;
  medianInterval: number | null;
  recent: Array<{ id: number; date: string; reward: number; interval: number | null }>;
  health: { records: number; warnings: string[] };
  horizonProbabilities: Array<{ days: number; probability: number }>;
  hasModel: boolean;
  daysSinceLastSurvey: number | null;
  latestPrediction: LatestPrediction | null;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 19) return "Selamat sore";
  return "Selamat malam";
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) {
    return <div className="text-sm text-muted animate-pulse">Memuat dasbor…</div>;
  }

  if (data.totalSurveys === 0) {
    return (
      <EmptyState
        title="Belum ada histori survei"
        description="Import histori survei yang sudah ada untuk mulai membuat prediksi."
        action={
          <Link
            href="/data"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            Import Data
          </Link>
        }
      />
    );
  }

  const probChart = data.horizonProbabilities.map((p) => ({
    label: `${p.days}d`,
    probability: p.probability,
  }));

  return (
    <div className="space-y-6 animate-fade-up">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold">{greeting()} 👋</h1>
        <p className="text-sm text-muted mt-1">
          Here&apos;s what your survey history says today.
        </p>
      </header>

      {data.health.warnings.length > 0 && (
        <div className="card border-amber-500/40 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-400 space-y-1">
          {data.health.warnings.map((w, i) => (
            <div key={i}>⚠ {w}</div>
          ))}
        </div>
      )}

      {!data.hasModel && (
        <div className="card p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
          <div className="text-sm">
            <div className="font-medium">Model belum di-training</div>
            <div className="text-muted text-xs mt-0.5">
              Train model dulu untuk mendapat prediksi yang akurat.
            </div>
          </div>
          <Link
            href="/model"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors shrink-0"
          >
            Latih Model
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card card-hover p-5 bg-gradient-to-br from-indigo-500/10 to-violet-500/10">
          <div className="text-xs font-medium tracking-wide text-indigo-600 dark:text-indigo-400">
            SURVEI BERIKUTNYA
          </div>
          {data.latestPrediction ? (
            <>
              <div className="mt-2 text-3xl font-bold">
                ~ {data.latestPrediction.predictedIntervalDays} hari
              </div>
              <div className="text-sm text-muted mt-1">
                Sekitar {formatDate(data.latestPrediction.predictedDate)}
              </div>
              <div className="mt-4 mb-1 text-xs text-muted">Keandalan</div>
              <ReliabilityBar value={data.latestPrediction.reliabilityArrival} />
            </>
          ) : (
            <>
              <div className="mt-2 text-3xl font-bold">~ {data.medianInterval ?? "–"} hari</div>
              <div className="text-sm text-muted mt-1">
                Berdasarkan median interval historis ({data.totalSurveys} survei)
              </div>
            </>
          )}
          {data.daysSinceLastSurvey !== null && (
            <div className="text-xs text-muted mt-2">
              Sudah {data.daysSinceLastSurvey} hari sejak survei terakhir.
            </div>
          )}
          <Link
            href="/prediction"
            className="inline-block mt-3 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Lihat prediksi lengkap →
          </Link>
        </div>

        <div className="card card-hover p-5">
          <div className="text-xs font-medium tracking-wide text-muted">PERKIRAAN REWARD</div>
          <div className="mt-2 text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500 dark:from-indigo-400 dark:to-violet-400">
            {formatRupiah(
              data.latestPrediction
                ? Math.round(data.latestPrediction.predictedReward)
                : data.medianReward,
            )}
          </div>
          {data.latestPrediction ? (
            <>
              <div className="flex items-center gap-2 mt-3 text-[11px] text-muted">
                <span>{formatRupiah(data.latestPrediction.rangeLowReward)}</span>
                <span>●───────────●</span>
                <span>{formatRupiah(data.latestPrediction.rangeHighReward)}</span>
              </div>
              <div className="mt-3 mb-1 text-xs text-muted">Keandalan</div>
              <ReliabilityBar value={data.latestPrediction.reliabilityReward} />
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mt-3 text-[11px] text-muted">
                <span>Low</span>
                <span>●───────────●</span>
                <span>High</span>
              </div>
              <div className="text-sm text-muted mt-1">
                Median dari {data.totalSurveys} histori survei
              </div>
            </>
          )}
        </div>
      </div>

      {probChart.length > 0 && (
        <div className="card p-5">
          <div className="font-semibold mb-3">Survey Probability</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={probChart} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="probFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                </linearGradient>
              </defs>
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
                formatter={(v) => [`${v}%`, "Probability"]}
              />
              <Area
                type="monotone"
                dataKey="probability"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#probFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
          <p className="text-[11px] text-muted mt-2">
            Probabilitas survei sudah masuk dalam X hari, dihitung dari distribusi interval historis.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Survei" value={data.totalSurveys} />
        <StatCard label="Total Reward" value={formatRupiah(data.totalReward)} />
        <StatCard label="Rata-rata Reward" value={formatRupiah(data.avgReward)} />
        <StatCard label="Interval Median" value={data.medianInterval ? `${data.medianInterval} hari` : "–"} sub={`Rata-rata ${data.avgInterval ?? "–"} hari`} />
      </div>

      <div className="card p-5">
        <div className="font-semibold mb-3">Aktivitas Terbaru</div>
        <div className="divide-y divide-border-subtle">
          {data.recent.map((s) => (
            <Link
              key={s.id}
              href="/data"
              className="flex items-center justify-between py-2.5 hover:bg-indigo-500/5 rounded-md px-2 -mx-2 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm w-20">{formatDate(s.date)}</span>
                <span className="text-sm font-medium">{formatRupiah(s.reward)}</span>
              </div>
              <span className="text-xs text-muted">
                {s.interval !== null ? `${s.interval} hari setelah sebelumnya →` : "→"}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
