import { describe, expect, it } from "vitest";
import { quickAnswer } from "./quick-answers";

describe("quickAnswer", () => {
  it("owner name is Sammy", () => {
    expect(quickAnswer("Who is the owner of Steal a Brainrot?")).toBe("Sammy");
    expect(quickAnswer("who made the game")).toBe("Sammy");
  });
  it("Sammy's cat is Nova", () => {
    expect(quickAnswer("What is Sammy's cat name?")).toBe("Nova");
  });
  it("release date is May 16, 2025", () => {
    expect(quickAnswer("When did the game come out?")).toBe("May 16, 2025");
  });
  it("newest update comes from the update log", () => {
    expect(quickAnswer("What's the newest update?")).toBe("Update 75: Bros Machine (2026-11-14)");
  });
  it("next update is Saturday 3 PM ET", () => {
    expect(quickAnswer("When is the next update?")).toBe("Every Saturday at 3 PM ET");
  });
  it("leaks and real name still go to the AI", () => {
    expect(quickAnswer("What is leaked for the next update?")).toBeNull();
    expect(quickAnswer("What is the owner's real name?")).toBeNull();
  });
});
