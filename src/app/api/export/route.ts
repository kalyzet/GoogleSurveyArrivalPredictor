import { NextRequest } from "next/server";
import * as XLSX from "xlsx";
import { listSurveys } from "@/lib/dataService";

export async function GET(req: NextRequest) {
  const format = new URL(req.url).searchParams.get("format") ?? "csv";
  const surveys = listSurveys();

  if (format === "xlsx") {
    const ws = XLSX.utils.json_to_sheet(
      surveys.map((s) => ({ Tanggal: s.date, Hadiah: s.reward })),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Survey History");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="survey-history.xlsx"',
      },
    });
  }

  const header = "Tanggal,Hadiah\n";
  const csv = header + surveys.map((s) => `${s.date},${s.reward}`).join("\n") + "\n";
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="survey-history.csv"',
    },
  });
}
