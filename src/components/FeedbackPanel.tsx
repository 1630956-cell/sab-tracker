import { useMemo, useState } from "react";
import { screenMessage } from "@/lib/feedback-filter";
import { submitFeedback } from "@/lib/feedback.functions";

const CATEGORIES = ["Bug", "Wrong data", "Suggestion", "Missing content", "Other"] as const;
type Category = (typeof CATEGORIES)[number];

type Sent = { category: string; message: string; at: string; status: string };
const HISTORY = "sab.feedback.v1";
const MAX = 1200;

export function FeedbackPanel() {
  const [category, setCategory] = useState<Category>("Bug");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ tone: "ok" | "warn" | "error"; text: string } | null>(null);
  const [history, setHistory] = useState<Sent[]>(() => {
    try {
      const raw = localStorage.getItem(HISTORY);
      return raw ? (JSON.parse(raw) as Sent[]) : [];
    } catch {
      return [];
    }
  });

  const screen = useMemo(() => screenMessage(message), [message]);
  const tooShort = message.trim().length > 0 && message.trim().length < 10;

  const remember = (entry: Sent) => {
    const next = [entry, ...history].slice(0, 8);
    setHistory(next);
    try {
      localStorage.setItem(HISTORY, JSON.stringify(next));
    } catch {
      /* ignore quota errors */
    }
  };

  const send = async () => {
    if (!screen.ok) return;
    if (message.trim().length < 10) {
      setResult({ tone: "warn", text: "Add a bit more detail — at least 10 characters." });
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const res = await submitFeedback({
        data: { category, message, page: typeof window !== "undefined" ? window.location.pathname : "" },
      });
      if (res.delivered) {
        setResult({ tone: "ok", text: "Report sent. Thanks — that's genuinely useful." });
        remember({ category, message, at: new Date().toISOString(), status: res.via });
        setMessage("");
      } else if (res.reason === "not-configured") {
        setResult({
          tone: "warn",
          text: "No destination is configured yet, so nothing was sent. Your message is kept below — copy it and send it directly.",
        });
        remember({ category, message, at: new Date().toISOString(), status: "not delivered" });
      } else {
        setResult({ tone: "error", text: res.reason ?? res.error ?? "Could not send that right now." });
      }
    } catch {
      setResult({ tone: "error", text: "Could not send that right now. Your text is still here — try again." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="surface p-5">
        <h2 className="font-display text-lg font-bold">Report an issue or suggest something</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Broken page, wrong brainrot stat, missing unit, idea for a feature — send it here.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                category === c ? "bg-gradient-brand text-primary-foreground shadow-glow" : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, MAX))}
            rows={5}
            placeholder="What's wrong, where, and what did you expect instead?"
            className="w-full resize-y rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none transition focus:border-primary focus:shadow-glow"
          />
          <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <span className={screen.ok ? "text-muted-foreground" : "text-destructive"}>
              {screen.ok ? "Be specific — page, brainrot name, what you saw." : screen.reason}
            </span>
            <span className={`font-mono ${message.length > MAX - 80 ? "text-destructive" : "text-muted-foreground"}`}>{message.length}/{MAX}</span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            onClick={send}
            disabled={busy || !screen.ok || tooShort}
            className="rounded-xl bg-gradient-brand px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "Sending…" : "Send report"}
          </button>
          {message && (
            <button
              onClick={() => {
                void navigator.clipboard?.writeText(`[${category}] ${message}`);
                setResult({ tone: "ok", text: "Copied — paste it wherever you report issues." });
              }}
              className="rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground"
            >
              Copy text
            </button>
          )}
          <span className="text-[11px] text-muted-foreground/70">Slurs and threats are blocked automatically.</span>
        </div>

        {result && (
          <div
            className={`mt-3 rounded-xl border p-3 text-sm ${
              result.tone === "ok"
                ? "border-primary/40 bg-primary/10 text-foreground"
                : result.tone === "warn"
                  ? "border-border bg-secondary text-foreground"
                  : "border-destructive/40 bg-destructive/10 text-destructive"
            }`}
          >
            {result.text}
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="surface p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-primary-glow">Your recent reports</h3>
          <ul className="mt-2 space-y-2">
            {history.map((h) => (
              <li key={h.at} className="rounded-xl bg-secondary/60 px-3 py-2">
                <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                  <span>{h.category}</span>
                  <span className="font-mono">{new Date(h.at).toLocaleString()}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-foreground">{h.message}</p>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70">{h.status}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-muted-foreground/70">Stored in this browser only. Clear site data to remove them.</p>
        </div>
      )}
    </section>
  );
}
