import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, Eye, MapPin } from "lucide-react";
import backdrop from "@/assets/profile-backdrop.jpg";
import { LogoMark } from "@/components/brand/Logo";
import { linkIcons } from "@/components/site/ProfilePreview";
import { BRAND } from "@/lib/brand";
import { demoProfile } from "@/lib/demo-profile";

export const Route = createFileRoute("/$username")({
  head: ({ params }) => {
    const title = `@${params.username} · ${BRAND.name}`;
    const description = `Check out @${params.username}'s profile on ${BRAND.name}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: PublicProfile,
});

function PublicProfile() {
  const { username } = Route.useParams();
  const p = { ...demoProfile, username };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <img src={backdrop} alt="" width={1600} height={1008} className="fixed inset-0 h-full w-full object-cover" />
      <div className="fixed inset-0 bg-background/55" />
      <main className="relative flex min-h-screen items-center justify-center px-5 py-16">
        <div className="w-full max-w-md animate-fade-up rounded-3xl border border-border bg-card/60 p-8 text-center shadow-glow backdrop-blur-2xl">
          <img
            src={p.avatar}
            alt={p.displayName}
            width={816}
            height={816}
            className="mx-auto size-28 rounded-full border-2 border-primary-glow/60 object-cover shadow-glow"
          />
          <h1 className="mt-5 flex items-center justify-center gap-1.5 text-2xl font-semibold tracking-tight">
            {p.displayName} <BadgeCheck className="size-5 text-primary-glow" />
          </h1>
          <p className="text-sm text-muted-foreground">@{p.username}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            {p.badges.map((b) => (
              <span key={b} className="rounded-full border border-primary/50 bg-primary/20 px-2.5 py-0.5 text-[11px] font-medium">
                {b}
              </span>
            ))}
          </div>
          <p className="mt-5 text-foreground/85">{p.bio}</p>
          <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3.5" /> {p.location}
          </p>
          <div className="mt-7 space-y-2.5">
            {p.links.map((l) => {
              const Icon = linkIcons[l.icon];
              return (
                <a
                  key={l.label}
                  href={l.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-border bg-foreground/5 px-4 py-3.5 text-sm font-medium transition hover:border-primary-glow/60 hover:bg-primary/20"
                >
                  <Icon className="size-4 text-primary-glow" />
                  <span className="flex-1 text-left">{l.label}</span>
                </a>
              );
            })}
          </div>
          <div className="mt-8 flex items-center justify-between text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Eye className="size-3.5" /> {p.views.toLocaleString("en-US")}</span>
            <Link to="/" className="inline-flex items-center gap-1.5 hover:text-foreground">
              <LogoMark className="size-4" /> Made with {BRAND.name}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
