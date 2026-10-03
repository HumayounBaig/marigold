import {
  areaLabel,
  MEALS,
  MOVEMENTS,
  SOOTHES,
  mealById,
  movementById,
  sootheById,
} from "./catalog";
import type {
  CheckIn,
  DayPlan,
  Feeding,
  FlagLevel,
  Meal,
  Movement,
  PainArea,
  Phase,
  Profile,
  RedFlag,
  Soothe,
  WeightEntry,
} from "./types";

export const PHASE_RANK: Record<Phase, number> = {
  rest: 0,
  reconnect: 1,
  rebuild: 2,
  return: 3,
};

export const PHASE_LABEL: Record<Phase, string> = {
  rest: "Rest and circulation",
  reconnect: "Reconnecting, gently",
  rebuild: "Rebuilding strength",
  return: "Returning to fuller strength",
};

export const DEFAULT_PARTNER_NOTE =
  "I made Marigold so the details of your recovery could stay on a computer we control. Tell it how the day actually feels. It will not lecture you, and it will not send your answers anywhere.";

const UNSAFE_OUTPUT =
  /\b(calories?|deficit|detox|keto|fasting|intermittent|ibuprofen|acetaminophen|tylenol|advil|motrin|milligrams?|\dmg\b|diagnos\w*|pre-?eclampsia|blood clot|you have an infection|lose \d|pounds a week|lbs? a week|baby weight|bounce back|pre-?baby|burn fat|starve|skip meals|eat less)\b/i;

export type PlanInput = {
  profile: Profile;
  checkIn: CheckIn;
  now?: Date;
  recentMovementIds?: string[];
  worseMovementIds?: string[];
  insights?: string[];
};

export type Allowed = {
  movements: Movement[];
  meals: Meal[];
  soothes: Soothe[];
  snackRequired: boolean;
};

