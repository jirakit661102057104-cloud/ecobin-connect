# Lottie Animation Integration Reference

## Install (pick one)
```bash
npm i lottie-react                 # simpler, wraps lottie-web
npm i @lottiefiles/dotlottie-react  # smaller bundle, .lottie (zipped) format — prefer for production
```
Prefer the `.lottie` (dotLottie) format over raw `.json` where possible — it's compressed and bundles assets, meaningfully smaller payload for production sites.

## Basic usage
```tsx
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

<DotLottieReact src="/animations/success.lottie" loop autoplay style={{ width: 200, height: 200 }} />
```

## Interactive control (play on hover, on scroll into view, on state change)
```tsx
const ref = useRef<DotLottieCommonPlayer>(null);
<DotLottieReact ref={ref} src="/animations/check.lottie" autoplay={false} loop={false} />
// then: ref.current?.play() on the triggering event (e.g. form success)
```
For scroll-triggered playback, combine with an IntersectionObserver (or the `react-intersection-observer` hook) and call `.play()` when the element enters the viewport — don't autoplay off-screen Lottie animations, it wastes CPU.

## Working with designer handoff
- Ask for the `.lottie` export (Bodymovin/LottieFiles plugin in After Effects) rather than raw `.json` when possible.
- Validate the file plays correctly at [LottieFiles.com](https://lottiefiles.com) preview before integrating — catches missing-asset issues early.
- For icon-sized Lottie animations (loading spinners, checkmarks), keep the file under ~50KB; anything larger for a small UI element usually means unoptimized vector complexity — ask the designer to simplify.

## Performance notes
- Multiple simultaneous Lottie players on one page (e.g. animated icon grid) can be expensive — consider `renderer: 'svg'` vs `'canvas'` tradeoffs (`canvas` is cheaper for many small instances; `svg` gives crisper scaling and CSS-styleable output).
- Pause/destroy players for off-screen or unmounted content rather than leaving them running.
