"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { emptyStore, STORE_KEY } from "@/lib/storage";
import type { CheckIn, DayPlan, Profile, SessionLog, Store, WeightEntry, WinId } from "@/lib/types";

type StoreApi = {
  ready: boolean;
  store: Store;
  setProfile: (profile: Profile) => void;
  updateProfile: (profile: Profile) => void;
  saveCheckIn: (checkIn: CheckIn) => void;
  savePlan: (plan: DayPlan) => void;
  addWeight: (entry: WeightEntry) => void;
  removeWeight: (date: string) => void;
  logSession: (entry: SessionLog) => void;
  toggleWin: (date: string, win: WinId) => void;
  setNight: (night: boolean) => void;
  setEaseDown: (easeDown: boolean) => void;
  reset: () => void;
};

const StoreContext = createContext<StoreApi | null>(null);

function readStore(): Store {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as Partial<Store>;
    return {
      ...emptyStore(),
      ...parsed,
      profile: parsed.profile ?? null,
      checkIns: parsed.checkIns ?? [],
      plans: parsed.plans ?? {},
      weights: parsed.weights ?? [],
      sessions: parsed.sessions ?? [],
      wins: parsed.wins ?? {},
      night: Boolean(parsed.night),
      easeDown: parsed.easeDown !== false,
    };
  } catch {
    return emptyStore();
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<Store>(emptyStore);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loaded = readStore();
    document.documentElement.classList.toggle("dark", loaded.night);
    // Notes live only in this browser, so they cannot be read during server render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStore(loaded);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
    document.documentElement.classList.toggle("dark", store.night);
  }, [store, ready]);

  const api = useMemo<StoreApi>(
    () => ({
      ready,
      store,
      setProfile: (profile) => setStore((current) => ({ ...current, profile })),
      updateProfile: (profile) => setStore((current) => ({ ...current, profile })),
      saveCheckIn: (checkIn) =>
        setStore((current) => ({
          ...current,
          checkIns: [...current.checkIns.filter((item) => item.date !== checkIn.date), checkIn].sort((a, b) =>
            a.date.localeCompare(b.date),
          ),
        })),
      savePlan: (plan) => setStore((current) => ({ ...current, plans: { ...current.plans, [plan.date]: plan } })),
      addWeight: (entry) =>
        setStore((current) => ({
          ...current,
          weights: [...current.weights.filter((item) => item.date !== entry.date), entry].sort((a, b) =>
            a.date.localeCompare(b.date),
          ),
        })),
      removeWeight: (date) =>
        setStore((current) => ({ ...current, weights: current.weights.filter((item) => item.date !== date) })),
      logSession: (entry) =>
        setStore((current) => ({
          ...current,
          sessions: [
            ...current.sessions.filter((item) => !(item.date === entry.date && item.movementId === entry.movementId)),
            entry,
          ],
        })),
      toggleWin: (date, win) =>
        setStore((current) => {
          const existing = current.wins[date] ?? [];
          const next = existing.includes(win) ? existing.filter((item) => item !== win) : [...existing, win];
          return { ...current, wins: { ...current.wins, [date]: next } };
        }),
      setNight: (night) => setStore((current) => ({ ...current, night })),
      setEaseDown: (easeDown) => setStore((current) => ({ ...current, easeDown })),
      reset: () => setStore(emptyStore()),
    }),
    [ready, store],
  );

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("Marigold store is missing.");
  return value;
}
