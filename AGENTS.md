<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- Brand strings (name, titles) come only from `src/lib/brand.ts`; pages import `BRAND` instead of hardcoding — keeps renames to one file.
- Game facts and the seed update log live in `src/lib/game-data.ts`; the preset knowledge base (Sammy, obtain methods, timeline, mutations, codes) lives in `src/lib/brainrot-db.ts`; live data (player count, AI web answers via Lovable AI Gateway with google_search) comes from server functions in `src/lib/game.functions.ts` — keeps keys server-side.
- Colors are oklch tokens in `src/styles.css` with `:root,.dark` and `.light` blocks; the theme toggle flips the `<html>` class and saves to localStorage (an inline head script applies it before paint) — components must use tokens only so both themes work.
- Obvious questions are answered instantly from preset data in `src/lib/quick-answers.ts` (client and server) before any AI call — saves credits and wait time; news/leaks always go to the AI.
- The AI abuse filter (`src/lib/abuse-guard.ts`) runs before quick answers and the AI, on client and server; the server also caches answers per normalized question — protects AI credits. The Codex tab data in `src/lib/codex-data.ts` is generated from the user's database bundle — regenerate rather than hand-edit.
