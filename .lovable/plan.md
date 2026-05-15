## UX Block 2 — Discovery & Recommendations

### 1. "Why recommended" line on each card

- Add new optional prop `reason?: string` to `PerfumeCard` (rendered as one-line muted text under the description, e.g. `text-xs text-muted-foreground italic line-clamp-1`).
- Compute the reason client-side in `Recommendations.tsx` (no backend changes):
  - Load the user's `preferred_families` from `profiles` once on mount via a small `useUserPreferences` hook (or inline query).
  - For each recommended perfume, intersect its accords/notes with the user's preferred families:
    - Match → `"Matches your love of {family1} and {family2} notes"` (max 2 families, 12 words max).
    - No match but mood/occasion/season selected → `"Picked for your {mood}/{occasion}/{season} vibe"`.
    - Fallback → `"Popular with users who share your taste profile"`.
  - Pass `reason` into each `<PerfumeCard>` in the recommendations grid.

### 2. Recently Viewed horizontal scroller

- New hook `useRecentlyViewed(userId)`:
  - Storage key: `scentgenai:recently_viewed:${userId}`.
  - `addRecentlyViewed(perfume)` — prepend (dedupe by id), cap at 8, stored as `{id, name, image_url, brand}` snapshot.
  - `recentlyViewed` array, `clear()` method.
- New component `RecentlyViewed.tsx`:
  - Horizontal scroll row (`overflow-x-auto snap-x`), small cards (~120px wide) with image + name + brand.
  - Click → opens the perfume detail modal (emits `onSelect(id)` upward).
  - Hidden when list is empty.
- Hook into:
  - `Search.tsx` — call `addRecentlyViewed` in the existing `setSelectedPerfume` flow; render `<RecentlyViewed>` at top of page.
  - `Recommendations.tsx` — same.
- Logout cleanup: in `useAuth` `signOut`, remove all keys matching `scentgenai:recently_viewed:*` from localStorage.

### 3. Mobile swipe gestures on perfume cards

- Wrap `<PerfumeCard>` consumption in Search/Recommendations with a new `<SwipeablePerfumeCard>` component (keeps `PerfumeCard` itself untouched for desktop/non-swipe contexts).
- Behavior (only active when `useIsMobile()` returns true; otherwise renders the card normally):
  - `onTouchStart` records start X.
  - `onTouchMove` updates `translateX`. Behind the card, render two absolutely-positioned color layers:
    - Right side: green (`bg-emerald-500`) with check icon, opacity scaling with swipe distance.
    - Left side: gray (`bg-muted`) with X icon.
  - `onTouchEnd`:
    - If `|deltaX| ≥ 40%` of card width:
      - Right → animate card off-screen right, call `onAddToCollection(perfume.id, 'owned')`, show green checkmark overlay briefly, then unmount or reset.
      - Left → fade card opacity to 0 + slide left, call optional `onDismiss(perfume.id)` (locally hide from grid via a dismissed-IDs Set in the parent page).
    - Otherwise → CSS transition snap back to translateX(0).
- Use plain CSS transforms + transitions; no new deps.

### Files

**New:**
- `src/hooks/useRecentlyViewed.tsx`
- `src/components/RecentlyViewed.tsx`
- `src/components/SwipeablePerfumeCard.tsx`

**Edited:**
- `src/components/PerfumeCard.tsx` — add optional `reason` prop + render line.
- `src/pages/Search.tsx` — recently viewed + swipeable wrapper + dismissed set + record on open.
- `src/pages/Recommendations.tsx` — recently viewed + swipeable wrapper + compute `reason` per card + load preferred_families.
- `src/hooks/useAuth.tsx` — clear `recently_viewed:*` localStorage keys on `signOut`.

### Notes / non-goals

- Reason text is computed client-side from existing data; the recommendations Edge Function is not modified.
- Swipe gestures are mobile-only (gated by `useIsMobile`); desktop UX is unchanged.
- Dismissed perfumes are session-local (not persisted) to keep scope tight.
