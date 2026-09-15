---
name: responsive-mobile-first
description: Design and implement responsive, mobile-first layouts using fluid typography, container queries, and correct Tailwind/CSS breakpoint strategy. Use whenever the user builds any UI layout, mentions "responsive", "mobile", "breakpoints", asks why a layout breaks on small screens, or is building anything user-facing without specifying device — always assume mobile-first unless told otherwise.
---

# Responsive & Mobile-First Design Skill

Default posture: **build for the smallest viewport first, then progressively enhance upward.** Never build desktop-first and retrofit mobile with overrides.

## Breakpoint strategy (Tailwind defaults, extend only if justified)
`sm 640px · md 768px · lg 1024px · xl 1280px · 2xl 1536px`
- Base (no prefix) styles = mobile (< 640px). Add `md:`/`lg:` to layer in more complex layouts as space grows.
- Don't skip straight to `lg:` for something that also needs to look right at `md:` — test the in-between.

## Core patterns
- **Fluid typography**: use `clamp()` (`text-[clamp(1.5rem,4vw,2.5rem)]` or a Tailwind plugin) for hero/display text instead of jumping abruptly at breakpoints.
- **Layout primitives**: prefer `flex`/`grid` with `flex-wrap`, `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` over fixed pixel widths.
- **Container queries** (`@container`) for components that must adapt to their parent's width, not the viewport — e.g. a Card that appears both in a narrow sidebar and a wide main column.
- **Touch targets**: minimum 44×44px tappable area on interactive elements for mobile; increase spacing between adjacent tap targets.
- **Navigation**: collapse to a drawer/sheet below `md`, not a squeezed horizontal nav.
- **Images/media**: always constrain with `max-w-full h-auto` or `next/image` with `sizes` set correctly per breakpoint to avoid oversized downloads on mobile.

## Testing checklist before calling a layout done
1. 375px (small phone), 768px (tablet), 1024px (small laptop), 1440px+ (desktop)
2. Long content (long names, long numbers) doesn't break the layout at any width
3. No horizontal scroll at any breakpoint unless explicitly intentional (e.g. a carousel)
4. Touch targets ≥44px on mobile; hover-only interactions have a tap/focus equivalent

## Anti-patterns to flag
- Hardcoded `width: 800px` on a container instead of `max-w-3xl w-full`
- Desktop nav hidden with `hidden md:block` but no mobile alternative provided
- Font sizes fixed at desktop scale, causing overflow/wrapping on mobile
- Media queries scattered ad hoc instead of using the design system's breakpoint tokens

## Example prompt this skill should trigger on
> "Build a pricing page with 3 tiers — make sure it looks good on mobile too."
