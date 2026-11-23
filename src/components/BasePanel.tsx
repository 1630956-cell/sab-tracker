import { useEffect, useMemo, useState } from "react";
import { UNITS } from "@/lib/codex-data";
import { MUTATIONS, TRAITS, money } from "@/lib/mutations";
import { MutationMatrix } from "@/components/MutationMatrix";

type Row = { id: string; name: string; count: number; mutation: string; trait: string };
const STORAGE = "sab.base.v1";

/** base × (mutation + Σ additive traits) × harmful multiplier, per the in-game rule. */
function rowIncome(row: Row): number {
  const unit = UNITS.find((u) => u[0] === row.name);
  const base = unit?.[3] ?? 0;
  const mut = MUTATIONS.find((m) => m.name === row.mutation);
  const trait = TRAITS.find((t) => t.name === row.trait);
  const additive = trait && trait.multiplier >= 1 ? trait.multiplier : 0;
  const harmful = trait && trait.multiplier < 1 ? trait.multiplier : 1;
  const mult = mut?.multiplier ?? (mut?.reported ?? 1);
  return base * (mult + additive) * harmful * row.count;
}

export function BasePanel() {
  const [rows, setRows] = useState<Row[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE);
      return raw ? (JSON.parse(raw) as Row[]) : [];
    } catch {
      return [];
    }
  });
  const [pick, setPick] = useState("");
  const [draftMut, setDraftMut] = useState("None (raw)");
  const [draftTrait, setDraftTrait] = useState("None");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(rows));
    } catch {
      /* storage full or blocked — the calculator still works in-memory */
    }
  }, [rows]);

  const total = useMemo(() => rows.reduce((a, r) => a + rowIncome(r), 0), [rows]);
  const breakdown = useMemo(
    () => rows.map((r) => ({ ...r, value: rowIncome(r) })).sort((a, b) => b.value - a.value),
    [rows]
  );

  // Risk: income concentration weighted by published scarcity.
  const risk = useMemo(() => {
    if (!total) return 0;
    const raw = rows.reduce((acc, r) => {
      const unit = UNITS.find((u) => u[0] === r.name);
      const share = rowIncome(r) / total;
      const scarcity = unit?.[6] != null ? 1 - Math.min(1, (unit[6] ?? 0) / 100_000) : 0.45;
      return acc + share * (0.55 * scarcity + 0.45 * Math.min(1, rowIncome(r) / 5e8));
    }, 0);
    return Math.min(1, raw);
  }, [rows, total]);

  const riskTier = risk > 0.66 ? "CRITICAL" : risk > 0.4 ? "HIGH" : risk > 0.18 ? "MODERATE" : "LOW";
  const lead = breakdown[0];

  const add = () => {
    if (!pick) return;
    setRows((prev) => [...prev, { id: crypto.randomUUID(), name: pick, count: 1, mutation: draftMut, trait: draftTrait }]);
    setPick("");
  };

  return (
    <section className="space-y-4">
      <div className="surface p-5">
        <h2 className="font-display text-lg font-bold">Base yield calculator</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Model your base exactly: units × mutation + stacked traits. Saved to this browser.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <input
            list="sab-units"
            value={pick}
            onChange={(e) => setPick(e.target.value)}
            placeholder="Add a brainrot…"
            className="min-w-[200px] flex-1 rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:shadow-glow"
          />
          <datalist id="sab-units">
            {UNITS.filter((u) => u[3] > 0).map((u) => (
              <option key={u[0]} value={u[0]}>{`${u[0]} — ${u[2]}`}</option>
            ))}
          </datalist>
          <select value={draftMut} onChange={(e) => setDraftMut(e.target.value)} className="rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary">
            <option>None (raw)</option>
            {MUTATIONS.map((m) => (
              <option key={m.name} value={m.name}>{`${m.name}${m.multiplier ? ` · ${m.multiplier}×` : " · ~15×?"}`}</option>
            ))}
          </select>
          <select value={draftTrait} onChange={(e) => setDraftTrait(e.target.value)} className="rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary">
            <option>None</option>
            {TRAITS.map((t) => (
              <option key={t.name} value={t.name}>{`${t.name} · ${t.multiplier}×`}</option>
            ))}
          </select>
          <button onClick={add} className="rounded-xl bg-gradient-brand px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow">
            Add
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[["Cash / second", money(total)], ["Per minute", money(total * 60)], ["Per hour", money(total * 3600)], ["Per day", money(total * 86400)]].map(([label, value]) => (
          <div key={label} className="surface p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
            <div className="mt-1 font-mono text-2xl font-bold text-gradient">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.6fr_1fr]">
        <div className="surface p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-primary-glow">Slots ({rows.length})</h3>
          <div className="mt-3 space-y-2">
            {breakdown.length === 0 && <p className="text-sm text-muted-foreground">No units yet — add one above.</p>}
            {breakdown.map((r) => (
              <div key={r.id} className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-xl bg-secondary/60 p-2.5">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{r.name}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">
                    {r.mutation === "None (raw)" ? "raw" : r.mutation} · {r.trait === "None" ? "no trait" : r.trait} · {money(r.value)}/s
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={1}
                    value={r.count}
                    onChange={(e) =>
                      setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, count: Math.max(1, Number(e.target.value) || 1) } : x)))
                    }
                    className="w-16 rounded-lg border border-input bg-card px-2 py-1 text-center font-mono text-sm outline-none focus:border-primary"
                  />
                  <button
                    onClick={() => setRows((prev) => prev.filter((x) => x.id !== r.id))}
                    className="rounded-lg border border-border px-2 py-1 text-xs text-destructive transition hover:bg-destructive/10"
                    aria-label={`Remove ${r.name}`}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="surface p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Theft vulnerability</div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-gradient-brand transition-all" style={{ width: `${Math.round(risk * 100)}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className={`text-sm font-bold ${risk > 0.66 ? "text-destructive" : risk > 0.4 ? "text-foreground" : "text-primary-glow"}`}>{riskTier}</span>
              <span className="font-mono text-xs text-muted-foreground">{Math.round(risk * 100)}%</span>
            </div>
            <p className="mt-2 text-[11px] leading-tight text-muted-foreground/70">
              Weighted by income concentration and published scarcity. Spread yield across slots; a single high-value unit draws raiders.
            </p>
          </div>
          <div className="surface p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Top slot — every mutation</div>
            {lead ? (
              <div className="mt-2">
                <div className="text-sm font-semibold">{lead.name}</div>
                <MutationMatrix perSec={UNITS.find((u) => u[0] === lead.name)?.[3] ?? 0} unitName={lead.name} inline />
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Add a unit to see its mutation spread.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