export function parseDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00`);
}

export function daysSince(birthDate: string, now = new Date()): number {
  const birth = parseDate(birthDate);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const ms = start.getTime() - birth.getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

export function weeksSince(birthDate: string, now = new Date()): number {
  return Math.floor(daysSince(birthDate, now) / 7);
}

export function recoveryPhase(weeks: number, cleared: boolean): Phase {
  if (!cleared || weeks < 2) return "rest";
  if (weeks < 6) return "reconnect";
  if (weeks < 12) return "rebuild";
  return "return";
}

export function stageLabel(birthDate: string, now = new Date()): string {
  const days = daysSince(birthDate, now);
  if (days === 0) return "Day of birth";
  if (days === 1) return "Day 1";
  if (days < 14) return `Day ${days}`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? "Week 1" : `Week ${weeks}`;
}

export function feedsWithBody(feeding: Feeding): boolean {
  return feeding === "nursing" || feeding === "pumping" || feeding === "combination";
}

export function topPain(checkIn: CheckIn, count = 2): { area: PainArea; level: number }[] {
  return Object.entries(checkIn.pain)
    .map(([area, level]) => ({ area: area as PainArea, level: level ?? 0 }))
    .filter((item) => item.level > 0)
    .sort((a, b) => b.level - a.level)
    .slice(0, count);
}

export function maxPain(checkIn: CheckIn): number {
  const values = Object.values(checkIn.pain).filter((value): value is number => typeof value === "number");
  return values.length ? Math.max(...values) : 0;
}

export function redFlags(checkIn: CheckIn, profile: Profile): RedFlag[] {
  const flags: RedFlag[] = [];
  const add = (id: string, level: FlagLevel, title: string, detail: string) => {
    flags.push({ id, level, title, detail });
  };

  if (checkIn.bleeding === "heavy") {
    add(
      "bleeding",
      "now",
      "Bleeding needs a clinician now",
      "Soaking a pad in about an hour, or passing clots larger than an egg, is a reason to contact your clinician or urgent care now. Skip exercise.",
    );
  }
  if (checkIn.chestOrBreath) {
    add(
      "chest",
      "now",
      "Chest pain or troubled breathing needs urgent care",
      "Chest pain, sudden shortness of breath, or a sense that breathing is wrong after birth can be serious. Contact emergency services or urgent care now. Do not walk it off.",
    );
  }
  if (checkIn.severeHeadache) {
    add(
      "head",
      "now",
      "A severe headache needs urgent care",
      "A sudden severe headache, or a headache with vision changes, swelling, or pain under the ribs, can show up in the weeks after birth. Contact urgent care or your clinician now.",
    );
  }
  if (checkIn.legSwelling) {
    add(
      "leg",
      "now",
      "One-sided leg pain or swelling needs urgent care",
      "A calf that is swollen, red, warm, or painful on one side needs urgent care. Do not massage it, and do not exercise.",
    );
  }
  if (checkIn.scaryThoughts) {
    add(
      "thoughts",
      "now",
      "You deserve a person on the phone",
      "Scary thoughts, or thoughts of hurting yourself or the baby, are a reason to get help now. In the US, call or text 988. Postpartum Support International is 1-800-944-4773. Elsewhere, use your local emergency number or a perinatal mental health line. Tell someone in the house.",
    );
  }
  if (checkIn.fever) {
    add(
      "fever",
      "today",
      "Fever is a today call",
      "A fever or feeling acutely ill after birth is a reason to contact your clinician today, not a reason to push through a session.",
    );
  }
  if (checkIn.incisionWorry && (profile.delivery === "cesarean" || profile.concerns.includes("incision"))) {
    add(
      "incision",
      "today",
      "The incision needs eyes on it today",
      "Spreading redness, heat, opening, drainage, or a sudden increase in incision pain should be seen today. Keep movement to breathing until someone has assessed it.",
    );
  }
  if (maxPain(checkIn) >= 9) {
    add(
      "severe-pain",
      "today",
      "Pain this high deserves a call",
      "Pain at a 9 or 10, especially if it is new, is beyond a home movement plan. Contact your clinician today. Today's plan stays with rest.",
    );
  }
  if (checkIn.pelvicHeaviness) {
    add(
      "heaviness",
      "soon",
      "Heaviness is a pelvic-floor question",
      "A dragging or bulging feeling is a reason to ask for a pelvic floor physical therapist. Today skips movements that load the pelvis. This is not a diagnosis.",
    );
  }
  if (checkIn.mood === 1 && !checkIn.scaryThoughts) {
    add(
      "mood",
      "soon",
      "A very low day can be said out loud",
      "If the days stay this heavy, or you feel hopeless, tell your clinician and one person you trust. Postpartum Support International: 1-800-944-4773 in the US. If you might act on a harmful thought, call emergency services or 988.",
    );
  }
  return flags;
}

export function locksMovement(flags: RedFlag[]): boolean {
  return flags.some((flag) => flag.level === "now" || flag.level === "today");
}

export function effectiveMinutes(checkIn: CheckIn, locked: boolean): number {
  if (locked) return 5;
  let minutes: number = checkIn.minutes;
  if (checkIn.energy <= 1) minutes = Math.min(minutes, 10);
  else if (checkIn.energy === 2 || checkIn.sleepHours < 5) minutes = Math.min(minutes, 15);
  if (checkIn.bleeding === "moderate") minutes = Math.min(minutes, 10);
  return minutes;
}

export function movementBlock(movement: Movement, input: PlanInput, flags = redFlags(input.checkIn, input.profile)): string | null {
  const weeks = weeksSince(input.profile.birthDate, input.now);
  const phase = recoveryPhase(weeks, input.profile.cleared);
  const locked = locksMovement(flags);
  const minutes = effectiveMinutes(input.checkIn, locked);
  const worse = new Set(input.worseMovementIds ?? []);

  if (worse.has(movement.id)) return "You marked this worse recently, so it stays off the plan.";
  if (locked && !movement.okWhenUrgent) return "Today's symptoms need care first, so this stays on the shelf.";
  if (movement.requiresCleared && !input.profile.cleared) return "Waiting on clearance from your clinician.";
  if (movement.minDays && daysSince(input.profile.birthDate, input.now) < movement.minDays) {
    return "A short walk waits until you have been home a couple of days and feel steady.";
  }
  if (weeks < movement.minWeeks) return `This waits until at least week ${movement.minWeeks}.`;
  if (input.profile.delivery === "cesarean" && weeks < (movement.cesareanMinWeeks ?? movement.minWeeks)) {
    return "After a cesarean, this one waits longer so the incision can knit.";
  }
  if (PHASE_RANK[phase] < PHASE_RANK[movement.minPhase]) return "Your current stage is earlier than this movement.";
  if (input.checkIn.pelvicHeaviness && movement.avoidIfHeaviness) return "Pelvic heaviness means this load waits.";
  if ((input.checkIn.bleeding === "moderate" || input.checkIn.bleeding === "heavy") && movement.needsSteadyBleeding) {
    return "Bleeding is more than light, so this stays off today.";
  }
  if (input.checkIn.incisionWorry && movement.loadsCore) return "While the incision is a concern, core loading waits.";
  if (flags.some((flag) => flag.id === "leg") && movement.id === "ankle-pumps") {
    return "Skip ankle pumps until a clinician has checked the leg.";
  }
  for (const [area, max] of Object.entries(movement.maxPain) as [PainArea, number][]) {
    const level = input.checkIn.pain[area] ?? 0;
    if (level > max) return `${areaLabel(area)} is too sore for this today.`;
  }
  if (movement.minutes > minutes && movement.id !== "breath-5") {
    return "Today's energy calls for something shorter.";
  }
  return null;
}

export function eligibleMovements(input: PlanInput): Movement[] {
  const flags = redFlags(input.checkIn, input.profile);
  const allowed = MOVEMENTS.filter((movement) => movementBlock(movement, input, flags) === null);
  if (allowed.length === 0) return MOVEMENTS.filter((movement) => movement.id === "breath-5");
  return allowed;
}

function daySeed(date: string): number {
  return Number(date.replaceAll("-", "")) || 1;
}

export function eligibleMeals(input: PlanInput): Meal[] {
  const lowEnergy = input.checkIn.energy <= 2 || input.checkIn.sleepHours < 5;
  return MEALS.filter((meal) => {
    if (!lowEnergy) return true;
    return meal.oneHand || meal.minutes <= 15;
  });
}

export function snackRequired(profile: Profile, checkIn: CheckIn): boolean {
  return feedsWithBody(profile.feeding) || checkIn.energy <= 2 || checkIn.sleepHours < 5;
}

export function eligibleSoothes(input: PlanInput): Soothe[] {
  const pains = new Set(topPain(input.checkIn, 4).map((item) => item.area));
  for (const area of input.profile.concerns) pains.add(area);
  if (input.profile.delivery === "cesarean") pains.add("incision");
  if (feedsWithBody(input.profile.feeding)) {
    pains.add("neck");
    pains.add("wrists");
  }
  const specific = SOOTHES.filter((item) => item.area !== "general" && pains.has(item.area));
  const general = SOOTHES.filter((item) => item.area === "general");
  const merged = [...specific, ...general];
  return merged.length ? merged : general;
}

export function allowedFor(input: PlanInput): Allowed {
  return {
    movements: eligibleMovements(input),
    meals: eligibleMeals(input),
    soothes: eligibleSoothes(input),
    snackRequired: snackRequired(input.profile, input.checkIn),
  };
}

function scoreMovement(movement: Movement, input: PlanInput, minutes: number): number {
  let score = 0;
  const pains = topPain(input.checkIn, 3);
  for (const pain of pains) {
    if (movement.helps.includes(pain.area) && pain.level >= 3) score += 4;
  }
  const loud = maxPain(input.checkIn);
  const target = loud >= 6 ? Math.min(minutes, 8) : minutes;
  score -= Math.abs(movement.minutes - target) * 0.6;
  if ((input.recentMovementIds ?? []).includes(movement.id)) score -= 3;
  if (movement.id === "breath-5" && loud < 5 && minutes >= 15) score -= 2;
  if (movement.helps.length === 0 && pains.length > 0) score -= 1;
  return score;
}

function pickMovement(input: PlanInput, allowed: Movement[]): Movement {
  const flags = redFlags(input.checkIn, input.profile);
  const minutes = effectiveMinutes(input.checkIn, locksMovement(flags));
  if (locksMovement(flags)) {
    return allowed.find((movement) => movement.id === "breath-5") ?? allowed[0];
  }
  const ranked = [...allowed].sort((a, b) => {
    const delta = scoreMovement(b, input, minutes) - scoreMovement(a, input, minutes);
    if (delta !== 0) return delta;
    return a.id.localeCompare(b.id);
  });
  return ranked[0];
}

function rotatePick<T extends { id: string }>(items: T[], seed: number, offset: number): T {
  const index = Math.abs(seed + offset) % items.length;
  return items[index];
}

export function pickMeals(input: PlanInput, meals: Meal[]): Meal[] {
  const seed = daySeed(input.checkIn.date);
  const breakfasts = meals.filter((meal) => meal.slot === "breakfast");
  const mains = meals.filter((meal) => meal.slot === "main");
  const snacks = meals.filter((meal) => meal.slot === "snack");
  const breakfast = rotatePick(breakfasts.length ? breakfasts : MEALS.filter((meal) => meal.slot === "breakfast"), seed, 0);
  const pool = mains.length ? mains : MEALS.filter((meal) => meal.slot === "main");
  const firstMain = rotatePick(pool, seed, 3);
  const secondPool = pool.filter((meal) => meal.id !== firstMain.id);
  const second = rotatePick(secondPool.length ? secondPool : pool, seed, 7);
  if (snackRequired(input.profile, input.checkIn)) {
    const snackPool = snacks.length ? snacks : MEALS.filter((meal) => meal.slot === "snack");
    return [breakfast, firstMain, rotatePick(snackPool, seed, 5)];
  }
  return [breakfast, firstMain, second];
}

export function pickSoothes(input: PlanInput, soothes: Soothe[]): Soothe[] {
  const pains = topPain(input.checkIn, 3);
  const chosen: Soothe[] = [];
  const used = new Set<string>();
  const take = (item: Soothe | undefined) => {
    if (!item || used.has(item.id)) return;
    used.add(item.id);
    chosen.push(item);
  };

  for (const pain of pains) {
    take(soothes.find((item) => item.area === pain.area));
    if (chosen.length >= 2) break;
  }
  if (input.profile.delivery === "cesarean" && (input.checkIn.pain.incision ?? 0) > 0) {
    take(soothes.find((item) => item.id === "incision-support"));
  }
  if (feedsWithBody(input.profile.feeding)) {
    take(soothes.find((item) => item.area === "neck" || item.area === "wrists"));
  }
  for (const item of soothes) {
    if (chosen.length >= 2) break;
    take(item);
  }
  for (const item of SOOTHES) {
    if (chosen.length >= 2) break;
    if (item.area === "general") take(item);
  }
  return chosen.slice(0, 2);
}

function painPhrase(checkIn: CheckIn): string {
  const [first] = topPain(checkIn, 1);
  if (!first) return "Pain is quiet enough to build on";
  return `${areaLabel(first.area)} is the loudest signal, at ${first.level} out of 10`;
}

export function fallbackCopy(input: PlanInput, movement: Movement, meals: Meal[], soothes: Soothe[]): Pick<DayPlan, "greeting" | "restNote" | "whyToday"> {
  const name = input.profile.name.trim() || "there";
  const energy =
    input.checkIn.energy <= 2 || input.checkIn.sleepHours < 5
      ? "Energy is low, so the session stays small."
      : "There is a little room to move, and it stays well inside a mild effort.";
  const urgent = locksMovement(redFlags(input.checkIn, input.profile));
  const greeting = urgent
    ? `${name}, ${painPhrase(input.checkIn).toLowerCase()}. Today's plan is rest and a call to your clinician, not a workout.`
    : `${name}, ${painPhrase(input.checkIn).toLowerCase()}. ${energy}`;
  const restNote = feedsWithBody(input.profile.feeding)
    ? "Protect one horizontal rest today. Hunger during these weeks is a reason to eat, including the snack, not a reason to negotiate."
    : "Protect one horizontal rest today, even twenty minutes. Healing likes that more than a tighter schedule.";
  const mealNames = meals.map((meal) => meal.title).join(", ");
  const sootheNames = soothes.map((item) => item.title).join(" and ");
  const whyToday = urgent
    ? `The symptoms you logged come before ${movement.title.toLowerCase()} as exercise. ${sootheNames} is here only as comfort while you get care.`
    : `${movement.title} fits the time and the pain you logged. ${mealNames} keep the day fed. ${sootheNames} speaks to what hurts.`;
  return { greeting, restNote, whyToday };
}

