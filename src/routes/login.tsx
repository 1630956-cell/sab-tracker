import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AuthShell } from "@/components/site/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BRAND, brandMeta } from "@/lib/brand";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: brandMeta(`Log in · ${BRAND.name}`, `Log in to your ${BRAND.name} account.`) }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  return (
    <AuthShell
      title={BRAND.titles.login}
      subtitle="Log in to manage your profile."
      footer={
        <>
          New to {BRAND.name}?{" "}
          <Link to="/register" className="font-medium text-primary-glow hover:underline">Create an account</Link>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          toast.success(`Welcome back to ${BRAND.name}`);
          navigate({ to: "/dashboard" });
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="login-id">Username or email</Label>
          <Input id="login-id" required autoComplete="username" className="h-11" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="login-pass">Password</Label>
          <Input id="login-pass" type="password" required autoComplete="current-password" className="h-11" />
        </div>
        <Button type="submit" variant="hero" size="xl" className="w-full">Log in</Button>
      </form>
    </AuthShell>
  );
}
