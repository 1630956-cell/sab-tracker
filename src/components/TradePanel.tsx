import { useMemo, useState } from "react";
import { UNITS } from "@/lib/codex-data";
import { money } from "@/lib/mutations";

type Side = "A" | "B";

/**
 * Derived index — NOT a marketplace price. No source publishes trade values in a
 * single unit, so this scores a unit on income percentile (70%) and published
 * scarcity (30%). It is a comparison tool, nothing more.
 */
function scoreOf(name: string): { score: number; exists: number | null; income: number } {
  const unit = UNITS.find((u) => u[0] === name);
  if (!unit) return { score: 0, exists: null, income: 0 };
  const incomes = UNITS.map((u) => u[3]).filter((n) => n > 0).sort((a, b) => a - b);
  const pct = incomes.length ? incomes.filter((v) => v <= unit[3]).length / incomes.length : 0;
  const exists = unit[6];
  const scarcity = exists != null ? Math.max(0, 1 - Math.log10(Math.max(10, exists)) / 6) : 0.45;
  return { score: Math.round(1000 * (0.7 * pct + 0.3 * scarcity)), exists, income: unit[3] };
}

export function TradePanel() {
  const [a, setA] = useState<string[]>([]);
  const [b, setB] = useState<string[]>([]);
  const [pick, setPick] = useState("");

  const add = (side: Side) => {
    if (!pick) return;
    if (side === "A") setA((p) => [...p, pick]);
    else setB((p) => [...p, pick]);
    setPick("");
  };

  const totals = useMemo(
    () => ({
      A: a.reduce((s, n) => s + scoreOf(n).score, 0),
      B: b.reduce((s, n) => s + scoreOf(n).score, 0),
    }),
    [a, b]
  );

  const diff = totals.A - totals.B;
  const pct = totals.B > 0 ? (diff / totals.B) * 100 : totals.A > 0 ? 100 : 0;
  const verdict = Math.abs(pct) < 8 ? "FAIR" : diff > 0 ? "YOU WIN ON INDEX" : "YOU LOSE ON INDEX";

  const warnings = [...a, ...b].flatMap((n) => {
    const s = scoreOf(n);
    if (s.exists == null) return [`${n} has no published exist count — scarcity unproven.`];
    if (s.exists > 100_000) return [`${n} has ${s.exists.toLocaleString()} copies — illiquid, expect to sit on it.`];
    if (s.exists <= 5) return [`${n} is effectively extinct at ${s.exists} copies — hard to re-acquire if you trade it away.`];
    return [];
  });

  const column = (side: Side, list: string[]) => (
    <div className="surface p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-primary-glow">{side === "A" ? "Your side" : "Their side"}</h3>
        <span className="font-mono text-lg font-bold text-gradient">{totals[side]}</span>
      </div>
      <div className="mt-2 flex gap-1">
        <button onClick={() => add(side)} className="rounded-lg bg-secondary px-2.5 py-1 text-xs transition hover:bg-accent">add selected</button>
        <button onClick={() => (side === "A" ? setA([]) : setB([]))} className="rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground transition hover:text-destructive">clear</button>
      </div>
      <ul className="mt-3 space-y-1.5">
        {list.length === 0 && <li className="text-sm text-muted-foreground">Nothing yet.</li>}
        {list.map((n, i) => {
          const s = scoreOf(n);
          return (
            <li key={`${n}-${i}`} className="flex items-center justify-between rounded-lg bg-secondary/60 px-2.5 py-1.5">
              <div className="min-w-0">
                <div className="truncate text-sm">{n}</div>
                <div className="font-mono text-[10px] text-muted-foreground">
                  {money(s.income)}/s · {s.exists != null ? `${s.exists.toLocaleString()} exist` : "count unpublished"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-primary-glow">{s.score}</span>
                <button
                  onClick={() => (side === "A" ? setA(a.filter((_, j) => j !== i)) : setB(b.filter((_, j) => j !== i)))}
                  className="text-xs text-destructive"
                  aria-label={`Remove ${n}`}
                >
                  ×
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <section className="space-y-4">
      <div className="surface p-5">
        <h2 className="font-display text-lg font-bold">Trade lab</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Compare both sides on a derived index. No marketplace prices exist in this data, so nothing here is a price — compare rank, then check liquidity warnings.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            list="trade-units"
            value={pick}
            onChange={(e) => setPick(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") add("A"); }}
            placeholder="Search a brainrot to add…"
            className="min-w-[220px] flex-1 rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:shadow-glow"
          />
          <datalist id="trade-units">
            {UNITS.map((u) => <option key={u[0]} value={u[0]}>{`${u[0]} — ${u[2]}`}</option>)}
          </datalist>
          <button onClick={() => add("A")} className="rounded-xl border border-primary/60 px-3 py-2 text-sm font-semibold text-primary-glow transition hover:shadow-glow">To mine</button>
          <button onClick={() => add("B")} className="rounded-xl border border-border px-3 py-2 text-sm font-semibold text-foreground transition hover:shadow-glow">To theirs</button>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {column("A", a)}
        {column("B", b)}
      </div>

      <div className="surface p-5">
        <div className="flex flex-wrap items-baseline gap-6">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Differential</div>
            <div className={`font-mono text-2xl font-bold ${diff >= 0 ? "text-primary-glow" : "text-destructive"}`}>{diff >= 0 ? "+" : ""}{diff}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Relative</div>
            <div className="font-mono text-2xl font-bold text-foreground">{pct.toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Verdict</div>
            <div className={`text-lg font-bold ${verdict === "FAIR" ? "text-foreground" : diff > 0 ? "text-primary-glow" : "text-destructive"}`}>{verdict}</div>
          </div>
        </div>
        {warnings.length > 0 && (
          <ul className="mt-3 space-y-1 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-muted-foreground">
            {warnings.slice(0, 5).map((w) => <li key={w}>⚠ {w}</li>)}
          </ul>
        )}
      </div>
    </section>
  );
}
