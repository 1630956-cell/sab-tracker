import { createFileRoute } from "@tanstack/react-router";
import { Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { PageHeading } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { BRAND, brandMeta } from "@/lib/brand";

export const Route = createFileRoute("/dashboard/premium")({
  head: () => ({ meta: brandMeta(BRAND.titles.premium, `Unlock everything with ${BRAND.titles.premium}.`) }),
  component: PremiumPage,
});

const free = ["Personal profile page", "Unlimited links", "Basic customization", "View counter"];
const premium = [
  "Everything in Free",
  "Exclusive profile effects & fonts",
  "Custom domain support",
  "Advanced analytics",
  "Premium badge",
  "Alias usernames",
  "Priority support",
];

function PremiumPage() {
  return (
    <div className="animate-fade-up">
      <PageHeading title={BRAND.titles.premium} subtitle="Make your page truly one of a kind." />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface p-7">
          <p className="text-sm font-medium text-muted-foreground">Free</p>
          <p className="mt-2 text-4xl font-semibold tracking-tight">$0</p>
          <p className="text-sm text-muted-foreground">Forever</p>
          <ul className="mt-6 space-y-3 text-sm">
            {free.map((f) => (
              <li key={f} className="flex items-center gap-2.5"><Check className="size-4 text-muted-foreground" /> {f}</li>
            ))}
          </ul>
          <Button variant="glass" className="mt-8 w-full" disabled>Current plan</Button>
        </div>
        <div className="relative overflow-hidden rounded-[calc(var(--radius)+4px)] border border-primary/60 bg-card p-7 shadow-glow">
          <div className="pointer-events-none absolute inset-0 bg-spotlight" />
          <div className="relative">
            <p className="flex items-center gap-2 text-sm font-medium text-primary-glow"><Sparkles className="size-4" /> {BRAND.titles.premium}</p>
            <p className="mt-2 text-4xl font-semibold tracking-tight">$6.99</p>
            <p className="text-sm text-muted-foreground">One-time payment, lifetime access</p>
            <ul className="mt-6 space-y-3 text-sm">
              {premium.map((f) => (
                <li key={f} className="flex items-center gap-2.5"><Check className="size-4 text-primary-glow" /> {f}</li>
              ))}
            </ul>
            <Button
              variant="hero"
              size="xl"
              className="mt-8 w-full"
              onClick={() => toast(`${BRAND.titles.premium} checkout is coming soon`)}
            >
              Upgrade to Premium
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
