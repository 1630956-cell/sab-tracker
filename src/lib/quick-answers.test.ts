import { describe, expect, it } from "vitest";
import { quickAnswer, shouldDelegateToAi } from "./quick-answers";
import { UNITS } from "./codex-data";

describe("quickAnswer", () => {
  it("uses one shared personal-facts source for multi-part questions", () => {
    expect(quickAnswer("my name, my cat's name, favorite Brainrot and favorite mutation"))
      .toBe("Your name is Sammy, your cat's name is Nova, your favorite Brainrot is Meowl, and your favorite mutation is Ying Yang.");
  });

  it("owner name is Sammy", () => {
    expect(quickAnswer("Who is the owner of Steal a Brainrot?")).toBe("Sammy");
    expect(quickAnswer("who made the game")).toBe("Sammy");
  });
  it("answers the user's name only when asked", () => {
    expect(quickAnswer("What is my name?")).toBe("Your name is Sammy.");
    expect(quickAnswer("What is the best obtainable OG?")).not.toContain("Sammy");
  });

  it("combines all requested personal facts into one complete answer", () => {
    expect(quickAnswer("What is my name, favorite Brainrot, favorite mutation, and favorite kind of tacos?"))
      .toBe("Your name is Sammy, your favorite Brainrot is Meowl, your favorite mutation is Ying Yang, and your favorite taco is Carne Asada.");
  });
  it("answers a single favorite taco question directly", () => {
    expect(quickAnswer("What is my favorite kind of tacos?"))
      .toBe("Your favorite taco is Carne Asada.");
  });
  it("keeps repeated personal facts from appearing twice", () => {
    expect(quickAnswer("my name and my name and favorite brainrot"))
      .toBe("Your name is Sammy and your favorite Brainrot is Meowl.");
  });

  it("Sammy's cat is Nova", () => {
    expect(quickAnswer("What is Sammy's cat name?")).toBe("Your cat's name is Nova.");
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
  it("returns the stored favorite mutation without extra text", () => {
    expect(quickAnswer("What's Sammy's favorite mutation?")).toBe("Your favorite mutation is Ying Yang.");
  });
  it("keeps Hacker mutation multiplier separate from Hacker Elephant existence", () => {
    expect(quickAnswer("What's the Hacker mutation multiplier?")).toBe("15x");
    expect(quickAnswer("How many Hacker Elephants are confirmed?")).toBe("1");
  });
  it("uses mutation-specific existence separately from base existence", () => {
    expect(quickAnswer("How many Meowl exist in Gold?")).toContain("Meowl Gold existence: 323.");
    expect(quickAnswer("How many Meowl exist?")).toBe("4037");
  });
  it("answers every intent in the multi-question example", () => {
    const answer = quickAnswer(
      "Any active codes? what my name meowls exist count in diamond and best secret in the game"
    );
    const bestSecret = UNITS
      .filter((unit) => unit[1].toLowerCase() === "secret")
      .sort((a, b) => b[3] - a[3])[0]!;

    expect(answer).toContain("Active codes:");
    expect(answer).toContain("None are confirmed active.");
    expect(answer).toContain("your name is Sammy.");
    expect(answer).toContain("Meowl Diamond existence: 323.");
    expect(answer).toContain(`Best Secret:\n${bestSecret[0]} — ${bestSecret[2]}.`);
    expect(answer).not.toContain("4037");
    expect(answer).not.toMatch(/BESTBRAINROTEVER|saturn/);
  });
  it("does not confirm an OG based on static obtain text", () => {
    expect(quickAnswer("What is the best obtainable OG?")).toContain(
      "I can't confirm which OG is currently obtainable from the available game data."
    );
  });
  it("does not autocorrect Spyder Elephant to a misspelling", () => {
    expect(quickAnswer("What is Spyder Elephant's rarity?")).toBe("OG");
  });
  it("Timmy Bros needs Grim Cheese + Tim Cheese", () => {
    expect(quickAnswer("How do I make Timmy Bros?")).toBe("Grim Cheese + Tim Cheese");
  });

  it("understands common misspellings of Brainrot and mutation names", () => {
    expect(quickAnswer("how much does meolw make per sec" )).toContain("$");
    expect(quickAnswer("how many Meowl exist in diamnod" )).toContain("Meowl Diamond existence:");
    expect(quickAnswer("what is the Hacker mutaiton multiplier" )).toBe("15x");
  });
  it("answers multiple named Brainrots from the local catalog", () => {
    const answer = quickAnswer("compare Meowl and Strawberry Elephant income and rarity");
    expect(answer).toContain("Meowl");
    expect(answer).toContain("Strawberry Elephant");
    expect(answer).toContain("OG");
  });
  it("does not delegate a locally answerable multi-stat question to AI", () => {
    const question = "What is Meowl's income, rarity, and how many exist?";
    expect(quickAnswer(question)).not.toBeNull();
    expect(shouldDelegateToAi(question)).toBe(false);
  });

  it("leaks and real name still go to the AI", () => {
    expect(quickAnswer("What is leaked for the next update?")).toBeNull();
    expect(quickAnswer("What is the owner's real name?")).toBeNull();
  });
});
