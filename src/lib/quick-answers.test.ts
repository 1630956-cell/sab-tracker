import { describe, expect, it } from "vitest";
import { quickAnswer } from "./quick-answers";

describe("quickAnswer", () => {
  it("owner name is Sammy", () => {
    expect(quickAnswer("Who is the owner of Steal a Brainrot?")).toBe("Sammy");
    expect(quickAnswer("who made the game")).toBe("Sammy");
  });
  it("answers the user's name only when asked", () => {
    expect(quickAnswer("What is my name?")).toBe("Your name is Sammy.");
    expect(quickAnswer("What is the best obtainable OG?")).not.toContain("Sammy");
  });
  it("Sammy's cat is Nova", () => {
    expect(quickAnswer("What is Sammy's cat name?")).toBe("Nova");
  });
  it("release date is May 16, 2025", () => {
    expect(quickAnswer("When did the game come out?")).toBe("May 16, 2025");
  });
  it("newest update comes from the update log", () => {
    expect(quickAnswer("What's the newest update?")).toBe("Update 76: New Bros + Hacker Mutation (2026-11-21)");
  });
  it("next update is Saturday 3 PM ET", () => {
    expect(quickAnswer("When is the next update?")).toBe("Every Saturday at 3 PM ET");
  });
  it("Hacker mutation is 15x and the best mutation", () => {
    expect(quickAnswer("What is the Hacker mutation multiplier?")).toBe("15× (reported)");
    expect(quickAnswer("What's the best mutation?")).toBe("Hacker (15×, reported)");
  });
  it("uses mutation-specific existence separately from base existence", () => {
    expect(quickAnswer("How many Meowl exist in Gold?")).toBe("Meowl — Gold existence: 323");
    expect(quickAnswer("How many Meowl exist?")).toBe("4037");
  });
  it("answers all parts of a multi-part question", () => {
    const answer = quickAnswer("what the best obtainable og my name and meowl exist in gold");
    expect(answer).toContain("Best currently obtainable OG: I can't confirm which OG is currently obtainable from the available game data.");
    expect(answer).toContain("Your name: Sammy.");
    expect(answer).toContain("Meowl Gold existence: 323.");
  });
  it("does not confirm an OG based on static obtain text", () => {
    expect(quickAnswer("What is the best obtainable OG?")).toBe(
      "I can't confirm which OG is currently obtainable from the available game data."
    );
  });
  it("does not autocorrect Spyder Elephant to a misspelling", () => {
    expect(quickAnswer("What is Spyder Elephant's rarity?")).toBe("OG");
  });
  it("Timmy Bros needs Grim Cheese + Tim Cheese", () => {
    expect(quickAnswer("How do I make Timmy Bros?")).toBe("Grim Cheese + Tim Cheese");
  });
  it("leaks and real name still go to the AI", () => {
    expect(quickAnswer("What is leaked for the next update?")).toBeNull();
    expect(quickAnswer("What is the owner's real name?")).toBeNull();
  });
});
