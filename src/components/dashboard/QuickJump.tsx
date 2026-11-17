import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Copy, ExternalLink, Sparkles } from "lucide-react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { demoProfile } from "@/lib/demo-profile";
import { dashNav } from "./nav-items";
import { copyProfileLink } from "./share";

export function QuickJump({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable;
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpenChange]);

  const run = (fn: () => void) => {
    onOpenChange(false);
    fn();
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Jump to a page or action…" />
      <CommandList>
        <CommandEmpty>Nothing found.</CommandEmpty>
        <CommandGroup heading="Pages">
          {dashNav.map(({ to, label, icon: Icon }) => (
            <CommandItem key={to} onSelect={() => run(() => navigate({ to }))}>
              <Icon /> {label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => run(copyProfileLink)}>
            <Copy /> Copy my link
          </CommandItem>
          <CommandItem onSelect={() => run(() => navigate({ to: "/$username", params: { username: demoProfile.username } }))}>
            <ExternalLink /> View my page
          </CommandItem>
          <CommandItem onSelect={() => run(() => navigate({ to: "/dashboard/premium" }))}>
            <Sparkles /> Upgrade to Premium
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
