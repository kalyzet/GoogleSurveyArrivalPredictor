"use client";

export function formatRupiah(value: number | null | undefined): string {
  if (value === null || value === undefined) return "–";
  return "Rp" + value.toLocaleString("id-ID");
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "–";
  return new Date(iso + "T00:00:00").toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatShortDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

export function reliabilityLevel(value: number): "High" | "Medium" | "Low" {
  if (value >= 72) return "High";
  if (value >= 40) return "Medium";
  return "Low";
}

export function reliabilityColor(value: number): string {
  const level = reliabilityLevel(value);
  if (level === "High") return "text-emerald-600 dark:text-emerald-400 bg-emerald-500";
  if (level === "Medium") return "text-amber-600 dark:text-amber-400 bg-amber-500";
  return "text-red-600 dark:text-red-400 bg-red-500";
}

export function ReliabilityBar({ value }: { value: number }) {
  const level = reliabilityLevel(value);
  const color = level === "High" ? "bg-emerald-500" : level === "Medium" ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="group/rel relative">
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-full rounded-full bg-border-subtle overflow-hidden">
          <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
        </div>
        <span className={`text-xs font-medium shrink-0 ${reliabilityColor(value).split(" ")[0]}`}>
          {value}%
        </span>
      </div>
      <span className="pointer-events-none absolute -top-8 left-0 z-10 hidden group-hover/rel:block whitespace-nowrap rounded-md bg-surface border border-border-subtle px-2 py-1 text-[11px] text-muted shadow-md">
        Reliability = performa historis model × kecukupan data. Bukan jaminan.
      </span>
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="card card-hover p-4">
      <div className="text-xs text-muted">{label}</div>
      <div className="text-xl md:text-2xl font-bold mt-1">{value}</div>
      {sub && <div className="text-xs text-muted mt-1">{sub}</div>}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        className="animate-fade-up card w-full max-w-md p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-semibold mb-4">{title}</h3>
        {children}
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center text-center gap-2 py-14 px-6">
      <div className="text-lg font-semibold">{title}</div>
      <p className="text-sm text-muted max-w-sm">{description}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
