import assert from "node:assert/strict";
import test from "node:test";
import { mealById, movementById } from "./catalog";
import type { CheckIn, Movement, Profile } from "./types";
import {
  allowedFor,
  buildRulesPlan,
  createPlan,
  insights,
  mergeModelOutput,
  movementBlock,
  recoveryPhase,
  systemPrompt,
  userPrompt,
  weeksSince,
  weightInsight,
} from "./recovery";

const NOW = new Date(2026, 9, 3, 12, 0, 0);

function profile(overrides: Partial<Profile> = {}): Profile {
  return {
    name: "Elena",
    babyName: "Io",
    birthDate: "2026-09-05",
    delivery: "vaginal",
    feeding: "nursing",
    cleared: true,
    concerns: ["low-back", "neck"],
    intention: "Walk around the block without my back locking.",
    unit: "lb",
    partnerNote: "For you.",
    ...overrides,
  };
}

function checkIn(overrides: Partial<CheckIn> = {}): CheckIn {
  return {
    id: "c1",
    date: "2026-10-03",
    sleepHours: 6,
    energy: 3,
    mood: 3,
    pain: { "low-back": 2 },
    bleeding: "light",
    pelvicHeaviness: false,
    fever: false,
    chestOrBreath: false,
    severeHeadache: false,
    legSwelling: false,
    incisionWorry: false,
    scaryThoughts: false,
    minutes: 20,
    note: "",
    createdAt: NOW.toISOString(),
    ...overrides,
  };
}

test("early weeks stay in rest even if she marks herself cleared", () => {
  assert.equal(recoveryPhase(0, true), "rest");
  assert.equal(recoveryPhase(1, true), "rest");
  assert.equal(recoveryPhase(2, true), "reconnect");
  assert.equal(recoveryPhase(6, true), "rebuild");
  assert.equal(recoveryPhase(12, true), "return");
  assert.equal(recoveryPhase(20, false), "rest");
});

test("weeks since birth uses local dates", () => {
  assert.equal(weeksSince("2026-09-19", NOW), 2);
  assert.equal(weeksSince("2026-10-03", NOW), 0);
});

test("cesarean at week 4 cannot load the core or bridge", () => {
  const input = {
    profile: profile({ birthDate: "2026-09-05", delivery: "cesarean", cleared: true }),
    checkIn: checkIn({ pain: {} }),
    now: NOW,
  };
  assert.equal(weeksSince(input.profile.birthDate, NOW), 4);
  assert.ok(movementBlock({ ...requireMovement("bird-dog") }, input));
  assert.ok(movementBlock({ ...requireMovement("glute-bridge") }, input));
  assert.equal(movementBlock(requireMovement("walk-15"), input), null);
});

test("high pelvic pain removes bridges, squats, and longer walks", () => {
  const input = {
    profile: profile({ birthDate: "2026-07-11", cleared: true }),
    checkIn: checkIn({ pain: { pelvis: 8 }, minutes: 30, energy: 4 }),
    now: NOW,
  };
  const allowed = allowedFor(input).movements.map((item) => item.id);
  assert.ok(!allowed.includes("glute-bridge"));
  assert.ok(!allowed.includes("chair-squat"));
  assert.ok(!allowed.includes("walk-25"));
  assert.ok(allowed.includes("breath-5"));
});

test("heavy bleeding locks the plan to rest and a now-level flag", () => {
  const plan = buildRulesPlan({
    profile: profile(),
    checkIn: checkIn({ bleeding: "heavy", pain: {} }),
    now: NOW,
  });
  assert.equal(plan.movementId, "breath-5");
  assert.ok(plan.flags.some((flag) => flag.id === "bleeding" && flag.level === "now"));
  assert.ok(plan.mealIds.length === 3);
});

test("nursing plans include a snack and never a deficit phrase", () => {
  const plan = buildRulesPlan({
    profile: profile({ feeding: "nursing" }),
    checkIn: checkIn(),
    now: NOW,
  });
  assert.equal(plan.mealIds.length, 3);
  assert.ok(plan.mealIds.some((id) => mealById(id)?.slot === "snack"));
  assert.ok(plan.mealIds.some((id) => mealById(id)?.slot === "breakfast"));
  assert.doesNotMatch(plan.greeting, /calorie|deficit|baby weight/i);
  assert.doesNotMatch(plan.whyToday, /eat less/i);
});

test("model cannot assign an unsafe movement or calorie talk", () => {
  const input = {
    profile: profile({ birthDate: "2026-09-05", delivery: "cesarean", cleared: true }),
    checkIn: checkIn({ bleeding: "heavy" }),
    now: NOW,
  };
  const base = buildRulesPlan(input);
  const allowed = allowedFor(input);
  const merged = mergeModelOutput(
    JSON.stringify({
      greeting: "Elena, cut calories and drop the baby weight this week.",
      movementId: "chair-squat",
      mealIds: ["not-real", "nope", "no"],
      sootheIds: ["heat-back"],
      restNote: "Skip meals to make up for it.",
      whyToday: "A 1200 calorie deficit will help.",
    }),
    base,
    allowed,
  );
  assert.equal(merged.movementId, "breath-5");
  assert.deepEqual(merged.mealIds, base.mealIds);
  assert.equal(merged.greeting, base.greeting);
  assert.equal(merged.restNote, base.restNote);
  assert.equal(merged.adjusted, true);
  assert.equal(merged.source, "model");
});

