export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.OLLAMA_MODEL ?? "qwen2.5:3b";
const HOST = process.env.OLLAMA_HOST ?? "http://127.0.0.1:11434";

export async function GET() {
  try {
    const response = await fetch(`${HOST}/api/tags`, { signal: AbortSignal.timeout(4_000) });
    if (!response.ok) {
      return Response.json({
        ok: false,
        model: MODEL,
        detail: "Ollama is installed but did not answer. Start it with ollama serve.",
      });
    }
    const payload = (await response.json()) as { models?: { name: string }[] };
    const names = payload.models?.map((item) => item.name) ?? [];
    const ready = names.some((name) => name === MODEL || name.startsWith(`${MODEL}:`) || MODEL.startsWith(name));
    return Response.json({
      ok: ready,
      model: MODEL,
      installed: names,
      detail: ready
        ? "Qwen2.5 3B Instruct, Apache-2.0, served by Ollama on this computer. Check-ins are not sent to a cloud model."
        : `${MODEL} is not pulled yet. Run: ollama pull ${MODEL}`,
    });
  } catch {
    return Response.json({
      ok: false,
      model: MODEL,
      detail: "Ollama is not running. The catalog can still plan the day on this machine, without a model note.",
    });
  }
}
