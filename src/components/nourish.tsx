"use client";

import { useState } from "react";
import { MEALS, mealById } from "@/lib/catalog";
import { feedsWithBody } from "@/lib/recovery";
import { todayKey } from "@/lib/storage";
import type { MealSlot } from "@/lib/types";
import { useStore } from "@/components/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const SLOTS: { id: MealSlot; label: string }[] = [
  { id: "breakfast", label: "Breakfast" },
  { id: "main", label: "Plates" },
  { id: "snack", label: "Within reach" },
];

export function Nourish() {
  const { store } = useStore();
  const profile = store.profile;
  const [copied, setCopied] = useState(false);
  if (!profile) return null;
  const plan = store.plans[todayKey()];
  const chosen = new Set(plan?.mealIds ?? []);
  const fuel = feedsWithBody(profile.feeding);

  async function copyList() {
    const lines = MEALS.map((meal) => `${meal.title}: ${meal.parts.join(", ")}`);
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="grid gap-8">
      <div className="max-w-2xl">
        <h1 className="font-heading text-4xl">Nourish</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          {fuel
            ? "You are feeding a baby with your body. Hunger is a reason to eat, including at night. Marigold will not give you a calorie target."
            : "Recovery still wants complete meals. Weight, if it eases, comes from walks, sleep, and enough food — not from a smaller plate."}
        </p>
        <Button type="button" variant="outline" className="mt-4 h-11 rounded-full px-5" onClick={copyList}>
          {copied ? "Copied the pantry list" : "Copy a simple shopping list"}
        </Button>
      </div>

      {plan ? (
        <section className="grid gap-3">
          <h2 className="font-heading text-2xl">On today’s plan</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {plan.mealIds.map((id) => {
              const meal = mealById(id);
              if (!meal) return null;
              return <MealCard key={id} mealId={id} highlighted />;
            })}
          </div>
          {plan.restNote ? <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{plan.restNote}</p> : null}
        </section>
      ) : null}

      {SLOTS.map((slot) => (
        <section key={slot.id} className="grid gap-3">
          <h2 className="font-heading text-2xl">{slot.label}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {MEALS.filter((meal) => meal.slot === slot.id).map((meal) => (
              <MealCard key={meal.id} mealId={meal.id} highlighted={chosen.has(meal.id)} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function MealCard({ mealId, highlighted }: { mealId: string; highlighted: boolean }) {
  const meal = mealById(mealId);
  if (!meal) return null;
  return (
    <article className={highlighted ? "rounded-2xl bg-primary px-4 py-4 text-primary-foreground" : "rounded-2xl bg-card px-4 py-4 ring-1 ring-foreground/10"}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-heading text-xl">{meal.title}</h3>
        <Badge variant={highlighted ? "secondary" : "outline"}>{meal.minutes} min</Badge>
      </div>
      <p className={highlighted ? "mt-2 text-sm leading-6 text-primary-foreground/85" : "mt-2 text-sm leading-6 text-muted-foreground"}>{meal.why}</p>
      <ul className="mt-3 text-sm leading-6">
        {meal.parts.map((part) => (
          <li key={part}>{part}</li>
        ))}
      </ul>
    </article>
  );
}