test("a snack cannot replace the main meal", () => {
  const input = {
    profile: profile({ feeding: "nursing" }),
    checkIn: checkIn(),
    now: NOW,
  };
  const base = buildRulesPlan(input);
  const allowed = allowedFor(input);
  const breakfast = allowed.meals.find((item) => item.slot === "breakfast");
  const snacks = allowed.meals.filter((item) => item.slot === "snack");
  const merged = mergeModelOutput(
    JSON.stringify({
      greeting: "Elena, four hours would have been kinder, and the back is asking for a short day.",
      movementId: base.movementId,
      mealIds: [breakfast!.id, snacks[0].id, snacks[1].id],
      sootheIds: base.sootheIds,
      restNote: base.restNote,
      whyToday: base.whyToday,
    }),
    base,
    allowed,
    "Elena",
  );
  assert.deepEqual(merged.mealIds, base.mealIds);
  assert.equal(merged.adjusted, true);
  assert.ok(merged.mealIds.some((id) => mealById(id)?.slot === "main"));
});

test("the explanation names the session she will actually do", () => {
  const input = {
    profile: profile({ birthDate: "2026-07-11", cleared: true, feeding: "formula" }),
    checkIn: checkIn({ pain: {}, energy: 4, sleepHours: 7, minutes: 20 }),
    now: NOW,
  };
  const base = buildRulesPlan(input);
  const allowed = allowedFor(input);
  const merged = mergeModelOutput(
    JSON.stringify({
      greeting: "Elena, the day has enough sleep for a small session and nothing hurts.",
      movementId: "breath-5",
      mealIds: base.mealIds,
      sootheIds: base.sootheIds,
      restNote: "Lie down for twenty minutes after you finish.",
      whyToday: "Heel slides are the plan, whatever the card says.",
    }),
    base,
    allowed,
    "Elena",
  );
  const title = movementById(merged.movementId)?.title ?? "";
  assert.match(merged.whyToday, new RegExp(title, "i"));
  assert.doesNotMatch(merged.whyToday, /heel slides/i);
});

test("model may choose among safe ids", () => {
  const input = {
    profile: profile({ birthDate: "2026-07-11", cleared: true, feeding: "formula" }),
    checkIn: checkIn({ pain: { neck: 4 }, energy: 4, sleepHours: 7, minutes: 20 }),
    now: NOW,
  };
  const base = buildRulesPlan(input);
  const allowed = allowedFor(input);
  assert.ok(allowed.movements.some((item) => item.id === "open-book"));
  const breakfast = allowed.meals.find((item) => item.slot === "breakfast");
  const mains = allowed.meals.filter((item) => item.slot === "main");
  assert.ok(breakfast);
  const merged = mergeModelOutput(
    JSON.stringify({
      greeting: "Elena, your neck is the part asking for a change of position, and the rest of you has enough sleep to move a little.",
      movementId: "open-book",
      mealIds: [breakfast!.id, mains[0].id, mains[1].id],
      sootheIds: ["neck-feed", "neck-release"],
      restNote: "Lie down for twenty minutes while someone else holds Io.",
      whyToday: "Open book matches the neck pain without loading the pelvis.",
    }),
    base,
    allowed,
  );
  assert.equal(merged.movementId, "open-book");
  assert.equal(merged.adjusted, false);
  assert.match(merged.greeting, /Elena/);
});

test("prompt only offers eligible movements and forbids diagnosis", () => {
  const input = {
    profile: profile({ cleared: false, birthDate: "2026-09-20" }),
    checkIn: checkIn({ minutes: 10, energy: 2 }),
    now: NOW,
  };
  const allowed = allowedFor(input);
  const prompt = userPrompt(input, allowed);
  assert.match(systemPrompt(), /do not diagnose/i);
  assert.ok(!prompt.includes("chair-squat"));
  assert.ok(prompt.includes("breath-5"));
  for (const movement of allowed.movements) {
    assert.equal(movementBlock(movement, input), null);
  }
});

test("createPlan falls back when the model throws", async () => {
  const plan = await createPlan(
    { profile: profile(), checkIn: checkIn(), now: NOW },
    async () => {
      throw new Error("connection refused");
    },
  );
  assert.equal(plan.source, "rules");
  assert.match(plan.modelError ?? "", /connection refused/);
  assert.ok(plan.movementId);
});

test("sleep and pain insight appears once there is a pattern", () => {
  const rows = [4, 4, 7, 8, 4, 7].map((sleep, index) =>
    checkIn({
      id: `s${index}`,
      date: `2026-09-${20 + index}`,
      sleepHours: sleep,
      pain: { "low-back": sleep < 5 ? 7 : 3 },
    }),
  );
  const found = insights(rows);
  assert.ok(found.some((item) => item.id === "sleep-pain"));
  assert.match(found.find((item) => item.id === "sleep-pain")!.text, /Sleep is part of the pain plan/);
});

test("fast loss while nursing gets a fuel warning, slow loss does not", () => {
  const fast = weightInsight(
    [
      { date: "2026-09-01", value: 180 },
      { date: "2026-09-15", value: 176 },
    ],
    "lb",
    "nursing",
    true,
  );
  assert.match(fast ?? "", /faster/);
  const slow = weightInsight(
    [
      { date: "2026-09-01", value: 180 },
      { date: "2026-09-29", value: 178 },
    ],
    "lb",
    "nursing",
    true,
  );
  assert.match(slow ?? "", /slow downward drift/);
});

function requireMovement(id: string): Movement {
  const movement = movementById(id);
  if (!movement) throw new Error(`missing ${id}`);
  return movement;
}
