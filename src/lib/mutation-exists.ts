/**
 * Per-mutation exist counts, ONLY where a source actually published them.
 *
 * The wiki and the in-game Index publish total counts for a unit; a handful of
 * item pages break that total down per variant. Anything missing here has never
 * been published — render it as "—", never as 0 and never as an estimate.
 */
export const MUTATION_EXISTS: Record<string, Record<string, number>> = {
  // Polaroidini item page: Default 20 · Gold 2 · Diamond 2 · every other mutation 0
  polaroidini: { Default: 20, Gold: 2, Diamond: 2, Rainbow: 0, Bloodrot: 0, Candy: 0, Lava: 0, Galaxy: 0, "Yin Yang": 0, Radioactive: 0, Cursed: 0, Divine: 0, Cyber: 0, Phantom: 0, Crystal: 0 },
  // Meowl item page: Default 2,171 published; variants not itemised
  meowl: { Default: 2171 },
};

/** Lookup helper: unit name is matched case/space-insensitively. */
export function existsFor(unitName: string, mutation: string): number | null {
  const key = unitName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const entry = MUTATION_EXISTS[key];
  if (!entry) return null;
  const value = entry[mutation];
  return typeof value === "number" ? value : null;
}
