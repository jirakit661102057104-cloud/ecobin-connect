---
name: auth-authorization
description: Implement authentication (login, session/JWT, OAuth, magic links) and authorization (roles, permissions, route protection) in full-stack React/Next.js apps. Use whenever the user asks about login, sign-up, sessions, JWT, OAuth providers, protecting routes, role-based access control, or "who can see/do what" in the app.
---

# Authentication & Authorization Skill

## Authentication: prefer a managed/battle-tested library over hand-rolled
Default recommendation for Next.js: **Auth.js (NextAuth)**, **Clerk**, or **Better Auth** — hand-rolling password hashing, session handling, and OAuth flows is a security liability unless there's a specific reason to. If the user insists on custom auth, still use vetted primitives (`bcrypt`/`argon2` for hashing, `jose` for JWT) and never invent your own crypto.

## Session strategy
- **Cookie-based sessions** (httpOnly, secure, sameSite=lax/strict) are the default for web apps — not localStorage-stored JWTs, which are vulnerable to XSS token theft.
- If JWTs are required (e.g. for a separate API consumed by mobile), keep them short-lived (~15 min) with a refresh token rotated and stored httpOnly, not in localStorage/sessionStorage.
- Validate the session on the server on every protected request — never trust a client-supplied "isLoggedIn" flag.

## Route protection (Next.js App Router)
```ts
// middleware.ts
export function middleware(req: NextRequest) {
  const session = getSessionFromCookie(req);
  if (!session && isProtectedRoute(req.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
}
export const config = { matcher: ['/dashboard/:path*', '/settings/:path*'] };
```
Also re-check auth inside the Server Component/Server Action itself (defense in depth) — middleware alone isn't a substitute for checking `session` before returning sensitive data.

## Authorization (RBAC/permissions)
- Model as `role` (coarse: admin/member/viewer) + optional fine-grained `permissions` array for anything beyond simple role tiers.
- Enforce authorization **at the data-access layer** (inside the service function that queries the DB), not only in the UI — hiding a button is not access control.
```ts
async function getOrgSettings(userId: string, orgId: string) {
  const membership = await getMembership(userId, orgId);
  if (!membership || membership.role !== 'admin') throw new ForbiddenError();
  return db.orgSettings.findUnique({ where: { orgId } });
}
```
- For multi-tenant apps, scope every query by `orgId`/`tenantId` derived from the session — never trust a tenant ID passed from the client without cross-checking membership.

## OAuth integration checklist
- [ ] Redirect URIs registered exactly (including protocol/trailing slash) per environment (dev/staging/prod)
- [ ] State parameter validated to prevent CSRF on the OAuth callback
- [ ] Minimum necessary scopes requested
- [ ] Provider-returned email verified/trusted only if the provider confirms email verification

## Anti-patterns to flag
- JWTs or session tokens stored in `localStorage`
- Authorization checks only in the frontend (hiding UI ≠ securing data)
- Password hashing with plain SHA-256/MD5 instead of bcrypt/argon2
- Missing tenant/org scoping on a query in a multi-tenant app (cross-tenant data leak)

## Example prompt this skill should trigger on
> "Add login with email/password and Google OAuth, and make sure only admins can access the billing settings page."
