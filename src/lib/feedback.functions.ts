import { createServerFn } from "@tanstack/react-start";
import { screenMessage } from "./feedback-filter";

export type FeedbackInput = { category: string; message: string; page?: string; public?: boolean };
export type PublicItem = { id: number; title: string; category: string; body: string; state: string; comments: number; createdAt: string; url: string };
export type FeedbackResult = { delivered: boolean; via: "webhook" | "github" | "none"; error: string | null; reason: string | null };

const CATEGORIES = new Set(["Bug", "Wrong data", "Suggestion", "Missing content", "Other"]);

/** Naive per-IP throttle: 5 submissions per 10 minutes. Resets on redeploy. */
const recent = new Map<string, number[]>();
const WINDOW = 10 * 60 * 1000;
const LIMIT = 5;

function throttled(ip: string): boolean {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW);
  hits.push(now);
  recent.set(ip, hits);
  return hits.length > LIMIT;
}

export const submitFeedback = createServerFn({ method: "POST" })
  .inputValidator((d: FeedbackInput) => ({
    category: String(d.category ?? "Other").slice(0, 40),
    message: String(d.message ?? "").slice(0, 1200),
    page: String(d.page ?? "").slice(0, 200),
    public: Boolean(d.public),
  }))
  .handler(async ({ data }): Promise<FeedbackResult> => {
    if (!CATEGORIES.has(data.category)) return { delivered: false, via: "none", error: null, reason: "Pick a category first." };
    if (data.message.trim().length < 4) return { delivered: false, via: "none", error: null, reason: "Add a few more characters so the report makes sense." };

    // Re-screen on the server: the client filter is a convenience, not a control.
    const checked = screenMessage(data.message);
    if (!checked.ok) return { delivered: false, via: "none", error: null, reason: checked.reason };

    let ip = "anon";
    try {
      const { getRequestHeader } = await import("@tanstack/react-start/server");
      ip = getRequestHeader("cf-connecting-ip") ?? getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
    } catch {
      /* no request context */
    }
    if (throttled(ip)) return { delivered: false, via: "none", error: null, reason: "Too many reports from this connection. Try again in a few minutes." };

    const body = { category: data.category, message: checked.cleaned, page: data.page, at: new Date().toISOString() };

    const webhook = process.env["FEEDBACK_WEBHOOK_URL"];
    const token = process.env["GITHUB_TOKEN"];
    const repo = process.env["GITHUB_REPO"];

    const postToGithub = async (): Promise<FeedbackResult | null> => {
      if (!token || !repo) return null;
      try {
        const r = await fetch(`https://api.github.com/repos/${repo}/issues`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
          body: JSON.stringify({
            title: `[${data.category}] ${checked.cleaned.slice(0, 60)}`,
            body: `${checked.cleaned}\n\n---\nCategory: ${data.category}\nPage: ${data.page || "unknown"}\nSubmitted: ${body.at}`,
            labels: ["feedback"],
          }),
        });
        if (r.ok) return { delivered: true, via: "github", error: null, reason: null };
        return { delivered: false, via: "none", error: `GitHub returned ${r.status}`, reason: null };
      } catch {
        return { delivered: false, via: "none", error: "Could not reach GitHub.", reason: null };
      }
    };

    // Public suggestions go to GitHub issues so everyone can read them.
    if (data.public) {
      const viaGithub = await postToGithub();
      if (viaGithub) return viaGithub;
    }

    if (webhook) {
      try {
        const r = await fetch(webhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: `[${data.category}] ${checked.cleaned}\n— ${data.page || "unknown page"}` }),
        });
        if (r.ok) return { delivered: true, via: "webhook", error: null, reason: null };
        return { delivered: false, via: "none", error: `Webhook returned ${r.status}`, reason: null };
      } catch {
        return { delivered: false, via: "none", error: "Could not reach the webhook.", reason: null };
      }
    }

    // No webhook: fall back to a GitHub issue even for private reports.
    const fallback = await postToGithub();
    if (fallback) return fallback;

    return { delivered: false, via: "none", error: null, reason: "not-configured" };
  });

/** Public feed: every issue labelled "feedback". Reads are anonymous, so no token is needed. */
export const listPublicFeedback = createServerFn({ method: "GET" }).handler(async (): Promise<PublicItem[]> => {
  const repo = process.env["GITHUB_REPO"] ?? "1630956-cell/sab-tracker";
  try {
    const r = await fetch(`https://api.github.com/repos/${repo}/issues?labels=feedback&state=all&per_page=30&sort=created&direction=desc`, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!r.ok) return [];
    const rows = (await r.json()) as Array<{
      number: number; title: string; body: string | null; state: string; comments: number; created_at: string; html_url: string; pull_request?: unknown;
    }>;
    return rows
      .filter((x) => !x.pull_request)
      .map((x) => {
        const bodyText = (x.body ?? "").split("\n---\n")[0] ?? "";
        const cat = /^\[([^\]]+)\]/.exec(x.title)?.[1] ?? "Other";
        return {
          id: x.number,
          title: x.title.replace(/^\[[^\]]+\]\s*/, ""),
          category: cat,
          body: bodyText,
          state: x.state,
          comments: x.comments,
          createdAt: x.created_at,
          url: x.html_url,
        };
      });
  } catch {
    return [];
  }
});
