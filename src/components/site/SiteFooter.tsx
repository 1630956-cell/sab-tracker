import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import { BRAND } from "@/lib/brand";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-12 md:flex-row md:items-start md:justify-between">
        <div className="max-w-xs space-y-3">
          <Logo />
          <p className="text-sm text-muted-foreground">{BRAND.tagline}</p>
        </div>
        <div className="grid grid-cols-2 gap-10 text-sm sm:grid-cols-3">
          <div className="space-y-2.5">
            <p className="font-medium text-foreground">Product</p>
            <a href="/#features" className="block text-muted-foreground hover:text-foreground">Features</a>
            <Link to="/dashboard/premium" className="block text-muted-foreground hover:text-foreground">
              {BRAND.titles.premium}
            </Link>
          </div>
          <div className="space-y-2.5">
            <p className="font-medium text-foreground">Account</p>
            <Link to="/login" className="block text-muted-foreground hover:text-foreground">Log in</Link>
            <Link to="/register" className="block text-muted-foreground hover:text-foreground">Sign up</Link>
            <Link to="/dashboard" className="block text-muted-foreground hover:text-foreground">Dashboard</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-border/60">
        <p className="mx-auto max-w-6xl px-5 py-5 text-xs text-muted-foreground">
          © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
