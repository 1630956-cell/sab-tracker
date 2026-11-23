/**
 * Message screening for the feedback tab.
 *
 * Two tiers:
 *  - BLOCK: slurs and targeted harassment. Submission is refused outright.
 *  - SOFT:  ordinary profanity. Allowed, but masked so the report stays readable.
 *
 * Matching runs on a normalised copy of the text so simple evasion fails:
 * leetspeak, spacing, repeated characters and punctuation are all collapsed.
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

/** Severe terms: any hit blocks the submission. */
const BLOCKED: string[] = [
  // racial slurs
  "nigger", "nigga", "kike", "spic", "chink", "wetback", "gook", "raghead", "towelhead", "porchmonkey",
  // homophobic / transphobic slurs
  "faggot", "fagot", "dyke", "tranny", "shemale",
  // ableist slurs
  "retard", "retarded", "mongoloid",
  // antisemitic / extremist
  "hitlerwasright", "heilhitler", "whitepower", "gasjews",
];

/** Ordinary profanity: allowed, masked in the stored copy. */
const SOFT: string[] = ["fuck", "shit", "bitch", "cunt", "asshole", "bastard", "dick", "piss", "whore", "slut"];

/** Innocent words that contain a short slur as a prefix or substring. */
const ALLOW = new Set(["spices", "spicy", "suspicious", "suspicion", "retardant", "retardants", "auspicious", "chinking", "chinked"]);

/** Threats aimed at a person — blocked even without a slur. */
const THREATS = [
  /i\s*(will|am going to|ma going to)\s*(kill|hurt|stab|shoot|dox)/,
  /kill\s*(yourself|urself|your family)/,
  /dox(x)?\s*(him|her|them|you)/,
];

const TOKEN_SPLIT = /[^a-z0-9@$!]+/i;

/**
 * True when the text actually contains the term as a word (or the whole message
 * IS the term). Short terms must match exactly so "spices" doesn't trip "spic";
 * longer terms may be prefixed so "retarded" catches "retard".
 */
function containsTerm(text: string, term: string): boolean {
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
  /** Human-readable reason when blocked. */
  reason: string | null;
  /** Message with soft profanity masked. */
  cleaned: string;
};

export function screenMessage(raw: string): ScreenResult {
  const text = raw.trim();
  const flat = normalize(text);

  // "spic and span" is an ordinary phrase, not the slur.
  const phraseSafe = /\bspic\s+(and|n)\s+span\b/i.test(text);
  const slur = phraseSafe ? undefined : BLOCKED.find((w) => containsTerm(text, w));
  if (slur) {
    return { ok: false, reason: "That message contains a slur, so it can't be sent. Reword it and try again.", cleaned: text };
  }
  if (THREATS.some((re) => re.test(text.toLowerCase().replace(/\s+/g, " ")))) {
    return { ok: false, reason: "That reads as a threat against a person. Reports about the game are fine — threats aren't.", cleaned: text };
  }

  let cleaned = text;
  for (const word of SOFT) {
    const re = new RegExp(`\\b${word}(s|ed|ing|er|ers)?\\b`, "gi");
    cleaned = cleaned.replace(re, (m) => m[0] + "*".repeat(Math.max(1, m.length - 1)));
  }
  return { ok: true, reason: null, cleaned };
}
