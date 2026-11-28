export function normalizeKnowledgeText(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\bfavourite\b/g, "favorite")
    .replace(/\bfav\b/g, "favorite")
    .replace(/\bwhat is\b/g, " ")
    .replace(/\bwhat s\b/g, " ")
    .replace(/\btell me\b/g, " ")
    .replace(/\bmy\b/g, " ")
    .trim().replace(/\s+/g, " ");
}

function tokens(value: string): Set<string> {
  return new Set(normalizeKnowledgeText(value).split(" ").filter((word) => word.length > 1));
}

export function knowledgeSimilarity(left: string, right: string): number {
  const a = tokens(left);
  const b = tokens(right);
  if (!a.size || !b.size) return 0;
  let overlap = 0;
  for (const token of a) if (b.has(token)) overlap += 1;
  return overlap / (a.size + b.size - overlap);
}

export function chooseKnowledgeMatch<T extends { question_key: string; answer: string }>(
  question: string,
  rows: T[],
): T | null {
  const normalized = normalizeKnowledgeText(question);
  const exact = rows.find((row) => normalizeKnowledgeText(row.question_key.replace(/^v\d+:/, "")) === normalized);
  if (exact) return exact;

  const scored = rows.map((row => ({
    row,
    score: knowledgeSimilarity(question, row.question_key.replace(/^v\d+:/, "")),
  }))).filter((entry) => entry.score >= 0.62).sort((a, b) => b.score - a.score);

  if (!scored[0]) return null;
  if (scored[1] && scored[0].score - scored[1].score < 0.12) return null;
  return scored[0].row;
}
