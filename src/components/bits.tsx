"use client";

import { areaLabel } from "@/lib/catalog";
import type { RedFlag } from "@/lib/types";
import { cn } from "cn";

export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-9", className)} aria-hidden>
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <g className="fill-[#f6e2b0]">
        <ellipse cx="16" cy="8" rx="2" ry="4" />
        <ellipse cx="16" cy="24" rx="2" ry="4" />
        <ellipse cx="8" cy="16" rx="4" ry="2" />
        <ellipse cx="24" cy="16" rx="4" ry="2" />
      </g>
      <circle cx="16" cy="16" r="3" className="fill-marigold" />
    </svg>
  );
}

export function NumberScale({
  value,
  max = 10,
  onChange,
  label,
  columns,
}: {
  value: number;
  max?: number;
  onChange: (value: number) => void;
  label: string;
  columns?: number;
}) {
  return (
    <div className={columns ? "grid gap-1" : "flex flex-wrap gap-1"} style={columns ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : undefined} role="group" aria-label={label}>
      {Array.from({ length: max + 1 }, (_, number) => (
        <button
          key={number}
          type="button"
          aria-pressed={value === number}
          onClick={() => onChange(number)}
          className={cn(
            "h-9 min-w-8 rounded-lg px-2 text-sm font-medium transition-colors",
            value === number ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-secondary",
          )}
        >
          {number}
        </button>
      ))}
    </div>
  );
}

export function ChoicePills<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string; hint?: string }[];
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div className="grid gap-2" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-xl border px-3 py-3 text-left transition-colors",
            value === option.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted",
          )}
        >
          <span className="block text-sm font-medium">{option.label}</span>
          {option.hint ? (
            <span className={cn("mt-0.5 block text-xs", value === option.value ? "text-primary-foreground/80" : "text-muted-foreground")}>
              {option.hint}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

export function FlagList({ flags }: { flags: RedFlag[] }) {
  if (!flags.length) return null;
  return (
    <div className="grid gap-3">
      {flags.map((flag) => (
        <article
          key={flag.id}
          className={cn(
            "rounded-2xl border px-4 py-3",
            flag.level === "soon" ? "border-marigold/50 bg-marigold/15" : "border-destructive/40 bg-destructive/10",
          )}
        >
          <h3 className="font-heading text-base text-foreground">{flag.title}</h3>
          <p className="mt-1 text-sm leading-6 text-foreground/90">{flag.detail}</p>
        </article>
      ))}
    </div>
  );
}

export function AreaName({ area }: { area: Parameters<typeof areaLabel>[0] }) {
  return <>{areaLabel(area)}</>;
}
