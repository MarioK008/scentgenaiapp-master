
# Comprehensive Security & UX Improvements Plan

## Overview

This plan implements all 5 recommended improvements for launch readiness:
1. Edge function authentication (ERROR - Critical)
2. Rate limiting for high-cost AI functions
3. Mobile responsiveness audit
4. SEO meta tags optimization
5. Update plan documentation

---

## Task 1: Edge Function Authentication

**Issue:** 5 edge functions currently lack JWT validation, allowing unauthorized API access.

**Functions to secure:**
- `chat-with-assistant` - Uses GPT-4o + Perplexity (high cost)
- `get-recommendations` - Uses database queries
- `search-knowledge` - Uses OpenAI embeddings
- `search-trends` - Uses Perplexity API (high cost)
- `voice-transcribe` - Uses OpenAI Whisper

**Implementation Pattern:**
Add this authentication block at the start of each function:

```text
// Extract and validate JWT from Authorization header
const authHeader = req.headers.get('Authorization');
if (!authHeader?.startsWith('Bearer ')) {
  return new Response(
    JSON.stringify({ error: 'Unauthorized' }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { headers: { Authorization: authHeader } }
});

const token = authHeader.replace('Bearer ', '');
const { data: authData, error: authError } = await supabase.auth.getClaims(token);
if (authError || !authData?.claims) {
  return new Response(
    JSON.stringify({ error: 'Invalid or expired token' }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

const userId = authData.claims.sub;
console.log('Authenticated user:', userId);
```

**Files to modify:**
1. `supabase/functions/chat-with-assistant/index.ts`
2. `supabase/functions/get-recommendations/index.ts`
3. `supabase/functions/search-knowledge/index.ts`
4. `supabase/functions/search-trends/index.ts`
5. `supabase/functions/voice-transcribe/index.ts`

---

## Task 2: Rate Limiting for High-Cost Functions

**Implementation:** Use the existing `checkRateLimit` utility from `_shared/rate-limiter.ts`.

**Rate limits to apply:**

| Function | Max Requests | Window | Rationale |
|----------|--------------|--------|-----------|
| chat-with-assistant | 30 | 60 min | GPT-4o + TTS costs |
| search-trends | 20 | 60 min | Perplexity API costs |
| voice-transcribe | 50 | 60 min | Whisper API costs |
| generate-perfume-image | 10 | 60 min | DALL-E 3 ($0.04/image) |

**Implementation:**
```typescript
import { checkRateLimit } from "../_shared/rate-limiter.ts";

// After authentication, before processing
try {
  await checkRateLimit(req, 'chat-with-assistant', 30, 60);
} catch (error) {
  if (error instanceof Error && error.message.includes('Rate limit')) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
```

**Files to modify:**
1. `supabase/functions/chat-with-assistant/index.ts` - Add rate limit (30/hour)
2. `supabase/functions/search-trends/index.ts` - Add rate limit (20/hour)
3. `supabase/functions/voice-transcribe/index.ts` - Add rate limit (50/hour)
4. `supabase/functions/generate-perfume-image/index.ts` - Add rate limit (10/hour)

---

## Task 3: Mobile Responsiveness Improvements

**Analysis of current state:**
- Layout.tsx: Navigation items hide labels on mobile (good)
- Index.tsx: Uses responsive grid and text sizing (good)
- Dashboard.tsx: Grid changes from 4 cols to 2 cols on mobile (good)

**Issues identified:**
1. **Layout.tsx (Line 55)**: Navigation overflow on small screens - too many nav items cramped
2. **Dashboard.tsx**: Quick stats grid needs better mobile spacing
3. **Recommendations.tsx**: Filter grid needs vertical stacking on mobile

**Fixes to implement:**

**a) Layout.tsx - Add mobile hamburger menu or scroll container:**
```typescript
// Wrap nav items in horizontal scroll on mobile
<div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
```

**b) Dashboard.tsx - Improve stats grid spacing:**
```typescript
// Change from 2 cols on mobile to 1 col for better readability
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
```

**c) Recommendations.tsx - Already good with `grid-cols-1 md:grid-cols-3`**

