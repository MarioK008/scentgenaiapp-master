import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { checkRateLimit } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const messageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1).max(10000),
});

const requestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(50),
  includeAudio: z.boolean().optional().default(false),
  userId: z.string().uuid().optional(),
});

// Smart query classification - detect if user is asking about trends/news vs foundational knowledge
function classifyQuery(query: string): { isTrendQuery: boolean; isKnowledgeQuery: boolean } {
  const trendKeywords = /\b(trend|trending|new release|latest|news|2024|2025|2026|popular now|current|recent|just launched|upcoming|spring|summer|fall|winter|season|this year|bestseller|best seller|hot right now|what's new|new perfume|new fragrance|limited edition|celebrity|collaboration)\b/i;
  const knowledgeKeywords = /\b(what is|how to|explain|difference between|history|ingredient|note|accord|family|olfactive|chemistry|extraction|distillation|base note|top note|heart note|middle note|sillage|longevity|projection|concentration|eau de|parfum|toilette|cologne|perfumer|nose|house|maison)\b/i;
  
  const isTrendQuery = trendKeywords.test(query);
  const isKnowledgeQuery = knowledgeKeywords.test(query);
  
  return { isTrendQuery, isKnowledgeQuery };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: authData, error: authError } = await authClient.auth.getClaims(token);
    
    if (authError || !authData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authenticatedUserId = authData.claims.sub as string;
    console.log('Authenticated user:', authenticatedUserId);

    // Rate limiting check (30 requests per 60 minutes)
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

    const body = await req.json();
    
    // Validate input with Zod
    const validationResult = requestSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error.issues);
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validationResult.error.issues }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { messages, includeAudio } = validationResult.data;
    
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    console.log('Processing chat request with', messages.length, 'messages');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Extract last user message for knowledge search
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    let knowledgeContext = '';
    let trendsContext = '';
    let sources: { type: 'knowledge' | 'trends'; title: string }[] = [];

    if (lastUserMessage) {
      const queryClassification = classifyQuery(lastUserMessage.content);
      console.log(`📊 Query classification:`, queryClassification);

      // Parallel fetch both knowledge and trends if needed
      const fetchPromises: Promise<void>[] = [];

      // Always search knowledge base for foundational info or mixed queries
      if (queryClassification.isKnowledgeQuery || !queryClassification.isTrendQuery) {
        fetchPromises.push(
          (async () => {
            console.log('🔍 Searching knowledge base (global)...');
            try {
              const { data: searchResults } = await supabase.functions.invoke('search-knowledge', {
                body: {
                  query: lastUserMessage.content,
                  globalSearch: true,
                  matchCount: 5,
                },
              });

              if (searchResults?.matches && searchResults.matches.length > 0) {
                console.log(`✅ Found ${searchResults.matches.length} relevant knowledge chunks`);
                
                knowledgeContext = searchResults.matches
                  .map((match: any, idx: number) => {
                    sources.push({ type: 'knowledge', title: match.document_title });
                    return `[Knowledge Source ${idx + 1}: ${match.document_title}]\n${match.content}`;
                  })
                  .join('\n\n');
              } else {
                console.log('ℹ️ No relevant knowledge found');
              }
            } catch (error) {
              console.error('⚠️ Knowledge search error:', error);
            }
          })()
        );
      }

      // Search trends for current/news queries
      if (queryClassification.isTrendQuery) {
        fetchPromises.push(
          (async () => {
            console.log('🌐 Searching real-time trends...');
            try {
              const { data: trendsResults } = await supabase.functions.invoke('search-trends', {
                body: {
                  query: lastUserMessage.content,
                  searchRecency: 'month',
                },
              });

              if (trendsResults?.content) {
                console.log(`✅ Trends search complete`);
                sources.push({ type: 'trends', title: 'Web Search (Perplexity)' });
                
                trendsContext = `[Real-time Web Search]\n${trendsResults.content}`;
                
                if (trendsResults.citations?.length > 0) {
                  trendsContext += `\n\nSources: ${trendsResults.citations.slice(0, 3).join(', ')}`;
                }
              }
            } catch (error) {
              console.error('⚠️ Trends search error:', error);
            }
          })()
        );
      }

      // Wait for all searches to complete
      await Promise.all(fetchPromises);
    }

    // Build combined context
    let combinedContext = '';
    if (knowledgeContext) {
      combinedContext += '\n\n📚 KNOWLEDGE BASE INFORMATION:\n' + knowledgeContext;
    }
    if (trendsContext) {
      combinedContext += '\n\n🌐 CURRENT TRENDS & NEWS:\n' + trendsContext;
    }

    // System message for perfume consultant with combined context
    const systemMessage = {
      role: 'system',
      content: `You are an expert perfume consultant for ScentGenAI. Help users find their perfect fragrance by asking about their preferences, occasions, and favorite scents. Keep responses conversational and friendly. Always respond in English.

${combinedContext ? `You have access to both a curated knowledge base and real-time web search results. Use this information to give accurate, detailed answers.

When answering:
- For foundational perfumery questions (ingredients, techniques, history), prioritize knowledge base information
- For trends, new releases, or current news, prioritize web search results
- Always attribute information to its source when relevant (e.g., "According to recent news..." or "From our knowledge base...")
- If information conflicts, note the discrepancy and provide the most reliable answer

${combinedContext}` : 'Answer based on your general knowledge about perfumery.'}`
    };

    // Call GPT-4o
    const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [systemMessage, ...messages],
        temperature: 0.8,
        max_completion_tokens: 1000,
      }),
    });

    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      console.error('OpenAI Chat API error:', chatResponse.status, errorText);
      throw new Error(`OpenAI API error: ${chatResponse.status}`);
    }

    const chatData = await chatResponse.json();
    const textResponse = chatData.choices[0].message.content;

    console.log('Chat response generated successfully. Sources used:', sources.map(s => s.type).join(', ') || 'none');

    let audioResponse = null;

    // Generate audio if requested
    if (includeAudio) {
      console.log('Generating TTS audio');
      
      const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: textResponse,
          voice: 'alloy',
          response_format: 'mp3',
        }),
      });

      if (ttsResponse.ok) {
        const audioBuffer = await ttsResponse.arrayBuffer();
        audioResponse = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
        console.log('TTS audio generated successfully');
      } else {
        console.error('TTS generation failed:', ttsResponse.status);
      }
    }

    return new Response(
      JSON.stringify({ 
        text: textResponse,
        audio: audioResponse,
        sources: sources.length > 0 ? sources : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in chat-with-assistant:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
