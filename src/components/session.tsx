"use client";

import Link from "next/link";
import { useState } from "react";
import { movementById } from "@/lib/catalog";
import { movementBlock } from "@/lib/recovery";
import { blankCheckIn, todayKey } from "@/lib/storage";
import type { SessionReaction } from "@/lib/types";
import { useStore } from "@/components/store";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

export function SessionView({ id }: { id: string }) {
  const { store, logSession } = useStore();
  const profile = store.profile;
  const movement = movementById(id);
  const [step, setStep] = useState(0);
  const [reaction, setReaction] = useState<SessionReaction | null>(null);

  if (!profile || !movement) {
    return (
      <div className="max-w-xl">
        <h1 className="font-heading text-3xl">That session is not in the catalog.</h1>
        <Link href="/move" className={cn(buttonVariants({ variant: "outline" }), "mt-4 inline-flex h-11")}>
          Back to movement
        </Link>
      </div>
    );
  }

  const date = todayKey();
  const checkIn = store.checkIns.find((item) => item.date === date) ?? {
    ...blankCheckIn(date, []),
    energy: 3 as const,
    sleepHours: 7,
    minutes: 30 as const,
  };
  const reason = movementBlock(movement, {
    profile,
    checkIn,
    worseMovementIds: store.sessions.filter((item) => item.reaction === "worse").map((item) => item.movementId),
  });
  const done = step >= movement.steps.length;

  function finish(next: SessionReaction) {
    setReaction(next);
    logSession({ date, movementId: movement!.id, reaction: next });
  }

  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <div>
        <Link href="/move" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
          All movement
        </Link>
        <h1 className="mt-2 font-heading text-4xl">{movement.title}</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {movement.minutes} minutes. Keep the effort near a 3 out of 10. {movement.summary}
        </p>
      </div>

      {reason ? (
        <div className="rounded-2xl border border-marigold/50 bg-marigold/15 px-4 py-3 text-sm leading-6">{reason} You can read the steps. They are not today’s prescription.</div>
      ) : null}

      <ol className="grid gap-3">
        {movement.steps.map((text, index) => (
          <li
            key={text}
            className={cn(
              "rounded-2xl px-4 py-4 ring-1 ring-foreground/10",
              !reason && index === step && !done ? "bg-primary text-primary-foreground" : "bg-card",
            )}
          >
            <span className="text-xs uppercase tracking-[0.14em] opacity-70">Step {index + 1}</span>
            <p className="mt-1 text-base leading-7">{text}</p>
          </li>
        ))}
      </ol>

      <div className="rounded-2xl bg-clay/10 px-4 py-3 text-sm leading-6">
        <p className="font-medium">Stop if</p>
        <ul className="mt-1 list-disc pl-5">
          {movement.stopIf.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      {reason ? null : !done ? (
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="h-11" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0}>
            Previous
          </Button>
          <Button type="button" className="h-11 rounded-full px-5" onClick={() => setStep((value) => value + 1)}>
            {step === movement.steps.length - 1 ? "Finish" : "Next step"}
          </Button>
        </div>
      ) : reaction ? (
        <div className="rounded-2xl bg-card px-4 py-4 ring-1 ring-foreground/10">
          <p className="font-heading text-2xl">{reaction === "worse" ? "Then this one steps aside." : "That counts."}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {reaction === "worse"
              ? "Marigold will leave it out of the next plans. Tell your clinician if the worse feeling lingers."
              : "Lie down for a few minutes if you can. The session is stored only on this computer."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          <p className="font-heading text-2xl">How did that feel?</p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["better", "Better"],
                ["same", "About the same"],
                ["worse", "Worse"],
              ] as const
            ).map(([value, label]) => (
              <Button key={value} type="button" variant={value === "worse" ? "outline" : "default"} className="h-11 rounded-full px-4" onClick={() => finish(value)}>
                {label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
