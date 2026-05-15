
## Part A — Fix the blank page at scentgenai.app

**Root cause:** Two issues compound to break the published build:

1. `.env` is listed in `.gitignore`, so `VITE_SUPABASE_URL` and the publishable key are not bundled into the production build. At runtime `createClient(undefined, undefined)` blows up before React mounts → blank screen. Local preview works because Vite reads the on-disk `.env`.
2. `src/integrations/supabase/client.ts` reads `import.meta.env.VITE_SUPABASE_ANON_KEY`, but the managed `.env` exposes the key as `VITE_SUPABASE_PUBLISHABLE_KEY`. Even once the env file ships, the anon key is `undefined`.

**Fix:**
- Remove the `.env` line from `.gitignore` so the managed env file is included in the published build (standard Lovable/Vite practice).
- Do NOT edit `src/integrations/supabase/client.ts` (it is auto-generated). Instead, refresh the Lovable Cloud integration so it regenerates `client.ts` + `.env` consistently, then republish. If after refresh the variable name mismatch persists, we add the missing alias in `.env` (`VITE_SUPABASE_ANON_KEY=...`) as a safe fallback.
- Republish from the now-healthy preview.

## Part B — UX Block 1: Onboarding & First Run

### B1. Persist onboarding progress (`src/hooks/useOnboarding.tsx` + `src/components/OnboardingWizard.tsx`)
- Add `onboarding_step INT DEFAULT 0` column to `public.profiles` via migration.
- In `useOnboarding`: load `onboarding_step` alongside `onboarding_completed`; expose `savedStep` and `updateStep(step)`.
- `updateStep` writes to Supabase and mirrors to `localStorage` (`scentgenai:onboarding_step:{userId}`) as a fallback for offline/failed writes.
- `OnboardingWizard` initializes `currentStep` from `savedStep` and calls `updateStep` on every Next/Back.
- On `savePreferences` success, reset `onboarding_step` to 0.
- Add a subtle "Start over" link at the bottom of the wizard that resets step to 0 and clears local state.

### B2. Scent profile reveal screen
- New component `src/components/ScentProfileReveal.tsx`:
  - Full-screen overlay with the brand dark navy gradient.
  - Compute top 3 scent families from the user's `preferred_families` (fallback: first 3 selected).
  - Sequentially fade-in each family name (300ms each, 400ms gap) using existing `animate-fade-in` utility.
  - After the third, display "Your profile is ready" for 1500ms.
  - `onComplete` callback navigates to `/dashboard`.
- Trigger from wherever onboarding finishes (currently inside `OnboardingWizard` / `Dashboard`): on successful `savePreferences`, mount the reveal instead of immediately closing.

### B3. Upgrade empty states (use existing `EmptyState` component)
The `EmptyState` component already supports icon + headline + description + action button. Audit the listed pages and replace any text-only empty UI with `<EmptyState variant=... actionLabel=... onAction={...} />`:

- **`src/pages/Collections.tsx`** — when no items: `variant="collection"`, action "Explore Perfumes" → `/search`.
- **`src/pages/Feed.tsx`** — when no feed items: `variant="feed"`, action "Find people to follow" → `/search` (or wherever discovery lives; confirm during impl).
- **`src/pages/VoiceHistory.tsx`** — when no conversations: `variant="conversation"`, action "Start a conversation" → `/voice-chat`.
- **`src/pages/Search.tsx`** — already uses `EmptyState` for no-results; verify the action routes to `/recommendations` (already does). No change needed unless wording is off.
- **`src/pages/PublicProfile.tsx`** — empty public collection: `variant="collection"`, no action button (viewer is not the owner) — show icon + "This collection is empty yet" headline only.

## Files touched

- `.gitignore` (remove `.env`)
- `supabase/migrations/<new>.sql` (add `onboarding_step` column)
- `src/hooks/useOnboarding.tsx`
- `src/components/OnboardingWizard.tsx`
- `src/components/ScentProfileReveal.tsx` (new)
- `src/pages/Collections.tsx`
- `src/pages/Feed.tsx`
- `src/pages/VoiceHistory.tsx`
- `src/pages/PublicProfile.tsx`
- `src/pages/Search.tsx` (verify only)

## Order of execution

1. Apply the `.gitignore` fix and ask the user to refresh Cloud + republish — confirm the live site loads.
2. Run the `onboarding_step` migration.
3. Implement persistence + Start-over link.
4. Build the scent profile reveal and wire it into the onboarding completion flow.
5. Replace empty states one page at a time.
