export function getSammyPersonalFactsAnswer(question: string): string | null {
  const q = question.toLowerCase();
  const facts: { key: string; position: number; answer: string }[] = [];
  const nameMatch = /\b(my name|what(?:'s| is) my name|who am i)\b/.exec(q);
  const brainrotMatch = /\b(?:fav(?:ou?rite)?\s+(?:brainrot|brain\s?rot)|(?:brainrot|brain\s?rot)\s+(?:is\s+)?my fav(?:ou?rite)?)\b/.exec(q);
  const mutationMatch = /\b(?:fav(?:ou?rite)?\s+mutation|mutation\s+(?:is\s+)?my fav(?:ou?rite)?)\b/.exec(q);
  if (nameMatch) facts.push({ key: "name", position: nameMatch.index, answer: "Sammy" });
  if (brainrotMatch) facts.push({ key: "brainrot", position: brainrotMatch.index, answer: "Meowl" });
  if (!mutationMatch && /\bmutation\b/.test(q) && /\b(?:fav|favorite|favourite)\b/.test(q)) {
    facts.push({ key: "mutation", position: q.indexOf("mutation"), answer: "Ying Yang" });
  } else if (mutationMatch) {
    facts.push({ key: "mutation", position: mutationMatch.index, answer: "Ying Yang" });
  }
  if (facts.length < 1) return null;
  facts.sort((a, b) => a.position - b.position);
  return [...new Set(facts.map((fact) => fact.answer))].join(", ");
}
