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

    const { documentId, filePath, pageRange } = await req.json();

    const rangeText = pageRange 
      ? `(páginas ${pageRange.start}-${pageRange.end})` 
      : '(documento completo)';
    console.log('📄 Processing PDF:', filePath, rangeText);

    // Download PDF from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('knowledge-pdfs')
      .download(filePath);

    if (downloadError) throw downloadError;

    const fileSize = fileData.size;
    console.log(`📊 PDF size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

    // Check file size limit (10MB max to avoid worker limits)
    if (fileSize > 10 * 1024 * 1024) {
      throw new Error('PDF too large. Maximum size is 10MB. Please split into smaller files.');
    }

    console.log('🔍 Extracting text from PDF using OpenAI...');
    
    // Convert PDF to base64 efficiently
    const arrayBuffer = await fileData.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    let base64 = '';
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      base64 += btoa(String.fromCharCode.apply(null, Array.from(chunk)));
    }

    console.log('📤 Sending PDF to OpenAI for text extraction...');

    // Build extraction prompt based on page range
    let extractionPrompt = 'Extract all text content from this PDF document. Return only the text content, preserving the structure and formatting as much as possible. Focus on the main content and avoid extracting headers, footers, and page numbers unless they contain important information.';
    
    if (pageRange) {
      extractionPrompt = `Extract ONLY the text content from pages ${pageRange.start} to ${pageRange.end} of this PDF document. Ignore all other pages. Return only the text content from the specified page range, preserving the structure and formatting as much as possible. Focus on the main content and avoid extracting headers, footers, and page numbers unless they contain important information.`;
    }

    // Use OpenAI to extract text from PDF
    const extractionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: extractionPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${base64}`
                }
              }
            ]
          }
        ],
        max_completion_tokens: 4000,
      }),
    });

    if (!extractionResponse.ok) {
      const errorText = await extractionResponse.text();
      console.error('OpenAI extraction error:', errorText);
      throw new Error(`Failed to extract text from PDF: ${extractionResponse.status}`);
    }

    const extractionData = await extractionResponse.json();
    const extractedText = extractionData.choices[0].message.content;

    console.log(`✅ Extracted ${extractedText.length} characters from PDF`);

    // Split text into chunks (~500 tokens each, approximately 1500 characters)
    const textChunkSize = 1500;
    const chunks: string[] = [];
    
    for (let i = 0; i < extractedText.length; i += textChunkSize) {
      const chunk = extractedText.substring(i, Math.min(i + textChunkSize, extractedText.length));
      if (chunk.trim().length > 100) { // Only include chunks with substantial content
        chunks.push(chunk.trim());
      }
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
      const chunkMetadata: any = { 
        page: Math.floor(index / 2) + 1 // Rough page estimation
      };
      
      if (pageRange) {
        chunkMetadata.pageRange = pageRange;
        chunkMetadata.page = pageRange.start + Math.floor(index / 2);
      }
      
      const { error: insertError } = await supabase
        .from('knowledge_chunks')
        .insert({
          document_id: documentId,
          content: chunk,
          embedding,
          chunk_index: index,
          metadata: chunkMetadata,
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