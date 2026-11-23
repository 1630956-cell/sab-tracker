import { createServerFn } from "@tanstack/react-start";
import { GAME } from "./game-data";
import { quickAnswer } from "./quick-answers";
import { guard, normalize, RepeatTracker } from "./abuse-guard";

const tracker = new RepeatTracker();

export const getLiveStats = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const r = await fetch(`https://games.roblox.com/v1/games?universeIds=${GAME.universeId}`);
    if (!r.ok) return { error: `Roblox returned ${r.status}`, playing: null, visits: null, favorites: null, updated: null };
    const j = (await r.json()) as { data?: { playing: number; visits: number; favoriteCount: number; updated: string }[] };
    const g = j.data?.[0];
    return { error: null, playing: g?.playing ?? null, visits: g?.visits ?? null, favorites: g?.favoriteCount ?? null, updated: g?.updated ?? null };
  } catch {
    return { error: "Could not reach Roblox", playing: null, visits: null, favorites: null, updated: null };
  }
});

/** Ask the built-in AI (Gemini via Lovable AI Gateway) with live Google Search. No user key needed. */
export const askGemini = createServerFn({ method: "POST" })
  .inputValidator((d: { prompt: string }) => ({ prompt: String(d.prompt).slice(0, 2000) }))
  .handler(async ({ data }) => {
    let who = "anon";
    try {
      const { getRequestHeader } = await import("@tanstack/react-start/server");
      who = getRequestHeader("cf-connecting-ip") ?? getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
    } catch { /* no request context */ }
    const refused = guard(data.prompt, tracker, who);
    if (refused) return { text: refused, error: null };
    const quick = quickAnswer(data.prompt);
    if (quick) return { text: quick, error: null };
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { text: null, error: "AI is not set up for this app yet." };
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, "X-Lovable-AI-SDK": "fetch" },
      body: JSON.stringify({
        model: "google/gemini-3.8-flash",
        stream: true,
        reasoning_effort: "low",
        tools: [{ type: "google_search" }],
        messages: [
          { role: "system", content: `You are an expert on Steal a Brainrot (Roblox). Today is ${new Date().toDateString()}.
Sammy (@SpyderSammy) is the owner and creator of Steal a Brainrot. He is the central person in this game; Sammy means SpyderSammy unless the question clearly means someone else. Never claim that his real name is confirmed unless explicitly asked and use only verified or clearly labeled community information.
For every question about Steal a Brainrot, prioritize information about Sammy, his role, leadership, updates, Admin Abuse, game development, and decisions. If the question asks about the owner or creator, answer with Sammy. If the question is not about Steal a Brainrot or Sammy, answer normally and do not force a connection.
Known facts: his cat is Nova; the newest update is 76 (Nov 21, 2026): Hacker mutation (reported 15×) and new Bros Machine Bros including Timmy Bros and Ball Bros. Search the web only if newer information is needed.
The user’s personal name and favorite Brainrots or mutations are not known unless the user tells you in this conversation. Never guess them; politely say they have not shared that information yet.
Reply with ONLY the answer itself—a few words or one short sentence. No intro, no explanation, no lists, no markdown.` },
          { role: "user", content: data.prompt },
        ],
      }),
    });
    if (!r.ok || !r.body) {
      const body = await r.text().catch(() => "");
      if (r.status === 402) return { text: null, error: "Out of AI credits for now — try again after credits reset." };
      if (r.status === 429) return { text: "Too many questions right now — wait a moment and try again.", error: null };
      return { text: null, error: `AI error ${r.status}: ${body.slice(0, 300)}` };
    }
    const reader = r.body.getReader();
    const dec = new TextDecoder();
    let buf = "", text = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (payload === "[DONE]") continue;
        try {
          const j = JSON.parse(payload) as { choices?: { delta?: { content?: string } }[] };
          text += j.choices?.[0]?.delta?.content ?? "";
        } catch { /* partial frame */ }
      }
    }
    const final = text.replace(/\*\*|__|^[-*]\s+/gm, "").trim() || "No answer.";
    return { text: final, error: null };
  });
