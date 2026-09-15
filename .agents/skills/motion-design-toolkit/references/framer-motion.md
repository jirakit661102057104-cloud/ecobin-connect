# Framer Motion (motion/react) Reference

## Install
```bash
npm i motion
```
Import from `motion/react` (the current package name; `framer-motion` still works as an alias in most setups but prefer `motion/react` going forward).

## Basic enter animation
```tsx
import { motion } from 'motion/react';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, ease: 'easeOut' }}
>
```

## Variants for orchestrated children (preferred over manual stagger math)
```tsx
const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

<motion.ul variants={container} initial="hidden" animate="show">
  {items.map(i => <motion.li key={i.id} variants={item}>{i.label}</motion.li>)}
</motion.ul>
```

## Gestures (hover, tap, drag) — declarative, no manual event wiring
```tsx
<motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} />
<motion.div drag dragConstraints={{ left: 0, right: 300 }} />
```

## Layout animation (auto-animate size/position changes)
```tsx
<motion.div layout transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
```
Add `layoutId` to animate an element morphing between two positions/components (shared-element transitions, e.g. a card expanding into a modal).

## Exit animations & route/page transitions (Next.js App Router)
```tsx
<AnimatePresence mode="wait">
  <motion.main key={pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    {children}
  </motion.main>
</AnimatePresence>
```
Note: App Router page transitions need the animated wrapper in a client component keyed on `pathname`, since server-rendered route changes don't naturally give AnimatePresence something to exit.

## Reduced motion
```tsx
import { useReducedMotion } from 'motion/react';
const shouldReduceMotion = useReducedMotion();
<motion.div animate={{ y: shouldReduceMotion ? 0 : 20 }} />
```

## Anti-patterns
- Re-declaring the same `transition`/`variants` object inline in every instance instead of a shared constant
- Animating `layout` on large lists without `LayoutGroup` scoping (causes unrelated siblings to reflow together)
- Using `motion.div` for something that's actually pure CSS `:hover` — reserve JS-driven motion for gesture/orchestration needs
