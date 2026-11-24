import { AI_CONTEXT, AI_CONTEXT_CORE } from "./ai-context";

const STOP_WORDS = new Set([
  "what", "is", "the", "a", "an", "how", "do", "does",
  "can", "i", "you", "it", "to", "of", "in", "for",
  "and", "or", "on", "with", "my", "me", "tell", "about"
]);

const MAX_CONTEXT_CHARACTERS = 6000;
const FALLBACK_CHARACTERS = 1800;
const MAX_MATCHED_LINES = 40;

type Posting = { index: number; weight: number };

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word));
}

// Build the inverted index once when this server module is loaded. Each query only
// scores lines containing at least one of its terms; it never rescans the full context.
const contextLines = AI_CONTEXT.split("\n");
const postings = new Map<string, Posting[]>();

for (let index = 0; index < contextLines.length; index += 1) {
  const line = contextLines[index]!;
  const terms = new Set(tokenize(line));
  for (const term of terms) {
    const list = postings.get(term) ?? [];
    list.push({ index, weight: line.toLowerCase().includes(`**${term}**`) ? 4 : 1 });
    postings.set(term, list);
  }
}

function fallbackContext(maxCharacters: number): string {
  // AI_CONTEXT_CORE is the intentionally compact snapshot, not the full context.
  return AI_CONTEXT_CORE.slice(0, Math.min(maxCharacters, FALLBACK_CHARACTERS));
}

export function retrieveAiContext(
  question: string,
  maxCharacters = MAX_CONTEXT_CHARACTERS
): string {
  const limit = Math.max(0, maxCharacters);
  const terms = new Set(tokenize(question));

  if (terms.size === 0) return fallbackContext(limit);

  const scores = new Map<number, number>();
  for (const term of terms) {
    for (const posting of postings.get(term) ?? []) {
      scores.set(posting.index, (scores.get(posting.index) ?? 0) + posting.weight);
    }
  }

  if (scores.size === 0) return fallbackContext(limit);

  const selected = [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_MATCHED_LINES)
    .map(([index]) => index)
    .sort((a, b) => a - b);

  let result = "";
  for (const index of selected) {
    const line = contextLines[index]!;
    const addition = result ? `\n${line}` : line;
    if (result.length + addition.length > limit) {
      if (!result && limit > 0) result = line.slice(0, limit);
      break;
    }
    result += addition;
  }

  return result.length >= 150 ? result : fallbackContext(limit);
}
