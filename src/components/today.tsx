"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { mealById, movementById, PAIN_AREAS, sootheById } from "@/lib/catalog";
import { insights, PHASE_LABEL, redFlags, stageLabel } from "@/lib/recovery";
import { blankCheckIn, todayKey } from "@/lib/storage";
import type { Bleeding, CheckIn, DayPlan, Minutes, PainArea } from "@/lib/types";
import { ChoicePills, FlagList, NumberScale } from "@/components/bits";
import { useStore } from "@/components/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "cn";

const BLEEDING: { value: Bleeding; label: string; hint: string }[] = [
  { value: "none", label: "None", hint: "No bleeding today" },
  { value: "spotting", label: "Spotting", hint: "A little, not a pad change" },
  { value: "light", label: "Light", hint: "A pad lasts several hours" },
  { value: "moderate", label: "Moderate", hint: "More than light. Movement stays off your feet" },
  { value: "heavy", label: "Heavy", hint: "Soaking a pad in about an hour, or large clots" },
];

const SIGNALS: { key: keyof CheckIn; label: string; hint: string }[] = [
  { key: "severeHeadache", label: "Severe headache or vision changes", hint: "Sudden, worst, or with spots in vision" },
  { key: "chestOrBreath", label: "Chest pain or breathing that feels wrong", hint: "Not ordinary tiredness" },
  { key: "legSwelling", label: "One calf swollen, red, warm, or painful", hint: "One side, not both ankles after a long sit" },
  { key: "fever", label: "Fever or feeling acutely ill", hint: "Chills, flu-feeling, or a temperature" },
  { key: "incisionWorry", label: "Incision looks more red, hot, open, or is draining", hint: "Or pain there jumped suddenly" },
  { key: "pelvicHeaviness", label: "A heavy, dragging, or bulging feeling in the pelvis", hint: "Changes which movements are offered" },
  { key: "scaryThoughts", label: "Thoughts that scare you, including of harm", hint: "This routes you to a person, not a workout" },
];

export function Today() {
  const { store } = useStore();
  const profile = store.profile;
  if (!profile) return null;

  const date = todayKey();
  const saved = store.checkIns.find((item) => item.date === date);
  const plan = store.plans[date];
  return (
    <TodayBody
      initial={saved ?? blankCheckIn(date, profile.concerns)}
      existingPlan={plan}
      profileName={profile.name}
      babyName={profile.babyName}
      birthDate={profile.birthDate}
      intention={profile.intention}
    />
  );
}

