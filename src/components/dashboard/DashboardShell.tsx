import { Link, Outlet } from "@tanstack/react-router";
import { Bell, ExternalLink, LayoutGrid, Link2, Palette, Settings, Share2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BRAND, profileUrl } from "@/lib/brand";
import { demoProfile } from "@/lib/demo-profile";

const nav = [
  { to: "/dashboard", label: "Overview", icon: LayoutGrid, exact: true },
  { to: "/dashboard/customize", label: "Customize", icon: Palette },
  { to: "/dashboard/links", label: "Links", icon: Link2 },
  { to: "/dashboard/premium", label: "Premium", icon: Sparkles },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
] as const;

const notifications = [
  { title: `Welcome to ${BRAND.name}`, text: "Your profile is live. Start customizing it.", time: "now" },
  { title: "New badge unlocked", text: "You earned the Early supporter badge.", time: "2h" },
  { title: "Profile milestone", text: "Your page passed 10,000 views.", time: "1d" },
];

function shareProfile() {
  const url = `https://${profileUrl(demoProfile.username)}`;
  navigator.clipboard?.writeText(url).catch(() => {});
  toast.success("Link copied", { description: `Your ${BRAND.name} link is ready to share.` });
}

export function DashboardShell() {
  const p = demoProfile;
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[256px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-sidebar-border bg-sidebar p-4 lg:flex">
        <Link to="/" className="px-2 py-1.5" aria-label="myprofile home">
          <Logo />
        </Link>
        <p className="mt-8 px-3 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/70">Menu</p>
        <nav className="mt-2 space-y-1">
          {nav.map(({ to, label, icon: Icon, ...rest }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: "exact" in rest }}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground data-[status=active]:bg-sidebar-accent data-[status=active]:text-sidebar-accent-foreground"
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-3">
          <div className="rounded-xl border border-primary/40 bg-primary/15 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="size-4 text-primary-glow" /> {BRAND.titles.premium}</p>
            <p className="mt-1 text-xs text-muted-foreground">Unlock exclusive effects and custom domains.</p>
            <Button asChild variant="hero" size="sm" className="mt-3 w-full">
              <Link to="/dashboard/premium">Upgrade</Link>
            </Button>
          </div>
          <Button variant="glass" className="w-full" onClick={shareProfile}>
            <Share2 /> Share your profile
          </Button>
          <div className="flex items-center gap-3 rounded-xl border border-sidebar-border p-2.5">
            <img src={p.avatar} alt="" width={816} height={816} className="size-9 rounded-full object-cover" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{p.displayName}</p>
              <p className="truncate text-xs text-muted-foreground">UID {p.uid.toLocaleString("en-US")}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-3 px-5 lg:px-8">
            <div className="flex items-center gap-3">
              <Link to="/" className="lg:hidden" aria-label="myprofile home"><Logo /></Link>
              <span className="hidden text-sm font-medium text-foreground lg:inline">{BRAND.titles.dashboard}</span>
            </div>
            <div className="flex items-center gap-2">
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
                <Link to="/$username" params={{ username: p.username }}>
                  <ExternalLink /> <span className="hidden sm:inline">View page</span>
                </Link>
              </Button>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-4 pb-3 lg:hidden">
            {nav.map(({ to, label, icon: Icon, ...rest }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: "exact" in rest }}
                className="flex shrink-0 items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground data-[status=active]:border-primary/60 data-[status=active]:bg-primary/20 data-[status=active]:text-foreground"
              >
                <Icon className="size-3.5" /> {label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
          <Outlet />
        </main>
      </div>
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
