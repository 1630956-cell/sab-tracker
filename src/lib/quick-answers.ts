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
    income:
      /\b(income|earn|earns|earning|per second|money|makes|make|making|\/s)\b/.test(q),
    rarity: /\b(rarity|rarities|rare|tier)\b/.test(q),
    exists:
      /\b(exist|exists|existing|how many|count|quantity|stock|owned)\b/.test(q),
  };
}

/** Format numbers without thousands separators. */
function plainNumber(value: number): string {
  return Number.isFinite(value) ? String(value) : "Unknown";
}

/** Only return the fields the user actually requested. */
function formatUnit(
  unit: Unit,
  fields: ReturnType<typeof requestedFields>,
  includeName = false
): string {
  const parts: string[] = [];

  if (fields.rarity) parts.push(unit[1] || "Unknown");
  if (fields.income) parts.push(unit[2] || "Unknown");

  if (fields.exists) {
    parts.push(unit[6] == null ? "Unknown" : plainNumber(unit[6]));
  }

  const values = parts.join(" · ");

  return includeName
    ? `${unit[0]}${values ? ` — ${values}` : ""}`
    : values;
}

/** Calculate edit distance for cautious typo matching. */
function editDistance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    let previous = row[0]!;
    row[0] = i;

    for (let j = 1; j <= b.length; j++) {
      const old = row[j]!;
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;

      row[j] = Math.min(
        row[j]! + 1,
        row[j - 1]! + 1,
        previous + cost
      );

      previous = old;
    }
  }

  return row[b.length]!;
}

/**
 * Find a Brainrot mentioned in the question.
 * Exact full-name matches always win.
 * Fuzzy matching is only used when the result is clearly unique.
 */
function findUnit(question: string): Unit | null {
  const q = normalize(question);
  if (!q) return null;

  const padded = ` ${q} `;

  const exactMatches = UNITS
    .filter((unit) => {
      const name = normalize(unit[0]);
      return name.length >= 3 && padded.includes(` ${name} `);
    })
    .sort(
      (a, b) =>
        normalize(b[0]).length - normalize(a[0]).length
    );

  if (exactMatches.length > 0) {
    const best = exactMatches[0]!;
    const second = exactMatches[1];

    if (
      second &&
      normalize(second[0]).length === normalize(best[0]).length
    ) {
      return null;
    }

    return best;
  }

  const questionWords = q.split(" ");
  const candidates: { unit: Unit; score: number }[] = [];

  for (const unit of UNITS) {
    const nameWords = normalize(unit[0]).split(" ");

    if (nameWords.some((word) => word.length < 3)) continue;
    if (nameWords.length > questionWords.length) continue;

    let bestScore = 0;

    for (
      let start = 0;
      start <= questionWords.length - nameWords.length;
      start++
    ) {
      const phrase = questionWords.slice(
        start,
        start + nameWords.length
      );

      let total = 0;
      let valid = true;

      for (let i = 0; i < nameWords.length; i++) {
        const expected = nameWords[i]!;
        const actual = phrase[i]!;

        if (expected === actual) {
          total += 1;
          continue;
        }

        // Do not fuzzy-match short words.
        if (expected.length < 5 || actual.length < 5) {
          valid = false;
          break;
        }

        const distance = editDistance(expected, actual);
        const similarity =
          1 - distance / Math.max(expected.length, actual.length);

        if (similarity < 0.8) {
          valid = false;
          break;
        }

        total += similarity;
      }

      if (valid) {
        bestScore = Math.max(
          bestScore,
          total / nameWords.length
        );
      }
    }

    if (bestScore >= 0.8) {
      candidates.push({ unit, score: bestScore });
    }
  }

  candidates.sort((a, b) => b.score - a.score);

  const best = candidates[0];
  const second = candidates[1];

  if (!best) return null;

  // Refuse ambiguous guesses instead of returning the wrong Brainrot.
  if (second && best.score - second.score < 0.08) {
    return null;
  }

  return best.unit;
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

    const rankingFields = {
      income: fields.income,
      rarity: fields.rarity,
      exists: fields.exists,
    };

    // A ranking must show the names, even if only one stat was requested.
    return [...UNITS]
      .filter((unit) => Number.isFinite(unit[3]))
      .sort((a, b) => b[3] - a[3])
      .slice(0, count)
      .map(
        (unit, index) =>
          `${index + 1}. ${formatUnit(unit, rankingFields, true)}`
      )
      .join("\n");
  }

  const thresholdMatch = q.match(
    /\b(over|above|more than|greater than|at least|under|below|less than)\s+\$?([\d,.]+)\s*(billion|million|thousand|[kmb])?\b/
  );

  if (
    thresholdMatch &&
    /\b(brainrots?|units?)\b/.test(q)
  ) {
    const amount = Number(
      thresholdMatch[2]!.replace(/,/g, "")
    );

    const suffix = thresholdMatch[3] ?? "";

    const multiplier =
      suffix === "b" || suffix === "billion"
        ? 1_000_000_000
        : suffix === "m" || suffix === "million"
          ? 1_000_000
          : suffix === "k" || suffix === "thousand"
            ? 1_000
            : 1;

    const threshold = amount * multiplier;

    const lower = [
      "under",
      "below",
      "less than",
    ].includes(thresholdMatch[1]!);

    const matches = UNITS
      .filter((unit) =>
        lower ? unit[3] < threshold : unit[3] >= threshold
      )
      .sort((a, b) => b[3] - a[3])
      .slice(0, 20);

    return matches.length
      ? matches
          .map((unit) => formatUnit(unit, fields, true))
          .join("\n")
      : "No Brainrots match that income range.";
  }

  const unit = findUnit(question);
  if (!unit) return null;

  if (fields.income || fields.rarity || fields.exists) {
    // Single-Brainrot answers contain only requested values.
    // Example: "OG · 4037", not "Meowl — OG · 4037".
    return formatUnit(unit, fields);
  }

  return null;
}

