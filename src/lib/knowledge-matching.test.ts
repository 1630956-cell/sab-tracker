import { describe, expect, it } from "vitest";
import { chooseKnowledgeMatch, knowledgeSimilarity, normalizeKnowledgeText } from "./knowledge-matching";

describe("verified knowledge matching", () => {
  const rows = [
    { question_key: "v8:what is my favorite brainrot", answer: "Meowl" },
    { question_key: "v8:what is my favorite mutation", answer: "Ying Yang" },
  ];
  it("normalizes punctuation and accents", () => {
    expect(normalizeKnowledgeText("  WHAT'S my favourite? ")).toBe("favorite");
  });
  it("scores overlapping wording", () => {
    expect(knowledgeSimilarity("what is my favorite brainrot", "my favorite brainrot")).toBeGreaterThan(0.5);
  });
  it("matches exact and close verified aliases", () => {
    expect(chooseKnowledgeMatch("what is my favorite brainrot", rows)?.answer).toBe("Meowl");
    expect(chooseKnowledgeMatch("what is my favorite brainrot please", rows)?.answer).toBe("Meowl");
  });
  it("does not guess between ambiguous rows", () => {
    expect(chooseKnowledgeMatch("my favorite", rows)).toBeNull();
  });
});
