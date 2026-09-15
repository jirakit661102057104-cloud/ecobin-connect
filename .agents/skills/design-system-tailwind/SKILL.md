---
name: design-system-tailwind
description: Build and maintain a scalable Tailwind CSS design system and component library — design tokens, variant management with class-variance-authority, theming, and consistent spacing/color/typography scales. Use whenever the user is styling with Tailwind, building a component library, setting up design tokens, configuring a Tailwind theme, or asking how to keep UI consistent across a project. Trigger on "design system", "tailwind config", "component library", "design tokens", "consistent styling".
---

# Design System & Tailwind CSS Engineering Skill

Turns Tailwind usage from ad-hoc utility soup into a governed design system.

## Foundation: tokens before components
Define tokens once in `tailwind.config.ts` (or CSS variables for runtime theming) — never hardcode hex codes or arbitrary pixel values in component files.

```ts
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      brand: { 50: '...', 500: '...', 900: '...' },
      surface: 'hsl(var(--surface))',
      foreground: 'hsl(var(--foreground))',
    },
    fontFamily: { sans: ['var(--font-inter)'] },
    spacing: { '18': '4.5rem' }, // only add if a real gap exists in the default scale
    borderRadius: { xl: '1rem' },
  }
}
```
For dark mode / multi-theme, drive colors through CSS variables (`hsl(var(--x))`) so themes swap without a rebuild.

## Component variants with class-variance-authority (cva)
Never branch className with long ternary chains. Use `cva` for variant + size + state matrices:
```ts
const button = cva('inline-flex items-center rounded-md font-medium transition-colors', {
  variants: {
    variant: { primary: 'bg-brand-600 text-white hover:bg-brand-700', ghost: 'bg-transparent hover:bg-surface-100' },
    size: { sm: 'h-8 px-3 text-sm', md: 'h-10 px-4', lg: 'h-12 px-6 text-lg' },
  },
  defaultVariants: { variant: 'primary', size: 'md' },
});
```
Merge with `tailwind-merge` (`cn = (...cls) => twMerge(clsx(cls))`) so consumer `className` overrides win predictably.

## Structure a component library
```
components/ui/          # primitives: Button, Input, Card, Dialog (shadcn-style, headless-first)
components/patterns/    # composed patterns: FormField, DataTable, EmptyState
components/features/    # feature-specific, not reused elsewhere
lib/cn.ts
```
Base primitives on unstyled/headless behavior (Radix primitives are the standard pairing with Tailwind) and layer Tailwind classes on top — don't reinvent focus trapping, keyboard nav, or ARIA roles.

## Governance rules
- No arbitrary values (`w-[123px]`, `text-[#3a3a3a]`) in feature code — if the scale doesn't have it, add the token, don't escape the system.
- One typographic scale (`text-xs` → `text-4xl` mapped to real heading levels), documented in a `Typography` stories/reference, not redefined per page.
- Spacing follows the 4px base scale everywhere; flag any component using raw margin/padding outside `p-*`/`m-*`/`gap-*` utilities.
- Every new primitive gets documented with its variant matrix (a short table: variant × size × state) before being reused across features.

## Example prompt this skill should trigger on
> "Set up a Tailwind design system for this SaaS app with light/dark themes and a Button, Card, and Input component."
