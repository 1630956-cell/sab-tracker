import { useMemo, useState } from "react";
import { MutationToggle } from "@/components/MutationMatrix";
import { ALL_CODES, OFFICIAL_UPDATES, SCAMS, UNITS } from "@/lib/codex-data";

const RARITIES = ["All", "OG", "Secret", "Brainrot God", "Limited", "Mythic", "Legendary", "Epic", "Rare", "Common", "Unknown"];
const RARITY_STYLE: Record<string, string> = {
  OG: "bg-destructive/20 text-destructive",
  Secret: "bg-foreground/15 text-foreground",
  "Brainrot God": "bg-primary/25 text-primary-glow",
  Limited: "bg-accent text-accent-foreground",
};
type Sort = "income" | "exist" | "name";
type View = "units" | "rarest" | "updates" | "codes" | "scams";
const VIEWS: [View, string][] = [["units", `All Brainrots (${UNITS.length})`], ["rarest", "Rarest (exist counts)"], ["updates", `Updates (${OFFICIAL_UPDATES.length})`], ["codes", `Codes (${ALL_CODES.length})`], ["scams", "Trade scams"]];
const fmt = (n: number) => n.toLocaleString("en-US");

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className={`rounded-full px-3 py-1 text-xs font-medium transition ${active ? "bg-gradient-brand text-primary-foreground shadow-glow" : "bg-secondary text-secondary-foreground hover:bg-accent"}`}>{children}</button>;
}

