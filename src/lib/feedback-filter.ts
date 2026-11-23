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

/** Known slurs. Any whole-word hit blocks the submission. */
const SLURS: string[] = [
  // racial / ethnic
  "nigger", "nigga", "niglet", "kike", "spic", "wetback", "chink", "gook", "raghead", "towelhead",
  "porchmonkey", "coonass", "sambos", "paki", "beaner", "cameljockey", "sandnigger",
  // homophobic / transphobic
  "faggot", "fagot", "faggots", "dyke", "dykes", "tranny", "trannies", "shemale",
  // ableist
  "retard", "retards", "retarded", "mongoloid",
  // antisemitic / extremist
  "hitlerwasright", "heilhitler", "whitepower", "gasjews", "zionazi",
];

/** Innocent words that share letters with a short slur. */
const ALLOW = new Set(["spices", "spicy", "suspicious", "suspicion", "auspicious", "retardant", "retardants"]);

const TOKEN_SPLIT = /[^a-z0-9@$!]+/i;

function containsSlur(text: string, term: string): boolean {
  const target = normalize(term);
  const flat = normalize(text);
  if (!flat) return false;
  if (flat === target) return true;
  const tokens = text.toLowerCase().split(TOKEN_SPLIT).map(normalize).filter(Boolean);
  return tokens.some((tok) => {
    if (ALLOW.has(tok)) return false;
    if (tok === target) return true;
    return target.length >= 6 && tok.startsWith(target);
  });
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
  // "spic and span" is an ordinary phrase.
  if (/\bspic\s+(and|n)\s+span\b/i.test(text)) return { ok: true, reason: null, cleaned: text };

  const hit = SLURS.find((w) => containsSlur(text, w));
  if (hit) {
    return { ok: false, reason: "That message contains a slur, so it can't be sent. Reword it and try again.", cleaned: text };
  }
  return { ok: true, reason: null, cleaned: text };
}
