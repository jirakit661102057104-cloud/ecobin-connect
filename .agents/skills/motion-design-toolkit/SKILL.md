---
name: motion-design-toolkit
description: Design and implement web motion and micro-interactions using GSAP, Framer Motion (motion/react), and Lottie — scroll-triggered animation, page/route transitions, gesture-driven UI, and after-effects-exported animations. Use whenever the user mentions animation, motion design, GSAP, Framer Motion, Lottie, scroll effects, page transitions, hover/micro-interactions, or wants a site to "feel alive"/premium. This skill routes to the right library per use case rather than reaching for one tool for everything.
---

# Motion Design Toolkit Skill (GSAP · Framer Motion · Lottie)

Three motion libraries, one decision framework — pick the right tool per job instead of defaulting to whichever is most familiar.

## Which library for which job
| Need | Use |
|---|---|
| Scroll-triggered sequences, timelines, pinning, complex choreography, SVG morphing | **GSAP** (+ ScrollTrigger) |
| React-idiomatic component animation, layout/shared-element transitions, gestures (drag/hover/tap), page transitions in Next.js | **Framer Motion** (`motion/react`) |
| Designer-exported vector animations (After Effects → Lottie JSON) — icons, illustrations, success/loading states | **Lottie** (`lottie-react` / `@lottiefiles/dotlottie-react`) |

Don't reach for GSAP inside every component for simple enter/exit — that's Framer Motion's job. Don't reimplement a designer's AE animation by hand — that's Lottie's job. Don't fight Framer Motion's declarative model for a 12-step pinned scroll sequence — that's GSAP's job.

## Cross-cutting rules (apply regardless of library)
1. **Respect `prefers-reduced-motion`** — every non-essential animation gets a reduced/skipped variant. Check `window.matchMedia('(prefers-reduced-motion: reduce)')` and gate accordingly.
2. **Animate cheap properties**: `transform` (translate/scale/rotate) and `opacity` only for anything performance-sensitive or scroll-linked — never animate `top`/`left`/`width`/`height`/`box-shadow` in a hot loop (forces layout/paint).
3. **Clean up on unmount**: kill GSAP timelines/ScrollTriggers and Framer Motion animation controls when a component unmounts, especially in Next.js route transitions — orphaned ScrollTriggers are the #1 source of "animation still running on a page I left" bugs.
4. **One driver per property** — don't have GSAP and Framer Motion (or CSS transitions) fighting over the same element's `transform`.

## Reference files (load the one relevant to the task)
- `references/gsap.md` — ScrollTrigger setup, timelines, cleanup in React/Next.js, SVG animation
- `references/framer-motion.md` — variants, layout animation, gestures, AnimatePresence/page transitions
- `references/lottie.md` — importing AE exports, interactivity, performance, segment control

## Example prompts this skill should trigger on
> "Add a scroll-triggered reveal animation to the landing page sections."
> "Animate this card component with a hover lift and tap feedback."
> "Our designer sent a Lottie file for the loading spinner, integrate it."
