

The user is asking for a research/summary deliverable, not an implementation task. I'll provide a comprehensive summary directly without a plan structure since no code changes are needed.

# ScentGenAI — Project Summary, Logic & Recommended Improvements

## 1. What Has Been Built

**ScentGenAI** is an AI-powered fragrance discovery and collection management web app, currently in MVP stage. Built on React 18 + Vite + TypeScript + Tailwind, with Lovable Cloud (Supabase) as backend.

### Core Modules

**Public Surface**
- Landing page (`/`) with hero, value proposition, and waitlist capture
- Legal pages: Terms, Privacy
- Auth flows: Sign up, Sign in, Forgot/Reset password
- Welcome emails + admin notifications via edge functions

**Authenticated User Experience**
- **Dashboard** — Personalized greeting, quick-access cards (Collection, Recommendations, MyScentGenAI, Search), journey stats, follow requests, onboarding wizard for new users
- **Collections** — Owned + Wishlist + custom user-defined collections (CRUD), perfume cards with notes pyramid (top/heart/base), accords, longevity, sillage
- **Search** — Real-time text filtering across the perfume catalog with add-to-collection actions
- **Recommendations** — AI-generated suggestions based on mood, occasion, season (via `get-recommendations` edge function)
- **MyScentGenAI Hub** — Three modes:
  - Voice Live (realtime WebSocket → OpenAI Realtime API, with VAD, interruption, 500-token responses, English-only)
  - Voice Chat (dictate + edit + send, transcription via Whisper)
  - Voice History (saved conversations)
- **Trends** — Perplexity-powered exploration of perfume trends (2026, releases, niche, celebrity, sustainable, 4 seasons), with save/explore tabs
- **Profile / Public Profile / Feed** — Avatar management, badges, follow system, social feed of followed users' additions
- **Knowledge Base** — User-uploaded PDFs processed into vector chunks for RAG search

**Admin Surface (role-gated)**
- Perfume catalog management, CSV import, AI image generation
- Waitlist, email logs, email templates, import logs
- Knowledge base administration, user management, image library

### Backend Logic (Edge Functions)
- `chat-with-assistant` — Hybrid RAG: classifies query (foundational vs trends), parallel calls to `search-knowledge` (vector search) and `search-trends` (Perplexity), composes context, calls GPT-4o, optional TTS
- `realtime-perfume-chat` — WebSocket proxy to OpenAI Realtime, injects top-100 perfumes into system prompt
- `get-recommendations` — AI-driven matching against catalog
- `search-knowledge` — OpenAI embeddings + pgvector `match_knowledge_chunks`
- `search-trends` — Perplexity API, perfume-domain-restricted
- `process-pdf`, `import-csv`, `generate-perfume-image`, `voice-transcribe`
- Auth/notification: `send-welcome-email`, `send-user-welcome`, `send-password-reset`, `notify-admin`, `submit-waitlist`

### Data Model (key tables)
`perfumes`, `brands`, `notes`, `accords`, `seasons`, `profiles`, `user_roles` (RBAC, separate table with `has_role()` SECURITY DEFINER function), `collections`, `custom_collections`, `collection_items`, `user_follows`, `badges`, `knowledge_chunks` (vector), `conversation_history`, `saved_trends`, `waitlist`, `email_logs`.

### Design System
Dark navy `#0E2A47` background, pink `#FF2E92` → gold `#F7B731` gradient accents, Playfair Display headings + Inter body, 20px card radius, 28-32px button radius, glass-morphism nav, custom shadows (`elegant`, `glow`, `gold`), skeleton shimmer, card hover-lift.

---

## 2. Application Logic Flow

```text
Visitor → Landing → Waitlist OR Sign Up
  ↓
Auth → Email verify → First login
  ↓
Onboarding Wizard (preferences) → Dashboard
  ↓
┌────────────────────────────────────────────────┐
│  User explores: Search / Recommendations /     │
│  Voice Assistant / Trends / Feed               │
│         ↓                                      │
│  Adds perfumes → Collections (owned/wishlist/  │
│  custom) → Triggers badge checks               │
│         ↓                                      │
│  Follows other users → Sees their additions    │
│  in Feed                                       │
└────────────────────────────────────────────────┘
  ↓
Admin (role-gated) → Manages catalog, users,
knowledge base, communications
```

