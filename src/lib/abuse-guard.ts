/** Protects the paid AI from abuse: offensive messages and copy-pasted repeats get a flat refusal. */
export const REFUSAL = "Can't help you with that.";

export function normalize(q: string): string {
  return q.toLowerCase().replace(/[0@]/g, "o").replace(/[1!|]/g, "i").replace(/3/g, "e").replace(/[4]/g, "a").replace(/[5$]/g, "s").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}

// Slurs and hate terms (matched on normalized text, also with spaces removed).
const SLURS = ["nigger", "nigga", "niga", "nigg", "faggot", "fagot", "fag", "retard", "chink", "spic", "kike", "wetback", "tranny", "coon", "gook", "beaner", "raghead", "towelhead", "paki", "sandnigger", "porchmonkey", "junglebunny", "heil hitler", "kill all", "white power", "gas the"];
const SLUR_RE = new RegExp(`\\b(${SLURS.filter((s) => !s.includes(" ")).join("|")})(s|z|es)?\\b`);

export function isOffensive(q: string): boolean {
  const n = normalize(q);
  if (SLUR_RE.test(n)) return true;
  const squashed = n.replace(/ /g, "");
  return SLURS.some((s) => (s.length >= 5 || s.includes(" ")) && squashed.includes(s.replace(/ /g, "")));
}

/** Same question (after normalizing) asked this many times inside the window is refused. */
export const MAX_REPEATS = 2;
export const WINDOW_MS = 10 * 60 * 1000;

export class RepeatTracker {
  private seen = new Map<string, number[]>();
  /** Records the ask; returns true when it should be refused. */
  hit(key: string, now = Date.now()): boolean {
    const times = (this.seen.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
    times.push(now);
    this.seen.set(key, times);
    if (this.seen.size > 5000) this.seen.clear();
    return times.length > MAX_REPEATS;
  }
}

export function guard(q: string, tracker: RepeatTracker, who = "anon"): string | null {
  if (isOffensive(q)) return REFUSAL;
  const n = normalize(q);
  if (n.length < 2) return REFUSAL;
  if (tracker.hit(`${who}|${n}`)) return REFUSAL;
  return null;
}
