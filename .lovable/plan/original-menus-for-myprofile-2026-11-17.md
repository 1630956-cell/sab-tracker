# Original menus for myprofile

Goal: replace the standard top bar and plain side list with two menus that feel distinctly myprofile, not a copy of other profile sites.

## Home page menu: "floating orbit bar"
- A detached, rounded glass bar floating a few pixels below the top of the screen, centered, instead of a full-width strip.
- Left: the logo icon only; the "myprofile" word slides out beside it on hover.
- Middle: Features, Premium, Example. A soft purple glow pill glides smoothly under whichever item you point at.
- Right: a live mini-claim field: "yourdomain.com/ _" that expands when clicked, so visitors can grab a username straight from the menu. Plus Log in.
- On scroll the bar shrinks slightly and its glow gets stronger.
- On phones it collapses into a single floating button that opens a full-screen menu with large staggered links.

## Dashboard menu: "profile-first dock"
- The sidebar becomes a floating panel with rounded corners and a gap from the screen edge, instead of a flat column glued to the side.
- Top: your mini profile card (avatar, name, live link with a copy button, today's views counter with a small sparkline). It stays visible, so the menu feels like *your* space.
- Nav items show an icon plus a short hint underneath (for example "Links: 4 active", "Premium: Unlock effects"). The active item gets a sliding purple indicator bar and gradient glow.
- Quick-jump: press "/" or Ctrl/Cmd+K to open a search box that jumps to any page or action (Copy link, View page, Upgrade).
- Collapse button turns the panel into a slim icon dock with labels on hover.
- On phones it becomes a floating bottom dock with five icons, with the active icon lifted and glowing.

## Technical details
- New components: `site/OrbitNav.tsx` (replaces SiteHeader usage), `dashboard/ProfileDock.tsx`, `dashboard/QuickJump.tsx` (built on the existing cmdk `command` component), `dashboard/MobileDock.tsx`.
- Sliding glow and indicator: one absolutely positioned element measured from the hovered or active item's position; CSS transitions only, with no new packages.
- New tokens/utilities in `src/styles.css`: `glass-bar`, `glow-pill`, nav transition timing; all colors use existing brand tokens.
- Collapsed state stored in localStorage and read after the page loads, to avoid a flash.
- Brand text still comes from `BRAND`; routes are unchanged.
