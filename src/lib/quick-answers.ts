import { DB } from "./brainrot-db";
import { GAME, UPDATES } from "./game-data";
import { UNITS } from "./codex-data";
import { existsForWithAdditional } from "./mutation-exists-additional";
import { MUTATIONS } from "./mutations";

type Rule = { test: RegExp; answer: () => string };
type Unit = (typeof UNITS)[number];

const latest = UPDATES[0]!;
const codes = DB.codes.filter((c) => c.status === "active").map((c) => c.code).join(", ");

function normalize(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

const NEEDS_WEB = /\b(leaks?|leaked|rumou?rs?|news|today|tonight|right now|currently|live|real name|age|player count|how many players)\b/;

const SAMMY_FACTS = {
  name: "Sammy",
  favoriteBrainrot: "Meowl",
  favoriteMutation: "Ying Yang",
} as const;

export function getSammyPersonalFactsAnswer(question: string): string | null {
  const q = question.toLowerCase();
  const facts: { key: string; position: number; answer: string }[] = [];

  const nameMatch = /\b(my name|what(?:'s| is) my name|who am i|my username|what(?:'s| is) my username|my handle|what(?:'s| is) my handle)\b/.exec(q);

  const catMatch = /\b(?:my\s+)?(?:cat|cats|pet)(?:'s)?\s+(?:name|called)\b|\b(?:what(?:'s| is)|tell me)\b.*\b(?:my\s+)?(?:cat|cats|pet)\b/i.exec(q);

  const brainrotMatch = /\b(?:my\s+)?fav(?:ou?rite)?\s+(?:brainrot|brain\s?rot)\b|\b(?:brainrot|brain\s?rot)\s+(?:is\s+)?my fav(?:ou?rite)?\b/.exec(q);

  const mutationMatch = /\b(?:my\s+)?fav(?:ou?rite)?\s+mutation\b|\bmutation\s+(?:is\s+)?my fav(?:ou?rite)?\b/.exec(q);

  if (nameMatch) facts.push({ key: "name", position: nameMatch.index, answer: SAMMY_FACTS.name });
  if (catMatch) facts.push({ key: "cat", position: catMatch.index, answer: "Nova" });
  if (brainrotMatch) facts.push({ key: "brainrot", position: brainrotMatch.index, answer: SAMMY_FACTS.favoriteBrainrot });
  if (mutationMatch) facts.push({ key: "mutation", position: mutationMatch.index, answer: SAMMY_FACTS.favoriteMutation });

  facts.sort((a, b) => a.position - b.position);

  return facts.length
    ? [...new Map(facts.map((fact) => [fact.key, fact.answer])).values()].join(", ")
    : null;
}

function requestedFields(q: string) {
  return {
    income: /\b(income|earn|earns|earning|per second|money|makes|make|making|\/s)\b/.test(q),
    rarity: /\b(rarity|rarities|rare|tier|what rarity|which rarity|what tier|which tier)\b/.test(q)
      || /\b(?:is|are)\b.*\b(?:an? )?(?:og|secret|brainrot)\b/.test(q),
    exists: /\b(exist|exists|existing|how many|count|quantity|stock|owned)\b/.test(q),
  };
}

function plainNumber(value: number): string { return Number.isFinite(value) ? String(value) : "Unknown"; }

function formatUnit(unit: Unit, fields: ReturnType<typeof requestedFields>, includeName = false): string {
  const parts: string[] = [];
  if (fields.rarity) parts.push(unit[1] || "Unknown");
  if (fields.income) parts.push(unit[2] || "Unknown");
  if (fields.exists) parts.push(unit[6] == null ? "Unknown" : plainNumber(unit[6]));
  const values = parts.join(" · ");
  return includeName ? `${unit[0]}${values ? ` — ${values}` : ""}` : values;
}

function findAllUnits(question: string, units: Unit[]): Unit[] {
  const normalizedQuestion = question.toLowerCase().replace(/[^a-z0-9]/g, " ");
  const matches = units.filter((unit) => normalizedQuestion.includes(unit[0].toLowerCase().replace(/[^a-z0-9]/g, " ")));
  return [...new Map(matches.map((unit) => [unit[0], unit])).values()];
}

function findRequestedMutation(q: string): string | null {
  return MUTATIONS.map((mutation) => mutation.name).find((name) => ` ${q} `.includes(` ${normalize(name)} `)) ?? null;
}

function editDistance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0]!;
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const old = row[j]!;
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j]! + 1, row[j - 1]! + 1, previous + cost);
      previous = old;
    }
  }
  return row[b.length]!;
}

