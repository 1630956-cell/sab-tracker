import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 py-16">
      <div className="pointer-events-none absolute inset-0 bg-spotlight" />
      <div className="pointer-events-none absolute inset-0 bg-grid" />
      <div className="relative w-full max-w-sm animate-fade-up">
        <Link to="/" className="mx-auto flex w-fit" aria-label="myprofile home">
          <Logo markClassName="size-9" />
        </Link>
        <div className="surface mt-8 p-7">
          <h1 className="text-2xl font-semibold tracking-[-0.03em]">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-7">{children}</div>
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
      </div>
    </div>
  );
}