export function buildRulesPlan(input: PlanInput): DayPlan {
  const now = input.now ?? new Date();
  const days = daysSince(input.profile.birthDate, now);
  const weeks = Math.floor(days / 7);
  const phase = recoveryPhase(weeks, input.profile.cleared);
  const flags = redFlags(input.checkIn, input.profile);
  const allowed = allowedFor(input);
  const movement = pickMovement(input, allowed.movements);
  const meals = pickMeals(input, allowed.meals);
  const soothes = pickSoothes(input, allowed.soothes);
  const copy = fallbackCopy(input, movement, meals, soothes);
  return {
    date: input.checkIn.date,
    ...copy,
    movementId: movement.id,
    mealIds: meals.map((meal) => meal.id),
    sootheIds: soothes.map((item) => item.id),
    source: "rules",
    model: null,
    adjusted: false,
    modelError: null,
    flags,
    phase,
    weeks,
    days,
  };
}

export function systemPrompt(): string {
  return [
    "You are Marigold, a postpartum recovery companion running entirely on her computer.",
    "You help one person ease pain and return to strength slowly. You do not diagnose, prescribe, or recommend medication, supplements, fasting, calorie cuts, or a target weight.",
    "Choose only ids from the lists in the user message. Never invent an id.",
    "If Urgent is yes, movementId must be breath-5, and the greeting must point her toward care without panic or exclamation points.",
    "Write in plain sentences. Use her name. No emoji. Do not call her mama. Do not say bounce back, baby weight, or pre-baby body.",
    "Reply with JSON only, in this shape:",
    '{"greeting":"2 sentences","movementId":"id","mealIds":["id","id","id"],"sootheIds":["id","id"],"restNote":"1 sentence","whyToday":"1 sentence"}',
  ].join("\n");
}

