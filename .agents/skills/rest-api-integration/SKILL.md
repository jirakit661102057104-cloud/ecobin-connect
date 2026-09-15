---
name: rest-api-integration
description: Integrate third-party or internal REST APIs correctly from the frontend and server — typed fetch clients, error handling, retries, caching, and pagination. Use whenever the user is calling an external API, building an API client/SDK wrapper, integrating a third-party service, or asking how to structure API calls in a Next.js app.
---

# REST API Integration Skill

## Where API calls belong
- **Server-side by default** (Server Component fetch, Server Action, or route handler) for anything using a secret API key — never expose third-party API keys to the client.
- **Client-side fetch** only for public, unauthenticated endpoints or endpoints proxied through your own backend that don't need a secret.

## Typed client pattern
Wrap every external API in a small typed client instead of calling `fetch` ad hoc across the codebase:
```ts
// lib/api/stripe-client.ts (example shape, applies to any REST API)
async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${process.env.API_SECRET}`, ...init?.headers },
  });
  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.json();
}
```
Validate the response shape with zod at the boundary (`schema.parse(await res.json())`) rather than trusting `as Type` casts — third-party APIs change without warning.

## Caching & revalidation (Next.js fetch)
```ts
fetch(url, { next: { revalidate: 60, tags: ['products'] } }); // ISR-style caching
fetch(url, { cache: 'no-store' }); // always fresh, e.g. user-specific data
revalidateTag('products'); // call after a mutation to bust the cache on demand
```

## Error handling & retries
- Distinguish error types: network failure, 4xx (client error — don't retry, surface to user), 5xx/timeout (transient — retry with backoff).
- Simple backoff: retry up to 3 times with exponential delay (e.g. 300ms, 900ms, 2700ms) only on 5xx/network errors, never on 4xx.
- Surface actionable errors to the UI (not raw stack traces) — map API error codes to user-facing messages centrally, not per call site.

## Pagination
- Prefer cursor-based pagination (`?cursor=...`) over offset-based for anything with frequently-changing data (avoids skipped/duplicated items).
- For infinite scroll in React, use a library-agnostic pattern: fetch next cursor, append to state, disable further fetch when `hasMore` is false.

## Rate limits
- Respect `Retry-After` headers; queue/backoff rather than hammering a rate-limited endpoint.
- For high-volume server-to-server integrations, add a simple in-memory or Redis-backed rate limiter on your own proxy route if the third party doesn't provide one.

## Anti-patterns to flag
- Third-party secret API keys used directly in client components (`NEXT_PUBLIC_*` misuse)
- No response validation — trusting `as` type casts on external API responses
- Retrying 4xx errors (client errors won't resolve by retrying)
- Duplicated fetch logic copy-pasted across components instead of a shared client

## Example prompt this skill should trigger on
> "Integrate the [X] third-party API to pull product data into our dashboard."
