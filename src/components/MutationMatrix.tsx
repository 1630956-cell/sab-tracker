import { useState } from "react";
import { MUTATIONS, money } from "@/lib/mutations";
import { existsForWithAdditional as existsFor } from "@/lib/mutation-exists-additional";

/** Colour the value by scarcity when a variant count is public, otherwise by multiplier tier. */
function valueTone(multiplier: number | null, exists: number | null): string {
  if (exists != null) {
    if (exists === 0) return "text-destructive";
    if (exists <= 5) return "text-destructive";
    if (exists <= 500) return "text-foreground";
    return "text-muted-foreground";
  }
  if (multiplier == null) return "text-muted-foreground";
  if (multiplier >= 14) return "text-gradient font-bold";
  if (multiplier >= 10) return "font-semibold text-primary-glow";
  if (multiplier >= 4) return "text-foreground";
  return "text-muted-foreground";
}

/**
 * Raw income plus what that same unit earns under every mutation.
 * Unpublished multipliers render as "—" instead of a guessed number.
 */
export function MutationMatrix({ perSec, unitName = "", inline = false }: { perSec: number; unitName?: string; inline?: boolean }) {
  const [picked, setPicked] = useState<string | null>(null);
  if (!perSec) return null;
  const pickedDef = picked ? MUTATIONS.find((x) => x.name === picked) ?? null : null;
  const pickedExists = pickedDef ? existsFor(unitName, pickedDef.name) : null;
  const pickedExact = pickedDef ? (pickedDef.multiplier != null ? perSec * pickedDef.multiplier : null) : null;
  const pickedEstimate = pickedDef && pickedExact == null && pickedDef.reported != null ? perSec * pickedDef.reported : null;
  return (
    <div className={inline ? "space-y-1.5" : "mt-2 space-y-1.5"}>
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          onClick={() => setPicked(picked === "Default" ? null : "Default")}
          className={`shrink-0 rounded-md border px-2 py-1 font-mono text-[11px] font-bold transition ${
            picked === "Default" ? "border-primary bg-primary/25 text-primary-glow shadow-glow" : "border-primary/50 bg-primary/15 text-primary-glow"
          }`}
        >
          RAW {money(perSec)}
        </button>
        {MUTATIONS.map((m) => {
          const exact = m.multiplier != null ? perSec * m.multiplier : null;
          const estimate = exact == null && m.reported != null ? perSec * m.reported : null;
          const label = m.name === "Yin Yang" ? "Yin" : m.name === "Radioactive" ? "Rad" : m.name;
          return (
            <button
              key={m.name}
              title={m.note}
              onClick={() => setPicked(picked === m.name ? null : m.name)}
              className={`shrink-0 rounded-md px-2 py-1 font-mono text-[11px] transition ${
                picked === m.name ? "ring-1 ring-primary shadow-glow " : ""
              }${
                exact != null
                  ? "bg-secondary text-secondary-foreground hover:bg-accent"
                  : "border border-dashed border-border bg-transparent"
              }`}
            >
              <span className="text-muted-foreground/70">{label}</span>{" "}
              {exact != null && (
                <span className={valueTone(m.multiplier, existsFor(unitName, m.name))}>{money(exact)}</span>
              )}
              {exact == null && estimate != null && (
                <span className="text-muted-foreground">
                  ~{money(estimate)}
                  <span className="ml-1 text-[9px] uppercase tracking-wide text-muted-foreground/60">{m.reported}x?</span>
                </span>
              )}
              {exact == null && estimate == null && <span className="text-destructive">—</span>}
            </button>
          );
        })}
      </div>
      {pickedDef || picked === "Default" ? (
        <div className="rounded-lg border border-primary/30 bg-secondary/60 px-2.5 py-1.5 text-[11px]">
          <span className="font-semibold text-primary-glow">{picked === "Default" ? "Default (no mutation)" : pickedDef?.name}</span>
          <span className="mx-1.5 text-muted-foreground/50">·</span>
          <span className="font-mono text-muted-foreground">
            {picked === "Default" ? "1×" : pickedDef?.multiplier != null ? `${pickedDef.multiplier}×` : pickedDef?.reported != null ? `~${pickedDef.reported}×?` : "—"}
          </span>
          <span className="mx-1.5 text-muted-foreground/50">·</span>
          <span className="font-mono text-foreground">
            {picked === "Default" ? money(perSec) : pickedExact != null ? money(pickedExact) : pickedEstimate != null ? `~${money(pickedEstimate)}` : "—"}
          </span>
          <span className="mx-1.5 text-muted-foreground/50">·</span>
          <span className={`font-mono ${(picked === "Default" ? existsFor(unitName, "Default") : pickedExists) == null ? "text-muted-foreground/70" : "text-primary-glow"}`}>
            {(picked === "Default" ? existsFor(unitName, "Default") : pickedExists) == null ? "exist count not published" : `${(picked === "Default" ? existsFor(unitName, "Default") : pickedExists)} exist`}
          </span>
        </div>
      ) : (
        <p className="text-[10px] leading-tight text-muted-foreground/70">
          Base income × mutation. Tap a mutation for its exist count. Traits stack on top:{" "}
          <span className="font-mono">base × (mutation + Σ traits)</span>.
        </p>
      )}
    </div>
  );
}

/** Expandable wrapper so a card stays compact until tapped. */
export function MutationToggle({ perSec, unitName = "" }: { perSec: number; unitName?: string }) {
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
      {open && <MutationMatrix perSec={perSec} unitName={unitName} />}
    </div>
  );
}