**Security model**: RLS on all tables, roles in dedicated `user_roles` table (avoids privilege escalation), `has_role()` SECURITY DEFINER for non-recursive policy checks, route guards (`ProtectedRoute`, `AdminRoute`), JWT validation in edge functions, rate limiting on AI endpoints.

---

## 3. Recommended Improvements

### High-Impact (next sprint)

1. **Real perfume images** — Currently AI-generated (DALL-E), looks inauthentic. Integrate a fragrance API (Fragrantica scraping is restricted; consider Parfumo, official brand CDNs, or manual curated upload pipeline).
2. **Mobile navigation** — Current top nav is icon-only with tooltips on desktop; mobile needs a bottom tab bar or hamburger drawer (tooltips don't work on touch).
3. **Voice assistant language matching** — Detected user speaks Spanish but assistant replies English-only by spec. Make language auto-detect + match user, or add explicit language selector in Profile.
4. **Empty states with illustrations** — Several screens (Feed, Collections, Saved Trends) still feel sparse when empty. Add branded SVG illustrations.

### Medium-Impact

5. **Search upgrade** — Move from client-side `.filter()` to server-side full-text search + filters (brand, accord, season, gender, concentration, year range, longevity/sillage). Add fuzzy matching.
6. **Perfume detail page** (vs modal) — Modal is fine for quick browse but a dedicated route enables deep-linking, SEO, sharing, and richer content (reviews, similar perfumes, owners list).
7. **Reviews & ratings** — User-written reviews per perfume with structured fields (longevity perceived, projection, value, occasion); aggregate to community scores.
8. **Recommendation explainability** — Show *why* a perfume was recommended ("matches your love of oud + winter + evening"). Builds trust.
9. **Collection insights dashboard** — Charts: accord distribution, brand diversity, seasonal coverage, gaps in wardrobe. Already have `useCollectionStats`; expand visually.
10. **Notification system** — In-app notifications for new followers, follow requests, badges earned, friend additions.

### Polish & Performance

11. **Page transitions** — `AnimatedPage` component exists; ensure it wraps every route consistently with framer-motion.
12. **Image optimization** — Serve WebP/AVIF, responsive `srcset`, lazy loading. Currently raw URLs.
13. **Skeleton consistency** — Some pages have skeletons (`Dashboard`, `PerfumeCard`), others still show plain spinners. Audit & unify.
14. **Trends caching** — Perplexity calls are slow + costly. Cache results per query for 24h in a `trends_cache` table.
15. **Voice history transcripts** — Make searchable + exportable.

### Strategic / Product

16. **Discovery flows** — "Blind testing" mode (rate by notes only, reveal brand after), "Twin scent" finder (tell us a perfume you love → get matches).
17. **Sample tracker** — Many perfume lovers buy decants/samples. Track sample inventory separately from full bottles.
18. **Wear log** — Quick "I'm wearing this today" button → builds a calendar view + correlates with weather/mood.
19. **Community features** — Public collection sharing already exists; add comments, likes, "scent twins" matching.
20. **Monetization prep** — Affiliate links to retailers (FragranceX, Notino), premium tier (unlimited AI consultations, advanced analytics).

### Technical Debt

21. **Type safety** — Audit `any` usage in edge functions and hooks.
22. **Error boundaries** — Add React error boundaries per route to prevent full-app crashes.
23. **Test coverage** — No tests visible. Add Vitest for hooks + Playwright for critical flows (signup, add to collection, voice chat).
24. **Edge function observability** — Centralize logging, add request IDs, monitor token usage per user.

---

## Suggested Next Steps

Pick one of three tracks:
- **Polish track**: items 2, 4, 11, 13 → ship a more refined feel in 1-2 days
- **Content track**: items 1, 5, 6, 7 → makes the catalog actually useful
- **Engagement track**: items 9, 10, 16, 18 → drives retention

