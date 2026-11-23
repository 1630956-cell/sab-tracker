# Project memory

## Product intent & audience

- **BrainrotIntel** — a live tracker/dashboard for the Roblox game "Steal a Brainrot"
- Audience: players of the game wanting real-time stats, update info, and reference tools

## Brand personality & voice

- Utility-focused gaming companion app
- Informative, community-oriented tone (creator/game info, feedback forms)

## Visual design & UX direction

- Vite + React stack
- Dark/light theme toggle in header
- Tabbed navigation as primary layout pattern
- Live data display with auto-refresh (stats every 30s)
- Includes searchable lists, database panels, calculators, and AI Q&A box

## Decisions, constraints & rationale

- Dev server runs automatically; app is live in preview panel
- Live stats refresh on 30-second interval
- Recurring countdowns for Saturday updates and "Taco Tuesday" admin abuse event

## Open questions & assumptions

- No explicit `.bolt/prompt` instructions exist yet; context is inferred from current app state
- Data sources for live stats and update logs not yet confirmed
- Specific visual theme details (colors, typography) not yet documented