export function userPrompt(input: PlanInput, allowed: Allowed): string {
  const weeks = weeksSince(input.profile.birthDate, input.now);
  const phase = recoveryPhase(weeks, input.profile.cleared);
  const flags = redFlags(input.checkIn, input.profile);
  const pains = Object.entries(input.checkIn.pain)
    .filter(([, level]) => (level ?? 0) > 0)
    .map(([area, level]) => `${areaLabel(area as PainArea)} ${level}`)
    .join(", ");
  const mealRule = allowed.snackRequired
    ? "Pick exactly 3 meal ids: one breakfast, one main, and one snack. She needs the snack."
    : "Pick exactly 3 meal ids: one breakfast and two different mains. Do not prescribe eating less.";
  const lines = [
    `Name: ${input.profile.name || "Friend"}`,
    `Stage: ${stageLabel(input.profile.birthDate, input.now)} (${phase})`,
    `Birth: ${input.profile.delivery}`,
    `Feeding: ${input.profile.feeding}`,
    `Cleared for movement beyond daily life: ${input.profile.cleared ? "yes" : "no"}`,
    `What she wants back: ${input.profile.intention || "to feel steadier in her body"}`,
    `Sleep hours: ${input.checkIn.sleepHours}`,
    `Energy 1-5: ${input.checkIn.energy}`,
    `Mood 1-5: ${input.checkIn.mood}`,
    `Pain: ${pains || "none logged"}`,
    `Bleeding: ${input.checkIn.bleeding}`,
    `Pelvic heaviness: ${input.checkIn.pelvicHeaviness ? "yes" : "no"}`,
    `Minutes she can give: ${effectiveMinutes(input.checkIn, locksMovement(flags))}`,
    `Note: ${input.checkIn.note || "none"}`,
    `Urgent: ${locksMovement(flags) ? "yes" : "no"}`,
    flags.length ? `Care notes: ${flags.map((flag) => flag.title).join("; ")}` : "Care notes: none",
    input.insights?.length ? `Pattern already computed: ${input.insights.join(" ")}` : "",
    input.recentMovementIds?.length ? `Do not repeat if you have a real alternative: ${input.recentMovementIds.join(", ")}` : "",
    "",
    "Movements you may choose exactly one of:",
    ...allowed.movements.map((movement) => `- ${movement.id}: ${movement.minutes} min, ${movement.summary}`),
    "",
    mealRule,
    ...allowed.meals.map((meal) => `- ${meal.id} (${meal.slot}): ${meal.title}`),
    "",
    "Soothe practices, choose exactly 2:",
    ...allowed.soothes.map((item) => `- ${item.id}: ${item.title} (${areaLabel(item.area)})`),
  ];
  return lines.filter((line) => line !== "").join("\n");
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("Model did not return JSON.");
  return JSON.parse(text.slice(start, end + 1));
}

