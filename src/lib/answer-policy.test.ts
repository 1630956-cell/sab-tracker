import { describe, expect, it } from "vitest";
import { canUseSharedAnswerStores, isUsableAiAnswer, needsFreshInformation } from "./answer-policy";

describe("answer storage policy", () => {
  it("does not share answers for contextual follow-ups", () => {
    expect(canUseSharedAnswerStores(true, false)).toBe(false);
  });

  it("does not share answers for time-sensitive questions", () => {
    expect(canUseSharedAnswerStores(false, true)).toBe(false);
  });

  it("allows standalone stable questions to use shared answers", () => {
    expect(canUseSharedAnswerStores(false, false)).toBe(true);
  });

  it("recognizes current and live information requests", () => {
    expect(needsFreshInformation("What are the latest active codes today?")).toBe(true);
    expect(needsFreshInformation("How much does Meowl make?")).toBe(false);
  });
});


describe("AI answer quality gate", () => {
  it("accepts a concise direct answer", () => {
    expect(isUsableAiAnswer("What is my favorite Brainrot?", "Your favorite Brainrot is Meowl.")).toBe(true);
  });

  it("rejects an echoed question", () => {
    expect(isUsableAiAnswer("What is Meowl?", "What is Meowl?")).toBe(false);
  });

  it("rejects reflection-style openings", () => {
    expect(isUsableAiAnswer("What is Meowl?", "You asked what Meowl is.")).toBe(false);
  });
});
