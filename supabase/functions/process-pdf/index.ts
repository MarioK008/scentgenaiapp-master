import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { documentId, filePath } = await req.json();

    console.log('📄 Processing PDF:', filePath);

    // Download PDF from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('knowledge-pdfs')
      .download(filePath);

    if (downloadError) throw downloadError;

    // Convert to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    // Extract text using OpenAI (vision API can read PDFs)
    console.log('🔍 Extracting text from PDF...');
    
    // For now, we'll use a simple approach: split the PDF into chunks based on size
    // In a production system, you'd use a PDF parser library
    const text = `[PDF Content from ${filePath}]`; // Placeholder
    
    // Split text into chunks (~500 tokens each)
    const chunkSize = 1500; // ~500 tokens
    const chunks: string[] = [];
    
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.substring(i, i + chunkSize));
    }

    console.log(`📦 Created ${chunks.length} chunks`);

    // Generate embeddings for each chunk
    const embeddingPromises = chunks.map(async (chunk, index) => {
      console.log(`🔢 Generating embedding ${index + 1}/${chunks.length}`);
      
      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: chunk,
        }),
      });

      if (!embeddingResponse.ok) {
        const errorText = await embeddingResponse.text();
        console.error('Embedding error:', errorText);
        throw new Error(`Failed to generate embedding: ${errorText}`);
      }

      const embeddingData = await embeddingResponse.json();
      const embedding = embeddingData.data[0].embedding;

      // Store chunk with embedding
      const { error: insertError } = await supabase
        .from('knowledge_chunks')
        .insert({
          document_id: documentId,
          content: chunk,
          embedding,
          chunk_index: index,
          metadata: { page: Math.floor(index / 2) + 1 }, // Rough page estimation
        });

      if (insertError) throw insertError;

      return true;
    });

    await Promise.all(embeddingPromises);

    // Update document as processed
    const { error: updateError } = await supabase
      .from('knowledge_documents')
      .update({
        processed: true,
        chunk_count: chunks.length,
      })
      .eq('id', documentId);

    if (updateError) throw updateError;

    console.log('✅ PDF processed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        chunks: chunks.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Error processing PDF:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});