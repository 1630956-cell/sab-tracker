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
import { guard, RepeatTracker } from "@/lib/abuse-guard";
import { CodexPanel } from "@/components/CodexPanel";
import { BasePanel } from "@/components/BasePanel";
import { TradePanel } from "@/components/TradePanel";
import { FeedbackPanel } from "@/components/FeedbackPanel";

const clientTracker = new RepeatTracker();

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
  const parts = [["d", Math.floor(s / 86400)], ["h", Math.floor((s % 86400) / 3600)], ["m", Math.floor((s % 3600) / 60)], ["s", s % 60]] as const;
  return (
    <div className="surface p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-3 flex gap-2">
        {parts.map(([u, v]) => (
          <div key={u} className="flex-1 rounded-lg bg-secondary px-2 py-2 text-center">
            <div className="font-mono text-2xl font-bold tabular-nums text-foreground">{now == null ? "--" : String(v).padStart(2, "0")}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{u}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ThemeToggle() {
  const [light, setLight] = useState(false);
  useEffect(() => { setLight(document.documentElement.classList.contains("light")); }, []);
  const flip = () => {
    const next = !light; setLight(next);
    const el = document.documentElement;
    el.classList.toggle("light", next); el.classList.toggle("dark", !next);
    try { localStorage.setItem("theme", next ? "light" : "dark"); } catch { /* ignore */ }
  };
  return (
    <button onClick={flip} aria-label={light ? "Switch to black theme" : "Switch to white theme"} className="flex items-center gap-1 rounded-lg border border-border bg-secondary px-2.5 py-1.5 text-xs font-medium transition hover:shadow-glow">
      <span className={light ? "opacity-40" : ""}>🌙</span><span className="text-muted-foreground">/</span><span className={light ? "" : "opacity-40"}>☀️</span>
    </button>
  );
}

const TABS = [
  { id: "updates", label: "Update log" },
  { id: "codex", label: "Brainrot Codex" },
  { id: "base", label: "Base yield" },
  { id: "trade", label: "Trade lab" },
  { id: "report", label: "Report / suggest" },
  { id: "database", label: "Database" },
  { id: "sammy", label: "Sammy & the game" },
  { id: "ask", label: "Ask AI" },
] as const;
type Tab = (typeof TABS)[number]["id"];

function Home() {
  const { data } = useSuspenseQuery(statsQuery);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Tab>("updates");
  const list = useMemo(() => UPDATES.filter((u) => (u.title + u.items.join(" ") + u.n).toLowerCase().includes(q.toLowerCase())), [q]);
  const nextUpdate = useMemo(() => nextET(6, 15), []);
  const nextTaco = useMemo(() => nextET(2, 18), []);
  const latest = UPDATES[0]!;
  const newBros = DB.bros.filter((b) => b.income.startsWith("New"));
  const newest = DB.mutations[DB.mutations.length - 1]!;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-spotlight" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-grid" />
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 h-px neon-edge" />

      <div className="sticky top-3 z-20 mt-3 px-4 sm:px-5">
      <header className="mx-auto flex max-w-5xl items-center justify-between rounded-2xl px-4 py-2.5 glass-bar">
        <div className="flex items-center gap-2 text-base font-bold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-brand shadow-glow">⚡</span>
          <span className="font-display text-sm sm:text-base">{BRAND.name}</span>
        </div>
        <div className="flex items-center gap-2">
        <ThemeToggle />
        <a href={GAME.url} target="_blank" rel="noreferrer" className="rounded-lg bg-gradient-brand px-3.5 py-1.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:brightness-110">Play game ↗</a>
        </div>
      </header>
      </div>

      <main className="relative mx-auto max-w-5xl space-y-5 px-4 pb-16 pt-8 sm:px-5">
        <section className="surface animate-fade-up p-6 sm:p-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" /></span>
            Live players in {GAME.name} · refreshes every 30s
          </div>
          <div className="mt-2 font-mono text-5xl font-bold tabular-nums text-gradient sm:text-7xl">{fmt(data.playing)}</div>
          {data.error && <p className="mt-2 text-sm text-destructive">{data.error}</p>}
          <div className="mt-6 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            {[["Total visits", fmt(data.visits)], ["Favorites", fmt(data.favorites)], ["Last game update", data.updated ? new Date(data.updated).toLocaleString() : "—"]].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-secondary px-3 py-2.5"><div className="text-xs text-muted-foreground">{k}</div><div className="mt-0.5 font-semibold">{v}</div></div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <Countdown label="Next Saturday update + Admin Abuse · 3 PM ET" target={nextUpdate} />
          <Countdown label="Taco Tuesday Admin Abuse · 6 PM ET" target={nextTaco} />
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="surface relative overflow-hidden p-6">
            <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/30 blur-3xl" />
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-primary-glow">
              <span className="rounded bg-gradient-brand px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">NEW</span>
              Update #{latest.n} · {latest.date}
            </div>
            <h2 className="mt-2 font-display text-2xl font-bold">{latest.title}</h2>
            <ul className="mt-3 grid gap-1.5 text-sm text-muted-foreground">{latest.items.map((i) => <li key={i} className="flex gap-2"><span className="text-primary-glow">▸</span>{i}</li>)}</ul>
          </div>
          <div className="surface p-6">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Newest mutation</div>
            <div className="mt-1 text-3xl font-bold text-gradient">{newest.name}</div>
            <div className="text-sm text-muted-foreground">{newest.note.split(" · ")[0]}</div>
            <div className="mt-4 text-xs uppercase tracking-wider text-muted-foreground">New Bros recipes</div>
            <ul className="mt-2 space-y-2 text-sm">
              {newBros.map((b) => (
                <li key={b.name} className="rounded-lg bg-secondary px-3 py-2">
                  <div className="font-medium">{b.name}</div>
                  <div className="text-xs text-muted-foreground">{b.recipe}</div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <IncomingPanel />

        <nav className="flex flex-wrap gap-1 rounded-2xl p-1 glass-bar">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition ${tab === t.id ? "bg-gradient-brand text-primary-foreground shadow-glow" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
              {t.label}
            </button>
          ))}
        </nav>

        {tab === "updates" && (
          <section className="space-y-3">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search updates, Brainrots, events…" className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none transition focus:border-primary focus:shadow-glow" />
            {list.map((u) => (
              <article key={u.n} className="surface animate-rise p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-semibold"><span className="mr-2 font-mono text-primary-glow">#{u.n}</span>{u.title}</h3>
                  <span className="shrink-0 text-xs text-muted-foreground">{u.date}</span>
                </div>
                <ul className="mt-2 space-y-0.5 text-sm text-muted-foreground">{u.items.map((i) => <li key={i}>• {i}</li>)}</ul>
              </article>
            ))}
            {list.length === 0 && <p className="text-sm text-muted-foreground">No matches.</p>}
          </section>
        )}

        {tab === "sammy" && (
          <section className="grid gap-4 sm:grid-cols-2">
            <div className="surface p-5">
              <h3 className="text-lg font-bold">{SAMMY.display} (@{SAMMY.handle})</h3>
              <a className="text-sm text-primary-glow" href={`https://www.roblox.com/users/${SAMMY.userId}/profile`} target="_blank" rel="noreferrer">Roblox profile ↗</a>
              <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">{SAMMY.facts.map((f) => <li key={f}>• {f}</li>)}</ul>
            </div>
            <div className="surface p-5">
              <h3 className="text-lg font-bold">{GAME.name}</h3>
              <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">{SAMMY.gameFacts.map((f) => <li key={f}>• {f}</li>)}</ul>
              <div className="mt-4 space-y-1 rounded-lg bg-secondary p-3 font-mono text-xs text-muted-foreground">
                <div>Place ID: {GAME.placeId}</div><div>Universe ID: {GAME.universeId}</div><div>Group: {GAME.groupName} ({GAME.groupId})</div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Only the game with these IDs is official — anything else is a copy.</p>
            </div>
          </section>
        )}

        {tab === "codex" && <CodexPanel />}
        {tab === "base" && <BasePanel />}
        {tab === "trade" && <TradePanel />}
        {tab === "report" && <FeedbackPanel />}
        {tab === "database" && <DatabasePanel />}

        {tab === "ask" && <AskPanel />}
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        {BRAND.name} · fan-made, not affiliated with Roblox or {GAME.groupName}
      </footer>
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
    const refused = guard(p, clientTracker);
    if (refused) { setOut(refused); return; }
    const quick = quickAnswer(p);
    if (quick) { setOut(quick); return; }
    setLoading(true); setOut(null);
    const r = await ask({ data: { prompt: p } });
    setOut(r.error ?? r.text); setLoading(false);
  }
  return (
    <section className="surface space-y-3 p-5">
      <div className="flex flex-wrap gap-2">{presets.map((p) => <button key={p} onClick={() => { setPrompt(p); run(p); }} className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground transition hover:bg-accent">{p}</button>)}</div>
      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none transition focus:border-primary focus:shadow-glow" />
      <button disabled={loading} onClick={() => run()} className="rounded-lg bg-gradient-brand px-5 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition hover:brightness-110 disabled:opacity-50">{loading ? "Searching the web…" : "Ask"}</button>
      {out && <div className="animate-rise whitespace-pre-wrap rounded-xl border border-primary/40 bg-background p-4 text-base font-medium">{out}</div>}
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
    <section className="surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">Incoming updates</h2>
        <button disabled={loading} onClick={check} className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground transition hover:bg-accent disabled:opacity-50">{loading ? "Checking the web…" : "Check latest leaks (AI)"}</button>
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
