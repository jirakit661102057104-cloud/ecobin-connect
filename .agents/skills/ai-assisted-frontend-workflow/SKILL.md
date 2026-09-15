---
name: ai-assisted-frontend-workflow
description: Meta-workflow for AI-agent-driven frontend work — converting a design (image/Figma/description) to code, refactoring existing components safely, auditing UI for design/UX consistency, and optimizing an existing codebase. Use whenever the user shares a design/screenshot/Figma link to implement, asks the agent to refactor or clean up frontend code, asks for a design/UX review of existing UI, or asks to "optimize" the frontend codebase.
---

# AI-Assisted Frontend Workflow Skill

Governs how this agent approaches four recurring AI-driven frontend tasks. Route to the relevant section.

## 1. Design-to-code (image/Figma → implementation)
1. Inventory the design first: layout structure (grid/flex regions), spacing scale used, color palette, typography scale, component states visible (hover/active/disabled if shown), and responsive intent if multiple breakpoints are provided.
2. Match to the project's existing design system/tokens (`design-system-tailwind` skill) rather than inventing new arbitrary values — if the design uses a color/spacing not in the current token set, flag it as a new token to add, don't hardcode an arbitrary value.
3. Build server-first (Next.js Server Components) and only mark client where the design implies interactivity.
4. Call out anything the static design doesn't specify (loading state, empty state, error state, exact responsive behavior) and either propose a sensible default or ask — don't silently invent behavior for states the design didn't show.
5. After implementation, do a side-by-side self-review against the source design for spacing/alignment/color accuracy before presenting it as done.

## 2. Component refactoring (existing code → cleaner code)
1. Establish current behavior first (read the component fully, note all props/behaviors) — a refactor must be behavior-preserving unless the user explicitly asked for a behavior change too.
2. Apply `react-component-engineering` skill's checklist: split responsibilities, extract hooks, tighten prop types.
3. Refactor incrementally and note what changed and why (e.g. "extracted data-fetching into `useProductData` hook, split the 300-line component into `ProductCard` + `ProductActions`") rather than a silent full rewrite — the user needs to trust the diff.
4. Flag but don't silently fix out-of-scope issues found along the way (e.g. an unrelated accessibility gap) — mention them separately so the user can decide.

## 3. Codebase optimization (performance/bundle/build)
Investigate before prescribing — profile first:
- Bundle size: check for accidentally-client-bundled server-only code, un-tree-shaken barrel imports, heavy libraries (three.js, moment.js) loaded on routes that don't need them.
- Render performance: identify components re-rendering unnecessarily (React DevTools Profiler) before reaching for `memo`/`useMemo` speculatively.
- Image/asset optimization: unoptimized images are the most common real-world performance culprit — check `next/image` usage and formats before deeper code-level optimization.
- Report findings with impact estimate before making sweeping changes — optimization work should be justified by an actual measured problem, not applied speculatively across the whole codebase.

## 4. Design/UX audit & review
Run a structured pass, not just vibes:
- Visual consistency: spacing, typography, and color against the design system (`visual-design-language` skill)
- Accessibility: run the `accessibility-a11y` skill's checklist
- Responsive behavior: check at the breakpoints in `responsive-mobile-first` skill
- UX flow soundness: missing loading/empty/error states, unclear CTAs, flow branches not handled (`ux-research-flow-design` skill)
Present findings as a prioritized list (critical/should-fix/nice-to-have), not an undifferentiated wall of nitpicks.

## Cross-cutting principle
For all four workflows: state assumptions explicitly, prefer incremental verifiable changes over big-bang rewrites, and route to the more specific skill (component engineering, accessibility, design system, etc.) for the actual implementation detail — this skill is the dispatcher/process, not the full technical reference.

## Example prompts this skill should trigger on
> "Here's a Figma screenshot of the new pricing page, build it."
> "Refactor this Dashboard component, it's gotten really messy."
> "Can you do a UX audit of our settings page?"
> "The app feels slow, can you optimize the frontend?"
