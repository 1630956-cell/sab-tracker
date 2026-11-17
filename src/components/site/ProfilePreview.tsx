import { BadgeCheck, Eye, Github, Globe, Instagram, Youtube } from "lucide-react";
import backdrop from "@/assets/profile-backdrop.jpg";
import { demoProfile } from "@/lib/demo-profile";
import { LogoMark } from "@/components/brand/Logo";

export const linkIcons = { globe: Globe, instagram: Instagram, github: Github, youtube: Youtube };

/** Phone-sized preview of a myprofile public page. */
export function ProfilePreview() {
  const p = demoProfile;
  return (
    <div className="relative mx-auto w-full max-w-[340px] overflow-hidden rounded-[2rem] border border-border bg-card shadow-glow">
      <img src={backdrop} alt="" width={1600} height={1008} className="absolute inset-0 h-full w-full object-cover opacity-80" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/50 to-background" />
      <div className="relative flex flex-col items-center px-6 pb-7 pt-12 text-center">
        <img
          src={p.avatar}
          alt={p.displayName}
          width={816}
          height={816}
          className="size-24 rounded-full border-2 border-primary-glow/60 object-cover shadow-glow"
        />
        <h3 className="mt-4 flex items-center gap-1.5 text-xl font-semibold tracking-tight">
          {p.displayName}
          <BadgeCheck className="size-5 text-primary-glow" />
        </h3>
        <p className="text-sm text-muted-foreground">@{p.username}</p>
        <p className="mt-3 text-sm text-foreground/80">{p.bio}</p>
        <div className="mt-6 w-full space-y-2.5">
          {p.links.slice(0, 3).map((l) => {
            const Icon = linkIcons[l.icon];
            return (
              <div
                key={l.label}
                className="flex items-center gap-3 rounded-xl border border-border bg-foreground/5 px-4 py-3 text-sm backdrop-blur"
              >
                <Icon className="size-4 text-primary-glow" />
                <span className="font-medium">{l.label}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-6 flex w-full items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Eye className="size-3.5" /> {p.views.toLocaleString("en-US")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <LogoMark className="size-4" /> myprofile
          </span>
        </div>
      </div>
    </div>
  );
}
