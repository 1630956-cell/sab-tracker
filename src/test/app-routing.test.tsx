import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });
});

describe("myprofile pages", () => {
  const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
  const leaf = (path: string) => router.matchRoutes(path).at(-1)?.routeId;

  it("routes auth, dashboard and public profile URLs to their pages", () => {
    expect(leaf("/login")).toBe("/login");
    expect(leaf("/register")).toBe("/register");
    expect(leaf("/dashboard")).toBe("/dashboard/");
    expect(leaf("/dashboard/settings")).toBe("/dashboard/settings");
    expect(leaf("/dashboard/premium")).toBe("/dashboard/premium");
    expect(leaf("/nova")).toBe("/$username");
  });
});