function findUnit(question: string): Unit | null {
  const q = normalize(question);
  if (!q) return null;
  const padded = ` ${q} `;
  const exactMatches = UNITS.filter((unit) => {
    const name = normalize(unit[0]);
    return name.length >= 3 && padded.includes(` ${name} `);
  }).sort((a, b) => normalize(b[0]).length - normalize(a[0]).length);
  if (exactMatches.length > 0) {
    const best = exactMatches[0]!;
    const second = exactMatches[1];
    if (second && normalize(second[0]).length === normalize(best[0]).length) return null;
    return best;
  }
  const questionWords = q.split(" ");
  const candidates: { unit: Unit; score: number }[] = [];
  for (const unit of UNITS) {
    const nameWords = normalize(unit[0]).split(" ");
    if (nameWords.some((word) => word.length < 3) || nameWords.length > questionWords.length) continue;
    let bestScore = 0;
    for (let start = 0; start <= questionWords.length - nameWords.length; start++) {
      const phrase = questionWords.slice(start, start + nameWords.length);
      let total = 0;
      let valid = true;
      for (let i = 0; i < nameWords.length; i++) {
        const expected = nameWords[i]!;
        const actual = phrase[i]!;
        if (expected === actual) { total += 1; continue; }
        if (expected.length < 5 || actual.length < 5) { valid = false; break; }
        const distance = editDistance(expected, actual);
        const similarity = 1 - distance / Math.max(expected.length, actual.length);
        if (similarity < 0.8) { valid = false; break; }
        total += similarity;
      }
      if (valid) bestScore = Math.max(bestScore, total / nameWords.length);
    }
    if (bestScore >= 0.8) candidates.push({ unit, score: bestScore });
  }
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  const second = candidates[1];
  if (!best || (second && best.score - second.score < 0.08)) return null;
  return best.unit;
}

function getRequestedCount(q: string): number {
  const match = q.match(/\btop\s+(\d{1,2})\b/) ?? q.match(/\b(\d{1,2})\s+(?:richest|highest|best)\b/);
  return Math.min(20, Math.max(1, Number(match?.[1] ?? 5)));
}

function bestSecretAnswer(): string {
  const bestSecret = UNITS.filter((unit) => unit[1].toLowerCase() === "secret").sort((a, b) => b[3] - a[3])[0];
  return bestSecret ? `Best Secret:\n${bestSecret[0]} — ${bestSecret[2]}.` : "Best Secret: Unknown.";
}

function answerFromCatalog(question: string): string | null {
  const q = normalize(question);
  if (!q) return null;
  const fields = requestedFields(q);
  const asksRanking = /\b(top|richest|highest earning|highest income|most profitable|best earning)\b/.test(q) && /\b(brainrot|brainrots|unit|units|earner|earners)\b/.test(q);
  if (asksRanking) {
    const count = getRequestedCount(q);
    const rankingFields = { income: fields.income, rarity: fields.rarity, exists: fields.exists };
    return [...UNITS].filter((unit) => Number.isFinite(unit[3])).sort((a, b) => b[3] - a[3]).slice(0, count).map((unit, index) => `${index + 1}. ${formatUnit(unit, rankingFields, true)}`).join("\n");
  }
  const thresholdMatch = q.match(/\b(over|above|more than|greater than|at least|under|below|less than)\s+\$?([\d,.]+)\s*(billion|million|thousand|[kmb])?\b/);
  if (thresholdMatch && /\b(brainrots?|units?)\b/.test(q)) {
    const amount = Number(thresholdMatch[2]!.replace(/,/g, ""));
    const suffix = thresholdMatch[3] ?? "";
    const multiplier = suffix === "b" || suffix === "billion" ? 1_000_000_000 : suffix === "m" || suffix === "million" ? 1_000_000 : suffix === "k" || suffix === "thousand" ? 1_000 : 1;
    const threshold = amount * multiplier;
    const lower = ["under", "below", "less than"].includes(thresholdMatch[1]!);
    const matches = UNITS.filter((unit) => lower ? unit[3] < threshold : unit[3] >= threshold).sort((a, b) => b[3] - a[3]).slice(0, 20);
    return matches.length ? matches.map((unit) => formatUnit(unit, fields, true)).join("\n") : "No Brainrots match that income range.";
  }
  const asksBestOG = /\b(best|strongest|highest|top)\b/.test(q) && /\bog\b/.test(q) && /\b(obtainable|obtain|available)\b/.test(q);
  const asksBestSecret = /\b(best|highest|strongest|top)\b/.test(q) && /\bsecret\b/.test(q);
  const asksUserName = /\bmy name\b|\bwho am i\b|\buser s name\b/.test(q);
  const mutation = fields.exists ? findRequestedMutation(q) : null;
  const mentionedUnits = findAllUnits(question, UNITS);
  const fallbackUnit = mentionedUnits.length ? null : findUnit(question);
  const units = mentionedUnits.length ? mentionedUnits : fallbackUnit ? [fallbackUnit] : [];
  if (asksBestOG || asksBestSecret || asksUserName) {
    const answers: string[] = [];
    if (asksBestOG) answers.push(`Best currently obtainable OG: ${bestObtainableOGAnswer()}`);
    if (asksBestSecret) answers.push(bestSecretAnswer());
    if (fields.income || fields.rarity || fields.exists) {
      for (const unit of units) {
        const unitFields = { ...fields, exists: fields.exists && !mutation };
        const details = formatUnit(unit, unitFields);
        if (details) answers.push(`${unit[0]}: ${details}${mutation ? "" : "."}`);
        if (mutation) {
          const count = existsForWithAdditional(unit[0], mutation);
          answers.push(`${unit[0]} ${mutation} existence: ${count === null ? "—" : String(count)}.`);
        }
      }
    }
    return answers.join("\n");
  }
  if (fields.income || fields.rarity || fields.exists) {
    if (!units.length) return null;
    const unitAnswers = units.map((unit) => {
      if (fields.exists && mutation) {
        const count = existsForWithAdditional(unit[0], mutation);
        const otherDetails = formatUnit(unit, { ...fields, exists: false });
        const stats = [...(otherDetails ? [otherDetails] : []), `${mutation} existence: ${count === null ? "—" : String(count)}`];
        return `${unit[0]} — ${stats.join(" · ")}`;
      }
      return formatUnit(unit, fields, units.length > 1);
    });
    return units.length > 1 || (fields.exists && mutation) ? unitAnswers.join("\n") : unitAnswers[0]!;
  }
  return null;
}

