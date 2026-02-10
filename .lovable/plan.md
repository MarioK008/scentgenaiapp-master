
# ScentGenAI Feedback Fixes

## 1. Navigation Spacing (Layout.tsx)

**Problem:** Top menu buttons feel too crowded; active highlight causes visual overlap.

**Fix:**
- Increase gap between nav items from `gap-1 sm:gap-2` to `gap-2 sm:gap-3`
- Add horizontal padding to each nav button (`px-3 sm:px-4`)
- Add a subtle separator before the profile/signout section
- Consider showing labels at `md:` breakpoint instead of only `lg:` to use available space better

**File:** `src/components/Layout.tsx`

---

## 2. Perfume Images

**Problem:** Current images are AI-generated (DALL-E 3) and don't look like real products.

**What's needed from you:** This requires replacing the AI-generated images in the database with real/official product photos. Two approaches:
- **Option A (Manual):** You upload real product images and we update the database URLs
- **Option B (Automated):** We modify the system to search for and use official product images from a fragrance API or web source

This item will NOT be implemented in this round -- it requires a decision and real image assets from you. We'll note it as a follow-up.

---

## 3. Voice Response Length (realtime-perfume-chat)

**Problem:** AI spoken responses are limited to ~5 seconds because `max_response_output_tokens` is set to `150`.

**Fix:** Increase `max_response_output_tokens` from `150` to `500` in the session configuration. This allows responses of roughly 15-20 seconds of speech while still keeping them conversational and not overly long.

**File:** `supabase/functions/realtime-perfume-chat/index.ts` (line 134)

---

## 4. Trends Section Updates (Trends.tsx)

**Problem:** "Trending 2025" is outdated; missing seasonal categories.

**Fix:** Update `TRENDING_TOPICS` array:
- Change "Trending 2025" to "Trending 2026" (and update its query text)
- Change "Summer Picks" query year to 2026
- Add three new seasonal topics: "Spring Picks", "Autumn Picks", "Winter Picks"

**File:** `src/pages/Trends.tsx` (lines 30-37)

Updated topics list:
```text
- Trending 2026
- New Releases
- Niche Fragrances
- Celebrity Launches
- Sustainable Scents
- Spring Picks
- Summer Picks
- Autumn Picks
- Winter Picks
```

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/components/Layout.tsx` | Increase nav spacing and padding |
| `supabase/functions/realtime-perfume-chat/index.ts` | Increase max_response_output_tokens from 150 to 500 |
| `src/pages/Trends.tsx` | Update year to 2026, add seasonal categories |

**Deferred:** Perfume images replacement (requires real product image assets or API integration decision from you).
