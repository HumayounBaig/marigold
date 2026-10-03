"use client";

import { Onboarding } from "@/components/onboarding";
import { Today } from "@/components/today";
import { useStore } from "@/components/store";

export default function HomePage() {
  const { ready, store } = useStore();
  if (!ready) return null;
  if (!store.profile) return <Onboarding />;
  return <Today />;
}
