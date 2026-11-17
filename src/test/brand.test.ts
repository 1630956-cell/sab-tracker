import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BRAND, profileUrl } from "@/lib/brand";

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

describe("myprofile brand", () => {
  it("uses the exact page titles from the brand brief", () => {
    expect(BRAND.name).toBe("myprofile");
    expect(BRAND.titles).toEqual({
      browser: "myprofile",
      dashboard: "myprofile Dashboard",
      login: "Welcome to myprofile",
      register: "Create your myprofile account",
      settings: "myprofile Settings",
      premium: "myprofile Premium",
    });
  });

  it("builds public profile URLs as domain/username", () => {
    expect(profileUrl("nova")).toBe("yourdomain.com/nova");
  });

  it("never mentions the Guns.lol brand in app source or public files", () => {
    const self = join("src", "test", "brand.test.ts");
    const files = [...walk("src"), ...walk("public")].filter(
      (f) => /\.(tsx?|css|svg|html|txt|json)$/.test(f) && !f.endsWith(self),
    );
    const offenders = files.filter((f) => /guns\s*\.?\s*lol/i.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });
});
