import { Link, useLocation } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Copy, PanelLeftClose, PanelLeftOpen, Search, Sparkles } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { useActiveGlide, useGlide } from "@/hooks/use-glide";
import { BRAND, profileUrl } from "@/lib/brand";
import { demoProfile } from "@/lib/demo-profile";
import { cn } from "@/lib/utils";
import { dashNav, isActive } from "./nav-items";
import { copyProfileLink } from "./share";

const KEY = "myprofile:dock-collapsed";

function Sparkline({ data }: { data: readonly number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 60},${18 - ((v - min) / (max - min || 1)) * 16}`).join(" ");
  return (
    <svg viewBox="0 0 60 20" className="h-5 w-16" aria-hidden="true">
      <polyline points={pts} fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: "var(--primary-glow)" }} />
    </svg>
  );
}

export function ProfileDock({ onSearch }: { onSearch: () => void }) {
  const p = demoProfile;
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { container, style, moveTo } = useGlide<HTMLDivElement>("y");

  useEffect(() => {
    setCollapsed(localStorage.getItem(KEY) === "1");
  }, []);
  const toggle = () => {
    setCollapsed((c) => {
      localStorage.setItem(KEY, c ? "0" : "1");
      return !c;
    });
  };

  const getActive = useCallback(() => container.current?.querySelector<HTMLElement>("[data-active=true]") ?? null, [container]);
  useActiveGlide(moveTo, getActive, `${pathname}-${collapsed}`);

  const today = p.viewsLast7[p.viewsLast7.length - 1] ?? 0;

  return (
    <aside className={cn("sticky top-0 hidden h-screen shrink-0 p-3 transition-[width] duration-500 lg:block", collapsed ? "w-[92px]" : "w-[288px]")}>
      <div className="glass-bar relative flex h-full flex-col overflow-hidden rounded-3xl p-3">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-spotlight opacity-70" />

        <div className={cn("relative flex items-center", collapsed ? "flex-col gap-3" : "justify-between")}>
          <Link to="/" aria-label={`${BRAND.name} home`} className="flex items-center gap-2 px-1">
            <LogoMark className="size-8" />
            {!collapsed && <span className="text-[15px] font-semibold tracking-[-0.04em]">{BRAND.name}</span>}
          </Link>
          <button type="button" onClick={toggle} aria-label={collapsed ? "Expand menu" : "Collapse menu"} className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-foreground/5 hover:text-foreground">
            {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </button>
        </div>

        {/* Profile card */}
        <div className={cn("relative mt-5 rounded-2xl border border-border bg-background/50", collapsed ? "p-2" : "p-3.5")}>
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            <div className="relative shrink-0">
              <img src={p.avatar} alt="" width={816} height={816} className="size-11 rounded-full object-cover ring-2 ring-primary/60" />
              <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-card bg-success" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{p.displayName}</p>
                <button type="button" onClick={copyProfileLink} className="group flex max-w-full items-center gap-1 text-xs text-muted-foreground hover:text-primary-glow">
                  <span className="truncate">{profileUrl(p.username)}</span>
                  <Copy className="size-3 shrink-0 opacity-60 group-hover:opacity-100" />
                </button>
              </div>
            )}
          </div>
          {!collapsed && (
            <div className="mt-3 flex items-end justify-between border-t border-border pt-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Views today</p>
                <p className="text-lg font-semibold tracking-tight">{today.toLocaleString("en-US")}</p>
              </div>
              <Sparkline data={p.viewsLast7} />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onSearch}
          className={cn("relative mt-3 flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground", collapsed && "justify-center px-0")}
          aria-label="Quick jump"
        >
          <Search className="size-4" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">Jump to…</span>
              <kbd className="rounded border border-border bg-muted px-1.5 text-[10px]">/</kbd>
            </>
          )}
        </button>

        {/* Nav */}
        <div ref={container} className="relative mt-4 flex flex-col gap-1">
          <span className="glow-pill pointer-events-none absolute left-0 top-0 w-full rounded-xl" style={style}>
            <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary-glow" />
          </span>
          {dashNav.map(({ to, label, hint, icon: Icon, exact }) => {
            const active = isActive(pathname, to, exact);
            return (
              <Link
                key={to}
                to={to}
                data-active={active}
                title={collapsed ? label : undefined}
                className={cn(
                  "group relative z-10 flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
                  collapsed && "justify-center px-0",
                  active ? "text-foreground" : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground",
                )}
              >
                <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors", active ? "bg-gradient-brand text-primary-foreground" : "bg-foreground/5")}>
                  <Icon className="size-4" />
                </span>
                {!collapsed && (
                  <span className="min-w-0 leading-tight">
                    <span className="block text-sm font-medium">{label}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">{hint}</span>
                  </span>
                )}
                {collapsed && (
                  <span className="glass-bar pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg px-2.5 py-1 text-xs text-foreground opacity-0 transition-opacity group-hover:opacity-100">
                    {label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <div className="relative mt-auto">
          {collapsed ? (
            <Link to="/dashboard/premium" aria-label="Upgrade" className="mx-auto flex size-11 items-center justify-center rounded-xl bg-gradient-brand text-primary-foreground shadow-glow">
              <Sparkles className="size-4" />
            </Link>
          ) : (
            <Link to="/dashboard/premium" className="group block overflow-hidden rounded-2xl bg-gradient-brand p-4 text-primary-foreground shadow-glow">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="size-4" /> Go Premium
              </p>
              <p className="mt-1 text-xs opacity-80">Effects, custom domains & more.</p>
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}
