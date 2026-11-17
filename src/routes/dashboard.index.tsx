import { createFileRoute, Link } from "@tanstack/react-router";
import { AtSign, Eye, Fingerprint, Hash, Image, Link2, Palette, ShieldCheck, Sparkles, User } from "lucide-react";
import { PageHeading } from "@/components/dashboard/DashboardShell";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BRAND, brandMeta } from "@/lib/brand";
import { demoProfile } from "@/lib/demo-profile";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({ meta: brandMeta(BRAND.titles.dashboard, `Manage your ${BRAND.name} profile.`) }),
  component: Overview,
});

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function Overview() {
  const p = demoProfile;
  const max = Math.max(...p.viewsLast7);
  const stats = [
    { label: "Username", value: p.username, hint: "Change available now", icon: User },
    { label: "Alias", value: p.alias, hint: "Premium feature", icon: AtSign },
    { label: "UID", value: p.uid.toLocaleString("en-US"), hint: "Joined Nov 2026", icon: Fingerprint },
    { label: "Profile views", value: p.views.toLocaleString("en-US"), hint: "+18% this week", icon: Eye },
  ];
  const checklist = [
    { label: "Upload an avatar", done: true },
    { label: "Add a description", done: true },
    { label: "Add your socials", done: true },
    { label: "Link a Discord account", done: false },
    { label: "Enable 2-factor authentication", done: false },
  ];
  const done = checklist.filter((c) => c.done).length;

  return (
    <div className="animate-fade-up">
      <PageHeading title={BRAND.titles.dashboard} subtitle={`Welcome back, ${p.displayName}. Here's how your page is doing.`} />

      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Account overview</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(({ label, value, hint, icon: Icon }) => (
            <div key={label} className="surface p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{label}</p>
                <Icon className="size-4 text-primary-glow" />
              </div>
              <p className="mt-3 truncate text-2xl font-semibold tracking-tight">{value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="surface p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold tracking-tight">Profile views</h2>
            <span className="text-xs text-muted-foreground">Last 7 days</span>
          </div>
          <div className="mt-6 flex h-44 items-end gap-3">
            {p.viewsLast7.map((v, i) => (
              <div key={days[i]} className="flex h-full flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-md bg-gradient-brand opacity-90 transition-opacity hover:opacity-100"
                    style={{ height: `${(v / max) * 100}%` }}
                    title={`${v.toLocaleString("en-US")} views`}
                  />
                </div>
                <span className="text-[11px] text-muted-foreground">{days[i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="surface p-6">
          <h2 className="font-semibold tracking-tight">Profile completion</h2>
          <div className="mt-4 flex items-center gap-3">
            <Progress value={(done / checklist.length) * 100} className="h-2 bg-muted [&>div]:bg-gradient-brand" />
            <span className="text-sm font-medium">{Math.round((done / checklist.length) * 100)}%</span>
          </div>
          <ul className="mt-5 space-y-2.5 text-sm">
            {checklist.map((c) => (
              <li key={c.label} className="flex items-center gap-2.5">
                <span className={`flex size-4 items-center justify-center rounded-full border ${c.done ? "border-primary-glow bg-primary" : "border-border"}`}>
                  {c.done && <span className="size-1.5 rounded-full bg-primary-foreground" />}
                </span>
                <span className={c.done ? "text-muted-foreground line-through" : ""}>{c.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="surface p-6">
          <h2 className="font-semibold tracking-tight">Manage your account</h2>
          <p className="mt-1 text-sm text-muted-foreground">Quick shortcuts to the things you change most.</p>
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            {[
              { to: "/dashboard/customize", label: "Customize page", icon: Palette },
              { to: "/dashboard/links", label: "Manage links", icon: Link2 },
              { to: "/dashboard/settings", label: "Security", icon: ShieldCheck },
              { to: "/dashboard/premium", label: "Go Premium", icon: Sparkles },
            ].map(({ to, label, icon: Icon }) => (
              <Button key={to} asChild variant="glass" className="h-12 justify-start">
                <Link to={to}><Icon className="text-primary-glow" /> {label}</Link>
              </Button>
            ))}
          </div>
        </div>
        <div className="surface p-6">
          <h2 className="font-semibold tracking-tight">Connections</h2>
          <p className="mt-1 text-sm text-muted-foreground">Link accounts to show them on your page.</p>
          <ul className="mt-5 space-y-2.5">
            {[
              { name: "Discord", icon: Hash, connected: false },
              { name: "Image host", icon: Image, connected: true },
            ].map(({ name, icon: Icon, connected }) => (
              <li key={name} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <span className="flex items-center gap-3 text-sm"><Icon className="size-4 text-muted-foreground" /> {name}</span>
                {connected ? (
                  <span className="text-xs font-medium text-success">Connected</span>
                ) : (
                  <Button size="sm" variant="hero">Connect</Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