**Files to modify:**
1. `src/components/Layout.tsx` - Add horizontal scroll for nav on mobile
2. `src/pages/Dashboard.tsx` - Improve stats grid for mobile
3. `src/index.css` - Add scrollbar-hide utility if not present

---

## Task 4: SEO Meta Tags Optimization

**Current state:**
- `index.html` has basic OG tags and Twitter cards (good)
- Individual pages don't set document title or meta tags

**Implementation:** Create a reusable SEO component using React Helmet alternative (document.title + meta tags).

**a) Create SEO utility hook:**

```typescript
// src/hooks/useSEO.tsx
import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description?: string;
}

export function useSEO({ title, description }: SEOProps) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ScentGenAI` : 'ScentGenAI - Your Personal Scent AIssistant';
    document.title = fullTitle;
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && description) {
      metaDescription.setAttribute('content', description);
    }
  }, [title, description]);
}
```

**b) Add to key pages:**

| Page | Title | Description |
|------|-------|-------------|
| Dashboard | Dashboard | Manage your fragrance collection and get personalized recommendations |
| Search | Search Perfumes | Find perfumes by name, brand, or fragrance notes |
| Recommendations | AI Recommendations | Get personalized fragrance suggestions powered by AI |
| Collections | My Collection | Browse and organize your favorite perfumes |
| Trends | Fragrance Trends | Discover the latest perfume trends and releases |
| Profile | Profile Settings | Manage your ScentGenAI profile and preferences |
| Auth | Sign In | Sign in to your ScentGenAI account |

**Files to create:**
1. `src/hooks/useSEO.tsx` - SEO utility hook

**Files to modify:**
1. `src/pages/Dashboard.tsx` - Add useSEO
2. `src/pages/Search.tsx` - Add useSEO
3. `src/pages/Recommendations.tsx` - Add useSEO
4. `src/pages/Collections.tsx` - Add useSEO
5. `src/pages/Trends.tsx` - Add useSEO
6. `src/pages/Profile.tsx` - Add useSEO
7. `src/pages/Auth.tsx` - Add useSEO
8. `src/pages/VoiceAssistant.tsx` - Add useSEO

---

## Task 5: Update Plan Documentation

Update `.lovable/plan.md` to reflect all completed improvements and current project status.

---

## Implementation Order

1. **Edge Function Authentication** (Critical - Security)
   - Secure all 5 functions with JWT validation
   
2. **Rate Limiting** (High - Cost Protection)
   - Add rate limits to 4 high-cost functions
   
3. **SEO Hook** (Medium - User Experience)
   - Create useSEO hook and apply to all pages
   
4. **Mobile Responsiveness** (Medium - UX)
   - Fix navigation overflow and grid spacing
   
5. **Documentation Update** (Low - Maintenance)
   - Update plan.md with completion status

---

## Technical Details

### Edge Function Authentication Changes

**chat-with-assistant/index.ts:**
- Add SUPABASE_ANON_KEY environment variable usage
- Insert auth block after CORS handling (line ~39)
- Use authenticated userId from JWT claims instead of request body

**get-recommendations/index.ts:**
- Add auth block after CORS handling (line ~24)
- Use authenticated userId from JWT claims

**search-knowledge/index.ts:**
- Add auth block after CORS handling (line ~20)
- Use authenticated userId from JWT claims

**search-trends/index.ts:**
- Add auth block after CORS handling (line ~16)
- Log authenticated user for audit trail

**voice-transcribe/index.ts:**
- Add auth block after CORS handling (line ~15)
- Log authenticated user for audit trail

### Testing Plan

After implementation:
1. Test each edge function with valid JWT token
2. Test each edge function without token (should return 401)
3. Test rate limiting by exceeding limits
4. Verify mobile navigation on 375px width
5. Check page titles in browser tabs

---

## Cost Impact

- **Security:** Prevents unauthorized API usage (could save $100s in abuse scenarios)
- **Rate limiting:** Caps costs at predictable levels
- **SEO:** Improves organic discovery (long-term value)
- **Mobile:** Improves user retention on mobile devices

---

## Files Summary

**New files:**
- `src/hooks/useSEO.tsx`

**Modified files (15 total):**
- 5 edge functions (auth + rate limiting)
- 8 pages (SEO hooks)
- 2 components (mobile fixes)