export function CodexPanel() {
  const [view, setView] = useState<View>("units");
  const [q, setQ] = useState("");
  const [rarity, setRarity] = useState("All");
  const [sort, setSort] = useState<Sort>("income");
  const [limit, setLimit] = useState(60);
  const s = q.toLowerCase().trim();

  const units = useMemo(() => {
    let r = UNITS.filter((u) => (rarity === "All" || u[1] === rarity) && (!s || (u[0] + " " + u[4]).toLowerCase().includes(s)));
    if (view === "rarest") r = r.filter((u) => u[6] != null).sort((a, b) => (a[6] ?? 0) - (b[6] ?? 0));
    else if (sort === "income") r = [...r].sort((a, b) => b[3] - a[3]);
    else if (sort === "exist") r = [...r].sort((a, b) => (a[6] ?? Infinity) - (b[6] ?? Infinity));
    else r = [...r].sort((a, b) => a[0].localeCompare(b[0]));
    return r;
  }, [s, rarity, sort, view]);

  const top = UNITS.reduce((a, b) => (b[3] > a[3] ? b : a));
  // Only rank units we can corroborate: a published count AND a recorded income.
  // Rows with no income come from trackers without wiki backing and can carry junk
  // counts (e.g. "Rainbow And Gold" at 1). Excluding them keeps the headline honest.
  const rankable = UNITS.filter((u) => u[6] != null && u[3] > 0);
  const rarest = rankable.reduce((a, b) => ((b[6] ?? 1e9) < (a[6] ?? 1e9) ? b : a), rankable[0]);

  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="surface p-4"><div className="text-xs uppercase tracking-wide text-muted-foreground">Brainrots tracked</div><div className="mt-1 font-mono text-3xl font-bold text-gradient">{UNITS.length}</div></div>
        <div className="surface p-4"><div className="text-xs uppercase tracking-wide text-muted-foreground">Highest income</div><div className="mt-1 truncate font-semibold">{top[0]}</div><div className="font-mono text-sm text-primary-glow">{top[2]}</div></div>
        <div className="surface p-4"><div className="text-xs uppercase tracking-wide text-muted-foreground">Rarest known</div><div className="mt-1 truncate font-semibold">{rarest[0]}</div><div className="font-mono text-sm text-primary-glow">{rarest[6]} exist</div><div className="mt-1 text-[10px] text-muted-foreground/70">{rankable.length} of {UNITS.length} units counted</div></div>
      </div>

      <div className="flex flex-wrap gap-1 rounded-2xl p-1 glass-bar">
        {VIEWS.map(([id, label]) => <button key={id} onClick={() => { setView(id); setLimit(60); }} className={`flex-1 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-medium transition ${view === id ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}>{label}</button>)}
      </div>

      <input value={q} onChange={(e) => { setQ(e.target.value); setLimit(60); }} placeholder="Search by name, obtain method, update, code…" className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none transition focus:border-primary focus:shadow-glow" />

      {(view === "units" || view === "rarest") && (
        <>
          <div className="flex flex-wrap gap-2">{RARITIES.map((r) => <Chip key={r} active={rarity === r} onClick={() => setRarity(r)}>{r}</Chip>)}</div>
          {view === "units" && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">Sort:
              {(["income", "exist", "name"] as Sort[]).map((k) => <Chip key={k} active={sort === k} onClick={() => setSort(k)}>{k === "income" ? "Income $/s" : k === "exist" ? "Rarest first" : "A–Z"}</Chip>)}
              <span className="ml-auto">{units.length} results</span>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {units.slice(0, limit).map((u, i) => (
              <article key={u[0] + i} className="surface animate-rise flex flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold leading-tight">{view === "rarest" && <span className="mr-1 font-mono text-primary-glow">#{i + 1}</span>}{u[0]}</h3>
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${RARITY_STYLE[u[1]] ?? "bg-secondary text-muted-foreground"}`}>{u[1]}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-lg font-bold text-gradient">{u[2] || "—"}</span>
                  {u[6] != null && <span className="font-mono text-xs text-muted-foreground">{fmt(u[6])} exist</span>}
                </div>
                <MutationToggle perSec={u[3]} unitName={u[0]} />
                {u[4] && <p className="line-clamp-2 text-xs text-muted-foreground">{u[4]}</p>}
                {u[5] && <p className="mt-auto text-[11px] text-muted-foreground/70">Added {u[5]}</p>}
              </article>
            ))}
          </div>
          {units.length > limit && <button onClick={() => setLimit(limit + 60)} className="w-full rounded-xl bg-secondary py-2.5 text-sm font-medium transition hover:bg-accent">Show more ({units.length - limit} left)</button>}
          {units.length === 0 && <p className="text-sm text-muted-foreground">No matches.</p>}
          {view === "rarest" && <p className="text-xs text-muted-foreground">Only Brainrots with a published exist count are ranked.</p>}
        </>
      )}

      {view === "updates" && (
        <ol className="relative space-y-3 border-l border-border pl-5">
          {OFFICIAL_UPDATES.filter((u) => !s || u.join(" ").toLowerCase().includes(s)).map((u) => (
            <li key={u[0] + u[1]} className="surface animate-rise relative p-4">
              <span className="absolute -left-[27px] top-5 h-3 w-3 rounded-full bg-gradient-brand shadow-glow" />
              <div className="flex items-baseline justify-between gap-3"><h3 className="font-semibold"><span className="mr-2 font-mono text-primary-glow">{u[0]}</span>{u[1]}</h3><span className="shrink-0 text-xs text-muted-foreground">{u[2]}</span></div>
              <p className="mt-1 text-sm text-muted-foreground">{u[3]}</p>
            </li>
          ))}
        </ol>
      )}

      {view === "codes" && (
        <div className="grid gap-2">
          {ALL_CODES.filter((c) => !s || c.join(" ").toLowerCase().includes(s)).map((c) => (
            <div key={c[0]} className="surface flex flex-wrap items-center gap-3 p-3">
              <button onClick={() => navigator.clipboard?.writeText(c[0])} title="Copy" className="rounded-md bg-secondary px-2 py-1 font-mono text-sm font-bold transition hover:bg-accent">{c[0]}</button>
              <span className="text-sm">{c[2]}</span>
              <span className="text-xs text-muted-foreground">{c[4]}</span>
              <span className={`ml-auto rounded px-1.5 py-0.5 text-[10px] uppercase ${c[3] === "active" ? "bg-primary/20 text-primary-glow" : "bg-secondary text-muted-foreground"}`}>{c[3]}</span>
            </div>
          ))}
        </div>
      )}

      {view === "scams" && (
        <div className="grid gap-3 sm:grid-cols-2">
          {SCAMS.map((x) => (
            <div key={x[0]} className="surface p-4">
              <h3 className="font-semibold text-destructive">{x[0]}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{x[1]}</p>
              <p className="mt-2 text-sm"><span className="font-semibold text-primary-glow">Stay safe: </span>{x[2]}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
