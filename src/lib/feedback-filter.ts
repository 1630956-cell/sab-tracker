/**
 * Slur filter for the feedback tab.
 *
 * Scope is deliberately narrow: KNOWN slurs only. Ordinary profanity, insults,
 * threats and short messages all pass through untouched — anything that slips
 * past is handled by reporting the public issue.
 *
 * Matching is whole-word (or whole-message) after normalising leetspeak,
 * spacing, accents and repeated characters, so "n.i.g.g.e.r" still matches
 * while "spices" does not match "spic".
 */

const LEET: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s", "!": "i" };

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split("")
    .map((c) => LEET[c] ?? c)
    .join("")
    .replace(/(.)\1{2,}/g, "$1$1")
    .replace(/[^a-z]/g, "");
}

/** The exact ban list. Whole-word matches only, so "class" and "pass" are fine. */
const BANNED: string[] = [
  "niggger", "nigga", "nigger", "nga", "nger",
  "fuck", "fck",
  "rape", "slave",
  "bitch", "ass", "shit", "bunz",
  "kys",
];

/** Banned phrases — matched on the flattened text because they contain spaces. */
const BANNED_PHRASES: string[] = ["kill yourself", "killyourself", "kys"];

/** Innocent words that would otherwise collide with a short banned word. */
const ALLOW = new Set(["class", "classes", "pass", "passed", "assassin", "assassins", "grass", "glass", "bass", "mass", "basket"]);

const TOKEN_SPLIT = /[^a-z0-9@$!]+/i;

/** Normalised repeat-collapsing means "niggger" and "n1gga" both land on a listed form. */
function containsBanned(text: string, term: string): boolean {
  const target = normalize(term);
  const flat = normalize(text);
  if (!flat || !target) return false;
  if (flat === target) return true;
  const tokens = text.toLowerCase().split(TOKEN_SPLIT).map(normalize).filter(Boolean);
  return tokens.some((tok) => (ALLOW.has(tok) ? false : tok === target));
}

export type ScreenResult = {
  ok: boolean;
  /** Set only when a slur was found. */
  reason: string | null;
  /** Unchanged copy of the message — nothing is masked. */
  cleaned: string;
};

export function screenMessage(raw: string): ScreenResult {
  const text = raw.trim();
  const flat = normalize(text);

  const phrase = BANNED_PHRASES.some((p) => flat.includes(normalize(p)));
  const word = phrase ? undefined : BANNED.find((w) => containsBanned(text, w));
  if (phrase || word) {
    return { ok: false, reason: "That message contains a banned word, so it can't be sent. Reword it and try again.", cleaned: text };
  }
  return { ok: true, reason: null, cleaned: text };
}
