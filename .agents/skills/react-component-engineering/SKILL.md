---
name: react-component-engineering
description: Engineer clean, reusable, well-typed React components and hooks with correct composition, memoization, and prop API design. Use whenever the user is building, reviewing, or refactoring React components, designing a component's prop interface, splitting a large component, extracting custom hooks, or asking about React performance (re-renders, memo, useMemo/useCallback). Trigger on "build a component", "this component is doing too much", "why does this re-render", "extract a hook".
---

# React Component Engineering Skill

Guides writing React components that are typed, composable, testable, and performant by default — not just "working."

## Component design checklist
1. **Single responsibility**: if a component both fetches data, manages complex state, AND renders deep markup, split it into a container (logic) + presentational component, or extract a custom hook for the logic.
2. **Prop API design**:
   - Prefer explicit, narrow props over a generic `props: any` or a giant config object.
   - Use discriminated unions for variant props (`variant: 'primary' | 'secondary'`) instead of multiple booleans (`isPrimary`, `isSecondary`).
   - Expose a `className`/`asChild`-style escape hatch on reusable UI components so consumers can extend styling without forking the component.
   - Default to composition (`children`, slots) over prop-drilling deeply nested config.
3. **State placement**: lift state only as high as the nearest common consumer needs it — no higher. Prefer colocated `useState` over global state for anything not actually shared.
4. **Custom hooks**: extract a hook (`useXyz`) whenever logic (data fetching, subscriptions, derived state, event listeners) is reused across ≥2 components or when it makes the component's JSX easier to read at a glance.

## Performance rules (apply only when there's a measured or obvious problem — don't over-optimize by default)
- `React.memo` a component only if it re-renders often with the same props and the render itself is expensive.
- `useMemo`/`useCallback` are for referential stability passed to memoized children or expensive computations — not a blanket habit on every value.
- Move state down / split components to shrink re-render blast radius before reaching for memoization.
- Use the `key` prop correctly on lists (stable, unique IDs — never array index if the list can reorder/filter).

## TypeScript conventions
```tsx
type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
} & React.ComponentPropsWithoutRef<'button'>;

export function Button({ variant = 'primary', size = 'md', isLoading, className, children, ...rest }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} disabled={isLoading || rest.disabled} {...rest}>
      {isLoading ? <Spinner /> : children}
    </button>
  );
}
```
Use `ComponentPropsWithoutRef<'element'>` extension so native attributes pass through for free.

## Anti-patterns to flag
- Components over ~200 lines mixing data fetching, business logic, and deep JSX
- Passing entire objects as props when only 2 fields are used (breaks memoization, obscures the real dependency)
- `useEffect` used to derive state from other state (compute it inline during render instead)
- Prop names that leak implementation detail (`isApiLoading`) instead of user-facing intent (`isLoading`)
- Inline anonymous functions/objects passed to memoized children without `useCallback`/`useMemo` when it actually defeats the memoization

## Example prompt this skill should trigger on
> "This ProductCard component is 300 lines and handles fetching, cart logic, and rendering — help me clean it up."
