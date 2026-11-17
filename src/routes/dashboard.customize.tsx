import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeading } from "@/components/dashboard/DashboardShell";
import { ProfilePreview } from "@/components/site/ProfilePreview";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { BRAND, brandMeta } from "@/lib/brand";
import { demoProfile } from "@/lib/demo-profile";

export const Route = createFileRoute("/dashboard/customize")({
  head: () => ({ meta: brandMeta(`Customize · ${BRAND.titles.dashboard}`, `Customize your ${BRAND.name} page.`) }),
  component: CustomizePage,
});

const accents = ["bg-primary", "bg-primary-glow", "bg-chart-3", "bg-chart-4", "bg-foreground"];

function CustomizePage() {
  const [accent, setAccent] = useState(0);
  return (
    <div className="animate-fade-up">
      <PageHeading title="Customize" subtitle="Design how visitors see your page." />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <div className="surface space-y-3 p-6">
            <Label htmlFor="bio">Description</Label>
            <Textarea id="bio" defaultValue={demoProfile.bio} rows={3} />
          </div>
          <div className="surface p-6">
            <p className="text-sm font-medium">Accent color</p>
            <div className="mt-4 flex gap-3">
              {accents.map((c, i) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Accent ${i + 1}`}
                  onClick={() => setAccent(i)}
                  className={`size-9 rounded-full ${c} ring-offset-2 ring-offset-card transition ${accent === i ? "ring-2 ring-ring" : ""}`}
                />
              ))}
            </div>
          </div>
          <div className="surface space-y-5 p-6">
            {["Animated background", "Glow on username", "Show badges", "Typewriter description"].map((l, i) => (
              <div key={l} className="flex items-center justify-between">
                <Label htmlFor={`c-${i}`}>{l}</Label>
                <Switch id={`c-${i}`} defaultChecked={i !== 3} />
              </div>
            ))}
          </div>
          <Button variant="hero" onClick={() => toast.success("Page updated", { description: `Your ${BRAND.name} changes are live.` })}>
            Save changes
          </Button>
        </div>
        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 text-sm text-muted-foreground">Live preview</p>
          <ProfilePreview />
        </div>
      </div>
    </div>
  );
}