function isConfirmedObtainableOG(unit: Unit): boolean {
  const rarity = String(unit[1]).toLowerCase();
  const obtain = String(unit[4] ?? "").toLowerCase();
  if (rarity !== "og") return false;
  const unavailableTerms = ["never spawns", "retired", "unobtainable", "discontinued", "removed", "never obtainable", "no longer obtainable", "admin abuse event only"];
  return !unavailableTerms.some((term) => obtain.includes(term));
}

function bestObtainableOGAnswer(): string {
  const best = UNITS.filter(isConfirmedObtainableOG).sort((a, b) => b[3] - a[3])[0];
  if (!best) return "Strawberry Elephant ($750M/s) with 1,269 exist (Red Carpet spawn).";
  return `${best[0]} (${best[2]}) with ${best[6] ? best[6].toLocaleString() : "unpublished"} exist (${best[4] || "Red Carpet spawn"}).`;
}

const RULES: Rule[] = [
  { test: /\b(best|strongest|highest|top)\b.*\b(obtainable|obtain|available)\b.*\bog\b|\bog\b.*\b(best|strongest|highest|top)\b.*\b(obtainable|obtain|available)\b/i, answer: bestObtainableOGAnswer },
  { test: /\b(?:what is|what's|tell me)\b.*\b(?:my )?(?:favorite|favourite|fav)\s+(?:brainrot|unit)\b|\bmy (?:favorite|favourite|fav)\s+(?:brainrot|unit)\b/i, answer: () => "Meowl" },
  { test: /\b(?:what is|what's|tell me)\b.*\b(?:my )?(?:favorite|favourite|fav)\s+mutation\b|\bmy (?:favorite|favourite|fav)\s+mutation\b/i, answer: () => "Ying Yang" },
  { test: /\bcannelloni\b|hydra dragon/, answer: () => "Hydra Dragon Cannelloni — Secret — $300M/s" },
{ test: /\b(?:what is|what's|name|who is|which is)\b.*\b(?:my )?(?:cat|cats|pet)(?:'s)?\b|\b(?:my )?(?:cat|cats|pet)(?:'s)?\b.*\b(?:name|called|is it)\b/i, answer: () => "Nova" },
  { test: /\b(?:username|handle)\b|\bwho is sammy\b/i, answer: () => "Sammy" },
  { test: /\bstudio\b|\bcompany\b/, answer: () => "Do Big Studios" },
  { test: /\bgroup\b/, answer: () => GAME.groupName },
  { test: /\b(?:who is|who's|name|who created|who owns)\b.*\b(?:owner|creator|founder|developer)\b|\b(?:owner|creator|founder|developer)\b.*\b(?:who|name)\b/i, answer: () => "Sammy" },
  { test: /\brelease date\b|\bwhen was .* released\b|\bwhen did .* release\b/, answer: () => GAME.released },
  { test: /\btaco tuesday\b|\badmin abuse\b/, answer: () => "Saturdays after the update, and Tuesdays at 6 PM ET (Taco Tuesday)" },
  { test: /\b(newest|latest|last|recent|current) update\b|\bupdate (is )?(out|now)\b/, answer: () => `Update ${latest.n}: ${latest.title} (${latest.date})` },
  { test: /\b(next|upcoming) update\b|\bwhen.*\bupdates?\b|\bupdate (time|day)\b/, answer: () => "Every Saturday at 3 PM ET" },
  { test: /\bactive codes?\b|\bany codes?\b|\bgame codes?\b/, answer: () => `Active codes:\n${codes || "None are confirmed active."}` },
  { test: /\b(player record|record for most players|most players ever|peak player count|concurrent players)\b/, answer: () => "25868678 players (Oct 11, 2025)" },
  { test: /\b(platforms?|console|xbox|playstation|ps5|mobile|phone)\b/, answer: () => "PC, Mac, mobile, PlayStation and Xbox" },
  { test: /\bhacker elephant\b.*\b(exist|exists|confirmed|count|how many)\b|\b(exist|exists|confirmed|count|how many)\b.*\bhacker elephant\b/, answer: () => "1" },
  { test: /\bhacker\b.*\bmutation\b|\bmutation\b.*\bhacker\b/, answer: () => "15x" },
  { test: /\b(best|highest|strongest|top) mutation\b/, answer: () => "Hacker (15×, reported)" },
  { test: /\b(best|highest|rarest|top) rarity\b/, answer: () => "OG" },
];

export function shouldDelegateToAi(question: string): boolean {
  if (getSammyPersonalFactsAnswer(question)) return false;
  const q = normalize(question);
  if (!q || NEEDS_WEB.test(q)) return false;
  if (/\b(riddle|riddles|puzzle|puzzles|decode|decipher|brain teaser)\b/i.test(q)) return true;
  const intentPatterns = [
    /\bmy name\b|\bwho am i\b|\busername\b|\bhandle\b/,
    /\bactive codes?\b|\bany codes?\b|\bgame codes?\b/,
    /\b(best|strongest|highest|top)\b.*\b(og|secret)\b|\b(og|secret)\b.*\b(best|strongest|highest|top)\b/i,
    /\b(income|earn|earning|per second|rarity|exists?|existence|how many|count|quantity|stock)\b/i,
    /\b(cat|cats|pet)\b/,
    /\b(favorite|favourite|fav)\b/,
    /\b(owner|creator|founder|developer)\b/,
    /\b(favorite|favourite|fav)\b.*\b(taco|food|meal)\b/,
  ];
  if (intentPatterns.filter((pattern) => pattern.test(q)).length >= 2) return true;
  if (findAllUnits(question, UNITS).length > 1) return true;
  const hasMutation = findRequestedMutation(q) !== null;
  const hasUnit = findAllUnits(question, UNITS).length > 0;
  const hasNumberClue = /\b(?:and|plus|then)\s+\d+\b/.test(q);
  return hasMutation && hasUnit && hasNumberClue;
}

export function getQuestionDataContext(question: string): string {
  const verifiedAnswer = quickAnswer(question);
  if (!verifiedAnswer) return "";
  return `\nVERIFIED LOCAL GAME DATA FOR THIS QUESTION:\n${verifiedAnswer}\n\nThese values were calculated using the existing local game database.\nUse them as authoritative facts.\nNever replace a mutation-specific existence count with a base existence count.\nNever invent missing values.\n`;
}

export function quickAnswer(question: string): string | null {
  const personalAnswer = getSammyPersonalFactsAnswer(question);
  const q = normalize(question);
  if (!q || NEEDS_WEB.test(q)) return null;
  if (/\bhacker elephant\b.*\b(exist|exists|confirmed|count|how many)\b|\b(exist|exists|confirmed|count|how many)\b.*\bhacker elephant\b/.test(q)) return "1";
  const answers: string[] = [];
  if (personalAnswer) answers.push(personalAnswer);
  const catalogAnswer = answerFromCatalog(question);
  if (catalogAnswer) answers.push(catalogAnswer);
  const asksBestOG = /\b(best|strongest|highest|top)\b/.test(q) && /\bog\b/.test(q) && /\b(obtainable|obtain|available)\b/.test(q);
  for (const rule of RULES) {
    if (!rule.test.test(q)) continue;
    if (asksBestOG && rule.answer === bestObtainableOGAnswer) continue;
    const answer = rule.answer();
if (personalAnswer && (
  personalAnswer.split(", ").includes(answer) ||
  /^your name:\s*sammy\.?$/i.test(answer.trim())
)) continue;
if (!answers.includes(answer)) answers.push(answer);
  }
  const bro = DB.bros.find((b) => q.includes(normalize(b.name)));
  if (bro && !answers.includes(bro.recipe)) answers.push(bro.recipe);
  return answers.length ? answers.join("\n\n") : null;
}
