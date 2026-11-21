import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { BRAND, brandMeta } from "@/lib/brand";
import { GAME, SAMMY, UPDATES, nextET } from "@/lib/game-data";
import { askGemini, getLiveStats } from "@/lib/game.functions";
import { DatabasePanel } from "@/components/DatabasePanel";
import { DB } from "@/lib/brainrot-db";
import { quickAnswer } from "@/lib/quick-answers";

const statsQuery = queryOptions({ queryKey: ["live"], queryFn: () => getLiveStats(), staleTime: 25_000, refetchInterval: 30_000 });

export const Route = createFileRoute("/")({
  head: () => ({ meta: brandMeta(`${BRAND.name} — Steal a Brainrot live tracker`) }),
  loader: ({ context }) => context.queryClient.ensureQueryData(statsQuery),
  component: Home,
});

const fmt = (n: number | null) => (n == null ? "—" : n.toLocaleString("en-US"));

function Countdown({ label, target }: { label: string; target: Date }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i); }, []);
  const s = now == null ? 0 : Math.max(0, Math.floor((target.getTime() - now) / 1000));
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-2xl text-foreground tabular-nums">{now == null ? "--" : `${d}d ${h}h ${m}m ${sec}s`}</div>
    </div>
  );
}

function Home() {
  const { data } = useSuspenseQuery(statsQuery);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"updates" | "database" | "sammy" | "ask">("updates");
  const list = useMemo(() => UPDATES.filter((u) => (u.title + u.items.join(" ") + u.n).toLowerCase().includes(q.toLowerCase())), [q]);
  const nextUpdate = useMemo(() => nextET(6, 15), []);
  const nextTaco = useMemo(() => nextET(2, 18), []);
  const latest = UPDATES[0]!;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <div className="text-lg font-bold tracking-tight">🧠 {BRAND.name}</div>
        <a href={GAME.url} target="_blank" rel="noreferrer" className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">Play game</a>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-5 pb-16">
        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" /></span>
            Live players in {GAME.name} · refreshes every 30s
          </div>
          <div className="mt-2 font-mono text-5xl font-bold tabular-nums sm:text-6xl">{fmt(data.playing)}</div>
          {data.error && <p className="mt-2 text-sm text-destructive">{data.error}</p>}
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div><div className="text-muted-foreground">Total visits</div><div className="font-semibold">{fmt(data.visits)}</div></div>
            <div><div className="text-muted-foreground">Favorites</div><div className="font-semibold">{fmt(data.favorites)}</div></div>
            <div><div className="text-muted-foreground">Last game update</div><div className="font-semibold">{data.updated ? new Date(data.updated).toLocaleString() : "—"}</div></div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <Countdown label="Next Saturday update + Admin Abuse (3 PM ET)" target={nextUpdate} />
          <Countdown label="Taco Tuesday Admin Abuse (6 PM ET)" target={nextTaco} />
        </section>

        <section className="rounded-2xl border border-primary/40 bg-card p-6">
          <div className="text-xs uppercase tracking-wider text-primary">Latest update · #{latest.n} · {latest.date}</div>
          <h2 className="mt-1 text-2xl font-bold">{latest.title}</h2>
          <ul className="mt-3 grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">{latest.items.map((i) => <li key={i}>• {i}</li>)}</ul>
        </section>

        <IncomingPanel />

        <nav className="flex flex-wrap gap-2">
          {(["updates", "database", "sammy", "ask"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === t ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
              {t === "updates" ? "Update log" : t === "database" ? "Database" : t === "sammy" ? "Sammy & the game" : "Ask AI (live web)"}
            </button>
          ))}
        </nav>

        {tab === "updates" && (
          <section className="space-y-3">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search updates, Brainrots, events…" className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" />
            {list.map((u) => (
              <article key={u.n} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-baseline justify-between"><h3 className="font-semibold">#{u.n} · {u.title}</h3><span className="text-xs text-muted-foreground">{u.date}</span></div>
                <ul className="mt-2 space-y-0.5 text-sm text-muted-foreground">{u.items.map((i) => <li key={i}>• {i}</li>)}</ul>
              </article>
            ))}
            {list.length === 0 && <p className="text-sm text-muted-foreground">No matches.</p>}
          </section>
        )}

        {tab === "sammy" && (
          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-lg font-bold">{SAMMY.display} (@{SAMMY.handle})</h3>
              <a className="text-sm text-primary" href={`https://www.roblox.com/users/${SAMMY.userId}/profile`} target="_blank" rel="noreferrer">Roblox profile ↗</a>
              <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">{SAMMY.facts.map((f) => <li key={f}>• {f}</li>)}</ul>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-lg font-bold">{GAME.name}</h3>
              <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">{SAMMY.gameFacts.map((f) => <li key={f}>• {f}</li>)}</ul>
              <div className="mt-4 space-y-1 font-mono text-xs text-muted-foreground">
                <div>Place ID: {GAME.placeId}</div><div>Universe ID: {GAME.universeId}</div><div>Group: {GAME.groupName} ({GAME.groupId})</div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Only the game with these IDs is official — anything else is a copy.</p>
            </div>
          </section>
        )}

        {tab === "database" && <DatabasePanel />}

        {tab === "ask" && <AskPanel />}
      </main>
    </div>
  );
}

function AskPanel() {
  const ask = useServerFn(askGemini);
  const [prompt, setPrompt] = useState("What is the newest Steal a Brainrot update and what did it add?");
  const [out, setOut] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const presets = ["What's the newest update?", "What events are coming next?", "Latest news about SpyderSammy", "When is the next update and what's leaked?", "Any active codes?"];
  async function run(p = prompt) {
    const quick = quickAnswer(p);
    if (quick) { setOut(quick); return; }
    setLoading(true); setOut(null);
    const r = await ask({ data: { prompt: p } });
    setOut(r.error ?? r.text); setLoading(false);
  }
  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap gap-2">{presets.map((p) => <button key={p} onClick={() => { setPrompt(p); run(p); }} className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">{p}</button>)}</div>
      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} className="w-full rounded-lg border border-input bg-background p-3 text-sm outline-none focus:border-primary" />
      <button disabled={loading} onClick={() => run()} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">{loading ? "Searching the web…" : "Ask"}</button>
      {out && <div className="whitespace-pre-wrap rounded-lg bg-background p-4 text-sm">{out}</div>}
    </section>
  );
}

function IncomingPanel() {
  const ask = useServerFn(askGemini);
  const [out, setOut] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  async function check() {
    setLoading(true); setOut(null);
    const r = await ask({ data: { prompt: "What is the next upcoming Steal a Brainrot update or event, and what is leaked or announced for it?" } });
    setOut(r.error ?? r.text); setLoading(false);
  }
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">Incoming updates</h2>
        <button disabled={loading} onClick={check} className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground disabled:opacity-50">{loading ? "Checking the web…" : "Check latest leaks (AI)"}</button>
      </div>
      <ul className="mt-3 divide-y divide-border">
        {DB.upcoming.map((u) => (
          <li key={u.when + u.event} className="grid gap-1 py-2 text-sm sm:grid-cols-[200px_1fr]">
            <span className="font-medium">{u.when}</span>
            <span className="text-muted-foreground">
              {u.event}
              <span className={`ml-2 rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${u.status === "unconfirmed" ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary"}`}>{u.status}</span>
            </span>
          </li>
        ))}
      </ul>
      {out && <div className="mt-3 whitespace-pre-wrap rounded-lg bg-background p-3 text-sm">{out}</div>}
    </section>
  );
}
