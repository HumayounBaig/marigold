"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Footprints, HandHeart, Moon, NotebookPen, Settings, Soup, Sun } from "lucide-react";
import { Logo } from "@/components/bits";
import { useStore } from "@/components/store";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

const LINKS = [
  { href: "/", label: "Today", icon: Sun },
  { href: "/move", label: "Move", icon: Footprints },
  { href: "/nourish", label: "Nourish", icon: Soup },
  { href: "/soothe", label: "Soothe", icon: HandHeart },
  { href: "/progress", label: "Progress", icon: NotebookPen },
];

function NavLink({ href, label, icon: Icon, compact = false }: (typeof LINKS)[number] & { compact?: boolean }) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2 rounded-full px-3 py-2 text-sm transition-colors",
        compact && "flex-col gap-1 px-1 py-1 text-[11px]",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="size-4" />
      {label}
    </Link>
  );
}

export function Splash() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-4 px-6">
      <Logo className="size-14" />
      <p className="font-heading text-2xl">Marigold</p>
      <p className="text-sm text-muted-foreground">Opening your notes on this computer.</p>
    </div>
  );
}

function HomeRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/");
  }, [router]);
  return <Splash />;
}

export function AppGate({ children }: { children: React.ReactNode }) {
  const { ready, store } = useStore();
  const pathname = usePathname();
  if (!ready) return <Splash />;
  if (!store.profile) {
    if (pathname !== "/") return <HomeRedirect />;
    return <div className="flex min-h-full flex-1 flex-col">{children}</div>;
  }
  return <Shell>{children}</Shell>;
}

export function Shell({ children }: { children: React.ReactNode }) {
  const { store, setNight } = useStore();
  const name = store.profile?.name;
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo />
            <span>
              <span className="block font-heading text-lg leading-none">Marigold</span>
              <span className="text-xs text-muted-foreground">{name ? `For ${name}` : "On this computer"}</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {LINKS.map((link) => (
              <NavLink key={link.href} {...link} />
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={store.night ? "Use the day theme" : "Use the night theme"}
              onClick={() => setNight(!store.night)}
            >
              {store.night ? <Sun /> : <Moon />}
            </Button>
            <Link href="/settings" aria-label="Settings" className={buttonVariants({ variant: "ghost", size: "icon" })}>
              <Settings />
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-28 md:pb-12">{children}</main>
      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-background/95 px-2 py-2 backdrop-blur md:hidden"
        aria-label="Primary"
      >
        {LINKS.map((link) => (
          <NavLink key={link.href} {...link} compact />
        ))}
      </nav>
    </div>
  );
}
