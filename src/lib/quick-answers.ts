import { DB } from "./brainrot-db";
import { GAME, UPDATES } from "./game-data";
import { UNITS } from "./codex-data";

/**
 * Instant answers for known game information.
 * Returns null when the question needs Gemini or live web research.
 */
type Rule = { test: RegExp; answer: () => string };

const latest = UPDATES[0]!;
const codes = DB.codes.filter((c) => c.status !== "expired").map((c) => c.code).join(", ");

const RULES: Rule[] = [
  { test: /\bcannelloni\b|hydra\s+dragon/, answer: () => "Hydra Dragon Cannelloni — Secret · $300M/s (formerly $350M/s) · cost $300B (formerly $350B) · Unobtainable (Fuse Machine)" },
  { test: /\b(favorite|favourite|fav)\s+(brainrot|unit)\b|\b(brainrot|unit)\b.*\b(favorite|favourite|fav)\b/, answer: () => "Meowl" },
  { test: /\b(favorite|favourite|fav)\s+mutation\b|\bmutation\b.*\b(favorite|favourite|fav)\b/, answer: () => "Unknown" },
  { test: /\bcats?\b|\bpet\b/, answer: () => "Nova" },
  { test: /(what is|what's|whats|tell me)\s+(your|my)?\s*(developer|real|roblox|personal)?\s*(name|handle)|\b(username|handle|@)\b.*\b(sammy|owner|creator|dev)\b|\b(sammy|owner|creator|dev)\b.*\b(username|handle|@)\b/, answer: () => "Sammy" },
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

/** Questions that need current information and must reach Gemini. */
const NEEDS_WEB =
  /\b(leak|leaks|leaked|rumou?r|news|today|tonight|right now|live|real name|age|old is|how many players|player count)\b/;

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

const NORMALIZED_UNITS = UNITS.map((unit) => ({
  unit,
  name: normalize(unit[0]),
}));

function formatUnit(unit: (typeof UNITS)[number]): string {
  return `${unit[0]} — ${unit[1]} · ${unit[2]}`;
}

function parseIncomeThreshold(question: string): number | null {
  const match = question.match(
    /(?:more than|greater than|above|over|at least|under|below|less than|fewer than)\s*\$?\s*([\d,.]+)\s*(billion|million|thousand|[kmb])?\b/i
  );

  if (!match) return null;

  const amount = Number(match[1]!.replace(/,/g, ""));
  if (!Number.isFinite(amount)) return null;

  const suffix = (match[2] ?? "").toLowerCase();

  const multiplier =
    suffix === "b" || suffix === "billion" ? 1_000_000_000 :
    suffix === "m" || suffix === "million" ? 1_000_000 :
    suffix === "k" || suffix === "thousand" ? 1_000 :
    1;

  return amount * multiplier;
}

function answerFromCatalog(question: string): string | null {
  const q = normalize(question);
  if (!q) return null;

  // Top/highest income questions.
  const asksTop =
    /\b(top|richest|highest income|most expensive|best earning|strongest)\b/.test(q) &&
    /\b(brainrots?|units?|earners?)\b/.test(q);

  if (asksTop) {
    const countMatch = q.match(/\btop\s+(\d{1,2})\b/);
    const count = Math.min(10, Math.max(1, Number(countMatch?.[1] ?? 5)));

    const top = [...UNITS]
      .sort((a, b) => b[3] - a[3])
      .slice(0, count);

    return top.map((unit, index) => `${index + 1}. ${formatUnit(unit)}`).join("\n");
  }

  // Income threshold questions.
  const threshold = parseIncomeThreshold(question);
  const asksThreshold =
    threshold !== null &&
    /\b(brainrots?|units?)\b/.test(q) &&
    /\b(more than|greater than|above|over|at least|under|below|less than|fewer than)\b/.test(q);

  if (asksThreshold && threshold !== null) {
    const isLowerLimit = /\b(more than|greater than|above|over|at least)\b/.test(q);

    const matches = UNITS
      .filter((unit) => isLowerLimit ? unit[3] >= threshold : unit[3] < threshold)
      .sort((a, b) => b[3] - a[3])
      .slice(0, 15);

    if (!matches.length) return "No Brainrots in the catalog match that income range.";

    return matches.map(formatUnit).join("\n");
  }

  // Match a Brainrot by its full name, not a loose partial fragment.
  const paddedQuestion = ` ${q} `;
  const matches = NORMALIZED_UNITS
    .filter((entry) =>
      entry.name.length >= 4 &&
      paddedQuestion.includes(` ${entry.name} `)
    )
    .sort((a, b) => b.name.length - a.name.length);

  if (!matches.length) return null;

  const best = matches[0]!;

  // If two equally specific names match, avoid guessing.
  if (matches[1] && matches[1].name.length === best.name.length) {
    return null;
  }

  const asksIncome = /\b(income|earn|earns|earning|make|makes|making|per second|\/s|money)\b/.test(q);
  const asksRarity = /\b(rarity|rare|rarity is|tier)\b/.test(q);
  const asksExist = /\b(exist|exists|how many|count|quantity|stock)\b/.test(q);

  if (asksIncome && asksRarity) return formatUnit(best.unit);
  if (asksIncome) return `${best.unit[0]} makes ${best.unit[2]}.`;
  if (asksRarity) return `${best.unit[0]} is ${best.unit[1]} rarity.`;

  if (asksExist) {
    const exist = best.unit[6];
    return exist == null
      ? `The recorded existence count for ${best.unit[0]} is unknown.`
      : `${best.unit[0]} has ${exist.toLocaleString("en-US")} recorded exists.`;
  }

  return formatUnit(best.unit);
}

export function quickAnswer(question: string): string | null {
  const q = question
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  if (!q || NEEDS_WEB.test(q)) return null;

  const bro = DB.bros.find((b) => q.includes(b.name.toLowerCase()));
  if (bro) return bro.recipe;

  const catalogAnswer = answerFromCatalog(question);
  if (catalogAnswer) return catalogAnswer;

  for (const rule of RULES) {
    if (rule.test.test(q)) return rule.answer();
  }

  return null;
}
