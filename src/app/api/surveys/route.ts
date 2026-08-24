import { NextRequest } from "next/server";
import {
  insertSurvey,
  listSurveys,
  updateSurvey,
  deleteSurvey,
  getDatasetHealth,
  validateSurveyInput,
} from "@/lib/dataService";
import { evaluatePendingPredictions } from "@/lib/evaluate";

export async function GET() {
  return Response.json({
    surveys: listSurveys().slice().reverse(),
    health: getDatasetHealth(),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ error: "Body tidak valid" }, { status: 400 });
  const check = validateSurveyInput(body.date, body.reward);
  if (!check.ok) return Response.json({ error: check.error }, { status: 400 });
  const date = body.date as string;
  const reward = Number(body.reward);
  if (body.id !== undefined && body.id !== null) {
    const result = updateSurvey(Number(body.id), date, reward);
    if (!result.inserted) {
      return Response.json(
        { error: result.reason === "duplicate" ? "Tanggal sudah ada di data" : "Data tidak ditemukan" },
        { status: 409 },
      );
    }
    return Response.json({ ok: true });
  }
  const result = insertSurvey(date, reward);
  if (!result.inserted) {
    return Response.json({ error: "Tanggal sudah ada di data" }, { status: 409 });
  }
  const evaluation = evaluatePendingPredictions(date, reward);
  return Response.json({ ok: true, evaluated: evaluation.evaluated });
}

export async function DELETE(req: NextRequest) {
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return Response.json({ error: "id tidak valid" }, { status: 400 });
  const ok = deleteSurvey(id);
  if (!ok) return Response.json({ error: "Data tidak ditemukan" }, { status: 404 });
  return Response.json({ ok: true });
}
