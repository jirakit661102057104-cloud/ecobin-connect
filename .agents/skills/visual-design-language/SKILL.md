---
name: visual-design-language
description: Apply a coherent modern visual design language — typography hierarchy, glassmorphism/depth effects, micro-interactions, and compact enterprise UI density — so interfaces look intentional and premium rather than templated. Use whenever building or reviewing UI visual design, when the user says a design looks "generic"/"boring"/"AI-generated", or when establishing the visual style for a new product.
---

# Visual Design Language Skill

Counters "generic AI-generated UI" by applying deliberate typographic, depth, and motion choices instead of defaults.

## Typography hierarchy
- Establish a clear scale mapped to real semantic levels, not arbitrary sizes: Display (hero) → H1 → H2 → H3 → Body → Caption. Each level should have an obvious, consistent size/weight jump from its neighbors.
- Pair a distinctive display/heading font with a highly legible body font rather than one font for everything — even a single well-chosen font family with varied weights (400/500/600/700) can carry hierarchy if a second family isn't warranted.
- Line length: cap body text at ~60-75 characters (`max-w-prose`) for readability.
- Line height: tighter for large headings (1.1-1.2), roomier for body text (1.5-1.65).

## Depth & modern visual effects (use deliberately, not everywhere)
- **Glassmorphism**: `backdrop-blur` + semi-transparent background + subtle border (`border-white/10`) — effective for floating nav bars, overlays, and cards over rich backgrounds; overusing it on every card flattens its impact and hurts text contrast/readability. Always verify text contrast still passes on top of a blurred/translucent surface.
- **Layered elevation**: use a consistent shadow scale (sm/md/lg/xl tokens, not ad hoc box-shadow values) to communicate stacking order — modals > dropdowns > cards > base.
- **Gradients & accent color**: use sparingly as an intentional signature (a hero background, a CTA button, a brand accent line) rather than saturating the whole interface.

## Micro-interactions
- Hover/focus states on every interactive element, even subtle ones (slight scale, color shift, underline) — their absence is what makes an interface feel unfinished.
- State transitions (loading → success, item added, form submitted) get a brief, purposeful animation (see `motion-design-toolkit` skill) rather than an instant jarring swap.
- Keep micro-interaction durations short (100-300ms) — anything longer feels sluggish for frequent interactions.

## Compact enterprise UI (for dashboards/admin/B2B tools)
- Higher information density than consumer/marketing UI: smaller base font size (14px body vs 16px), tighter vertical rhythm, denser table row height.
- Still maintain touch/click target minimums and contrast — density isn't an excuse to break accessibility.
- Favor clear borders/dividers over heavy shadows for separating dense data regions — shadows read as "floating," which fights a dense, grounded data-table aesthetic.

## A quick "does this look generic" self-check
- [ ] Does the type scale have genuine, intentional contrast between levels (not just 14/16/18px increments)?
- [ ] Is there one clear visual signature (a color, a shape language, a distinctive detail) rather than a purely default component-library look?
- [ ] Do interactive elements have considered hover/focus/active states, not just the framework default?
- [ ] Is whitespace used deliberately to group related content, not just uniform padding everywhere?

## Anti-patterns to flag
- Same font weight/size for headings and body with no real hierarchy
- Glassmorphism applied to every surface, muddying which layer is actually elevated
- Default browser/library focus rings left unstyled alongside an otherwise custom design
- Purely symmetric, centered, generic-feeling layouts with no visual point of interest

## Example prompt this skill should trigger on
> "This dashboard looks generic and AI-generated, make it feel more premium and intentional."
