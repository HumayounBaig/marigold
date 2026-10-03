"use client";

import { useEffect, useState } from "react";
import { PAIN_AREAS } from "@/lib/catalog";
import { birthDateError } from "@/lib/recovery";
import type { Delivery, Feeding, PainArea, Profile } from "@/lib/types";
import { useStore } from "@/components/store";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "cn";

type ModelStatus = { ok: boolean; model: string; detail: string };

export function Settings() {
  const { store, updateProfile, reset } = useStore();
  const profile = store.profile;
  const [draft, setDraft] = useState<Profile | null>(profile);
  const [message, setMessage] = useState("");
  const [model, setModel] = useState<ModelStatus | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/model")
      .then((response) => response.json())
      .then((payload: ModelStatus) => {
        if (!cancelled) setModel(payload);
      })
      .catch(() => {
        if (!cancelled) setModel({ ok: false, model: "qwen2.5:3b", detail: "Could not reach the local model status." });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!profile || !draft) return null;

  function patch(partial: Partial<Profile>) {
    setDraft((current) => (current ? { ...current, ...partial } : current));
  }

  function save() {
    if (!draft) return;
    const dateError = birthDateError(draft.birthDate);
    if (!draft.name.trim()) return setMessage("Name is required.");
    if (dateError) return setMessage(dateError);
    updateProfile({ ...draft, name: draft.name.trim() });
    setMessage("Saved on this computer.");
  }

  function download() {
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "marigold-notes.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid max-w-2xl gap-8">
      <div>
        <h1 className="font-heading text-4xl">Settings</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          Marigold is a companion, not a clinician. It does not diagnose, treat, or replace postpartum care, pelvic floor physical therapy, or emergency services.
        </p>
      </div>

      <section className="grid gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
        <h2 className="font-heading text-2xl">Why this runs open</h2>
        <p className="text-sm leading-6">
          A closed wellness app would send sleep, pain, mood, bleeding, feeding, and weight to a server you do not control, then answer with a model you cannot swap. Marigold uses Qwen2.5 3B Instruct, Apache-2.0 weights, through Ollama on this machine. After the model is downloaded, a day plan does not need the internet. You can change the catalog and the prompt in the code, or point <span className="font-medium">OLLAMA_MODEL</span> at another open model.
        </p>
        <p className={cn("text-sm leading-6", model?.ok ? "text-primary" : "text-clay")}>{model ? model.detail : "Checking the local model…"}</p>
      </section>

      <section className="grid gap-4">
        <h2 className="font-heading text-2xl">Her details</h2>
        <div className="grid gap-2">
          <Label htmlFor="s-name">Name</Label>
          <Input id="s-name" value={draft.name} onChange={(event) => patch({ name: event.target.value })} className="h-11 text-base" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="s-baby">Baby’s name</Label>
          <Input id="s-baby" value={draft.babyName} onChange={(event) => patch({ babyName: event.target.value })} className="h-11 text-base" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="s-birth">Birth date</Label>
          <Input id="s-birth" type="date" value={draft.birthDate} onChange={(event) => patch({ birthDate: event.target.value })} className="h-11 text-base" />
        </div>
        <div className="grid gap-2">
          <Label>Birth</Label>
          <div className="flex flex-wrap gap-2">
            {(["vaginal", "assisted", "cesarean"] as Delivery[]).map((option) => (
              <Button key={option} type="button" variant={draft.delivery === option ? "default" : "outline"} className="h-10" onClick={() => patch({ delivery: option })}>
                {option}
              </Button>
            ))}
          </div>
        </div>
        <div className="grid gap-2">
          <Label>Feeding</Label>
          <div className="flex flex-wrap gap-2">
            {(["nursing", "pumping", "combination", "formula", "weaning"] as Feeding[]).map((option) => (
              <Button key={option} type="button" variant={draft.feeding === option ? "default" : "outline"} className="h-10" onClick={() => patch({ feeding: option })}>
                {option}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant={draft.cleared ? "outline" : "default"} className="h-10" onClick={() => patch({ cleared: false })}>
            Not cleared yet
          </Button>
          <Button type="button" variant={draft.cleared ? "default" : "outline"} className="h-10" onClick={() => patch({ cleared: true })}>
            Cleared
          </Button>
        </div>
        <div className="grid gap-2">
          <Label>Places that hurt</Label>
          <div className="flex flex-wrap gap-2">
            {PAIN_AREAS.map((area) => {
              const on = draft.concerns.includes(area.id);
              return (
                <Button
                  key={area.id}
                  type="button"
                  variant={on ? "default" : "outline"}
                  className="h-10"
                  onClick={() => {
                    const concerns: PainArea[] = on ? draft.concerns.filter((item) => item !== area.id) : [...draft.concerns, area.id];
                    patch({ concerns });
                  }}
                >
                  {area.label}
                </Button>
              );
            })}
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="s-intent">What progress feels like</Label>
          <Textarea id="s-intent" value={draft.intention} onChange={(event) => patch({ intention: event.target.value })} className="min-h-24 text-base" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="s-note">A note from the person who set this up</Label>
          <Textarea id="s-note" value={draft.partnerNote} onChange={(event) => patch({ partnerNote: event.target.value })} className="min-h-28 text-base" />
        </div>
        <div className="flex gap-2">
          {(["lb", "kg"] as const).map((option) => (
            <Button key={option} type="button" variant={draft.unit === option ? "default" : "outline"} className="h-10" onClick={() => patch({ unit: option })}>
              {option}
            </Button>
          ))}
        </div>
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        <Button type="button" className="h-11 w-fit rounded-full px-5" onClick={save}>
          Save details
        </Button>
      </section>

      {profile.partnerNote ? (
        <blockquote className="border-l-2 border-marigold pl-4 text-sm leading-6 text-muted-foreground">{profile.partnerNote}</blockquote>
      ) : null}

      <section className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" className="h-11 rounded-full px-5" onClick={download}>
          Download her notes
        </Button>
        <Button type="button" variant="destructive" className="h-11 rounded-full px-5" onClick={() => setOpen(true)}>
          Delete everything on this computer
        </Button>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Marigold’s notes?</DialogTitle>
            <DialogDescription>Check-ins, plans, weight, and her name will be removed from this browser. This does not touch any server, because there isn’t one.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Keep them
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                reset();
                setOpen(false);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
