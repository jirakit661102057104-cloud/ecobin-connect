---
name: state-management
description: Choose and implement the right state management approach in React/Next.js — server state (React Query/SWR), global client state (Zustand/Context), URL state, and form state. Use whenever the user asks "where should this state live", introduces prop-drilling pain, asks about Redux/Zustand/Context/React Query, or is deciding how to share state across components.
---

# State Management Skill

## Decision framework: classify the state before picking a tool
1. **Server state** (data that lives in a database, fetched over the network — products, user profile, orders): use **TanStack Query (React Query)** or **SWR**, or in Next.js, Server Components + Server Actions with `revalidatePath`/`revalidateTag`. Never mirror server data into a global client store (Redux/Zustand) — you'll fight cache invalidation forever.
2. **URL state** (filters, pagination, selected tab, search query — anything that should survive a refresh/be shareable/bookmarkable): keep it in the URL (`useSearchParams`/`nuqs`), not component state.
3. **Global client-only state** (theme, sidebar open/closed, multi-step wizard progress not tied to a URL, cart contents before checkout): **Zustand** for anything beyond trivial — lighter and less boilerplate than Redux for most app sizes; **React Context** only for low-frequency-update, small-scope state (e.g. auth user object, theme) since Context re-renders all consumers on every change.
4. **Local component state**: plain `useState`/`useReducer` — the default, don't reach for global state until 2+ unrelated components genuinely need the same value.

## When Redux Toolkit is still the right call
Large teams with complex, deeply interdependent client state, time-travel debugging needs, or an existing Redux codebase. For most new MERN/Next.js projects in 2026, Zustand + React Query covers the same ground with far less boilerplate — default to that combination unless there's a specific reason for Redux.

## Zustand pattern
```ts
const useCartStore = create<CartState>((set) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  removeItem: (id) => set((state) => ({ items: state.items.filter(i => i.id !== id) })),
}));
```
Select narrowly in components (`useCartStore(s => s.items)`) rather than destructuring the whole store, to avoid unnecessary re-renders.

## React Query pattern (server state)
```ts
const { data, isLoading } = useQuery({ queryKey: ['products', filters], queryFn: () => fetchProducts(filters) });
const mutation = useMutation({ mutationFn: updateProduct, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }) });
```
In a Next.js App Router app with Server Components as the primary data source, reach for React Query mainly for client-side interactive data (search-as-you-type, optimistic updates, polling) rather than initial page data.

## Anti-patterns to flag
- Server-fetched data duplicated into Redux/Zustand "just in case," creating two sources of truth
- Filter/pagination state kept in `useState` instead of the URL, breaking back-button and shareable links
- Context used for high-frequency-updating state (e.g. mouse position, form input on every keystroke) causing broad re-renders
- Prop-drilling 4+ levels instead of composition or a scoped store

## Example prompt this skill should trigger on
> "I'm prop-drilling the cart state through 5 components, what's the right way to manage this?"
