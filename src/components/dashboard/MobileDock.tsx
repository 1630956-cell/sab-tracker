import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { dashNav, isActive } from "./nav-items";

export function MobileDock() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed inset-x-0 bottom-3 z-40 flex justify-center px-4 lg:hidden">
      <div className="glass-bar flex items-end gap-1 rounded-2xl p-1.5">
        {dashNav.map(({ to, label, icon: Icon, exact }) => {
          const active = isActive(pathname, to, exact);
          return (
            <Link
              key={to}
              to={to}
              aria-label={label}
              className={cn(
                "flex size-12 items-center justify-center rounded-xl transition-all duration-300",
                active ? "-translate-y-2 bg-gradient-brand text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-5" />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
