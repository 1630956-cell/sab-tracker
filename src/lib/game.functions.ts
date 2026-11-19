import { createServerFn } from "@tanstack/react-start";
import { GAME } from "./game-data";

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

export const askGemini = createServerFn({ method: "POST" })
  .inputValidator((d: { prompt: string }) => ({ prompt: String(d.prompt).slice(0, 2000) }))
  .handler(async ({ data }) => {
    const key = process.env['GEMINI_API_KEY'];
    if (!key) return { text: null, error: "Gemini key not added yet." };
    const r = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: `You are a Steal a Brainrot (Roblox) expert. Search the web for the newest info. Be concise, use bullet points, give dates.\n\n${data.prompt}` }] }],
          tools: [{ google_search: {} }],
        }),
      },
    );
    if (!r.ok) return { text: null, error: `Gemini error ${r.status}: ${(await r.text()).slice(0, 300)}` };
    const j = (await r.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = j.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    return { text: text || "No answer.", error: null };
  });
