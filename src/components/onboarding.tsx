"use client";

import { useState } from "react";
import { PAIN_AREAS } from "@/lib/catalog";
import { birthDateError, DEFAULT_PARTNER_NOTE } from "@/lib/recovery";
import type { Delivery, Feeding, PainArea } from "@/lib/types";
import { ChoicePills, Logo } from "@/components/bits";
import { useStore } from "@/components/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "cn";

const DELIVERIES: { value: Delivery; label: string; hint: string }[] = [
  { value: "vaginal", label: "Vaginal birth", hint: "Including a birth with tearing or a repair" },
  { value: "assisted", label: "Assisted vaginal birth", hint: "Forceps or vacuum" },
  { value: "cesarean", label: "Cesarean birth", hint: "The incision gets a longer, quieter ramp" },
];

const FEEDINGS: { value: Feeding; label: string; hint: string }[] = [
  { value: "nursing", label: "Nursing", hint: "Hunger is part of the plan, not a problem" },
  { value: "pumping", label: "Pumping", hint: "Same fuel needs, plus wrists and shoulders" },
  { value: "combination", label: "Both breast and bottle", hint: "Meals stay generous" },
  { value: "formula", label: "Formula", hint: "Recovery still needs real meals" },
  { value: "weaning", label: "Weaning", hint: "Appetite may shift. Meals stay complete" },
];

