/**
 * Mutation multipliers, verified against the SAB Wiki mutation list and El Dorado's guide.
 * `multiplier: null` means the value has NEVER been published — render it as unknown,
 * never substitute a number. Hacker (Update 76) is the current example: community says
 * 15x, nothing official confirms it.
 */
export type MutationDef = {
  name: string;
  /** Income multiplier. null = unpublished. */
  multiplier: number | null;
  /** Community-reported value, shown as a flagged estimate only. Never treated as fact. */
  reported?: number;
  /** Short tag shown under the value. */
  tag: string;
  note: string;
};

export const MUTATIONS: MutationDef[] = [
  { name: "Gold", multiplier: 1.25, tag: "permanent", note: "Permanent carpet roll, 10% chance" },
  { name: "Diamond", multiplier: 1.5, tag: "permanent", note: "Permanent carpet roll, 20.4% chance" },
  { name: "Bloodrot", multiplier: 2, tag: "event", note: "Bloodmoon event" },
  { name: "Candy", multiplier: 4, tag: "event", note: "Candy Aurora event" },
  { name: "Lava", multiplier: 6, tag: "event", note: "Molten event" },
  { name: "Galaxy", multiplier: 7, tag: "event", note: "Galaxy event" },
  { name: "Yin Yang", multiplier: 7.5, tag: "event", note: "Yin Yang event" },
  { name: "Radioactive", multiplier: 8.5, tag: "event", note: "Radioactive event" },
  { name: "Cursed", multiplier: 9, tag: "event", note: "Cursed event" },
  { name: "Rainbow", multiplier: 10, tag: "permanent", note: "Permanent carpet roll, 1% chance" },
  { name: "Divine", multiplier: 10, tag: "event", note: "Divine event — also grants the Halo trait" },
  { name: "Cyber", multiplier: 11, tag: "event", note: "Cyber event, hourly on weekends" },
  { name: "Phantom", multiplier: 12, tag: "event", note: "Phantom event, Update 53" },
  { name: "Crystal", multiplier: 13, tag: "event", note: "Crystal event, Update 59" },
  { name: "Eclipse", multiplier: 14, tag: "event", note: "Eclipse event, Update 69" },
  { name: "Hacker", multiplier: null, reported: 15, tag: "unconfirmed", note: "Update 76 — multiplier never published; community reports 15x, unconfirmed" },
];

/** Compact money formatter: 1500000000 -> $1.5B */
export function money(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "$0";
  const units: [number, string][] = [[1e12, "T"], [1e9, "B"], [1e6, "M"], [1e3, "K"]];
  for (const [size, suffix] of units) {
    if (n >= size) {
      const v = n / size;
      return `$${v >= 100 ? Math.round(v) : v.toFixed(v >= 10 ? 1 : 2)}${suffix}`;
    }
  }
  return `$${Math.round(n)}`;
}

/** Admin Abuse traits. Multipliers verified against the wiki trait list. */
export type TraitDef = { name: string; multiplier: number; source: string };

export const TRAITS: TraitDef[] = [
  { name: "Strawberry", multiplier: 8, source: "Admin Abuse · Strawberry event" },
  { name: "Meowl", multiplier: 7, source: "Admin Abuse · Meowl event" },
  { name: "John Pork", multiplier: 6.5, source: "Admin Abuse · 'is calling'" },
  { name: "Skibidi", multiplier: 6, source: "Admin Abuse · Skibidi heads" },
  { name: "Granny", multiplier: 5.5, source: "Granny funeral event" },
  { name: "Food", multiplier: 5.5, source: "Food event" },
  { name: "Paint", multiplier: 5, source: "Chicleteira ritual" },
  { name: ":3", multiplier: 4.5, source: "Mi Gatito ritual" },
  { name: "Tie", multiplier: 3.75, source: "Dul Dul Dul ritual" },
  { name: "Matteo Hat", multiplier: 3.5, source: "Matteo ritual" },
  { name: "Spider", multiplier: 3.5, source: "Sammyni Spyderini ritual" },
  { name: "Shark Fin", multiplier: 3, source: "Orcalero Orcala ritual" },
  { name: "Explosive", multiplier: 3, source: "Bombardiro Crocodilo ritual" },
  { name: "Galactic", multiplier: 3, source: "La Vacca Saturno ritual" },
  { name: "Sleepy", multiplier: 0.5, source: "Admin Abuse · HARMFUL, halves value" },
];
