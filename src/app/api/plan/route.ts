import { birthDateError, createPlan, type PlanInput } from "@/lib/recovery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.OLLAMA_MODEL ?? "qwen2.5:3b";
const HOST = process.env.OLLAMA_HOST ?? "http://127.0.0.1:11434";

export async function POST(request: Request) {
  let body: PlanInput;
  try {
    body = (await request.json()) as PlanInput;
  } catch {
    return Response.json({ error: "Check-in could not be read." }, { status: 400 });
  }

  if (!body?.profile || !body?.checkIn) {
    return Response.json({ error: "A profile and today's check-in are both required." }, { status: 400 });
  }

  const dateError = birthDateError(body.profile.birthDate);
  if (dateError) return Response.json({ error: dateError }, { status: 400 });

  const plan = await createPlan(
    body,
    async (system, user) => {
      const response = await fetch(`${HOST}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(90_000),
        body: JSON.stringify({
          model: MODEL,
          stream: false,
          format: "json",
          keep_alive: "30m",
          options: { temperature: 0.4, num_predict: 420, num_ctx: 3072 },
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
      });
      if (!response.ok) throw new Error(`The local model returned status ${response.status}.`);
      const payload = (await response.json()) as { message?: { content?: string } };
      const content = payload.message?.content;
      if (!content?.trim()) throw new Error("The local model returned an empty note.");
      return content;
    },
    MODEL,
  );

  return Response.json(plan);
}