export function Onboarding() {
  const { setProfile } = useStore();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [babyName, setBabyName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [delivery, setDelivery] = useState<Delivery>("vaginal");
  const [feeding, setFeeding] = useState<Feeding>("nursing");
  const [cleared, setCleared] = useState<boolean | null>(null);
  const [concerns, setConcerns] = useState<PainArea[]>([]);
  const [intention, setIntention] = useState("");
  const [unit, setUnit] = useState<"lb" | "kg">("lb");
  const [error, setError] = useState("");

  const steps = 6;

  function next() {
    setError("");
    if (step === 1) {
      if (!name.trim()) return setError("Add her name. Marigold speaks to one person.");
      const dateError = birthDateError(birthDate);
      if (dateError) return setError(dateError);
    }
    if (step === 3 && cleared === null) return setError("Say whether a clinician has cleared movement beyond daily life.");
    if (step === 5) {
      setProfile({
        name: name.trim(),
        babyName: babyName.trim(),
        birthDate,
        delivery,
        feeding,
        cleared: cleared === true,
        concerns,
        intention: intention.trim(),
        unit,
        partnerNote: DEFAULT_PARTNER_NOTE,
      });
      return;
    }
    setStep((value) => value + 1);
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col px-5 py-8 sm:py-14">
      <div className="mb-8 flex items-center gap-3">
        <Logo />
        <div>
          <p className="font-heading text-xl leading-none">Marigold</p>
          <p className="text-xs text-muted-foreground">
            Step {Math.min(step + 1, steps)} of {steps}
          </p>
        </div>
      </div>

      {step === 0 ? (
        <div className="flex flex-1 flex-col">
          <p className="text-sm uppercase tracking-[0.18em] text-clay">For one person</p>
          <h1 className="mt-3 font-heading text-4xl leading-tight text-balance sm:text-5xl">A quieter way through the weeks after birth.</h1>
          <p className="mt-5 text-base leading-7 text-muted-foreground">
            Marigold builds a short day for pain, food, and gentle strength. The plan comes from Qwen2.5, an open-weight model running on this computer. Pain, mood, feeding, and weight stay in this browser.
          </p>
          <ul className="mt-6 grid gap-3 text-sm leading-6">
            <li className="rounded-2xl bg-card px-4 py-3 ring-1 ring-foreground/10">Movement that waits for clearance, and gets smaller when something hurts.</li>
            <li className="rounded-2xl bg-card px-4 py-3 ring-1 ring-foreground/10">Meals that keep recovery fed. No calorie target, no “eat less.”</li>
            <li className="rounded-2xl bg-card px-4 py-3 ring-1 ring-foreground/10">A plain signal when a symptom needs a clinician, not another stretch.</li>
          </ul>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="grid gap-5">
          <div>
            <h1 className="font-heading text-3xl">Who is this for?</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">The name is how the daily note begins. The birth date sets the stage of recovery.</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="name">Her name</Label>
            <Input id="name" value={name} onChange={(event) => setName(event.target.value)} className="h-11 text-base" autoFocus />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="baby">Baby’s name, if you want it here</Label>
            <Input id="baby" value={babyName} onChange={(event) => setBabyName(event.target.value)} className="h-11 text-base" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="birth">Baby’s birth date</Label>
            <Input id="birth" type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} className="h-11 text-base" />
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="grid gap-5">
          <div>
            <h1 className="font-heading text-3xl">Birth and feeding</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">This changes which movements are even offered, and whether a snack is part of the day.</p>
          </div>
          <ChoicePills label="Birth" value={delivery} options={DELIVERIES} onChange={setDelivery} />
          <ChoicePills label="Feeding" value={feeding} options={FEEDINGS} onChange={setFeeding} />
        </div>
      ) : null}

      {step === 3 ? (
        <div className="grid gap-5">
          <div>
            <h1 className="font-heading text-3xl">Has a clinician cleared more than daily life?</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Until then, Marigold stays with breathing, posture, circulation, and short walks once the first days have passed. That is the whole plan, on purpose.
            </p>
          </div>
          <ChoicePills
            label="Clearance"
            value={cleared === null ? "" : cleared ? "yes" : "no"}
            options={[
              { value: "no", label: "Not yet", hint: "Or I have not been told I may do more" },
              { value: "yes", label: "Yes, cleared", hint: "A postpartum visit, midwife, or doctor said gentle movement is okay" },
            ]}
            onChange={(value) => setCleared(value === "yes")}
          />
        </div>
      ) : null}

      {step === 4 ? (
        <div className="grid gap-5">
          <div>
            <h1 className="font-heading text-3xl">Where does it hurt?</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Choose any that have been showing up. You can log the rest later. None is a fine answer.</p>
          </div>
          <div className="grid gap-2">
            {PAIN_AREAS.map((area) => {
              const on = concerns.includes(area.id);
              return (
                <button
                  key={area.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    setConcerns((current) => (current.includes(area.id) ? current.filter((item) => item !== area.id) : [...current, area.id]))
                  }
                  className={cn(
                    "rounded-xl border px-3 py-3 text-left",
                    on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card",
                  )}
                >
                  <span className="block text-sm font-medium">{area.label}</span>
                  <span className={cn("mt-0.5 block text-xs", on ? "text-primary-foreground/80" : "text-muted-foreground")}>{area.hint}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {step === 5 ? (
        <div className="grid gap-5">
          <div>
            <h1 className="font-heading text-3xl">What would feel like progress?</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              A walk to the corner. Lifting the baby without a wince. Clothes that are beside the point. Marigold will aim at that, not at a number on a scale.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="intention">In her words</Label>
            <Textarea
              id="intention"
              value={intention}
              onChange={(event) => setIntention(event.target.value)}
              className="min-h-28 text-base"
              placeholder="Walk the block without my back locking up."
            />
          </div>
          <div className="grid gap-2">
            <Label>Weight unit, if she wants a quiet record later</Label>
            <div className="flex gap-2">
              {(["lb", "kg"] as const).map((option) => (
                <Button key={option} type="button" variant={unit === option ? "default" : "outline"} className="h-11 px-5" onClick={() => setUnit(option)}>
                  {option}
                </Button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

      <div className="mt-8 flex items-center justify-between gap-3">
        <Button type="button" variant="ghost" className="h-11 px-4" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0}>
          Back
        </Button>
        <Button type="button" className="h-11 rounded-full px-6 text-base" onClick={next}>
          {step === 0 ? "Begin" : step === 5 ? "Open Marigold" : "Continue"}
        </Button>
      </div>
    </div>
  );
}
