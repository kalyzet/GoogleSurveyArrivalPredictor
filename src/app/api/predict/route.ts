import { runPrediction } from "@/lib/ml/predict";

export async function POST() {
  try {
    const result = await runPrediction();
    return Response.json({ ok: true, result });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Prediksi gagal" },
      { status: 400 },
    );
  }
}
