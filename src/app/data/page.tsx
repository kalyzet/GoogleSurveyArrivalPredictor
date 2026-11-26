"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Upload, Download, Search, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/components/Toast";
import { EmptyState, formatDate, formatRupiah, Modal } from "@/components/ui";

interface Row {
  id: number;
  date: string;
  reward: number;
  interval: number | null;
}

interface Health {
  records: number;
  dateRange: { start: string; end: string } | null;
  duplicates: number;
  invalidRewards: number;
  warnings: string[];
}

interface PreviewResult {
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  preview: Array<{ date: string; reward: number }>;
  invalidPreview: Array<{ reason: string }>;
}

const PAGE_SIZE = 15;

export default function DataPage() {
  const toast = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [health, setHealth] = useState<Health | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortDesc, setSortDesc] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [formDate, setFormDate] = useState("");
  const [formReward, setFormReward] = useState("");
  const [deleting, setDeleting] = useState<Row | null>(null);

  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [pendingRows, setPendingRows] = useState<Array<Record<string, unknown>>>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const restoreFileRef = useRef<HTMLInputElement>(null);

  const [restoreConfirm, setRestoreConfirm] = useState<{
    data: string;
    surveys: number;
    predictions: number;
  } | null>(null);

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    fetch("/api/surveys")
      .then((r) => r.json())
      .then((json) => {
        if (!active) return;
        setRows(json.surveys);
        setHealth(json.health);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  const filtered = useMemo(() => {
    const list = rows.filter((r) => r.date.includes(search) || String(r.reward).includes(search));
    return list.sort((a, b) =>
      sortDesc ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date),
    );
  }, [rows, search, sortDesc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const onSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const onSortToggle = () => {
    setSortDesc(!sortDesc);
    setPage(1);
  };

  const openAdd = () => {
    setEditing(null);
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormReward("");
    setModalOpen(true);
  };

  const openEdit = (row: Row) => {
    setEditing(row);
    setFormDate(row.date);
    setFormReward(String(row.reward));
    setModalOpen(true);
  };

  const saveSurvey = async () => {
    const res = await fetch("/api/surveys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editing?.id ?? null,
        date: formDate,
        reward: formReward === "" ? "" : Number(formReward),
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast(json.error ?? "Gagal menyimpan", "error");
      return;
    }
    toast(
      editing
        ? "Survei berhasil diperbarui ✓"
        : json.evaluated > 0
          ? `Survei ditambahkan ✓ (${json.evaluated} prediksi dievaluasi)`
          : "Survei berhasil ditambahkan ✓",
      "success",
    );
    setModalOpen(false);
    reload();
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const res = await fetch(`/api/surveys?id=${deleting.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast("Gagal menghapus", "error");
    } else {
      toast("Survei dihapus", "success");
    }
    setDeleting(null);
    reload();
  };

  const handleFile = async (file: File) => {
    let rowsParsed: Array<Record<string, unknown>> = [];
    try {
      if (file.name.toLowerCase().endsWith(".csv")) {
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter((l) => l.trim());
        if (lines.length > 0) {
          const header = lines[0].split(/[,;\t]/).map((h) => h.trim().toLowerCase());
          const di = header.findIndex((h) => h.includes("tanggal") || h.includes("date"));
          const ri = header.findIndex((h) => h.includes("hadiah") || h.includes("reward"));
          const dataLines = lines.slice(header.some((h) => isNaN(Number(h[0]))) ? 1 : 0);
          rowsParsed = dataLines.map((line) => {
            const cells = line.split(/[,;\t]/).map((c) => c.trim());
            return { tanggal: cells[di >= 0 ? di : 0], hadiah: cells[ri >= 0 ? ri : 1] };
          });
        }
      } else {
        const XLSX = await import("xlsx");
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf);
        const ws = wb.Sheets[wb.SheetNames[0]];
        rowsParsed = XLSX.utils.sheet_to_json(ws, { defval: "" }) as Array<Record<string, unknown>>;
      }
    } catch {
      toast("Gagal membaca file", "error");
      return;
    }
    if (rowsParsed.length === 0) {
      toast("File tidak berisi data", "error");
      return;
    }
    const res = await fetch("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: rowsParsed, dryRun: true }),
    });
    const json: PreviewResult = await res.json();
    setPendingRows(rowsParsed);
    setPreview(json);
  };

  const commitImport = async () => {
    await fetch("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: pendingRows, dryRun: false }),
    });
    toast(`Import selesai: ${preview?.validCount} record ditambahkan`, "success");
    setPreview(null);
    setPendingRows([]);
    reload();
  };

  const handleBackup = async () => {
    try {
      const res = await fetch("/api/backup", { method: "GET" });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 100);
      toast("Backup berhasil diunduh ✓", "success");
    } catch {
      toast("Gagal membuat backup", "error");
    }
  };

  const handleRestoreFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result;
      if (typeof text !== "string") {
        toast("Gagal membaca file", "error");
        return;
      }
      try {
        const parsed = JSON.parse(text) as { version?: number; surveys?: unknown[]; predictions?: unknown[] };
        if (
          parsed?.version !== 1 ||
          !Array.isArray(parsed.surveys) ||
          !Array.isArray(parsed.predictions)
        ) {
          toast("Format file backup tidak dikenal", "error");
          return;
        }
        setRestoreConfirm({
          data: text,
          surveys: parsed.surveys.length,
          predictions: parsed.predictions.length,
        });
      } catch {
        toast("File bukan JSON yang valid", "error");
      }
    };
    reader.readAsText(file);
  };

  const confirmRestore = async () => {
    if (!restoreConfirm) return;
    try {
      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore", data: restoreConfirm.data }),
      });
      const json = await res.json();
      if (json.ok) {
        toast(`Data dipulihkan ✓ (${json.surveys} survei, ${json.predictions} prediksi)`, "success");
        setRestoreConfirm(null);
        reload();
      } else {
        toast(json.error || "Gagal restore", "error");
      }
    } catch {
      toast("Gagal restore", "error");
    }
  };

  return (
    <div className="space-y-5 animate-fade-up">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Data</h1>
          <p className="text-sm text-muted mt-1">Manajemen histori survei.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleBackup}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            <Download className="h-4 w-4" /> Backup
          </button>
          <button
            onClick={() => restoreFileRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm hover:border-indigo-400 transition-colors"
          >
            <Upload className="h-4 w-4" /> Restore
          </button>
          <input
            ref={restoreFileRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleRestoreFile(f);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm hover:border-indigo-400 transition-colors"
          >
            <Upload className="h-4 w-4" /> Import
          </button>
          <a
            href="/api/export?format=csv"
            className="flex items-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm hover:border-indigo-400 transition-colors"
          >
            <Download className="h-4 w-4" /> CSV
          </a>
          <a
            href="/api/export?format=xlsx"
            className="flex items-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm hover:border-indigo-400 transition-colors"
          >
            <Download className="h-4 w-4" /> XLSX
          </a>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> Tambah Survei
          </button>
        </div>
      </header>

      <input
        ref={fileRef}
        type="file"
        accept=".csv,.xlsx"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />

      {health && health.warnings.length > 0 && (
        <div className="card border-amber-500/40 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-400 space-y-1">
          {health.warnings.map((w, i) => (
            <div key={i}>⚠ {w}</div>
          ))}
        </div>
      )}

      {health && (
        <div className="card p-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted">
          <span>Record: <b className="text-foreground">{health.records}</b></span>
          {health.dateRange && (
            <span>
              Rentang: {formatDate(health.dateRange.start)} — {formatDate(health.dateRange.end)}
            </span>
          )}
          <span>Duplikat: <b className={health.duplicates ? "text-red-500" : "text-emerald-500"}>{health.duplicates}</b></span>
          <span>Tidak valid: <b className={health.invalidRewards ? "text-red-500" : "text-emerald-500"}>{health.invalidRewards}</b></span>
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState
          title="Belum ada histori survei"
          description="Tambahkan data manual atau import dari CSV/XLSX."
          action={
            <button
              onClick={() => fileRef.current?.click()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Import Data
            </button>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="p-3 border-b border-border-subtle flex items-center gap-2">
            <Search className="h-4 w-4 text-muted" />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari tanggal atau reward…"
              className="input-base border-none shadow-none focus:shadow-none"
            />
            <button
              onClick={onSortToggle}
              className="text-xs text-muted whitespace-nowrap hover:text-indigo-500 transition-colors"
            >
              Tanggal {sortDesc ? "↓" : "↑"}
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted border-b border-border-subtle">
                <th className="px-4 py-2.5 font-medium">Date</th>
                <th className="px-4 py-2.5 font-medium">Reward</th>
                <th className="px-4 py-2.5 font-medium">Interval</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => (
                <tr key={row.id} className="border-b border-border-subtle/60 last:border-0">
                  <td className="px-4 py-2.5">{formatDate(row.date)}</td>
                  <td className="px-4 py-2.5 font-medium">{formatRupiah(row.reward)}</td>
                  <td className="px-4 py-2.5 text-muted">
                    {row.interval !== null ? `${row.interval} hari` : "–"}
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <button
                      onClick={() => openEdit(row)}
                      className="p-1.5 rounded-md hover:bg-indigo-500/10 text-muted hover:text-indigo-500 transition-colors"
                      aria-label="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleting(row)}
                      className="p-1.5 rounded-md hover:bg-red-500/10 text-muted hover:text-red-500 transition-colors"
                      aria-label="Hapus"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-3 flex items-center justify-between text-xs text-muted">
            <span>
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} dari{" "}
              {filtered.length}
            </span>
            <div className="flex gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-2.5 py-1 rounded-md border border-border-subtle disabled:opacity-40 hover:border-indigo-400"
              >
                Sebelumnya
              </button>
              <span className="px-2 py-1">{page} / {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-2.5 py-1 rounded-md border border-border-subtle disabled:opacity-40 hover:border-indigo-400"
              >
                Berikutnya
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Survei" : "Tambah Survei"}
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted mb-1 block">Date</label>
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="input-base"
            />
          </div>
          <div>
            <label className="text-xs text-muted mb-1 block">Reward</label>
            <div className="flex items-center rounded-lg border border-border-subtle bg-surface px-3 focus-within:border-indigo-600 focus-within:ring-3 focus-within:ring-indigo-500/15 transition-colors">
              <span className="text-sm text-muted select-none shrink-0">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                value={formReward === "" ? "" : Number(formReward).toLocaleString("id-ID")}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
                  setFormReward(digits.slice(0, 12));
                }}
                placeholder="6.546"
                className="w-full bg-transparent outline-none py-2 pl-2 text-sm text-foreground placeholder:text-muted"
              />
            </div>
          </div>
          {editing && (
            <p className="text-[11px] text-muted">
              Interval adalah derived data dan dihitung otomatis.
            </p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-border-subtle px-4 py-2 text-sm hover:border-indigo-400"
            >
              Batal
            </button>
            <button
              onClick={saveSurvey}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Simpan Survei
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Hapus Data">
        <p className="text-sm text-muted">
          Hapus survei {deleting && formatDate(deleting.date)} ({deleting && formatRupiah(deleting.reward)})?
        </p>
        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={() => setDeleting(null)}
            className="rounded-lg border border-border-subtle px-4 py-2 text-sm hover:border-indigo-400"
          >
            Batal
          </button>
          <button
            onClick={confirmDelete}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </Modal>

      <Modal
        open={!!restoreConfirm}
        onClose={() => setRestoreConfirm(null)}
        title="Restore Backup"
      >
        <div className="space-y-3">
          <p className="text-sm text-muted">
            Semua data saat ini akan <b className="text-red-500">digantikan</b> oleh isi
            backup ini. Tindakan ini tidak bisa dibatalkan.
          </p>
          <div className="card p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted">Survei</span>
              <span className="font-medium">{restoreConfirm?.surveys ?? 0} record</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">History prediksi</span>
              <span className="font-medium">{restoreConfirm?.predictions ?? 0} record</span>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setRestoreConfirm(null)}
              className="rounded-lg border border-border-subtle px-4 py-2 text-sm hover:border-indigo-400"
            >
              Batal
            </button>
            <button
              onClick={confirmRestore}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Restore
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!preview}
        onClose={() => setPreview(null)}
        title="Pratinjau Import"
      >
        {preview && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 py-2.5">
                <div className="text-lg font-bold">{preview.validCount}</div>
                Valid
              </div>
              <div className="rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 py-2.5">
                <div className="text-lg font-bold">{preview.invalidCount}</div>
                Tidak valid
              </div>
              <div className="rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 py-2.5">
                <div className="text-lg font-bold">{preview.duplicateCount}</div>
                Duplikat
              </div>
            </div>
            {preview.preview.length > 0 && (
              <div className="text-xs">
                <div className="text-muted mb-1">Contoh data valid:</div>
                {preview.preview.slice(0, 5).map((p, i) => (
                  <div key={i} className="flex justify-between py-0.5">
                    <span>{formatDate(p.date)}</span>
                    <span>{formatRupiah(p.reward)}</span>
                  </div>
                ))}
              </div>
            )}
            {preview.invalidPreview.length > 0 && (
              <div className="text-xs text-red-500">
                {preview.invalidPreview.map((inv, i) => (
                  <div key={i}>• {inv.reason}</div>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPreview(null)}
                className="rounded-lg border border-border-subtle px-4 py-2 text-sm hover:border-indigo-400"
              >
                Batal
              </button>
              <button
                onClick={commitImport}
                disabled={preview.validCount === 0}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                Import
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
