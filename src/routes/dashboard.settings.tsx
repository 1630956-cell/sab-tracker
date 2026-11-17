import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeading } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { BRAND, brandMeta } from "@/lib/brand";
import { demoProfile } from "@/lib/demo-profile";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({ meta: brandMeta(BRAND.titles.settings, `Manage your ${BRAND.name} account settings.`) }),
  component: SettingsPage,
});

function SettingsPage() {
  const p = demoProfile;
  return (
    <div className="animate-fade-up">
      <PageHeading title={BRAND.titles.settings} subtitle="Account, security and notification preferences." />
      <div className="grid gap-4 lg:grid-cols-2">
        <form
          className="surface space-y-4 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            toast.success("Settings saved", { description: `Your ${BRAND.name} account is up to date.` });
          }}
        >
          <h2 className="font-semibold tracking-tight">Account</h2>
          <div className="space-y-2">
            <Label htmlFor="s-user">Username</Label>
            <div className="flex h-10 items-center rounded-md border border-input px-3 text-sm">
              <span className="text-muted-foreground">{BRAND.domain}/</span>
              <input id="s-user" defaultValue={p.username} className="h-full w-full bg-transparent outline-none" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-name">Display name</Label>
            <Input id="s-name" defaultValue={p.displayName} className="h-10" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-email">Email</Label>
            <Input id="s-email" type="email" defaultValue="nova@example.com" className="h-10" />
          </div>
          <Button type="submit" variant="hero">Save changes</Button>
        </form>
        <div className="space-y-4">
          <div className="surface space-y-5 p-6">
            <h2 className="font-semibold tracking-tight">Security & notifications</h2>
            {[
              { id: "2fa", label: "Two-factor authentication", hint: "Add an extra layer of protection.", on: false },
              { id: "views", label: "Show view count", hint: "Display total views on your page.", on: true },
              { id: "email", label: `${BRAND.name} product updates`, hint: "News about features and Premium.", on: true },
            ].map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-4">
                <div>
                  <Label htmlFor={s.id}>{s.label}</Label>
                  <p className="text-xs text-muted-foreground">{s.hint}</p>
                </div>
                <Switch id={s.id} defaultChecked={s.on} />
              </div>
            ))}
          </div>
          <div className="surface border-destructive/40 p-6">
            <h2 className="font-semibold tracking-tight">Danger zone</h2>
            <p className="mt-1 text-sm text-muted-foreground">Permanently delete your {BRAND.name} account and page.</p>
            <Button variant="destructive" size="sm" className="mt-4">Delete account</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
