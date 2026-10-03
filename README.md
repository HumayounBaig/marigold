# Marigold

Marigold is a private postpartum recovery companion. It was made for one person: the weeks after birth, when weight is changing, pain is ordinary and sometimes not, and the last thing she needs is an account on someone else’s server.

Each day she logs sleep, energy, mood, where it hurts, and a few symptoms that should never be coached through. An open-weight model, running on the same computer, writes a short plan from a fixed catalog:

- a movement small enough for her stage, clearance, and today’s pain
- meals that keep recovery fed, including a snack when she is nursing or running on empty
- two comfort practices for the places that hurt
- a plain instruction to call a clinician when the check-in says so

Weight can be recorded. The app will not set a calorie target, and it will say so if the loss is fast enough to threaten energy or a milk supply.

## Why open

Postpartum notes are intimate: bleeding, incision worries, pelvic heaviness, mood, feeding, weight. A closed coaching app uploads that to a vendor and answers with a model you cannot inspect, fine-tune, or replace.

Marigold is built the other way around.

- **The model is the product.** Daily wording and choices come from [Qwen2.5 3B Instruct](https://huggingface.co/Qwen/Qwen2.5-3B-Instruct), Apache-2.0 weights, served by [Ollama](https://ollama.com) on localhost. The app refuses ids and phrases the model is not allowed to use. A closed API could ignore that and still ship the answer.
- **Her data stays here.** Check-ins live in browser storage. The plan request goes to this Next.js server, which talks only to Ollama on `127.0.0.1`. There is no account and no cloud model.
- **It can run without the internet** once the model is downloaded. If Ollama is asleep, the same catalog still builds a safe plan and says that it did.
- **You can change how it behaves.** Movements, meals, and soothe steps are in `src/lib/catalog.ts`. The system prompt is `systemPrompt()` in `src/lib/recovery.ts`. Another open model is `OLLAMA_MODEL=...`.
- **It costs nothing to run** beyond the machine it is already on.

That is the practical difference. A closed app can look kinder on a marketing page. It cannot promise that a 3 a.m. note about scary thoughts never left the house.

## Safety

Marigold is not a clinician, a pelvic floor therapist, or emergency care. It will not diagnose, prescribe, or recommend medication. Heavy bleeding, chest pain, a severe headache, one-sided leg swelling, fever, a worrying incision, and thoughts of harm stop the workout and point to a person.

Movement waits on postpartum clearance, stays easier after a cesarean, and drops out when pain, heaviness, or bleeding say so. Nothing in the catalog is a crunch, a fast, or a target weight.

## Run it

Requirements: Node 22+, [Ollama](https://ollama.com), and about 2 GB for the model.

```bash
ollama serve
ollama pull qwen2.5:3b
npm install
npm run dev
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123).

```bash
npm test
npm run typecheck
```

To try a different local model:

```bash
OLLAMA_MODEL=qwen2.5:1.5b npm run dev
```

The first plan can take half a minute while the weights load. Later notes are quicker. Use the night theme in the header for feeds in the dark.