function cleanProse(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length < 12 || text.length > max) return null;
  if (UNSAFE_OUTPUT.test(text)) return null;
  return text;
}

export function mergeModelOutput(text: string, base: DayPlan, allowed: Allowed): DayPlan {
  const parsed = asRecord(extractJson(text));
  if (!parsed) throw new Error("Model JSON was empty.");
  let adjusted = false;
  const greeting = cleanProse(parsed.greeting, 420) ?? base.greeting;
  if (greeting === base.greeting && typeof parsed.greeting === "string") adjusted = true;
  const restNote = cleanProse(parsed.restNote, 320) ?? base.restNote;
  if (restNote === base.restNote && typeof parsed.restNote === "string") adjusted = true;
  const whyToday = cleanProse(parsed.whyToday, 360) ?? base.whyToday;
  if (whyToday === base.whyToday && typeof parsed.whyToday === "string") adjusted = true;

  const movementIds = new Set(allowed.movements.map((movement) => movement.id));
  let movementId = base.movementId;
  if (typeof parsed.movementId === "string" && movementIds.has(parsed.movementId)) {
    movementId = parsed.movementId;
  } else if (parsed.movementId) {
    adjusted = true;
  }
  if (locksMovement(base.flags) && movementId !== "breath-5") {
    movementId = "breath-5";
    adjusted = true;
  }

  const mealIdsAllowed = new Set(allowed.meals.map((meal) => meal.id));
  const requestedMeals = Array.isArray(parsed.mealIds) ? parsed.mealIds.filter((id): id is string => typeof id === "string") : [];
  const validMeals = requestedMeals.filter((id) => mealIdsAllowed.has(id));
  const uniqueMeals = [...new Set(validMeals)];
  const breakfastOk = uniqueMeals.some((id) => mealById(id)?.slot === "breakfast");
  const snackOk = !allowed.snackRequired || uniqueMeals.some((id) => mealById(id)?.slot === "snack");
  const mains = uniqueMeals.filter((id) => mealById(id)?.slot === "main");
  let mealIds = base.mealIds;
  if (uniqueMeals.length === 3 && breakfastOk && snackOk && (allowed.snackRequired || mains.length >= 1)) {
    mealIds = uniqueMeals;
  } else if (requestedMeals.length) {
    adjusted = true;
  }

  const sootheIdsAllowed = new Set(allowed.soothes.map((item) => item.id));
  const requestedSoothe = Array.isArray(parsed.sootheIds)
    ? parsed.sootheIds.filter((id): id is string => typeof id === "string" && sootheIdsAllowed.has(id))
    : [];
  const sootheIds = [...new Set(requestedSoothe)].slice(0, 2);
  const finalSoothe = sootheIds.length === 2 ? sootheIds : base.sootheIds;
  if (sootheIds.length !== 2 && requestedSoothe.length) adjusted = true;

  return {
    ...base,
    greeting,
    restNote,
    whyToday,
    movementId,
    mealIds,
    sootheIds: finalSoothe,
    adjusted,
    source: "model",
  };
}

