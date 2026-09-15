---
name: form-validation-error-handling
description: Build forms with robust client+server validation, accessible error messaging, and consistent error handling across the stack. Use whenever the user builds any form (signup, checkout, settings, multi-step), asks about form validation, React Hook Form, Zod schemas, or error/loading state UX.
---

# Form Validation & Error Handling Skill

## Stack: React Hook Form + Zod
```tsx
const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
});
type FormValues = z.infer<typeof schema>;

const form = useForm<FormValues>({ resolver: zodResolver(schema), mode: 'onBlur' });
```
- Define the schema once, use it for **both** client-side validation and server-side validation (Server Action re-parses the same schema) — never trust client validation alone; the server is the source of truth.
- `mode: 'onBlur'` (validate on blur, not on every keystroke) for a less naggy UX; re-validate on change only after the first error on that field.

## Server Action validation pattern
```ts
'use server';
export async function createAccount(prevState: unknown, formData: FormData) {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  // proceed with parsed.data
}
```
Use `useActionState` (React 19/Next.js) to wire the action's returned error state back into the form UI, including pending state for the submit button.

## Accessible error UX
- Associate every error with its input via `aria-describedby`; announce with `role="alert"` on the error text so screen readers pick it up.
- Focus the first invalid field on submit failure.
- Show errors near the field they belong to, not only in a summary banner at the top (do both for long forms).
- Never clear the user's valid input on a failed submission — only surface what's wrong.

## Error handling layers
1. **Field-level**: inline validation message (Zod schema message).
2. **Form-level**: a submission-wide error (e.g. "email already registered") shown in a banner, not attached to a specific field unless it maps to one.
3. **Network/unexpected errors**: a generic, non-technical message ("Something went wrong, please try again") — never surface raw error objects/stack traces to the user; log the real error server-side.

## Multi-step forms
- Validate each step's schema independently (`schema.pick({...})`) before allowing "Next," but re-validate the full combined schema on final submit.
- Persist in-progress state (URL step param or local state) so back/forward doesn't lose data.

## Anti-patterns to flag
- Client-only validation with no matching server-side re-validation
- Generic "Invalid input" errors instead of field-specific, actionable messages
- Disabling the submit button silently with no visible reason why
- Losing all form input on a failed submit (forcing the user to retype everything)
- Raw error/exception text shown directly in the UI

## Example prompt this skill should trigger on
> "Build a signup form with email/password validation and proper error states."
