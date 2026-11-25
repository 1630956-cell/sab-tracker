import { createServerFn } from "@tanstack/react-start";
import { GAME } from "./game-data";
import { retrieveAiContext } from "./ai-retrieval";
import { quickAnswer, shouldDelegateToAi, getQuestionDataContext } from "./quick-answers";
import { guard, RepeatTracker } from "./abuse-guard";

const tracker = new RepeatTracker();

function formatAiAnswer(text: string): string {
  return text.replace(/\r\n/g, "\n").trim() || "No response received.";
}

function hasMultipleIntents(question: string): boolean {
  const q = question.toLowerCase();
  const patterns = [
    /\b(active codes?|game codes?)\b/i,
    /\b(my name|your name|who am i|username)\b/i,
    /\b(favorite|favourite|fav)\b.*\b(taco|food|meal)\b/i,
    /\b(favorite|favourite|fav)\b.*\b(brainrot|unit|character)\b/i,
    /\b(taco|food|meal)\b/i,
    /\b(brainrot|unit|character)\b/i,
  ];
  const matched = patterns.map((pattern) => pattern.test(q));
  const intentCount =
    Number(matched[0]) +
    Number(matched[1]) +
    Number(matched[2] || matched[4]) +
    Number(matched[3] || matched[5]);
  return intentCount >= 2;
}

export const getLiveStats = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const r = await fetch(`https://games.roblox.com/v1/games?universeIds=${GAME.universeId}`);
    if (!r.ok) return { error: `Roblox returned ${r.status}`, playing: null, visits: null, favorites: null, updated: null };
    const j = (await r.json()) as { data?: { playing: number; visits: number; favoritedCount: number; updated: string }[] };
    const g = j.data?.[0];
    return { error: null, playing: g?.playing ?? null, visits: g?.visits ?? null, favorites: g?.favoritedCount ?? null, updated: g?.updated ?? null };
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
    const multipleIntents = hasMultipleIntents(data.prompt);
    const delegateToAi = multipleIntents || shouldDelegateToAi(data.prompt);

    if (!delegateToAi) {
      const quick = quickAnswer(data.prompt);
      if (quick) return { text: quick, error: null };
    }
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { text: null, error: "AI is not set up for this app yet." };
    const needsSearch =
      /\b(latest|newest|today|tonight|right now|currently|live|leak|leaks|leaked|rumou?r|news|upcoming|next update|player count|how many players|just announced|recently announced|active codes?)\b/i.test(data.prompt);
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, "X-Lovable-AI-SDK": "fetch" },
      body: JSON.stringify({
        model: "google/gemini-3.8-flash",
        stream: true,
        reasoning_effort: "low",
        ...(needsSearch ? { tools: [{ type: "google_search" }] } : {}),
        messages: [
          {
            role: "system",
            content: `You are the expert AI tracker assistant for the Roblox game "Steal a Brainrot" (created by SpyderSammy).
Your goal is to give accurate, direct, and complete answers to players.

CORE RULES:
1. Answer every question and every part of multi-part questions directly. Do not skip parts.
2. Use the verified REFERENCE DATA below for in-game stats, unit rarities, income, mutations, exist counts, codes, and update notes.
3. If asked about new leaks, upcoming rumors, live events, or active codes, consult Google Search.
4. Keep replies clear, natural, and concise (1–3 sentences or simple bullet points when answering multiple questions). No unnecessary filler greetings or disclaimers.
5. Never invent fake exist counts or made-up unit stats.

REFERENCE DATA:
${retrieveAiContext(data.prompt)}
${getQuestionDataContext(data.prompt)}`,
          },
          { role: "user", content: data.prompt },
        ],
      }),
    });
    if (!r.ok || !r.body) {
      const body = await r.text().catch(() => "");
      if (r.status === 402) return { text: null, error: "Out of AI credits for now — try again after credits reset." };
      if (r.status === 429) return { text: "Too many questions right now — wait a moment and try again." };
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
    const final = formatAiAnswer(text);
    return { text: final, error: null };
  });