export async function createPlan(
  input: PlanInput,
  generate?: (system: string, user: string) => Promise<string>,
  modelName?: string,
): Promise<DayPlan> {
  const base = buildRulesPlan(input);
  if (!generate) return base;
  const allowed = allowedFor(input);
  try {
    const text = await generate(systemPrompt(), userPrompt(input, allowed));
    const merged = mergeModelOutput(text, base, allowed);
    return { ...merged, model: modelName ?? "qwen2.5:3b", modelError: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "The local model did not answer.";
    return { ...base, modelError: message };
  }
}

export type Insight = { id: string; text: string };

function dayPain(checkIn: CheckIn): number {
  return maxPain(checkIn);
}

export function insights(checkIns: CheckIn[]): Insight[] {
  const found: Insight[] = [];
  if (checkIns.length >= 4) {
    const short = checkIns.filter((item) => item.sleepHours < 5);
    const rested = checkIns.filter((item) => item.sleepHours >= 6);
    if (short.length >= 2 && rested.length >= 2) {
      const mean = (rows: CheckIn[]) => rows.reduce((sum, item) => sum + dayPain(item), 0) / rows.length;
      const tiredPain = mean(short);
      const restedPain = mean(rested);
      if (tiredPain - restedPain >= 1.5) {
        found.push({
          id: "sleep-pain",
          text: `On nights under 5 hours, the day's strongest pain averages ${tiredPain.toFixed(1)} out of 10. After 6 or more hours, it averages ${restedPain.toFixed(1)}. Sleep is part of the pain plan.`,
        });
      }
    }
    const totals = new Map<PainArea, { sum: number; n: number }>();
    for (const checkIn of checkIns) {
      for (const [area, level] of Object.entries(checkIn.pain) as [PainArea, number | undefined][]) {
        if (!level) continue;
        const current = totals.get(area) ?? { sum: 0, n: 0 };
        current.sum += level;
        current.n += 1;
        totals.set(area, current);
      }
    }
    let top: { area: PainArea; avg: number } | null = null;
    for (const [area, stat] of totals) {
      const avg = stat.sum / stat.n;
      if (stat.n >= 3 && (!top || avg > top.avg)) top = { area, avg };
    }
    if (top && top.avg >= 3) {
      found.push({
        id: "top-area",
        text: `${areaLabel(top.area)} has been the steady one, around ${top.avg.toFixed(1)} out of 10 on the days you logged it.`,
      });
    }
  }
  return found;
}

export function weightInsight(entries: WeightEntry[], unit: Profile["unit"], feeding: Feeding, easeDown: boolean): string | null {
  if (entries.length < 2) return null;
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const days = Math.max(1, Math.round((parseDate(last.date).getTime() - parseDate(first.date).getTime()) / 86_400_000));
  if (days < 7) return "A few days is fluid and sleep, not a direction. Give it a week before reading the slope.";
  const perWeek = ((last.value - first.value) / days) * 7;
  const unitName = unit === "lb" ? "lb" : "kg";
  const fast = unit === "lb" ? (feedsWithBody(feeding) ? 1 : 2) : feedsWithBody(feeding) ? 0.45 : 0.9;
  if (perWeek <= -(fast + 0.15)) {
    return feedsWithBody(feeding)
      ? `Weight is leaving faster than about ${fast} ${unitName} a week while you are still feeding the baby with your body. That pace can cost milk and energy. Eat the snack today and keep walks easy.`
      : `That is a fast drop, steeper than about ${fast} ${unitName} a week. Healing tissue likes a slower slope. Keep the meals complete.`;
  }
  if (perWeek >= (unit === "lb" ? 0.4 : 0.2)) {
    return easeDown
      ? "This stretch went up. Fluid, a growth spurt, and a short night all move the number. The levers here are walks, complete meals, and sleep — not a smaller plate."
      : "The number rose. One stretch is not a verdict. Fluid and sleep move it around.";
  }
  if (perWeek < -0.05) {
    return "A slow downward drift is a kind pace. Nothing here needs to go faster.";
  }
  return "The line is nearly flat. That can be exactly right while tissue is still healing.";
}

export function birthDateError(value: string, now = new Date()): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "Add the baby's birth date.";
  const date = parseDate(value);
  if (Number.isNaN(date.getTime())) return "That date does not look right.";
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (date.getTime() > today.getTime()) return "Birth date cannot be in the future.";
  if (daysSince(value, now) > 365 * 3) return "Marigold is built for the months and first years after birth.";
  return null;
}

export function describeMovement(id: string): Movement | undefined {
  return movementById(id);
}

export function describeMeal(id: string): Meal | undefined {
  return mealById(id);
}

export function describeSoothe(id: string): Soothe | undefined {
  return sootheById(id);
}
