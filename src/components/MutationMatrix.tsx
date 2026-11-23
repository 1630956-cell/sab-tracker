import { useState } from "react";
import { MUTATIONS, money } from "@/lib/mutations";

/**
 * Raw income plus what that same unit earns under every mutation.
 * Unpublished multipliers render as "—" instead of a guessed number.
 */
export function MutationMatrix({ perSec, inline = false }: { perSec: number; inline?: boolean }) {
  if (!perSec) return null;
  return (
    <div className={inline ? "space-y-1.5" : "mt-2 space-y-1.5"}>
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <span className="shrink-0 rounded-md border border-primary/50 bg-primary/15 px-2 py-1 font-mono text-[11px] font-bold text-primary-glow shadow-glow">
          RAW {money(perSec)}
        </span>
        {MUTATIONS.map((m) => {
          const exact = m.multiplier != null ? perSec * m.multiplier : null;
          const estimate = exact == null && m.reported != null ? perSec * m.reported : null;
          const label = m.name === "Yin Yang" ? "Yin" : m.name === "Radioactive" ? "Rad" : m.name;
          return (
            <span
              key={m.name}
              title={m.note}
              className={`shrink-0 rounded-md px-2 py-1 font-mono text-[11px] transition ${
                exact != null
                  ? "bg-secondary text-secondary-foreground hover:bg-accent"
                  : "border border-dashed border-border bg-transparent"
              }`}
            >
              <span className="text-muted-foreground/70">{label}</span>{" "}
              {exact != null && <span className="font-semibold text-primary-glow">{money(exact)}</span>}
              {exact == null && estimate != null && (
                <span className="text-muted-foreground">
                  ~{money(estimate)}
                  <span className="ml-1 text-[9px] uppercase tracking-wide text-muted-foreground/60">{m.reported}x?</span>
                </span>
              )}
              {exact == null && estimate == null && <span className="text-destructive">—</span>}
            </span>
          );
        })}
      </div>
      <p className="text-[10px] leading-tight text-muted-foreground/70">
        Base income × mutation. Traits stack on top: <span className="font-mono">base × (mutation + Σ traits)</span>.
      </p>
    </div>
  );
}

/** Expandable wrapper so a card stays compact until tapped. */
export function MutationToggle({ perSec }: { perSec: number }) {
  const [open, setOpen] = useState(false);
  if (!perSec) return null;
  return (
    <div className="mt-1">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg bg-secondary/60 px-2.5 py-1.5 text-[11px] font-medium transition hover:bg-secondary"
      >
        <span className="text-muted-foreground">All {MUTATIONS.length} mutations</span>
        <span className="font-mono text-primary-glow">{open ? "▴" : "▾"}</span>
      </button>
      {open && <MutationMatrix perSec={perSec} />}
    </div>
  );
}
