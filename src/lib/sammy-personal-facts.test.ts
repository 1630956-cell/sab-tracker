import { describe, expect, it } from "vitest";
import {
  getSammyPersonalFactsAnswer,
  getSammyPersonalFactsContext,
} from "./sammy-personal-facts";

describe("Sammy personal facts", () => {
  it("combines multiple requested facts into one sentence", () => {
    expect(
      getSammyPersonalFactsAnswer(
        "What is my name, favorite Brainrot, favorite mutation and favorite taco?"
      )
    ).toBe(
      "Your name is Sammy, your favorite Brainrot is Meowl, your favorite mutation is Ying Yang, and your favorite taco is Carne Asada."
    );
  });

  it("does not repeat the same fact when asked twice", () => {
    expect(getSammyPersonalFactsAnswer("my name and my name")).toBe(
      "Your name is Sammy."
    );
  });

  it("keeps the cat fact available in the same source", () => {
    expect(getSammyPersonalFactsAnswer("What is my cat's name?")).toBe(
      "Your cat's name is Nova."
    );
  });

  it("provides AI context from the same facts source", () => {
    expect(getSammyPersonalFactsContext()).toContain(
  "Favorite mutation: Ying Yang"
);
    expect(getSammyPersonalFactsContext()).toContain(
      "Favorite taco: Carne Asada"
    );
  });
});