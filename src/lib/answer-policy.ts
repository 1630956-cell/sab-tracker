/** Policies for shared answer storage and time-sensitive questions. */
export function needsFreshInformation(prompt: string): boolean {
  return /\b(active|working|current|currently|latest|newest|upcoming|next|today|tonight|right now|live|leaks?|leaked|rumou?rs?|player count|latest tweet|announcement)\b/i.test(prompt);
}

/** Shared answers are safe only for standalone, non-live questions. */
export function canUseSharedAnswerStores(hasHistory: boolean, needsFreshInfo: boolean): boolean {
  return !hasHistory && !needsFreshInfo;
}

/** Reject empty, echoed, or reflection-style model output before it is shown. */
export function isUsableAiAnswer(prompt: string, answer: string): boolean {
  const clean = answer.trim();
  if (clean.length < 2 || clean.length > 4000) return false;
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (normalize(clean) === normalize(prompt)) return false;
  if (/^(you asked|your question (?:is|was)|let me (?:repeat|restate)|here is what you asked)\b/i.test(clean)) return false;
  return true;
}
