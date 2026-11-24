import { DB } from "./brainrot-db";
import { GAME, UPDATES } from "./game-data";
import { UNITS } from "./codex-data";

type Rule = { test: RegExp; answer: () => string };
type Unit = (typeof UNITS)[number];

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

const NEEDS_WEB =
  /\b(leaks?|leaked|rumou?rs?|news|today|tonight|right now|currently|live|real name|age|player count|how many players)\b/;

function requestedFields(q: string) {
  return {
    income: /\b(income|earn|earns|earning|per second|money|makes|make|\/s)\b/.test(q),
    rarity: /\b(rarity|rarities|rare|tier)\b/.test(q),
    exists: /\b(exist|exists|existing|how many|count|quantity|stock)\b/.test(q),
  };
}

function formatUnit(
  unit: Unit,
  fields: ReturnType<typeof requestedFields>,
  includeName = false
): string {
  const parts: string[] = [];

  if (fields.rarity) parts.push(unit[1]);
  if (fields.income) parts.push(unit[2] || "Unknown");

  if (fields.exists) {
    parts.push(
      unit[6] == null
        ? "Unknown"
        : unit[6].toLocaleString("en-US")
    );
  }

  const values = parts.join(" · ");
  return includeName ? `${unit[0]}${values ? ` — ${values}` : ""}` : values;
}

function getRequestedCount(q: string): number {
  const match =
    q.match(/\btop\s+(\d{1,2})\b/) ??
    q.match(/\b(\d{1,2})\s+(?:richest|highest|best)\b/);

  return Math.min(20, Math.max(1, Number(match?.[1] ?? 5)));
}

function answerFromCatalog(question: string): string | null {
  const q = normalize(question);
  if (!q) return null;

  const fields = requestedFields(q);

  const asksRanking =
    /\b(top|richest|highest earning|highest income|most profitable|best earning)\b/.test(q) &&
    /\b(brainrot|brainrots|unit|units|earner|earners)\b/.test(q);

  if (asksRanking) {
    const count = getRequestedCount(q);

    return [...UNITS]
      .filter((unit) => Number.isFinite(unit[3]))
      .sort((a, b) => b[3] - a[3])
      .slice(0, count)
      .map((unit, index) => `${index + 1}. ${formatUnit(unit, fields, true)}`)
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
      ? matches.map((unit) => formatUnit(unit, fields, true)).join("\n")
      : "No Brainrots match that income range.";
  }

  const padded = ` ${q} `;

  const matches = [...UNITS]
    .filter((unit) => {
      const name = normalize(unit[0]);
      return name.length >= 4 && padded.includes(` ${name} `);
    })
    .sort((a, b) => normalize(b[0]).length - normalize(a[0]).length);

  if (!matches.length) return null;

  const best = matches[0]!;

  if (
    matches[1] &&
    normalize(matches[1][0]).length === normalize(best[0]).length
  ) {
    return null;
  }

  if (fields.income || fields.rarity || fields.exists) {
    return formatUnit(best, fields);
  }

  return null;
}

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
    test: /\bcannelloni\b|hydra dragon/,
    answer: () => "Hydra Dragon Cannelloni — Secret — $300M/s",
  },
  {
    test: /\b(cat|cats|pet)\b/,
    answer: () => "Nova",
  },
  {
    test: /\b(username|handle)\b|\bwho is sammy\b/,
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
    test: /\btaco tuesday\b|\badmin abuse\b/,
    answer: () => "Saturdays after the update, and Tuesdays at 6 PM ET (Taco Tuesday)",
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
    answer: () => codes || "No known active codes",
  },
  {
    test: /\b(player record|record for most players|most players ever|peak player count|concurrent players)\b/,
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

export function quickAnswer(question: string): string | null {
  const q = normalize(question);

  if (!q || NEEDS_WEB.test(q)) return null;

  const catalogAnswer = answerFromCatalog(question);
  if (catalogAnswer) return catalogAnswer;

  const bro = DB.bros.find((b) => q.includes(normalize(b.name)));
  if (bro) return bro.recipe;

  for (const rule of RULES) {
    if (rule.test.test(q)) return rule.answer();
  }

  return null;
}
