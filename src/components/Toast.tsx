"use client";

import { createContext, useCallback, useContext, useState } from "react";

interface ToastItem {
  id: number;
  message: string;
  kind: "success" | "error" | "info";
}

const ToastContext = createContext<(message: string, kind?: ToastItem["kind"]) => void>(
  () => {},
);

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, kind: ToastItem["kind"] = "info") => {
    const id = nextId++;
    setItems((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed bottom-20 md:bottom-6 right-4 z-[100] flex flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className={`animate-fade-up rounded-lg px-4 py-2.5 text-sm shadow-lg border max-w-xs ${
              t.kind === "success"
                ? "bg-emerald-600 text-white border-emerald-500"
                : t.kind === "error"
                  ? "bg-red-600 text-white border-red-500"
                  : "bg-indigo-600 text-white border-indigo-500"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
