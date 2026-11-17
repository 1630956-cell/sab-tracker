import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AuthShell } from "@/components/site/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BRAND, brandMeta } from "@/lib/brand";

export const Route = createFileRoute("/register")({
  validateSearch: (search: Record<string, unknown>): { username?: string | undefined } => ({
    username: typeof search["username"] === "string" ? search["username"] : undefined,
  }),
  head: () => ({ meta: brandMeta(`Sign up · ${BRAND.name}`, BRAND.titles.register + ".") }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const { username: claimed } = Route.useSearch();
  const [username, setUsername] = useState(claimed ?? "");

  return (
    <AuthShell
      title={BRAND.titles.register}
      subtitle="Claim your link in seconds. Free forever."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary-glow hover:underline">Log in</Link>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          toast.success(`Welcome to ${BRAND.name}!`, { description: `${BRAND.domain}/${username} is yours.` });
          navigate({ to: "/dashboard" });
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="reg-user">Username</Label>
          <div className="flex h-11 items-center rounded-md border border-input px-3 text-sm focus-within:ring-1 focus-within:ring-ring">
            <span className="text-muted-foreground">{BRAND.domain}/</span>
            <input
              id="reg-user"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_.]/g, "").toLowerCase())}
              className="h-full w-full bg-transparent outline-none"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="reg-email">Email</Label>
          <Input id="reg-email" type="email" required autoComplete="email" className="h-11" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reg-pass">Password</Label>
          <Input id="reg-pass" type="password" required minLength={8} autoComplete="new-password" className="h-11" />
        </div>
        <Button type="submit" variant="hero" size="xl" className="w-full">Create account</Button>
      </form>
    </AuthShell>
  );
}
