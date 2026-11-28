import { describe, expect, it } from "vitest";
import { getTrustedClientKey } from "./trusted-client";

describe("trusted client identity", () => {
  it("does not trust forwarded IP headers by default", () => {
    expect(getTrustedClientKey("203.0.113.2", false)).toBeNull();
  });
  it("accepts a Cloudflare IP only when proxy trust is explicitly enabled", () => {
    expect(getTrustedClientKey("203.0.113.2", true)).toBe("203.0.113.2");
  });
  it("rejects comma-separated spoof chains", () => {
    expect(getTrustedClientKey("203.0.113.2, 198.51.100.3", true)).toBeNull();
  });
});
