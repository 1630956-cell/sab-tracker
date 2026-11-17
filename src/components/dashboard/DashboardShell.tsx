import { Link, Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, ExternalLink, Search } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BRAND } from "@/lib/brand";
import { demoProfile } from "@/lib/demo-profile";
import { ProfileDock } from "./ProfileDock";
import { MobileDock } from "./MobileDock";
import { QuickJump } from "./QuickJump";

const notifications = [
  { title: `Welcome to ${BRAND.name}`, text: "Your profile is live. Start customizing it.", time: "now" },
  { title: "New badge unlocked", text: "You earned the Early supporter badge.", time: "2h" },
  { title: "Profile milestone", text: "Your page passed 10,000 views.", time: "1d" },
];

export function DashboardShell() {
  const [jumpOpen, setJumpOpen] = useState(false);
  return (
    <div className="flex min-h-screen">
      <ProfileDock onSearch={() => setJumpOpen(true)} />
      <QuickJump open={jumpOpen} onOpenChange={setJumpOpen} />
      <div className="min-w-0 flex-1 pb-24 lg:pb-0">
        <header className="sticky top-0 z-30 bg-background/70 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-3 px-5 lg:px-8">
            <div className="flex items-center gap-3">
              <Link to="/" className="lg:hidden" aria-label={`${BRAND.name} home`}><LogoMark /></Link>
              <span className="text-sm font-medium text-muted-foreground">{BRAND.titles.dashboard}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" aria-label="Quick jump" className="lg:hidden" onClick={() => setJumpOpen(true)}>
                <Search />
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
                    <Bell />
                    <span className="absolute right-2 top-2 size-1.5 rounded-full bg-primary-glow" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0">
                  <p className="border-b border-border px-4 py-3 text-sm font-semibold">{BRAND.name} notifications</p>
                  <ul className="divide-y divide-border">
                    {notifications.map((n) => (
                      <li key={n.title} className="px-4 py-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{n.title}</p>
                          <span className="text-xs text-muted-foreground">{n.time}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{n.text}</p>
                      </li>
                    ))}
                  </ul>
                </PopoverContent>
              </Popover>
              <Button asChild variant="glass" size="sm">
                <Link to="/$username" params={{ username: demoProfile.username }}>
                  <ExternalLink /> <span className="hidden sm:inline">View page</span>
                </Link>
              </Button>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-5 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
      <MobileDock />
    </div>
  );
}

export function PageHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">{title}</h1>
      {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
