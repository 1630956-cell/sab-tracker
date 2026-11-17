import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { useGlide } from "@/hooks/use-glide";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

const items = [
  { label: "Features", href: "/#features" },
  { label: "Premium", to: "/dashboard/premium" as const },
  { label: "Example", to: "/$username" as const, params: { username: "nova" } },
];

export function OrbitNav() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);
  const [name, setName] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { container, style, moveTo } = useGlide<HTMLDivElement>();

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
  }, [mobileOpen]);

  const claim = () => {
    navigate({ to: "/register", search: { username: name || undefined } });
  };

  const itemClass = "relative z-10 rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground";

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-3">
        <nav
          className={cn(
            "glass-bar pointer-events-auto flex items-center gap-2 rounded-full p-1.5 transition-all duration-500",
            scrolled ? "shadow-glow" : "md:mt-2",
          )}
        >
          <Link to="/" aria-label={`${BRAND.name} home`} className="group flex items-center gap-0 rounded-full py-1 pl-1 pr-2">
            <LogoMark className="size-8" />
            <span className="max-w-0 overflow-hidden whitespace-nowrap text-[15px] font-semibold tracking-[-0.04em] opacity-0 transition-all duration-500 group-hover:ml-2 group-hover:max-w-28 group-hover:opacity-100 sm:ml-2 sm:max-w-28 sm:opacity-100">
              {BRAND.name}
            </span>
          </Link>

          <div ref={container} className="relative hidden items-center md:flex" onMouseLeave={() => moveTo(null)}>
            <span className="glow-pill pointer-events-none absolute left-0 top-0 rounded-full" style={style} />
            {items.map((it) =>
              it.href ? (
                <a key={it.label} href={it.href} className={itemClass} onMouseEnter={(e) => moveTo(e.currentTarget)}>
                  {it.label}
                </a>
              ) : (
                <Link key={it.label} to={it.to!} params={it.params as never} className={itemClass} onMouseEnter={(e) => moveTo(e.currentTarget)}>
                  {it.label}
                </Link>
              ),
            )}
          </div>

          <div className="hidden h-6 w-px bg-border md:block" />

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!claimOpen) {
                setClaimOpen(true);
                setTimeout(() => inputRef.current?.focus(), 50);
              } else claim();
            }}
            className={cn(
              "hidden items-center rounded-full border border-border bg-background/60 pl-3.5 transition-all duration-500 sm:flex",
              claimOpen ? "w-72" : "w-[176px]",
            )}
          >
            <span className="shrink-0 text-xs text-muted-foreground">{claimOpen ? `${BRAND.domain}/` : "Claim your link"}</span>
            <input
              ref={inputRef}
              value={name}
              onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z0-9_.]/g, "").toLowerCase())}
              onBlur={() => !name && setClaimOpen(false)}
              placeholder="you"
              aria-label="Claim a username"
              className={cn("min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50", claimOpen ? "flex-1" : "w-0")}
            />
            <Button type="submit" variant="hero" size="icon" className="m-0.5 size-8 shrink-0 rounded-full" aria-label="Claim">
              <ArrowRight />
            </Button>
          </form>

          <Link to="/login" className="hidden rounded-full px-3.5 py-2 text-sm font-medium transition-colors hover:bg-foreground/5 sm:block">
            Log in
          </Link>

          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
            className="flex size-9 items-center justify-center rounded-full bg-gradient-brand text-primary-foreground md:hidden"
          >
            <Menu className="size-4" />
          </button>
        </nav>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-background/95 px-6 pb-10 pt-6 backdrop-blur-xl md:hidden">
          <div className="pointer-events-none absolute inset-0 bg-spotlight" />
          <div className="relative flex items-center justify-between">
            <LogoMark className="size-9" />
            <button type="button" aria-label="Close menu" onClick={() => setMobileOpen(false)} className="flex size-10 items-center justify-center rounded-full border border-border">
              <X className="size-4" />
            </button>
          </div>
          <div className="relative mt-16 flex flex-col gap-3">
            {[
              ...items.map((i) => ({ label: i.label, onClick: () => (i.href ? (window.location.href = i.href) : navigate({ to: i.to!, params: i.params as never })) })),
              { label: "Log in", onClick: () => navigate({ to: "/login" }) },
              { label: "Sign up", onClick: () => navigate({ to: "/register" }) },
            ].map((l, i) => (
              <button
                key={l.label}
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  l.onClick();
                }}
                className="animate-rise text-left text-4xl font-semibold tracking-[-0.04em]"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