function TodayBody({
  initial,
  existingPlan,
  profileName,
  babyName,
  birthDate,
  intention,
}: {
  initial: CheckIn;
  existingPlan?: DayPlan;
  profileName: string;
  babyName: string;
  birthDate: string;
  intention: string;
}) {
  const { store, saveCheckIn, savePlan } = useStore();
  const profile = store.profile!;
  const [checkIn, setCheckIn] = useState<CheckIn>(initial);
  const [editing, setEditing] = useState(!existingPlan);
  const [plan, setPlan] = useState<DayPlan | undefined>(existingPlan);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const flags = useMemo(() => redFlags(checkIn, profile), [checkIn, profile]);
  const recent = store.sessions.slice(-4).map((item) => item.movementId);
  const worse = store.sessions.filter((item) => item.reaction === "worse").map((item) => item.movementId);
  const pattern = insights(store.checkIns).map((item) => item.text);

  function patch(partial: Partial<CheckIn>) {
    setCheckIn((current) => ({ ...current, ...partial }));
  }

  async function generate() {
    setPending(true);
    setError("");
    const next = { ...checkIn, createdAt: new Date().toISOString() };
    saveCheckIn(next);
    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          checkIn: next,
          recentMovementIds: recent,
          worseMovementIds: worse,
          insights: pattern,
        }),
      });
      const payload = (await response.json()) as DayPlan & { error?: string };
      if (!response.ok) throw new Error(payload.error || "The plan could not be made.");
      setPlan(payload);
      savePlan(payload);
      setEditing(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The plan could not be made.");
    } finally {
      setPending(false);
    }
  }

  const movement = plan ? movementById(plan.movementId) : undefined;
  const meals = plan?.mealIds.map((id) => mealById(id)).filter((item) => item != null) ?? [];
  const soothes = plan?.sootheIds.map((id) => sootheById(id)).filter((item) => item != null) ?? [];

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
      <section className="grid gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {stageLabel(birthDate)}
            {babyName ? ` · ${babyName}` : ""}
          </p>
          <h1 className="mt-1 font-heading text-4xl text-balance">Today, {profileName}.</h1>
          {intention ? <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">{intention}</p> : null}
        </div>

        {editing ? (
          <Card>
            <CardContent className="grid gap-6">
              <div className="grid gap-2">
                <Label>Sleep last night, roughly</Label>
                <NumberScale label="Hours of sleep" max={12} columns={7} value={checkIn.sleepHours} onChange={(sleepHours) => patch({ sleepHours })} />
              </div>
              <div className="grid gap-2">
                <Label>Energy</Label>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Energy">
                  {(
                    [
                      [1, "Spent"],
                      [2, "Low"],
                      [3, "Steady"],
                      [4, "Able"],
                      [5, "Bright"],
                    ] as const
                  ).map(([level, label]) => (
                    <Button key={level} type="button" variant={checkIn.energy === level ? "default" : "outline"} className="h-11" onClick={() => patch({ energy: level })}>
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Mood</Label>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Mood">
                  {(
                    [
                      [1, "Heavy"],
                      [2, "Flat"],
                      [3, "Mixed"],
                      [4, "Okay"],
                      [5, "Light"],
                    ] as const
                  ).map(([level, label]) => (
                    <Button key={level} type="button" variant={checkIn.mood === level ? "default" : "outline"} className="h-11" onClick={() => patch({ mood: level })}>
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="grid gap-4">
                <div className="flex items-end justify-between gap-3">
                  <Label>Pain, 0 is none</Label>
                </div>
                {Object.keys(checkIn.pain).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Add a place if something hurts. Leaving this empty is allowed.</p>
                ) : null}
                {(Object.keys(checkIn.pain) as PainArea[]).map((area) => (
                  <div key={area} className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{PAIN_AREAS.find((item) => item.id === area)?.label}</span>
                      <button
                        type="button"
                        className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                        onClick={() => {
                          const pain = { ...checkIn.pain };
                          delete pain[area];
                          patch({ pain });
                        }}
                      >
                        Remove
                      </button>
                    </div>
                    <NumberScale
                      label={`${area} pain`}
                      value={checkIn.pain[area] ?? 0}
                      onChange={(level) => patch({ pain: { ...checkIn.pain, [area]: level } })}
                    />
                  </div>
                ))}
                <div className="flex flex-wrap gap-2">
                  {PAIN_AREAS.filter((area) => checkIn.pain[area.id] === undefined).map((area) => (
                    <Button
                      key={area.id}
                      type="button"
                      variant="outline"
                      className="h-8"
                      onClick={() => patch({ pain: { ...checkIn.pain, [area.id]: 0 } })}
                    >
                      Add {area.label.toLowerCase()}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Bleeding</Label>
                <ChoicePills label="Bleeding" value={checkIn.bleeding} options={BLEEDING} onChange={(bleeding) => patch({ bleeding })} />
              </div>
              <div className="grid gap-2">
                <Label>Anything that needs a person, not an app</Label>
                {SIGNALS.map((signal) => {
                  const on = Boolean(checkIn[signal.key]);
                  return (
                    <button
                      key={signal.key}
                      type="button"
                      aria-pressed={on}
                      onClick={() => patch({ [signal.key]: !on } as Partial<CheckIn>)}
                      className={cn(
                        "rounded-xl border px-3 py-3 text-left",
                        on ? "border-destructive/50 bg-destructive/10" : "border-border bg-background",
                      )}
                    >
                      <span className="block text-sm font-medium">{signal.label}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{signal.hint}</span>
                    </button>
                  );
                })}
              </div>
              <div className="grid gap-2">
                <Label>Minutes you can give movement</Label>
                <div className="flex gap-2">
                  {([10, 20, 30] as Minutes[]).map((minutes) => (
                    <Button
                      key={minutes}
                      type="button"
                      variant={checkIn.minutes === minutes ? "default" : "outline"}
                      className="h-11 flex-1"
                      onClick={() => patch({ minutes })}
                    >
                      {minutes}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="note">Anything else the day should know</Label>
                <Textarea
                  id="note"
                  value={checkIn.note}
                  onChange={(event) => patch({ note: event.target.value })}
                  className="min-h-20 text-base"
                  placeholder="Cluster feeding. Back seized while doing bottles."
                />
              </div>
              <FlagList flags={flags} />
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="button" className="h-11 rounded-full text-base" onClick={generate} disabled={pending}>
                {pending ? "Reading today’s check-in here…" : flags.some((flag) => flag.level !== "soon") ? "Make a rest plan" : "Make today’s plan"}
              </Button>
              {pending ? (
                <p className="text-xs leading-5 text-muted-foreground">
                  Qwen2.5 is working on this computer. The first note can take half a minute while the model wakes up. Nothing is uploaded.
                </p>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <Button type="button" variant="outline" className="h-11 w-fit rounded-full px-5" onClick={() => setEditing(true)}>
            Revise today’s check-in
          </Button>
        )}
      </section>

      <section className="grid gap-4">
        {!plan || !movement ? (
          <Card className="min-h-64 justify-center">
            <CardContent>
              <h2 className="font-heading text-2xl">The day is still unwritten.</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Tell Marigold how sleep, pain, and energy actually are. The open model will choose from a fixed catalog of gentle options. It cannot invent a workout.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            <FlagList flags={plan.flags} />
            <Card>
              <CardContent className="grid gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{PHASE_LABEL[plan.phase]}</Badge>
                  <Badge variant="outline">{plan.source === "model" ? "Written by Qwen, locally" : "Chosen from the local catalog"}</Badge>
                </div>
                <h2 className="font-heading text-3xl leading-snug text-balance">{plan.greeting}</h2>
                <p className="text-sm leading-6 text-muted-foreground">{plan.whyToday}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="grid gap-3">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Move</p>
                <h3 className="font-heading text-2xl">{movement.title}</h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  {movement.minutes} minutes. {movement.summary}
                </p>
                <Link href={`/move/${movement.id}`} className={cn(buttonVariants({ size: "lg" }), "h-11 w-fit rounded-full px-5 text-base")}>
                  Start this session
                </Link>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="grid gap-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Nourish</p>
                {meals.map((meal) => (
                  <div key={meal.id}>
                    <h3 className="font-medium">{meal.title}</h3>
                    <p className="text-sm leading-6 text-muted-foreground">{meal.summary}</p>
                  </div>
                ))}
                <Link href="/nourish" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
                  See the full plate
                </Link>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="grid gap-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Soothe</p>
                {soothes.map((item) => (
                  <div key={item.id}>
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="text-sm leading-6 text-muted-foreground">{item.steps[0]}</p>
                  </div>
                ))}
                <p className="text-sm leading-6">{plan.restNote}</p>
                <Link href="/soothe" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
                  Open the pain notes
                </Link>
              </CardContent>
            </Card>
            <p className="text-xs leading-5 text-muted-foreground">
              {plan.source === "model"
                ? `Note written on this computer by ${plan.model ?? "the local model"}. Apache-2.0 weights via Ollama. This check-in was not sent to a cloud model.`
                : "Ollama did not answer, so the same safety catalog chose the plan. The check-in still never left this computer."}
              {plan.adjusted ? " Where the model wandered outside the catalog or the house rules, those lines were replaced." : ""}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
