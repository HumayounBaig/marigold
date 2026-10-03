"use client";

import { PAIN_AREAS, SOOTHES, areaLabel } from "@/lib/catalog";
import { todayKey } from "@/lib/storage";
import { useStore } from "@/components/store";
import { Badge } from "@/components/ui/badge";

export function Soothe() {
  const { store } = useStore();
  const profile = store.profile;
  if (!profile) return null;
  const plan = store.plans[todayKey()];
  const chosen = new Set(plan?.sootheIds ?? []);
  const groups = [
    ...PAIN_AREAS.map((area) => ({ id: area.id, label: area.label, hint: area.hint })),
    { id: "general" as const, label: "The day itself", hint: "Rest and food, which do as much as any stretch" },
  ];

  return (
    <div className="grid gap-8">
      <div className="max-w-2xl">
        <h1 className="font-heading text-4xl">Soothe</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          These are comfort measures, not treatment. Sharp, sudden, or one-sided pain, fever, heavy bleeding, chest pain, or a severe headache belong to a clinician today.
        </p>
      </div>
      {groups.map((group) => {
        const items = SOOTHES.filter((item) => item.area === group.id);
        if (!items.length) return null;
        return (
          <section key={group.id} className="grid gap-3">
            <div>
              <h2 className="font-heading text-2xl">{group.label}</h2>
              <p className="text-sm text-muted-foreground">{group.hint}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {items.map((item) => {
                const on = chosen.has(item.id);
                return (
                  <article key={item.id} id={item.id} className={on ? "rounded-2xl bg-primary px-4 py-4 text-primary-foreground" : "rounded-2xl bg-card px-4 py-4 ring-1 ring-foreground/10"}>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-heading text-xl">{item.title}</h3>
                      {on ? <Badge variant="secondary">Today</Badge> : <Badge variant="outline">{areaLabel(item.area)}</Badge>}
                    </div>
                    <p className={on ? "mt-2 text-sm leading-6 text-primary-foreground/85" : "mt-2 text-sm leading-6 text-muted-foreground"}>{item.why}</p>
                    <ol className="mt-3 grid gap-2 text-sm leading-6">
                      {item.steps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
