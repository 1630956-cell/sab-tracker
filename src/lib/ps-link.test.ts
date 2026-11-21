import { describe, expect, it } from "vitest";
import { parsePsLink } from "./ps-link";

describe("parsePsLink", () => {
  it("accepts a Roblox share link", () => {
    expect(parsePsLink("https://www.roblox.com/share?code=abc123&type=Server")).toBe("https://www.roblox.com/share?code=abc123&type=Server");
  });
  it("accepts an old privateServerLinkCode link", () => {
    expect(parsePsLink("https://www.roblox.com/games/109983668079237/Steal-a-Brainrot?privateServerLinkCode=987")).toBe(
      "https://www.roblox.com/games/109983668079237/Steal-a-Brainrot?privateServerLinkCode=987",
    );
  });
  it("rejects non-Roblox sites", () => {
    expect(parsePsLink("https://roblox.com.evil.io/share?code=abc")).toBeNull();
    expect(parsePsLink("https://example.com/share?code=abc")).toBeNull();
  });
  it("rejects a Roblox link that is not a private server", () => {
    expect(parsePsLink("https://www.roblox.com/games/109983668079237/Steal-a-Brainrot")).toBeNull();
  });
});
