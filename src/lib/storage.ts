import type { CheckIn, PainArea, Store } from "./types";

export const STORE_KEY = "marigold.v1";

export function emptyStore(): Store {
  return {
    profile: null,
    checkIns: [],
    plans: {},
    weights: [],
    sessions: [],
    wins: {},
    night: false,
    easeDown: true,
  };
}

export function todayKey(date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function blankCheckIn(date: string, concerns: PainArea[]): CheckIn {
  const pain: CheckIn["pain"] = {};
  for (const area of concerns) pain[area] = 0;
  return {
    id: crypto.randomUUID(),
    date,
    sleepHours: 5,
    energy: 3,
    mood: 3,
    pain,
    bleeding: "none",
    pelvicHeaviness: false,
    fever: false,
    chestOrBreath: false,
    severeHeadache: false,
    legSwelling: false,
    incisionWorry: false,
    scaryThoughts: false,
    minutes: 10,
    note: "",
    createdAt: new Date().toISOString(),
  };
}
