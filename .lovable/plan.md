# Fix blank Collections & AI conversational pages

## What I found

### 1. Collections page — confirmed bug (blank screen)

`src/pages/Collections.tsx` violates the React **Rules of Hooks**:

- Lines 201–217 conditionally `return` early while `authLoading || collectionsLoading || loadingLegacy` is true.
- Lines 234 (`useMemo`) and 241 (`useWearLogs`) are hooks that run **after** that early return.

When loading flips from `true` → `false`, the number of hooks React sees changes between renders. React throws "Rendered more hooks than during the previous render" and the whole route unmounts → **blank page**. This matches your symptom exactly.

### 2. AI conversational pages — needs runtime verification

The three pages under `/voice-assistant`, `/voice-chat`, `/voice-live` look structurally correct (hooks all declared above the early returns). The likely failure points are:

- The realtime WebSocket (`/voice-live`) using `wss://<project>.supabase.co/functions/v1/realtime-perfume-chat`. If `VITE_SUPABASE_PROJECT_ID` is empty and URL parsing fails, the WS errors silently.
- An unhandled error in `chat-with-assistant` (e.g. missing `OPENAI_API_KEY`, rate limit, or schema mismatch) currently bubbles as a generic `toast` — but if the response shape is unexpected the page can still throw.
- Possibly the same kind of hook/render error tied to the Layout or AnimatedPage wrapper.

I will reproduce in the live preview after fixing Collections, then patch.

---

## Plan

### Step 1 — Fix Collections hook order (root cause of blank page)

In `src/pages/Collections.tsx`:

- Move `wearablePerfumeIds` (`useMemo`) and `useWearLogs(...)` **above** the `if (authLoading || collectionsLoading || loadingLegacy)` early return.
- Compute `currentPerfumes` / `currentTitle` / `emptyVariant` after the hooks but before the early return, so the loading state still renders the skeleton.
- No behavior change — only re-ordering so hook counts stay stable between renders.

### Step 2 — Reproduce AI chat blank page in the browser

- Open `/voice-assistant`, `/voice-chat`, `/voice-live` in the preview.
- Capture console errors, network failures, and edge-function logs (`chat-with-assistant`, `realtime-perfume-chat`).
- Identify which of the three actually goes blank and the exact thrown error.

### Step 3 — Patch the AI chat failure based on Step 2

Likely fixes (will be narrowed once reproduced):

- Wrap the relevant page body in a defensive guard (no early return between hooks).
- Add a graceful error state in `chat-with-assistant` invocation: if `data?.error` or no `data?.text`, show an inline error instead of throwing.
- For `/voice-live`, validate `projectId` before opening the WebSocket and show a clear error if missing; also handle `error` frames so a server-side failure doesn't leave the UI stuck.

### Step 4 — Verify

- Reload `/collections` while authenticated: skeleton → grid renders without console errors.
- Switch between Favorites / Wishlist / Custom tabs: no remounts crash.
- Open all three voice pages: each renders its UI; trigger a short send/record and confirm no blanking.

## Technical notes

- Only frontend changes. No DB migrations, no edge-function logic changes (unless Step 2 surfaces one).
- Keeps existing styles, copy, and routes intact.
- Files in scope:
  - `src/pages/Collections.tsx` (definite edit)
  - `src/pages/VoiceChat.tsx` / `src/pages/VoiceLive.tsx` / `src/pages/VoiceAssistant.tsx` (conditional, after repro)
