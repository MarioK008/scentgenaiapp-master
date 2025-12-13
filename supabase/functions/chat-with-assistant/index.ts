import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
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

    const { messages, includeAudio, userId } = validationResult.data;
    
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    console.log('Processing chat request with', messages.length, 'messages');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Extract last user message for knowledge search
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    let knowledgeContext = '';

    if (lastUserMessage && userId) {
      console.log('🔍 Searching knowledge base...');
      
      try {
        const { data: searchResults } = await supabase.functions.invoke('search-knowledge', {
          body: {
            query: lastUserMessage.content,
            userId: userId,
            matchCount: 3,
          },
        });

        if (searchResults?.matches && searchResults.matches.length > 0) {
          console.log(`✅ Found ${searchResults.matches.length} relevant knowledge chunks`);
          
          knowledgeContext = '\n\nCONOCIMIENTO RELEVANTE DE LA BASE DE DATOS:\n' + 
            searchResults.matches
              .map((match: any, idx: number) => 
                `[Fuente ${idx + 1}: ${match.document_title} - Similitud: ${(match.similarity * 100).toFixed(0)}%]\n${match.content}`
              )
              .join('\n\n');
        } else {
          console.log('ℹ️ No relevant knowledge found');
        }
      } catch (error) {
        console.error('⚠️ Knowledge search error:', error);
        // Continue without knowledge context
      }
    }

    // System message for perfume consultant with knowledge context
    const systemMessage = {
      role: 'system',
      content: `Eres un consultor experto en perfumes. Ayuda a los usuarios a encontrar su fragancia perfecta preguntando sobre sus preferencias, ocasiones y aromas favoritos. Mantén las respuestas conversacionales y amigables. Responde siempre en español.${knowledgeContext ? '\n\nUtiliza el conocimiento proporcionado para dar respuestas más precisas y detalladas. Si citas información de las fuentes, menciona que proviene de la base de conocimientos.' : ''
      }${knowledgeContext}`
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

    console.log('Chat response generated successfully');

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
        audio: audioResponse 
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
