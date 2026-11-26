import { createServerFn } from "@tanstack/react-start";
import { GAME } from "./game-data";
import { retrieveAiContext } from "./ai-retrieval";
import { quickAnswer, shouldDelegateToAi, getQuestionDataContext } from "./quick-answers";
import { guard, RepeatTracker } from "./abuse-guard";

const tracker = new RepeatTracker();
const answerCache = new Map<string, { text: string; expiresAt: number }>();

function getCachedAnswer(prompt: string): string | null {
  const key = prompt.toLowerCase().trim().replace(/\s+/g, " ");
  const entry = answerCache.get(key);

  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    answerCache.delete(key);
    return null;
  }

  return entry.text;
}

function saveCachedAnswer(prompt: string, text: string): void {
  const key = prompt.toLowerCase().trim().replace(/\s+/g, " ");

  if (answerCache.size >= 500) {
    const oldest = answerCache.keys().next().value;
    if (oldest) answerCache.delete(oldest);
  }

  answerCache.set(key, {
    text,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  });
}

function cleanAiAnswer(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^\s{0,3}#{1,6}\s*(Clue Breakdown|Breakdown|Explanation|Reasoning)\s*:?.*$/gim, "")
    .replace(/^\s*(Clue Breakdown|Breakdown|Explanation|Reasoning)\s*:.*$/gim, "")
    .replace(/^\s*[-*]\s*(Name|Favorite Brainrot|Favorite Kind of Tacos)\s*:.*$/gim, "")
    .replace(/^\s*---+\s*$/gm, "")
    .replace(/\r\n/g, "\n")
    .trim() || "No response received.";
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

/** Ask the built-in AI (Gemini via Lovable AI Gateway) with lightning-fast latency. */
export const askGemini = createServerFn({ method: "POST" })
  .inputValidator((d: { prompt: string }) => ({ prompt: String(d.prompt).slice(0, 2000) }))
  .handler(async ({ data }) => {
    let who = "anon";
    try {
      const { getRequestHeader } = await import("@tanstack/react-start/server");
      who = getRequestHeader("cf-connecting-ip") ?? getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
    } catch { /* no request context */ }

// Instant offline answer for single obvious questions (<0.01s)
if (!shouldDelegateToAi(data.prompt)) {
  const quick = quickAnswer(data.prompt);
  if (quick) return { text: quick, error: null };
}

const cached = getCachedAnswer(data.prompt);
if (cached) return { text: cached, error: null };

const refused = guard(data.prompt, tracker, who);
if (refused) return { text: refused, error: null };
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { text: null, error: "AI is not set up for this app yet." };

    // Only search the web if live external info is needed
    const needsSearch = /\b(active codes?|working codes?|codes right now|live leaks?|unconfirmed leak|today'?s announcement|latest tweet)\b/i.test(data.prompt);

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, "X-Lovable-AI-SDK": "fetch" },
      body: JSON.stringify({
        model: "google/gemini-3.8-flash",
        stream: false,
        reasoning_effort: "low",
        ...(needsSearch ? { tools: [{ type: "google_search" }] } : {}),
        messages: [
          {
            role: "system",
            content: `You are the expert AI for the Roblox game "Steal a Brainrot" (created by SpyderSammy / Do Big Studios).
Answer directly, accurately, and instantly.

CREATOR & LORE FACTS:
- Creator / Owner: Sammy (SpyderSammy)
- Sammy's Cat: Nova (only 1 cat)
- Sammy's Favorite Brainrot: Meowl
- Sammy's Favorite Food / Taco: Carne Asada
- Studio: Do Big Studios
- Game Updates: Every Saturday at 3 PM ET / 8 PM UTC
- Taco Tuesday / Admin Abuse: Tuesdays at 6 PM ET and Saturdays ~30-45m after updates

HANDLING CLUE CHAINS & RIDDLES:
- If the user provides a list of clues to tie together (such as "my name fav brainrot and kind of tacos"), output the final combined answer as ONE lowercase continuous string with no spaces (e.g. "sammymeowlcarneasada").
- Do not add unrequested bullet points, headings, or clue breakdowns.

STANDARD QUESTIONS:
- Answer directly and concisely (1–3 sentences).
- Use verified reference data below for exact stats, rarities, mutations, and exist counts.

REFERENCE DATA:
${retrieveAiContext(data.prompt)}
${getQuestionDataContext(data.prompt)}`,
          },
          { role: "user", content: data.prompt },
        ],
      }),
    });

    if (!r.ok) {
      const body = await r.text().catch(() => "");
      if (r.status === 402) return { text: null, error: "Out of AI credits for now — try again after credits reset." };
      if (r.status === 429) return { text: "Too many questions right now — wait a moment and try again." };
      return { text: null, error: `AI error ${r.status}: ${body.slice(0, 300)}` };
    }

    const json = (await r.json()) as { choices?: { message?: { content?: string } }[] };
    const rawText = json.choices?.[0]?.message?.content ?? "";
    const final = cleanAiAnswer(rawText);
    return { text: final, error: null };
  });
