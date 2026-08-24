"use client";

import { useCallback, useEffect, useState } from "react";
import { Cpu, Check, RefreshCw } from "lucide-react";
import { useToast } from "@/components/Toast";
import { formatRupiah } from "@/components/ui";
import type { ModelVersion } from "@/lib/types";

interface TrainRow {
  algorithm: string;
  mae: number;
  rmse: number;
  r2: number;
  within: number[];
  selected: boolean;
}

const TRAIN_STEPS = [
  "Menyiapkan fitur",
  "Melatih model (walk-forward)",
  "Evaluasi & pilih model terbaik",
];

export default function ModelPage() {
  const toast = useToast();
  const [versions, setVersions] = useState<ModelVersion[]>([]);
  const [training, setTraining] = useState(false);
  const [step, setStep] = useState(0);
  const [lastSummary, setLastSummary] = useState<{ arrival: TrainRow[]; reward: TrainRow[]; datasetSize: number; sampleCount: number } | null>(null);

  const load = useCallback(
    () =>
      fetch("/api/models")
        .then((r) => r.json())
        .then((json) => setVersions(json.versions))
        .catch(() => {}),
    [],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const train = async () => {
    setTraining(true);
    setStep(0);
    setLastSummary(null);
    try {
      await new Promise((r) => setTimeout(r, 400));
      setStep(1);
      const res = await fetch("/api/train", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setStep(2);
      await new Promise((r) => setTimeout(r, 300));
      setLastSummary(json.summary);
      toast(`Training selesai ✓ Dataset: ${json.summary.datasetSize} record`, "success");
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Training gagal", "error");
    } finally {
      setTraining(false);
      setStep(0);
    }
  };

  const parseMetrics = (v: ModelVersion) =>
    JSON.parse(v.metrics_json) as {
      mae: number;
      rmse: number;
      r2: number;
      toleranceHits: number[];
      evalPoints: number;
    };

  const activeArrival = versions.find((v) => v.target === "arrival" && v.is_active === 1);
  const activeReward = versions.find((v) => v.target === "reward" && v.is_active === 1);

  const renderTable = (rows: TrainRow[] | null, target: "arrival" | "reward") => {
    if (!rows) {
      const targetVersions = versions.filter((v) => v.target === target).sort((a, b) => parseMetrics(a).mae - parseMetrics(b).mae);
      if (targetVersions.length === 0) return null;
      rows = targetVersions.map((v) => {
        const m = parseMetrics(v);
        return { algorithm: v.algorithm, mae: m.mae, rmse: m.rmse, r2: m.r2, within: m.toleranceHits, selected: v.is_active === 1 };
      });
    }
    const unit = target === "arrival" ? " hari" : " Rp";
    return (
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted border-b border-border-subtle">
            <th className="py-2 font-medium">Model</th>
            <th className="py-2 font-medium text-right">MAE</th>
            <th className="py-2 font-medium text-right">RMSE</th>
            <th className="py-2 font-medium text-right">R²</th>
            <th className="py-2 font-medium text-right">±{target === "arrival" ? "3d" : "Rp1.000"}</th>
            <th className="py-2"></th>
          </tr>
        </thead>
        <tbody>
          {[...rows].sort((a, b) => Number(b.selected) - Number(a.selected) || a.mae - b.mae).map((row) => (
            <tr key={row.algorithm} className="border-b border-border-subtle/60 last:border-0">
              <td className="py-2">{row.algorithm}</td>
              <td className="py-2 text-right tabular-nums">
                {unit === " Rp" ? formatRupiah(Math.round(row.mae)) : row.mae.toFixed(1) + unit}
              </td>
              <td className="py-2 text-right tabular-nums text-muted">
                {unit === " Rp" ? formatRupiah(Math.round(row.rmse)) : row.rmse.toFixed(1) + unit}
              </td>
              <td className="py-2 text-right tabular-nums text-muted">{row.r2.toFixed(2)}</td>
              <td className="py-2 text-right tabular-nums">{Math.round(row.within[1] * 100)}%</td>
              <td className="py-2 text-right">
                {row.selected && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[11px] font-medium">
                    <Check className="h-3 w-3" /> Dipilih
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold">Model</h1>
        <p className="text-sm text-muted mt-1">
          Model dengan MAE terendah otomatis dipilih — baseline boleh menang.
        </p>
      </header>

      <div className="card p-5">
        <div className="font-semibold mb-3 flex items-center gap-2 text-sm">
          <Cpu className="h-4 w-4 text-indigo-500" /> Konfigurasi Training
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm mb-4">
          <div>
            <div className="text-xs text-muted">Dataset</div>
            <div className="font-medium">{lastSummary?.datasetSize ?? versions[0]?.dataset_size ?? "–"} records</div>
          </div>
          <div>
            <div className="text-xs text-muted">Validation</div>
            <div className="font-medium">Walk-Forward Split</div>
          </div>
          <div>
            <div className="text-xs text-muted">Fitur</div>
            <div className="font-medium">{versions[0]?.features_used ?? 17}</div>
          </div>
        </div>

        {training && (
          <div className="space-y-2 mb-4">
            {TRAIN_STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-2 text-xs">
                <div className="h-3 w-3 rounded-full border-2 border-indigo-500/30 overflow-hidden">
                  {i <= step && <div className={`h-full ${i < step ? "bg-emerald-500" : "bg-indigo-500 animate-pulse"}`} />}
                </div>
                <span className={i <= step ? "" : "text-muted"}>{label}</span>
                {i < step && <Check className="h-3 w-3 text-emerald-500" />}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={train}
          disabled={training}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${training ? "animate-spin" : ""}`} />
          {training ? "Melatih…" : "Latih Model"}
        </button>
      </div>

      {(activeArrival || activeReward) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { title: "MODEL AKTIF · ARRIVAL", v: activeArrival, fmt: (x: number) => `${x.toFixed(1)} days` },
            { title: "MODEL AKTIF · REWARD", v: activeReward, fmt: (x: number) => formatRupiah(Math.round(x)) },
          ].map(({ title, v, fmt }) =>
            v ? (
              <div key={title} className="card card-hover p-5">
                <div className="text-[11px] font-medium tracking-wide text-indigo-600 dark:text-indigo-400">{title}</div>
                <div className="mt-2 font-semibold">{v.algorithm}</div>
                {(() => {
                  const m = parseMetrics(v);
                  return (
                    <div className="mt-2 space-y-0.5 text-sm text-muted">
                      <div>MAE: <b className="text-foreground">{fmt(m.mae)}</b></div>
                      <div>RMSE: <b className="text-foreground">{fmt(m.rmse)}</b></div>
                      <div>Evaluasi pada {m.evalPoints} titik walk-forward</div>
                    </div>
                  );
                })()}
              </div>
            ) : null,
          )}
        </div>
      )}

      <div className="card p-5">
        <div className="font-semibold mb-3 text-sm">Perbandingan Prediksi Arrival</div>
        {renderTable(lastSummary?.arrival ?? null, "arrival")}
      </div>

      <div className="card p-5">
        <div className="font-semibold mb-3 text-sm">Perbandingan Prediksi Reward</div>
        {renderTable(lastSummary?.reward ?? null, "reward")}
      </div>

      {versions.length > 0 && (
        <div className="card p-5">
          <div className="font-semibold mb-3 text-sm">Riwayat Versi</div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted border-b border-border-subtle">
                <th className="py-2 font-medium">Dilatih</th>
                <th className="py-2 font-medium">Target</th>
                <th className="py-2 font-medium">Algorithm</th>
                <th className="py-2 font-medium text-right">Sample</th>
                <th className="py-2 font-medium text-right">MAE</th>
              </tr>
            </thead>
            <tbody>
              {versions.slice(0, 12).map((v) => {
                const m = JSON.parse(v.metrics_json) as { mae: number };
                return (
                  <tr key={v.id} className="border-b border-border-subtle/60 last:border-0">
                    <td className="py-2 text-xs">{v.trained_at.slice(0, 16).replace("T", " ")}</td>
                    <td className="py-2 capitalize">{v.target}</td>
                    <td className="py-2">{v.algorithm}</td>
                    <td className="py-2 text-right text-muted">{v.dataset_size}</td>
                    <td className="py-2 text-right tabular-nums">
                      {v.target === "arrival" ? `${m.mae.toFixed(1)}d` : formatRupiah(Math.round(m.mae))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
