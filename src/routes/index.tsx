import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, BarChart3, Link2, Palette, Share2, Sparkles, Award } from "lucide-react";
import { OrbitNav } from "@/components/site/OrbitNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ProfilePreview } from "@/components/site/ProfilePreview";
import { Button } from "@/components/ui/button";
import { BRAND, brandMeta } from "@/lib/brand";

// The home route ships no og:image, so serve-time hosting can inject the
// project's social preview (explicit og:image or latest screenshot).
export const Route = createFileRoute("/")({
  head: () => ({ meta: brandMeta(BRAND.titles.browser) }),
  component: Index,
});

const features = [
  { icon: Palette, title: "Customize everything", text: "Backgrounds, colors, fonts, effects and layouts — make it unmistakably yours." },
  { icon: Link2, title: "All your links", text: "Socials, projects and content gathered on one elegant page." },
  { icon: BarChart3, title: "Real analytics", text: "See who visits, where they come from and what they click." },
  { icon: Award, title: "Badges", text: "Show off your status with collectible profile badges." },
  { icon: Share2, title: "Share anywhere", text: `One short link — ${BRAND.domain}/you — for every bio.` },
  { icon: Sparkles, title: BRAND.titles.premium, text: "Exclusive effects, custom domains and priority features." },
];

function Index() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");

  return (
    <div className="min-h-screen">
      <OrbitNav />
      <main className="pt-16">
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-spotlight" />
          <div className="pointer-events-none absolute inset-0 bg-grid" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 pb-24 pt-20 lg:grid-cols-[1.15fr_1fr] lg:pt-28">
            <div className="animate-fade-up">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-foreground/5 px-3 py-1 text-xs text-muted-foreground">
                <span className="size-1.5 rounded-full bg-primary-glow" />
                The premium home for your online identity
              </span>
              <h1 className="mt-6 text-5xl font-semibold leading-[1.02] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
                <span className="text-gradient">Your profile,</span>
                <br />
                beautifully yours.
              </h1>
              <p className="mt-6 max-w-lg text-lg text-muted-foreground">
                Create, customize, share and manage a stunning personal page with {BRAND.name}.
              </p>
              <form
                className="mt-9 flex max-w-lg flex-col gap-2 rounded-2xl border border-border bg-card/80 p-2 backdrop-blur sm:flex-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  navigate({ to: "/register", search: { username: username.trim() || undefined } });
                }}
              >
                <label className="flex flex-1 items-center rounded-xl px-3 text-sm">
                  <span className="text-muted-foreground">{BRAND.domain}/</span>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_.]/g, "").toLowerCase())}
                    placeholder="username"
                    aria-label="Choose your username"
                    className="h-11 w-full bg-transparent text-foreground outline-none placeholder:text-muted-foreground/60"
                  />
                </label>
                <Button type="submit" variant="hero" size="xl">
                  Claim now <ArrowRight />
                </Button>
              </form>
            </div>
            <div className="animate-fade-up [animation-delay:150ms]">
              <ProfilePreview />
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl px-5 py-24">
          <div className="max-w-xl">
            <h2 className="text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Everything your profile needs.</h2>
            <p className="mt-3 text-muted-foreground">Thoughtfully designed tools, none of the clutter.</p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="surface p-6 transition-colors hover:border-primary/50">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/20 text-primary-glow">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-5 font-semibold tracking-tight">{title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-24">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card px-8 py-16 text-center">
            <div className="pointer-events-none absolute inset-0 bg-spotlight" />
            <div className="relative">
              <h2 className="text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Claim your {BRAND.name} today.</h2>
              <p className="mx-auto mt-3 max-w-md text-muted-foreground">Free forever. Upgrade to Premium whenever you want more.</p>
              <Button variant="hero" size="xl" className="mt-8" onClick={() => navigate({ to: "/register" })}>
                Create your page <ArrowRight />
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
