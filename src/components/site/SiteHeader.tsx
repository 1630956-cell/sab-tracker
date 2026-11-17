import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link to="/" aria-label="myprofile home">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <a href="/#features" className="transition-colors hover:text-foreground">Features</a>
          <Link to="/dashboard/premium" className="transition-colors hover:text-foreground">Premium</Link>
          <Link to="/$username" params={{ username: "nova" }} className="transition-colors hover:text-foreground">
            Example
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild variant="hero" size="sm">
            <Link to="/register">Sign up free</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
