import { DB } from "./brainrot-db";
import { GAME, SAMMY, UPDATES } from "./game-data";

/**
 * Instant answers for obvious questions — no AI call, no credits, no wait.
 * Returns null when the question needs the live web (news, leaks, anything unknown).
 */
type Rule = { test: RegExp; answer: () => string };

const latest = UPDATES[0]!;
const codes = DB.codes.filter((c) => c.status !== "expired").map((c) => c.code).join(", ");

const RULES: Rule[] = [
  { test: /\bcannelloni\b|hydra\s+dragon/, answer: () => "Hydra Dragon Cannelloni — Secret · $300M/s (formerly $350M/s) · cost $300B (formerly $350B) · Unobtainable (Fuse Machine)" },
  { test: /\bcats?\b|\bpet\b/, answer: () => "Nova" },
  { test: /(roblox )?(user ?name|handle|@)\b.*(sammy|owner|creator|dev)|(sammy|owner|creator).*(user ?name|handle)/, answer: () => `@${SAMMY.handle}` },
  { test: /(studio|company)/, answer: () => "Do Big Studios" },
  { test: /\bgroup\b/, answer: () => GAME.groupName },
  { test: /(what|which) (other )?games?.*(sammy|owner|creator|dev)|(sammy|owner|creator).*(other )?games/, answer: () => "Crab Game, Mining Clicker Simulator, Pixel Tower Defense; worked on Blade Ball, Race Clicker, Schedule and Fisch" },
  { test: /\b(owner|own|owns|creator|created|create|made|make|maker|developer|developers|dev|devs|founder)\b|who is sammy/, answer: () => "Sammy" },
  { test: /\b(released?|came out|come out|release date|launch(ed)?)\b/, answer: () => GAME.released },
  { test: /\b(taco tuesday|admin abuse)\b/, answer: () => "Saturdays after the update, and Tuesdays at 6 PM ET (Taco Tuesday)" },
  { test: /\b(newest|latest|last|recent|current) update\b|\bupdate (is )?(out|now)\b/, answer: () => `Update ${latest.n}: ${latest.title} (${latest.date})` },
  { test: /\b(next|upcoming) update\b|\bwhen.*\bupdates?\b|\bupdate (time|day)\b/, answer: () => "Every Saturday at 3 PM ET" },
  { test: /\bcodes?\b/, answer: () => (codes ? `${codes} (unconfirmed)` : "No known active codes") },
  { test: /\b(record|most players|peak|highest)\b/, answer: () => "25,868,678 players (Oct 11, 2025)" },
  { test: /\b(platforms?|console|xbox|playstation|ps5|mobile|phone)\b/, answer: () => "PC, Mac, mobile, PlayStation and Xbox" },
  { test: /\bhacker\b.*\bmutation\b|\bmutation\b.*\bhacker\b|\bhacker (multi|multiplier)\b/, answer: () => "15× (reported)" },
  { test: /\b(best|highest|strongest|top|newest|latest|new) mutation\b/, answer: () => "Hacker (15×, reported)" },
  { test: /\b(best|highest|rarest|top) rarity\b/, answer: () => "OG" },
];

/** Questions that must go to the live web even if they mention a known topic. */
const NEEDS_WEB = /\b(leak|leaks|leaked|rumou?r|news|today|tonight|right now|live|real name|age|old is|how many players|player count)\b/;

export function quickAnswer(question: string): string | null {
  const q = question.toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, " ").trim();
  if (!q || NEEDS_WEB.test(q)) return null;
  const bro = DB.bros.find((b) => q.includes(b.name.toLowerCase()));
  if (bro) return bro.recipe;
  for (const r of RULES) if (r.test.test(q)) return r.answer();
  return null;
}
