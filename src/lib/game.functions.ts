import { createServerFn } from "@tanstack/react-start";
import { GAME } from "./game-data";
import { retrieveAiContext } from "./ai-retrieval";
import { quickAnswer, shouldDelegateToAi, getQuestionDataContext } from "./quick-answers";
import { guard, RepeatTracker } from "./abuse-guard";

const tracker = new RepeatTracker();

function formatAiAnswer(text: string): string {
  return text.replace(/\r\n/g, "\n").trim() || "No response received.";
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

/** Ask the built-in AI (Gemini via Lovable AI Gateway) with smart Google Search. */
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

    // Only serve instant offline answers for simple single-fact lookups
    if (!shouldDelegateToAi(data.prompt)) {
      const quick = quickAnswer(data.prompt);
      if (quick) return { text: quick, error: null };
    }

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
          {
            role: "system",
            content: `You are the ultimate expert AI for the Roblox game "Steal a Brainrot" (created by SpyderSammy / Do Big Studios).
You are smart, accurate, and understand both direct player questions and community riddles/puzzles.

CREATOR & LORE FACTS:
- Creator / Owner: Sammy (SpyderSammy)
- Sammy's Cat: Nova (only 1 cat)
- Sammy's Favorite Brainrot: Meowl
- Sammy's Favorite Food / Taco: Carne Asada
- Studio: Do Big Studios (co-founded Brazilian Spyder with do_small)
- Game Updates: Every Saturday at 3 PM ET / 8 PM UTC
- Taco Tuesday / Admin Abuse: Tuesdays at 6 PM ET and Saturdays ~30-45m after updates

HANDLING CLUE CHAINS & RIDDLES:
- If the user provides a list of clues or a riddle intended to produce a password or tied-together answer (such as "my name fav brainrot and kind of tacos"):
  1. Solve each clue in order (e.g. Sammy + Meowl + Carne Asada).
  2. Provide the combined continuous answer first (e.g. "sammymeowlcarneasada").
  3. Briefly list the breakdown of the clues.

STANDARD QUESTIONS:
- Answer all parts of multi-part questions directly.
- Use the verified reference data below for exact unit rarities, mutations, income multipliers, and published exist counts.
- Never invent fake exist counts or made-up unit stats. If a count is unpublished, say it is unpublished.
- Use Google Search to check active codes, new leaks, upcoming rumors, or recent Discord announcements.

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
