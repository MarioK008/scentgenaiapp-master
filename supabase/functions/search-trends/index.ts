import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const requestSchema = z.object({
  query: z.string().min(1).max(500),
  searchRecency: z.enum(['day', 'week', 'month', 'year']).optional().default('month'),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate input
    const validationResult = requestSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error.issues);
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validationResult.error.issues }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { query, searchRecency } = validationResult.data;
    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');

    if (!PERPLEXITY_API_KEY) {
      throw new Error('PERPLEXITY_API_KEY is not configured');
    }

    console.log(`🔍 Searching trends for: "${query}" (recency: ${searchRecency})`);

    // Call Perplexity API with perfume-focused search
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { 
            role: 'system', 
            content: 'You are a perfume industry expert. Provide accurate, current information about fragrances, trends, new releases, and market news. Be concise and factual. Always cite your sources when possible.' 
          },
          { 
            role: 'user', 
            content: `${query} (Focus on perfume/fragrance industry)`
          }
        ],
        search_recency_filter: searchRecency,
        search_domain_filter: [
          'fragrantica.com',
          'basenotes.com',
          'perfumesociety.org',
          'nstperfume.com',
          'cafleurebon.com',
          'thepersolvelife.com',
          'reddit.com/r/fragrance'
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API error:', response.status, errorText);
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const citations = data.citations || [];

    console.log(`✅ Trends search complete. ${citations.length} citations found.`);

    return new Response(
      JSON.stringify({
        content,
        citations,
        source: 'perplexity',
        searchRecency,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in search-trends:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
