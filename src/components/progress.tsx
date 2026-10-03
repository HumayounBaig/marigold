"use client";

import { useState } from "react";
import { movementById } from "@/lib/catalog";
import { insights, PHASE_LABEL, recoveryPhase, stageLabel, weeksSince, weightInsight } from "@/lib/recovery";
import { todayKey } from "@/lib/storage";
import type { WinId } from "@/lib/types";
import { useStore } from "@/components/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const WINS: { id: WinId; label: string }[] = [
  { id: "outside", label: "Got outside" },
  { id: "meal", label: "Ate a real meal" },
  { id: "help", label: "Asked for help" },
  { id: "rest", label: "Rested while someone else held the baby, or while the baby slept" },
  { id: "lift", label: "Lifted the baby without a wince" },
];

export function Progress() {
  const { store, addWeight, removeWeight, toggleWin, setEaseDown } = useStore();
  const profile = store.profile;
  const [value, setValue] = useState("");
  const [date, setDate] = useState(todayKey());
  if (!profile) return null;

  const phase = recoveryPhase(weeksSince(profile.birthDate), profile.cleared);
  const found = insights(store.checkIns);
  const recent = store.checkIns.slice(-14);
  const pains = recent.map((item) => {
    const levels = Object.values(item.pain).filter((level): level is number => typeof level === "number");
    return { date: item.date, pain: levels.length ? Math.max(...levels) : 0 };
  });
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  const weekKey = todayKey(weekAgo);
  const sessions = store.sessions.filter((item) => item.date >= weekKey);
  const minutes = sessions.reduce((sum, item) => {
    if (item.reaction === "worse") return sum;
    return sum + (movementById(item.movementId)?.minutes ?? 0);
  }, 0);
  const todayWins = store.wins[todayKey()] ?? [];
  const note = weightInsight(store.weights, profile.unit, profile.feeding, store.easeDown);

  return (
    <div className="grid gap-8">
      <div className="max-w-2xl">
        <p className="text-sm text-muted-foreground">{stageLabel(profile.birthDate)}</p>
        <h1 className="mt-1 font-heading text-4xl">Progress</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          {PHASE_LABEL[phase]}. Strength, pain, and an ordinary day of caring for a baby are the record. Weight is optional, and it is not allowed to be the loudest thing here.
        </p>
      </div>

      <section className="grid gap-3 md:grid-cols-3">
        <article className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">This week</p>
          <p className="mt-2 font-heading text-3xl">{sessions.length}</p>
          <p className="text-sm text-muted-foreground">{sessions.length === 1 ? "session" : "sessions"}. Three short ones is a full week.</p>
        </article>
        <article className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Check-ins</p>
          <p className="mt-2 font-heading text-3xl">{store.checkIns.length}</p>
          <p className="text-sm text-muted-foreground">Days you told the truth about how it felt.</p>
        </article>
        <article className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Rough minutes</p>
          <p className="mt-2 font-heading text-3xl">{minutes}</p>
          <p className="text-sm text-muted-foreground">Counted only when a session did not feel worse.</p>
        </article>
      </section>

      <section className="grid gap-3">
        <h2 className="font-heading text-2xl">What today already held</h2>
        <div className="flex flex-wrap gap-2">
          {WINS.map((win) => {
            const on = todayWins.includes(win.id);
            return (
              <Button key={win.id} type="button" variant={on ? "default" : "outline"} className="h-auto min-h-11 rounded-full px-4 py-2 text-left whitespace-normal" onClick={() => toggleWin(todayKey(), win.id)}>
                {win.label}
              </Button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-3">
        <h2 className="font-heading text-2xl">Pain</h2>
        {pains.length < 2 ? (
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">After a few check-ins, this shows whether short sleep and pain are traveling together. The pattern stays on this machine.</p>
        ) : (
          <PainChart points={pains} />
        )}
        {found.length ? (
          <div className="grid gap-2">
            {found.map((item) => (
              <p key={item.id} className="max-w-2xl rounded-2xl bg-card px-4 py-3 text-sm leading-6 ring-1 ring-foreground/10">
                {item.text}
              </p>
            ))}
          </div>
        ) : null}
      </section>

      <section className="grid gap-4">
        <div className="max-w-2xl">
          <h2 className="font-heading text-2xl">A quiet record of weight</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Bodies after birth change in uneven pieces: fluid first, then very slowly. If the trend eases down, a pound a week is plenty while you are feeding a baby with your body, and some weeks will go up.
          </p>
        </div>
        <button
          type="button"
          aria-pressed={store.easeDown}
          onClick={() => setEaseDown(!store.easeDown)}
          className={store.easeDown ? "w-fit rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground" : "w-fit rounded-full bg-muted px-4 py-2 text-sm"}
        >
          {store.easeDown ? "Watching for a slow downward trend" : "Not watching a trend"}
        </button>
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const parsed = Number(value);
            if (!date || !Number.isFinite(parsed) || parsed <= 0) return;
            addWeight({ date, value: parsed });
            setValue("");
          }}
        >
          <div className="grid gap-1">
            <Label htmlFor="wdate">Date</Label>
            <Input id="wdate" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="h-11 text-base" />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="wvalue">{profile.unit}</Label>
            <Input id="wvalue" inputMode="decimal" value={value} onChange={(event) => setValue(event.target.value)} className="h-11 w-28 text-base" placeholder={profile.unit === "lb" ? "168" : "76"} />
          </div>
          <Button type="submit" className="h-11 rounded-full px-5">
            Save
          </Button>
        </form>
        {store.weights.length >= 2 ? <WeightChart entries={store.weights} unit={profile.unit} /> : null}
        {note ? <p className="max-w-2xl text-sm leading-6">{note}</p> : store.weights.length === 1 ? <p className="text-sm text-muted-foreground">One number is a starting mark, not a verdict.</p> : null}
        {store.weights.length ? (
          <ul className="grid max-w-md gap-2">
            {[...store.weights].reverse().map((entry) => (
              <li key={entry.date} className="flex items-center justify-between rounded-xl bg-card px-3 py-2 text-sm ring-1 ring-foreground/10">
                <span>
                  {entry.date} · {entry.value} {profile.unit}
                </span>
                <button type="button" className="text-xs text-muted-foreground underline-offset-2 hover:underline" onClick={() => removeWeight(entry.date)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}

function PainChart({ points }: { points: { date: string; pain: number }[] }) {
  const width = 560;
  const height = 160;
  const pad = 16;
  const max = 10;
  const coords = points.map((point, index) => {
    const x = pad + (index / Math.max(1, points.length - 1)) * (width - pad * 2);
    const y = height - pad - (point.pain / max) * (height - pad * 2);
    return `${x},${y}`;
  });
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-2xl rounded-2xl bg-card ring-1 ring-foreground/10" role="img" aria-label="Strongest pain on recent check-ins">
      <polyline fill="none" stroke="currentColor" strokeWidth="3" points={coords.join(" ")} className="text-clay" />
      {points.map((point, index) => {
        const [x, y] = coords[index].split(",");
        return <circle key={point.date} cx={x} cy={y} r="4" className="fill-primary" />;
      })}
    </svg>
  );
}

function WeightChart({ entries, unit }: { entries: { date: string; value: number }[]; unit: string }) {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const width = 560;
  const height = 180;
  const pad = 18;
  const values = sorted.map((item) => item.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);
  const coords = sorted.map((point, index) => {
    const x = pad + (index / Math.max(1, sorted.length - 1)) * (width - pad * 2);
    const y = height - pad - ((point.value - min) / span) * (height - pad * 2);
    return `${x},${y}`;
  });
  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-2xl rounded-2xl bg-card ring-1 ring-foreground/10" role="img" aria-label={`Weight in ${unit}`}>
        <polyline fill="none" stroke="currentColor" strokeWidth="3" points={coords.join(" ")} className="text-primary" />
      </svg>
      <p className="mt-2 text-xs text-muted-foreground">
        {sorted[0].value} {unit} to {sorted[sorted.length - 1].value} {unit}
      </p>
    </div>
  );
}
