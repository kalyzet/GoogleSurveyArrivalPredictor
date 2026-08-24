import { trainAllModels } from "@/lib/ml/train";

export async function POST() {
  try {
    const summary = await trainAllModels();
    return Response.json({ ok: true, summary });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Training gagal" },
      { status: 400 },
    );
  }
}
