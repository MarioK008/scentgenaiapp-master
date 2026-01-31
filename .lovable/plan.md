

## Switching from Lovable AI to OpenAI or Google Gemini

### Current State

Your project already uses OpenAI directly for most AI features. Only 2 edge functions use Lovable AI:
1. **generate-perfume-image** - AI image generation
2. **process-pdf** - Text extraction from PDFs

You already have `OPENAI_API_KEY` configured and working.

---

### Option A: Full OpenAI Migration (Recommended)

Since you already have OpenAI configured, this is the simplest path.

#### Changes Required

**1. Update `generate-perfume-image/index.ts`**

Replace Lovable AI with OpenAI's DALL-E 3:

```typescript
// BEFORE (Lovable AI)
const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
  headers: { Authorization: `Bearer ${lovableApiKey}` },
  body: JSON.stringify({ model: "google/gemini-2.5-flash-image-preview", ... })
});

// AFTER (OpenAI DALL-E 3)
const aiResponse = await fetch("https://api.openai.com/v1/images/generations", {
  headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
  body: JSON.stringify({
    model: "dall-e-3",
    prompt: prompt,
    size: "1024x1024",
    quality: "standard",
    response_format: "b64_json"
  })
});
```

**2. Update `process-pdf/index.ts`**

Replace Lovable AI with OpenAI GPT-4o for text extraction:

```typescript
// BEFORE (Lovable AI)
const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
  headers: { Authorization: `Bearer ${LOVABLE_API_KEY}` },
  body: JSON.stringify({ model: 'google/gemini-2.5-flash', ... })
});

// AFTER (OpenAI GPT-4o)
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
  body: JSON.stringify({ model: 'gpt-4o', ... })
});
```

#### Cost Considerations
- DALL-E 3 (1024x1024): ~$0.04 per image
- GPT-4o: ~$5/1M input tokens, $15/1M output tokens

---

### Option B: Google Gemini Migration

#### Setup Required

1. **Add GEMINI_API_KEY secret**
   - Get API key from Google AI Studio (https://aistudio.google.com/apikey)
   - Add to project secrets

2. **Update edge functions**

**generate-perfume-image/index.ts** - Use Imagen 3:

```typescript
const aiResponse = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${GEMINI_API_KEY}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: { sampleCount: 1 }
    })
  }
);
```

**process-pdf/index.ts** - Use Gemini 2.0 Flash:

```typescript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  }
);
```

#### Optional: Migrate ALL AI to Gemini

If you want to use Gemini for everything (chat, embeddings, etc.), additional changes:

| Function | Current | Gemini Replacement |
|----------|---------|-------------------|
| chat-with-assistant | GPT-4o | gemini-2.0-flash |
| search-knowledge | text-embedding-3-small | text-embedding-004 |
| realtime-perfume-chat | gpt-4o-realtime | Not available (Gemini has no real-time API yet) |
| voice-transcribe | Whisper | Not available (keep OpenAI) |

---

### Recommendation

**Go with Option A (OpenAI)** because:
1. You already have OPENAI_API_KEY configured
2. Only 2 functions need updating
3. OpenAI has mature APIs for all your needs (chat, images, voice, embeddings)
4. Real-time voice requires OpenAI (Gemini doesn't support this yet)

---

### Implementation Steps

1. Update `generate-perfume-image/index.ts` to use DALL-E 3
2. Update `process-pdf/index.ts` to use GPT-4o instead of Lovable AI
3. Test image generation on Admin Images page
4. Test PDF processing on Admin Knowledge page
5. Remove any remaining LOVABLE_API_KEY references (though the key will remain as it cannot be deleted)

