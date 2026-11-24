import { DB } from "./brainrot-db";
import { GAME, UPDATES } from "./game-data";
import { UNITS } from "./codex-data";

type Rule = { test: RegExp; answer: () => string };

const latest = UPDATES[0]!;
const codes = DB.codes
  .filter((c) => c.status !== "expired")
  .map((c) => c.code)
  .join(", ");

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

// Only send genuinely time-sensitive questions to the AI/web.
const NEEDS_WEB =
  /\b(leaks?|leaked|rumou?rs?|news|today|tonight|right now|currently|live|latest leaks?|upcoming leaks?)\b/;

const RULES: Rule[] = [
  {
    test: /\b(favorite|favourite|fav)\s+(brainrot|unit)\b|\b(brainrot|unit)\b.*\b(favorite|favourite|fav)\b/,
    answer: () => "Meowl",
  },
  {
    test: /\b(favorite|favourite|fav)\s+mutation\b|\bmutation\b.*\b(favorite|favourite|fav)\b/,
    answer: () => "Unknown",
  },
  {
    test: /\bcannelloni\b|hydra\s+dragon/,
    answer: () =>
      "Hydra Dragon Cannelloni — Secret · $300M/s · $300B cost · Unobtainable (Fuse Machine)",
  },
  {
    test: /\b(cat|cats|pet)\b/,
    answer: () => "Nova",
  },
  {
    test: /\b(username|handle)\b|\bwhat is (your|sammy'?s) name\b|\bwho is sammy\b/,
    answer: () => "Sammy",
  },
  {
    test: /\bstudio\b|\bcompany\b/,
    answer: () => "Do Big Studios",
  },
  {
    test: /\bgroup\b/,
    answer: () => GAME.groupName,
  },
  {
    test: /\b(owner|creator|founder|developer)\b/,
    answer: () => "Sammy",
  },
  {
    test: /\brelease date\b|\bwhen was .* released\b|\bwhen did .* release\b/,
    answer: () => GAME.released,
  },
  {
    test: /\btaco tuesday\b|\badmin abuse schedule\b/,
    answer: () =>
      "Saturdays after the update, and Tuesdays at 6 PM ET (Taco Tuesday)",
  },
  {
    test: /\b(newest|latest|last|recent|current) update\b|\bupdate (is )?(out|now)\b/,
    answer: () => `Update ${latest.n}: ${latest.title} (${latest.date})`,
  },
  {
    test: /\b(next|upcoming) update\b|\bwhen.*\bupdates?\b|\bupdate (time|day)\b/,
    answer: () => "Every Saturday at 3 PM ET",
  },
  {
    test: /\bactive codes?\b|\bany codes?\b|\bgame codes?\b/,
    answer: () => (codes ? `${codes} (unconfirmed)` : "No known active codes"),
  },
  {
    // Do not match generic words such as "highest-earning Brainrots".
    test: /\b(world|guinness|concurrent players|player record|record for most players|most players ever)\b/,
    answer: () => "25,868,678 players (Oct 11, 2025)",
  },
  {
    test: /\b(platforms?|console|xbox|playstation|ps5|mobile|phone)\b/,
    answer: () => "PC, Mac, mobile, PlayStation and Xbox",
  },
  {
    test: /\bhacker\b.*\bmutation\b|\bmutation\b.*\bhacker\b/,
    answer: () => "15× (reported)",
  },
  {
    test: /\b(best|highest|strongest|top) mutation\b/,
    answer: () => "Hacker (15×, reported)",
  },
  {
    test: /\b(best|highest|rarest|top) rarity\b/,
    answer: () => "OG",
  },
];

function formatUnit(unit: (typeof UNITS)[number]): string {
  const [name, rarity, income, , , , exists] = unit;

  const existsText =
    exists == null ? "Exists: unknown" : `Exists: ${exists.toLocaleString("en-US")}`;

  return `${name} — ${rarity} — ${income} — ${existsText}`;
}

function getRequestedCount(question: string): number {
  const match = question.match(/\btop\s+(\d{1,2})\b|\b(\d{1,2})\s+(?:best|highest|richest)\b/i);
  const value = Number(match?.[1] ?? match?.[2] ?? 5);

  return Math.min(20, Math.max(1, value));
}

function answerFromCatalog(question: string): string | null {
  const q = normalize(question);
  if (!q) return null;

  const asksRanking =
    /\b(top|richest|highest earning|highest income|most profitable|best earning)\b/.test(q) &&
    /\b(brainrot|brainrots|unit|units|earner|earners)\b/.test(q);

  if (asksRanking) {
    const count = getRequestedCount(q);

    return [...UNITS]
      .sort((a, b) => b[3] - a[3])
      .slice(0, count)
      .map((unit, index) => `${index + 1}. ${formatUnit(unit)}`)
      .join("\n");
  }

  const thresholdMatch = q.match(
    /\b(over|above|more than|greater than|at least|under|below|less than)\s+\$?([\d,.]+)\s*(billion|million|thousand|[kmb])?\b/
  );

  if (thresholdMatch && /\b(brainrots?|units?)\b/.test(q)) {
    const amount = Number(thresholdMatch[2]!.replace(/,/g, ""));
    const suffix = thresholdMatch[3] ?? "";

    const multiplier =
      suffix === "b" || suffix === "billion" ? 1_000_000_000 :
      suffix === "m" || suffix === "million" ? 1_000_000 :
      suffix === "k" || suffix === "thousand" ? 1_000 :
      1;

    const threshold = amount * multiplier;
    const lower = ["under", "below", "less than"].includes(thresholdMatch[1]!);

    const matches = UNITS
      .filter((unit) => lower ? unit[3] < threshold : unit[3] >= threshold)
      .sort((a, b) => b[3] - a[3])
      .slice(0, 20);

    return matches.length
      ? matches.map(formatUnit).join("\n")
      : "No Brainrots in the catalog match that income range.";
  }

  // Match the longest catalog name first to avoid partial-name collisions.
  const padded = ` ${q} `;
  const matches = [...UNITS]
    .filter(([name]) => {
      const normalizedName = normalize(name);
      return normalizedName.length >= 4 &&
        padded.includes(` ${normalizedName} `);
    })
    .sort((a, b) => normalize(b[0]).length - normalize(a[0]).length);

  if (!matches.length) return null;

  const best = matches[0]!;

  // If two names are equally specific, let Gemini interpret the question.
  if (matches[1] && normalize(matches[1][0]).length === normalize(best[0]).length) {
    return null;
  }

  const asksIncome = /\b(income|earn|earns|earning|make|makes|making|per second|money)\b/.test(q);
  const asksRarity = /\b(rarity|rare|tier)\b/.test(q);
  const asksExists = /\b(exist|exists|how many|count|quantity|stock)\b/.test(q);

  if (asksIncome && asksRarity) return formatUnit(best);
  if (asksIncome) return `${best[0]} makes ${best[2]}.`;
  if (asksRarity) return `${best[0]} is ${best[1]} rarity.`;

  if (asksExists) {
    return best[6] == null
      ? `The recorded existence count for ${best[0]} is unknown.`
      : `${best[0]} has ${best[6].toLocaleString("en-US")} recorded exists.`;
  }

  return formatUnit(best);
}

export function quickAnswer(question: string): string | null {
  const q = normalize(question);

  if (!q || NEEDS_WEB.test(q)) return null;

  // Handle catalog questions before broad general rules.
  const catalogAnswer = answerFromCatalog(question);
  if (catalogAnswer) return catalogAnswer;

  // Exact Brainrot Bros recipe lookup.
  const bro = DB.bros.find((b) => q.includes(normalize(b.name)));
  if (bro) return bro.recipe;

  for (const rule of RULES) {
    if (rule.test.test(q)) return rule.answer();
  }

  return null;
}