function bestObtainableOGAnswer(): string {
  const candidates = UNITS.filter((unit) => {
    const [name, rarity, , perSec, obtain] = unit;
    const method = obtain.toLowerCase();

    return (
      rarity === "OG" &&
      perSec > 0 &&
      method.includes("red carpet spawn") &&
      !/\b(retired|unobtainable|never spawns|discontinued)\b/i.test(method)
    );
  });

  candidates.sort((a, b) => b[3] - a[3]);

  const best = candidates[0];
  if (!best) return "Unknown";

  const exist = best[6] == null ? "Unknown" : String(best[6]);

  return `${best[0]} · ${exist} · Sammy`;
}

const RULES: Rule[] = [
  {
    test: /\b(best|strongest|highest|top)\b.*\b(obtainable|obtain|available)\b.*\bog\b|\bog\b.*\b(best|strongest|highest|top)\b.*\b(obtainable|obtain|available)\b/i,
    answer: bestObtainableOGAnswer,
  },
  {
    test:
      /\b(favorite|favourite|fav)\s+(brainrot|unit)\b|\b(brainrot|unit)\b.*\b(favorite|favourite|fav)\b/,
    answer: () => "Meowl",
  },
  {
    test:
      /\b(favorite|favourite|fav)\s+mutation\b|\bmutation\b.*\b(favorite|favourite|fav)\b/,
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
    test:
      /\brelease date\b|\bwhen was .* released\b|\bwhen did .* release\b/,
    answer: () => GAME.released,
  },
  {
    test: /\btaco tuesday\b|\badmin abuse\b/,
    answer: () =>
      "Saturdays after the update, and Tuesdays at 6 PM ET (Taco Tuesday)",
  },
  {
    test:
      /\b(newest|latest|last|recent|current) update\b|\bupdate (is )?(out|now)\b/,
    answer: () =>
      `Update ${latest.n}: ${latest.title} (${latest.date})`,
  },
  {
    test:
      /\b(next|upcoming) update\b|\bwhen.*\bupdates?\b|\bupdate (time|day)\b/,
    answer: () => "Every Saturday at 3 PM ET",
  },
  {
    test: /\bactive codes?\b|\bany codes?\b|\bgame codes?\b/,
    answer: () => codes || "No known active codes",
  },
  {
    test:
      /\b(player record|record for most players|most players ever|peak player count|concurrent players)\b/,
    answer: () => "25868678 players (Oct 11, 2025)",
  },
  {
    test:
      /\b(platforms?|console|xbox|playstation|ps5|mobile|phone)\b/,
    answer: () => "PC, Mac, mobile, PlayStation and Xbox",
  },
  {
    test:
      /\bhacker\b.*\bmutation\b|\bmutation\b.*\bhacker\b/,
    answer: () => "15× (reported)",
  },
  {
    test:
      /\b(best|highest|strongest|top) mutation\b/,
    answer: () => "Hacker (15×, reported)",
  },
  {
    test:
      /\b(best|highest|rarest|top) rarity\b/,
    answer: () => "OG",
  },
];

export function quickAnswer(question: string): string | null {
  const q = normalize(question);

  if (!q || NEEDS_WEB.test(q)) return null;

  // Catalog facts always get checked before general rules.
  const catalogAnswer = answerFromCatalog(question);
  if (catalogAnswer) return catalogAnswer;

  const bro = DB.bros.find((b) =>
    q.includes(normalize(b.name))
  );

  if (bro) return bro.recipe;

  for (const rule of RULES) {
    if (rule.test.test(q)) return rule.answer();
  }

  return null;
}
