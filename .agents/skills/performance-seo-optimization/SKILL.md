---
name: performance-seo-optimization
description: Optimize Core Web Vitals (LCP, CLS, INP) and technical SEO (metadata, structured data, sitemaps) for Next.js/React sites. Use whenever the user asks about site speed, Lighthouse scores, Core Web Vitals, SEO, or building anything public-facing that needs to rank/load fast.
---

# Performance & SEO Optimization Skill

## Core Web Vitals checklist
- **LCP (Largest Contentful Paint)**: identify the LCP element (usually hero image/heading) — use `next/image` with `priority` on it, preload critical fonts, avoid render-blocking client-side data fetching for above-the-fold content (prefer Server Components).
- **CLS (Cumulative Layout Shift)**: always set explicit width/height (or `next/image`'s automatic sizing) on images/embeds; reserve space for ads/dynamic content with a fixed-size skeleton; avoid injecting content above existing content after load.
- **INP (Interaction to Next Paint)**: keep the main thread free — avoid large synchronous JS execution on interaction, code-split heavy client components (charts, 3D, rich editors) with `next/dynamic`, debounce expensive handlers (search-as-you-type).

## Practical optimization order (highest impact first)
1. Image optimization (`next/image`, correct `sizes`, modern formats) — usually the single biggest win.
2. Font loading (`next/font` for automatic self-hosting + `font-display: swap` behavior, subset if using a large font).
3. Code splitting heavy client-only libraries (3D, charting, rich text editors) via `next/dynamic` so they don't block initial load on pages that don't need them.
4. Server-render/stream content instead of client-fetching on mount.
5. Third-party scripts (analytics, chat widgets) loaded with `next/script`'s `strategy="lazyOnload"`/`afterInteractive` — never `beforeInteractive` unless truly required.

## Technical SEO essentials (Next.js Metadata API)
```tsx
export const metadata: Metadata = {
  title: 'Product Name — Clear Value Prop',
  description: 'Concise, unique description under ~160 characters.',
  openGraph: { title, description, images: ['/og-image.png'], type: 'website' },
  alternates: { canonical: 'https://example.com/page' },
};
```
- Every page needs a unique, descriptive `title`/`description` — never leave a site-wide default on every page.
- `generateMetadata` for dynamic routes (product/blog pages) pulling from the actual content, not a generic fallback.
- Structured data (JSON-LD) for content types that benefit from rich results (products, articles, FAQs, org info).
- `sitemap.xml`/`robots.txt` generated (Next.js supports `sitemap.ts`/`robots.ts` route conventions) and verified to actually list the intended pages, not accidentally block them.
- Semantic HTML (`<h1>` once per page, logical heading order, `<nav>`/`<main>`/`<article>`) — this is both an SEO and accessibility signal.

## Measuring
- Lighthouse (lab data) for pre-launch checks; real-user Core Web Vitals (Vercel Analytics, Google Search Console's Core Web Vitals report) for production truth — lab and field data can diverge, trust field data for real users' experience.
- Re-measure after each optimization — don't apply a checklist blindly without confirming actual improvement, especially for INP which depends heavily on real device/network conditions.

## Anti-patterns to flag
- Hero images not using `next/image`/no `priority` hint, tanking LCP
- Missing/duplicate page titles and descriptions across dynamic routes
- Heavy third-party scripts loaded `beforeInteractive` without justification
- No explicit dimensions on images/embeds, causing layout shift

## Example prompt this skill should trigger on
> "Our Lighthouse score is bad and we want this page to rank better in search — help optimize it."
