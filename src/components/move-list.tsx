"use client";

import Link from "next/link";
import { MOVEMENTS } from "@/lib/catalog";
import { movementBlock, PHASE_LABEL, recoveryPhase, stageLabel, weeksSince } from "@/lib/recovery";
import { blankCheckIn, todayKey } from "@/lib/storage";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/components/store";

export function MoveList() {
  const { store } = useStore();
  const profile = store.profile;
  if (!profile) return null;
  const date = todayKey();
  const checkIn = store.checkIns.find((item) => item.date === date) ?? {
    ...blankCheckIn(date, []),
    energy: 3 as const,
    sleepHours: 7,
    minutes: 30 as const,
  };
  const input = {
    profile,
    checkIn,
    recentMovementIds: store.sessions.slice(-4).map((item) => item.movementId),
    worseMovementIds: store.sessions.filter((item) => item.reaction === "worse").map((item) => item.movementId),
  };
  const ready = MOVEMENTS.filter((movement) => movementBlock(movement, input) === null);
  const later = MOVEMENTS.filter((movement) => movementBlock(movement, input) !== null);
  const phase = recoveryPhase(weeksSince(profile.birthDate), profile.cleared);
  const loggedToday = store.checkIns.some((item) => item.date === date);

  return (
    <div className="grid gap-8">
      <div className="max-w-2xl">
        <p className="text-sm text-muted-foreground">{stageLabel(profile.birthDate)}</p>
        <h1 className="mt-1 font-heading text-4xl">Move</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          {PHASE_LABEL[phase]}. Effort should stay near a 3 out of 10. Stop for leaking, heaviness, a midline that domes, dizziness, or bleeding that picks up.
          {loggedToday ? " This list matches today’s check-in." : " Log today and the list will get stricter about what hurts."}
        </p>
      </div>
      <section className="grid gap-3">
        <h2 className="font-heading text-2xl">Fits today</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {ready.map((movement) => (
            <Link key={movement.id} href={`/move/${movement.id}`} className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10 transition-colors hover:bg-muted">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-heading text-xl">{movement.title}</h3>
                <Badge variant="secondary">{movement.minutes} min</Badge>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{movement.summary}</p>
            </Link>
          ))}
        </div>
      </section>
      {later.length ? (
        <section className="grid gap-3">
          <h2 className="font-heading text-2xl">Later</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {later.map((movement) => (
              <Link key={movement.id} href={`/move/${movement.id}`} className="rounded-2xl bg-muted/60 p-4 ring-1 ring-foreground/5">
                <h3 className="font-heading text-xl text-muted-foreground">{movement.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{movementBlock(movement, input)}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
