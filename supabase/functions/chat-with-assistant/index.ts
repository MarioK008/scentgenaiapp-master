import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { messages, includeAudio = false } = await req.json();
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Invalid messages format');
    }

    console.log('Processing chat request with', messages.length, 'messages');

    // System message for perfume consultant
    const systemMessage = {
      role: 'system',
      content: 'Eres un consultor experto en perfumes. Ayuda a los usuarios a encontrar su fragancia perfecta preguntando sobre sus preferencias, ocasiones y aromas favoritos. Mantén las respuestas conversacionales y amigables. Responde siempre en español.'
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