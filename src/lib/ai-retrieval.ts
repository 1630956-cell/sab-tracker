import { AI_CONTEXT } from "./ai-context";

const STOP_WORDS = new Set([
  "what", "is", "the", "a", "an", "how", "do", "does",
  "can", "i", "you", "it", "to", "of", "in", "for",
  "and", "or", "on", "with", "my", "me", "tell", "about"
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(word => word.length > 1 && !STOP_WORDS.has(word));
}

export function retrieveAiContext(
  question: string,
  maxCharacters = 12000
): string {
  const terms = tokenize(question);

  if (terms.length === 0) {
    return AI_CONTEXT.slice(0, maxCharacters);
  }

  const lines = AI_CONTEXT.split("\n");

  const scored = lines.map((line, index) => {
    const lower = line.toLowerCase();
    let score = 0;

    for (const term of terms) {
      if (lower.includes(term)) {
        score += lower.includes(`**${term}**`) ? 4 : 1;
      }
    }

    return { line, index, score };
  });

  const relevant = scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 100)
    .sort((a, b) => a.index - b.index);

  if (relevant.length === 0) {
    return AI_CONTEXT.slice(0, maxCharacters);
  }

  const result = relevant
    .map(item => item.line)
    .join("\n");

  // Keep a safe fallback if retrieval finds too little information.
  if (result.length < 300) {
    return AI_CONTEXT.slice(0, maxCharacters);
  }

  return result.slice(0, maxCharacters);
}
