"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { StatCard } from "@/components/ui";
import { formatRupiah } from "@/components/ui";

interface AnalyticsData {
  surveyPerMonth: Array<{ month: string; count: number }>;
  rewardPerMonth: Array<{ month: string; avg: number; max: number; min: number }>;
  perWeekday: Array<{ day: number; count: number }>;
  rewardTimeline: Array<{ date: string; reward: number }>;
  intervalStats: { avg: number | null; median: number | null; min: number | null; max: number | null };
  intervalBuckets: Array<{ label: string; count: number }>;
  summary: {
    totalSurveys: number;
    avgReward: number | null;
    medianGap: number | null;
    bestReward: number | null;
    longestGap: number | null;
  };
}

const WEEKDAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const tooltipStyle = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) return <div className="text-sm text-muted animate-pulse">Loading analytics…</div>;

  if (data.summary.totalSurveys === 0) {
    return <div className="card p-10 text-center text-sm text-muted">Belum ada data untuk dianalisis.</div>;
  }

  const monthLabel = (m: string) =>
    new Date(m + "-01T00:00:00").toLocaleDateString("id-ID", { month: "short" });

  return (
    <div className="space-y-6 animate-fade-up">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold">Analytics</h1>
        <p className="text-sm text-muted mt-1">Memahami pola dari histori survei.</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Surveys" value={data.summary.totalSurveys} />
        <StatCard label="Avg Reward" value={formatRupiah(data.summary.avgReward)} />
        <StatCard label="Median Gap" value={data.summary.medianGap !== null ? `${data.summary.medianGap} hari` : "–"} />
        <StatCard label="Best Reward" value={formatRupiah(data.summary.bestReward)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="font-semibold mb-3 text-sm">Survey Frequency (per bulan)</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.surveyPerMonth.map((d) => ({ ...d, label: monthLabel(d.month) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="var(--muted)" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="var(--muted)" width={28} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} survei`, "Count"]} />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <div className="font-semibold mb-3 text-sm">Reward Trend</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.rewardTimeline.map((d) => ({ ...d, label: d.date.slice(5) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="var(--muted)" interval="preserveStartEnd" minTickGap={40} />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--muted)" width={44} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v) => [formatRupiah(Number(v)), "Reward"]}
                labelFormatter={(l) => `…${l}`}
              />
              <Line type="monotone" dataKey="reward" stroke="#8b5cf6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <div className="font-semibold mb-3 text-sm">Survei berdasarkan hari</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.perWeekday.map((d) => ({ ...d, label: WEEKDAYS[d.day] }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="var(--muted)" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="var(--muted)" width={28} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} survei`, "Count"]} />
              <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <div className="font-semibold mb-3 text-sm">Interval Distribution</div>
          <div className="space-y-2.5 mt-2">
            {data.intervalBuckets.map((b) => {
              const maxCount = Math.max(...data.intervalBuckets.map((x) => x.count), 1);
              return (
                <div key={b.label} className="flex items-center gap-3 text-xs">
                  <span className="w-20 text-muted shrink-0">{b.label}</span>
                  <div className="flex-1 h-4 rounded bg-border-subtle/50 overflow-hidden">
                    <div
                      className="h-full rounded bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
                      style={{ width: `${(b.count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-right font-medium">{b.count}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2 text-center text-[11px] text-muted">
            <div>Avg<div className="font-semibold text-foreground">{data.intervalStats.avg ?? "–"}</div></div>
            <div>Median<div className="font-semibold text-foreground">{data.intervalStats.median ?? "–"}</div></div>
            <div>Min<div className="font-semibold text-foreground">{data.intervalStats.min ?? "–"}</div></div>
            <div>Max<div className="font-semibold text-foreground">{data.intervalStats.max ?? "–"}</div></div>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="font-semibold mb-3 text-sm">Avg Reward per bulan</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data.rewardPerMonth.map((d) => ({ ...d, label: monthLabel(d.month) }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="var(--muted)" />
            <YAxis tick={{ fontSize: 11 }} stroke="var(--muted)" width={48} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatRupiah(Number(v)), "Avg reward"]} />
            <Line type="monotone" dataKey="avg" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
        <p className="text-[11px] text-muted mt-2">
          Longest gap: {data.summary.longestGap ?? "–"} hari
        </p>
      </div>
    </div>
  );
}
