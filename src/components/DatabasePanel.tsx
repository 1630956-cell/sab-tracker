import { useMemo, useState } from "react";
import { DB } from "@/lib/brainrot-db";

type Row = { a: string; b: string; tag?: string };
type Section = { id: string; title: string; rows: Row[] };

function monthLabel(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return ym;
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

const SECTIONS: Section[] = [
  { id: "upcoming", title: "Coming up", rows: DB.upcoming.map((u) => ({ a: u.when, b: u.event, tag: u.status })) },
  { id: "sammy", title: "Sammy — everything known", rows: DB.sammy.map((s) => ({ a: s.label, b: s.value })) },
  { id: "obtain", title: "Every way to get a Brainrot", rows: DB.obtain.map((o) => ({ a: o.method, b: o.how })) },
  { id: "timeline", title: "Event & update timeline (by month)", rows: DB.timeline.map((t) => ({ a: monthLabel(t.month), b: t.event, ...(t.update ? { tag: `#${t.update}` } : {}) })) },
  { id: "rarities", title: "Rarities", rows: DB.rarities.map((r) => ({ a: r.name, b: r.note })) },
  { id: "mutations", title: "Mutations", rows: DB.mutations.map((m) => ({ a: m.name, b: m.note })) },
  { id: "traits", title: "Traits", rows: DB.traits.map((m) => ({ a: m.name, b: m.note })) },
  { id: "codes", title: "Codes", rows: DB.codes.map((c) => ({ a: c.code, b: c.reward, tag: c.status })) },
  { id: "records", title: "Records", rows: DB.records.map((r) => ({ a: r.when, b: r.record })) },
];

export function DatabasePanel() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string>("all");
  const filtered = useMemo(() => {
    const s = q.toLowerCase().trim();
    return SECTIONS.filter((sec) => open === "all" || sec.id === open)
      .map((sec) => ({ ...sec, rows: s ? sec.rows.filter((r) => `${r.a} ${r.b} ${r.tag ?? ""}`.toLowerCase().includes(s)) : sec.rows }))
      .filter((sec) => sec.rows.length > 0);
  }, [q, open]);

  return (
    <section className="space-y-4">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search everything — cat, fuse, Halloween, codes…" className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" />
      <div className="flex flex-wrap gap-2">
        {[{ id: "all", title: "All" }, ...SECTIONS].map((s) => (
          <button key={s.id} onClick={() => setOpen(s.id)} className={`rounded-full px-3 py-1 text-xs ${open === s.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
            {s.id === "all" ? "All" : s.title.split(" — ")[0]}
          </button>
        ))}
      </div>
      {filtered.map((sec) => (
        <article key={sec.id} className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 font-semibold">{sec.title}</h3>
          <dl className="divide-y divide-border">
            {sec.rows.map((r, i) => (
              <div key={`${r.a}-${i}`} className="grid gap-1 py-2 text-sm sm:grid-cols-[180px_1fr]">
                <dt className="font-medium text-foreground">{r.a}</dt>
                <dd className="text-muted-foreground">
                  {r.b}
                  {r.tag && <span className={`ml-2 rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${r.tag === "unconfirmed" || r.tag === "expired" ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary"}`}>{r.tag}</span>}
                </dd>
              </div>
            ))}
          </dl>
        </article>
      ))}
      {filtered.length === 0 && <p className="text-sm text-muted-foreground">No matches.</p>}
      <p className="text-xs text-muted-foreground">Preset facts gathered from fan wikis and news as of {DB.asOf}. Use “Ask AI” for anything newer.</p>
    </section>
  );
}
