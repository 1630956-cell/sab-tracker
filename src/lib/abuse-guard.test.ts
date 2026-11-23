import { describe, expect, it } from "vitest";
import { guard, isOffensive, REFUSAL, RepeatTracker } from "./abuse-guard";

describe("abuse guard", () => {
  it("refuses racist messages", () => {
    expect(guard("you n1gger", new RepeatTracker())).toBe(REFUSAL);
    expect(isOffensive("what is the newest update")).toBe(false);
  });
  it("refuses the same question copy-pasted a third time", () => {
    const t = new RepeatTracker();
    expect(guard("Any leaks?", t)).toBeNull();
    expect(guard("any leaks??", t)).toBeNull();
    expect(guard("ANY LEAKS", t)).toBe(REFUSAL);
  });
  it("tracks repeats per person", () => {
    const t = new RepeatTracker();
    guard("leaks", t, "a"); guard("leaks", t, "a");
    expect(guard("leaks", t, "b")).toBeNull();
  });
  it("does not flag normal game words", () => {
    expect(isOffensive("Is Spyder Elephant a good brainrot? cocofanto")).toBe(false);
  });
});
