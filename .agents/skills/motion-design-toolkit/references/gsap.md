# GSAP Motion Design Reference

## Install
```bash
npm i gsap
```
GSAP + ScrollTrigger is client-only. In Next.js, register the plugin and run animations inside `useEffect`/`useGSAP` (the official `@gsap/react` hook) so it's scoped and cleaned up correctly.

```bash
npm i @gsap/react
```

## Scoped, auto-cleanup pattern (recommended in React)
```tsx
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

function Reveal() {
  const container = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    gsap.from('.reveal-item', {
      y: 40, opacity: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out',
      scrollTrigger: { trigger: container.current, start: 'top 80%' },
    });
  }, { scope: container }); // auto-reverts/kills on unmount, scopes selectors
  return <div ref={container}>...</div>;
}
```
`useGSAP` auto-kills the context (including ScrollTriggers created inside) on unmount — this is the fix for the classic "ScrollTrigger still firing after route change" bug.

## Timelines for choreography
```tsx
const tl = gsap.timeline({ defaults: { ease: 'power2.out', duration: 0.6 } });
tl.from('.hero-title', { y: 30, opacity: 0 })
  .from('.hero-subtitle', { y: 20, opacity: 0 }, '-=0.3') // overlap by 0.3s
  .from('.hero-cta', { scale: 0.9, opacity: 0 }, '-=0.2');
```

## Pinning / scroll-driven sections
```tsx
ScrollTrigger.create({
  trigger: '.pin-section',
  start: 'top top',
  end: '+=1500',
  pin: true,
  scrub: 1, // ties animation progress directly to scroll position
});
```
`scrub: true|number` for scroll-linked (not autoplay) animation — use a number (e.g. `1`) for slight smoothing lag rather than `true` (instant, can feel jittery).

## SVG path animation
```bash
npm i gsap  # DrawSVGPlugin is a Club GreenSock (paid) plugin — mention this if the user needs it
```
For free SVG morphing/motion, animate stroke-dashoffset manually or use `MotionPathPlugin` (free) to move elements along an SVG path.

## Performance & cleanup checklist
- [ ] Wrapped in `useGSAP` with `{ scope }`, not a bare `useEffect` with manual cleanup
- [ ] `ScrollTrigger.refresh()` called after any layout-affecting async content loads (images, fonts)
- [ ] `will-change: transform` only on actively-animating elements, removed after
- [ ] No more than one ScrollTrigger per scroll-linked section unless truly independent
