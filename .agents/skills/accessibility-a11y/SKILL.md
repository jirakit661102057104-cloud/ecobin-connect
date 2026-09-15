---
name: accessibility-a11y
description: Audit and implement web accessibility (WCAG 2.1/2.2 AA) — semantic HTML, ARIA, keyboard navigation, focus management, color contrast. Use whenever building interactive components (modals, dropdowns, forms, tabs), reviewing UI for accessibility, or the user mentions "accessible", "a11y", "screen reader", "keyboard navigation", "WCAG". Also proactively apply this skill's checklist to every interactive component built, even if not explicitly requested.
---

# Accessibility (a11y) Frontend Skill

Accessibility is a default quality bar for every interactive component this agent builds, not an optional add-on.

## Non-negotiables for any interactive component
1. **Semantic HTML first**: `<button>` for actions, `<a>` for navigation, real `<form>`/`<label>`/`<input>` — don't build a "button" out of a `<div onClick>`. ARIA is a patch for cases HTML can't express, not a default.
2. **Keyboard operability**: everything clickable must be reachable and operable via `Tab`/`Shift+Tab`, `Enter`/`Space`, and `Escape` (to close dialogs/menus). Custom widgets (dropdown, combobox, tabs) follow the [WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/) pattern for that widget's key bindings.
3. **Focus management**: on opening a modal/drawer, move focus into it and trap it there; on close, return focus to the trigger element. Never let focus silently land on `<body>`.
4. **Visible focus indicators**: never `outline: none` without a replacement focus style — required for keyboard users.
5. **Color contrast**: text meets 4.5:1 (normal) / 3:1 (large text ≥18px) against its background; don't rely on color alone to convey state (add an icon/label alongside red/green).
6. **Images/icons**: meaningful images get descriptive `alt`; purely decorative images/icons get `alt=""` or `aria-hidden="true"`.
7. **Forms**: every input has a programmatically associated `<label>`; errors are announced (`aria-describedby` linking to the error message, `role="alert"` for live validation feedback).

## Component-specific patterns
- **Modal/Dialog**: `role="dialog"` `aria-modal="true"` `aria-labelledby` pointing to the title, focus trap, `Escape` to close. Prefer Radix/headless primitives which implement this correctly over hand-rolling.
- **Dropdown/Menu**: `role="menu"`/`menuitem` with arrow-key navigation, or use `<select>` for simple cases.
- **Tabs**: `role="tablist"`/`tab`/`tabpanel`, arrow keys move between tabs, only the active tab is in the natural Tab order.
- **Toasts/live regions**: `aria-live="polite"` (or `"assertive"` for errors) so screen readers announce updates without moving focus.

## Quick audit checklist (run before shipping any new UI)
- [ ] Can I complete the entire flow using only the keyboard?
- [ ] Does every interactive element have an accessible name (visible text, `aria-label`, or `aria-labelledby`)?
- [ ] Is there a logical heading hierarchy (`h1`→`h2`→`h3`, no skipped levels)?
- [ ] Do animations respect `prefers-reduced-motion`?
- [ ] Run axe DevTools / Lighthouse accessibility audit and resolve criticals before merging.

## Anti-patterns to flag
- `<div onClick>` used as a button with no `role="button"`/`tabIndex`/keyboard handler
- Icon-only buttons with no accessible label
- Custom checkbox/radio built without `role`, `aria-checked`, and keyboard support
- Motion-heavy interfaces with no `prefers-reduced-motion` fallback

## Example prompt this skill should trigger on
> "Build a dropdown menu for the user profile in the navbar."
(Apply this skill even though accessibility wasn't explicitly requested.)
