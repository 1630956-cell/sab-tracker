
/**
 * Sammy's personal facts — single source of truth.
 */

const FACTS = {
  name: "Sammy",
  username: "Sammy",
  cat: "Nova",
  favoriteBrainrot: "Meowl",
  favoriteMutation: "Ying Yang",
  favoriteTaco: "Carne Asada",
  bestDeveloper: "Hasted",
  age: "24",
  birthday: "February 2002",
} as const;

type FactKey = keyof typeof FACTS;

type Fact = {
  key: FactKey;
  label: string;
  position: number;
};

const FACT_PATTERNS: {
  key: FactKey;
  label: string;
  pattern: RegExp;
}[] = [
  {
    key: "name",
    label: "your name",
    pattern: /\b(?:my name|what(?:'s| is) my name|who am i|my username|what(?:'s| is) my username|my handle|what(?:'s| is) my handle)\b/,
  },
  {
    key: "cat",
    label: "your cat's name",
    pattern: /\b(?:my\s+)?(?:cat|cats|pet)(?:'s)?\s+(?:name|called)\b|\b(?:what(?:'s| is)|tell me)\b.*\b(?:my\s+)?(?:cat|cats|pet)\b/,
  },
  {
    key: "favoriteBrainrot",
    label: "your favorite Brainrot",
    pattern: /\b(?:my\s+)?fav(?:ou?rite)?\s+(?:brainrot|brain\s?rot)\b|\b(?:brainrot|brain\s?rot)\s+(?:is\s+)?my fav(?:ou?rite)?\b/,
  },
  {
    key: "favoriteMutation",
    label: "your favorite mutation",
    pattern: /\b(?:my\s+)?fav(?:ou?rite)?\s+mutations?\b|\bmutations?\s+(?:is|are)?\s*my fav(?:ou?rite)?\b/,
  },
  {
    key: "favoriteTaco",
    label: "your favorite taco",
    pattern: /\b(?:my\s+)?fav(?:ou?rite)?\s+(?:(?:kind|type)\s+of\s+)?tacos?\b|\b(?:tacos?|food)\s+(?:is|are)?\s*my fav(?:ou?rite)?\b/,
  },
  {
    key: "bestDeveloper",
    label: "your best developer",
    pattern: /\b(?:my\s+)?(?:best|favorite|favourite)\s+dev(?:eloper)?\b|\bwho\s+is\s+sammy'?s\s+best\s+dev(?:eloper)?\b/,
  },
  {
    key: "age",
    label: "your age",
    pattern: /\b(?:my\s+age|how old am i|sammy'?s age|how old is sammy)\b/,
  },
  {
    key: "birthday",
    label: "your birthday",
    pattern: /\b(?:my\s+)?(?:birthday|birth date|date of birth)\b|\bwhen was sammy born\b/,
  },
];

function normalizeQuestion(value: string): string {
  return value
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function formatAnswer(answer: string): string {
  const trimmed = answer.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export function getSammyPersonalFactsAnswer(
  question: string
): string | null {
  const q = normalizeQuestion(question);
  if (!q) return null;

  const found: Fact[] = [];

  for (const item of FACT_PATTERNS) {
    const match = item.pattern.exec(q);

    if (match) {
      found.push({
        key: item.key,
        label: item.label,
        position: match.index,
      });
    }
  }

  const unique = [
    ...new Map(
      found
        .sort((a, b) => a.position - b.position)
        .map((fact) => [fact.key, fact])
    ).values(),
  ];

  if (unique.length === 0) return null;

  const descriptions = unique.map(
    (fact) => `${fact.label} is ${FACTS[fact.key]}`
  );

  const sentence =
    descriptions.length === 1
      ? descriptions[0]!
      : `${descriptions.slice(0, -1).join(", ")}, and ${descriptions[descriptions.length - 1]!}`;

  return `${formatAnswer(sentence)}.`;
}

export function getSammyPersonalFactsContext(): string {
  return [
    `Name: ${FACTS.name}`,
    `Username: ${FACTS.username}`,
    `Cat: ${FACTS.cat}`,
    `Favorite Brainrot: ${FACTS.favoriteBrainrot}`,
    `Favorite mutation: ${FACTS.favoriteMutation}`,
    `Favorite taco: ${FACTS.favoriteTaco}`,
    `Best developer: ${FACTS.bestDeveloper}`,
    `Age: ${FACTS.age}`,
    `Birthday: ${FACTS.birthday}`,
  ].join("\n");
}
