---
name: project-architecture-clean-code
description: Establish and maintain clean project structure, folder/file organization conventions, naming standards, and lightweight documentation across a repository. Use whenever starting a new repo, the user asks how to organize files/folders, asks for a README or documentation, or the codebase organization has become inconsistent.
---

# Project Architecture, Clean Code & Documentation Skill

## Repository structure baseline
```
.
├── .agents/skills/       # project-scoped agent skills (this convention)
├── .github/workflows/    # CI
├── src/                  # or app/ + components/ etc. per framework skill
├── public/
├── docs/                 # architecture decision records, longer docs
├── .env.example          # documented, never real secrets
├── README.md
└── package.json
```

## Naming conventions (consistent across the codebase)
- Components: `PascalCase.tsx` (`ProductCard.tsx`)
- Hooks: `useCamelCase.ts` (`useCartState.ts`)
- Utilities/services: `camelCase.ts` (`formatCurrency.ts`)
- Route folders (Next.js App Router): lowercase, kebab-case for multi-word segments (`app/order-history/`)
- Constants: `SCREAMING_SNAKE_CASE` only for true constants, not for config objects

## Clean code principles this agent applies by default
- Functions do one thing; if a function needs "and" to describe what it does, split it.
- No magic numbers/strings — name them as constants with intent-revealing names.
- Early returns over deep nested conditionals.
- Comments explain *why*, not *what* (the code should already say what; comment the non-obvious reasoning, trade-off, or gotcha).
- Consistent error handling pattern across the codebase (don't mix throwing exceptions in one module with returning `{ error }` objects in another without a documented reason).

## README structure (for the project, or for a skill/package being published)
1. **What it is** — one or two sentences, no throat-clearing.
2. **Quick start** — install + run commands that actually work copy-pasted.
3. **Project structure** — brief folder map with one-line purpose per top-level folder.
4. **Environment variables** — table of required env vars with description (no real values).
5. **Scripts** — what each `package.json` script does.
6. **Deployment** — link to the relevant deployment skill/process.
7. **Contributing** (if applicable) — branch naming, commit convention, PR process.

## Documentation discipline
- Document architectural *decisions* (why Postgres over MongoDB, why a separate API service) as short ADRs in `docs/adr/NNN-title.md` — capture the reasoning while it's fresh, not just the final choice.
- Keep `.env.example` in sync with actually-required env vars every time a new one is added — a stale `.env.example` is a recurring onboarding tax.
- Inline JSDoc/TSDoc on exported functions in shared `lib/`/`packages/` code (not every function everywhere) — prioritize documenting the boundary/public API surface.

## Anti-patterns to flag
- Inconsistent naming conventions within the same codebase (mixing `snake_case` and `camelCase` for the same kind of thing)
- A `utils.ts`/`helpers.ts` dumping ground with unrelated functions instead of purpose-named modules
- READMEs that are out of date with the actual current setup steps
- No `.env.example`, forcing new contributors to reverse-engineer required env vars from source

## Example prompt this skill should trigger on
> "Set up the initial project structure and README for this new repo."
