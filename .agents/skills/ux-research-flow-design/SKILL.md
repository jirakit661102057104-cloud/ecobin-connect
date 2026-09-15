---
name: ux-research-flow-design
description: Design user flows, information architecture, and interaction patterns before writing UI code — map the user's journey, decision points, and edge/error states. Use whenever starting a new feature or product, when the user asks "how should this flow work", or before building any multi-step process (onboarding, checkout, wizards).
---

# UX Research & Flow Design Skill

Use this *before* generating UI code for any non-trivial feature — a flow designed on the fly in code tends to miss edge states.

## Flow-mapping process
1. **Entry points**: where does the user arrive from (which page, which trigger)? A flow can have multiple entries (e.g. "upgrade plan" reachable from a paywall, settings, or an email link) — each needs the right context carried through.
2. **Happy path steps**: the minimum sequence of screens/states from entry to the user's goal being met.
3. **Decision points & branches**: every place the flow forks (e.g. "already has a payment method?", "email already registered?") — enumerate both branches explicitly.
4. **Edge & error states**: what happens on network failure, validation error, permission denial, empty data, or the user abandoning mid-flow and returning later? A flow isn't done until these are specified, not left to be improvised while coding.
5. **Exit points**: where does the user land after success, after abandoning, after error?

## Information architecture
- Group navigation/content by user mental model (task-based: "Billing," "Team," "Integrations"), not by internal system structure.
- Keep primary navigation to 5-7 top-level items; anything more needs grouping or progressive disclosure.
- Every page should answer "where am I, what can I do here, how do I get back" without the user having to think.

## Interaction pattern selection
- **Modal** — a short, focused, single-purpose task that shouldn't lose the underlying page context (confirm delete, quick edit).
- **Full page / route** — a task with multiple steps, that deserves a URL, or that the user might want to bookmark/return to.
- **Drawer/side panel** — inspecting/editing an item from a list without losing the list context.
- **Inline edit** — quick, low-risk single-field changes (renaming something) where a modal would be overkill.

## Deliverable shape when this skill runs
Before generating components, produce a brief flow outline (can be a short text list or a simple diagram) covering: entry points → steps → branches → edge states → exit points. Confirm it with the user for anything with real ambiguity (e.g. checkout, onboarding) before writing UI code.

## Anti-patterns to flag
- Jumping straight to component code for a multi-step flow without mapping branches/edge states first
- Error/empty/loading states designed as an afterthought once the happy path is built
- Navigation structured around backend data models instead of user tasks

## Example prompt this skill should trigger on
> "We need an onboarding flow for new users to connect their first data source."
