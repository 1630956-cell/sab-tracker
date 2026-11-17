import { LayoutGrid, Link2, Palette, Settings, Sparkles } from "lucide-react";
import { demoProfile } from "@/lib/demo-profile";

export const dashNav = [
  { to: "/dashboard", label: "Overview", hint: "Stats & activity", icon: LayoutGrid, exact: true },
  { to: "/dashboard/customize", label: "Customize", hint: "Look & feel", icon: Palette, exact: false },
  { to: "/dashboard/links", label: "Links", hint: `${demoProfile.links.length} active`, icon: Link2, exact: false },
  { to: "/dashboard/premium", label: "Premium", hint: "Unlock effects", icon: Sparkles, exact: false },
  { to: "/dashboard/settings", label: "Settings", hint: "Account & security", icon: Settings, exact: false },
] as const;

export const isActive = (pathname: string, to: string, exact: boolean) =>
  exact ? pathname === to || pathname === `${to}/` : pathname.startsWith(to);
