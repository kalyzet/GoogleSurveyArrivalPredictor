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

  const load = useCallback(async () => {
    const res = await fetch("/api/surveys");
    const json = await res.json();
    setRows(json.surveys);
    setHealth(json.health);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    let list = rows.filter((r) => r.date.includes(search) || String(r.reward).includes(search));
    if (sortDesc) list = [...list].reverse();
    return list;
  }, [rows, search, sortDesc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, sortDesc]);

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
        ? "Survey updated successfully ✓"
        : json.evaluated > 0
          ? `Survey added ✓ (${json.evaluated} prediksi dievaluasi)`
          : "Survey added successfully ✓",
      "success",
    );
    setModalOpen(false);
    load();
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const res = await fetch(`/api/surveys?id=${deleting.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast("Gagal menghapus", "error");
    } else {
      toast("Survey deleted", "success");
    }
    setDeleting(null);
    load();
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
    load();
  };

  return (
    <div className="space-y-5 animate-fade-up">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Data</h1>
          <p className="text-sm text-muted mt-1">Manajemen histori survei.</p>
        </div>
        <div className="flex gap-2">
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
            <Plus className="h-4 w-4" /> Add Survey
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
          <span>Records: <b className="text-foreground">{health.records}</b></span>
          {health.dateRange && (
            <span>
              Range: {formatDate(health.dateRange.start)} — {formatDate(health.dateRange.end)}
            </span>
          )}
          <span>Duplicates: <b className={health.duplicates ? "text-red-500" : "text-emerald-500"}>{health.duplicates}</b></span>
          <span>Invalid: <b className={health.invalidRewards ? "text-red-500" : "text-emerald-500"}>{health.invalidRewards}</b></span>
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState
          title="No survey history yet"
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
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari tanggal atau reward…"
              className="input-base border-none shadow-none focus:shadow-none"
            />
            <button
              onClick={() => setSortDesc(!sortDesc)}
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
                      aria-label="Delete"
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
                Prev
              </button>
              <span className="px-2 py-1">{page} / {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-2.5 py-1 rounded-md border border-border-subtle disabled:opacity-40 hover:border-indigo-400"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Survey" : "Add Survey"}
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
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">Rp</span>
              <input
                type="number"
                min="0"
                step="1"
                value={formReward}
                onChange={(e) => setFormReward(e.target.value)}
                placeholder="6.546"
                className="input-base pl-9"
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
              Cancel
            </button>
            <button
              onClick={saveSurvey}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Save Survey
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
            Cancel
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
        open={!!preview}
        onClose={() => setPreview(null)}
        title="Import Preview"
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
                Invalid
              </div>
              <div className="rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 py-2.5">
                <div className="text-lg font-bold">{preview.duplicateCount}</div>
                Duplicate
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
                Cancel
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
