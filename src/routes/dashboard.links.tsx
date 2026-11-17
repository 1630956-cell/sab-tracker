import { createFileRoute } from "@tanstack/react-router";
import { GripVertical, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeading } from "@/components/dashboard/DashboardShell";
import { linkIcons } from "@/components/site/ProfilePreview";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { BRAND, brandMeta } from "@/lib/brand";
import { demoProfile } from "@/lib/demo-profile";

export const Route = createFileRoute("/dashboard/links")({
  head: () => ({ meta: brandMeta(`Links · ${BRAND.titles.dashboard}`, `Manage the links on your ${BRAND.name} page.`) }),
  component: LinksPage,
});

function LinksPage() {
  return (
    <div className="animate-fade-up">
      <div className="flex items-start justify-between gap-4">
        <PageHeading title="Links" subtitle="Add, reorder and toggle the links on your page." />
        <Button variant="hero" onClick={() => toast("Link editor is coming soon")}><Plus /> Add link</Button>
      </div>
      <ul className="space-y-2.5">
        {demoProfile.links.map((l) => {
          const Icon = linkIcons[l.icon];
          return (
            <li key={l.label} className="surface flex items-center gap-4 p-4">
              <GripVertical className="size-4 text-muted-foreground" />
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/20 text-primary-glow">
                <Icon className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{l.label}</p>
                <p className="truncate text-xs text-muted-foreground">{l.url}</p>
              </div>
              <Switch defaultChecked aria-label={`Show ${l.label}`} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
