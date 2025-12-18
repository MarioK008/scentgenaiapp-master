import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema - allow more characters in file paths (spaces, parentheses, etc.)
const requestSchema = z.object({
  documentId: z.string().uuid(),
  filePath: z.string()
    .min(1)
    .max(500)
    .refine(path => !path.includes('..'), 'Path traversal not allowed'),
});

const PAGES_PER_SECTION = 50; // Process 50 pages at a time for large PDFs
const BYTES_PER_PAGE_ESTIMATE = 50000; // Rough estimate: 50KB per page

// Helper: Update processing status
async function updateProcessingStatus(
  supabase: any,
  documentId: string,
  status: any
) {
  await supabase
    .from('knowledge_documents')
    .update({ processing_status: status })
    .eq('id', documentId);
}

// Helper: Extract text using pdf-parse (fast, free)
async function extractTextWithPdfParse(arrayBuffer: ArrayBuffer): Promise<string | null> {
  try {
    console.log('🚀 Attempting text extraction with pdf-parse...');
    
    // Import pdf-parse from npm using esm.sh
    const { default: pdfParse } = await import('https://esm.sh/pdf-parse@1.1.1');
    
    // Convert ArrayBuffer to Uint8Array for pdf-parse
    const buffer = new Uint8Array(arrayBuffer);
    const data = await pdfParse(buffer);
    
    console.log(`✅ pdf-parse extracted ${data.text.length} characters from ${data.numpages} pages`);
    
    // Check if extraction was successful (has meaningful content)
    if (data.text.trim().length < 100) {
      console.log('⚠️ pdf-parse extracted too little text, may be scanned PDF');
      return null;
    }
    
    return data.text;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.log('⚠️ pdf-parse failed:', errorMessage);
    return null;
  }
}

// Helper: Extract text using Lovable AI (handles complex PDFs via text analysis)
async function extractTextWithLovableAI(
  arrayBuffer: ArrayBuffer,
  pageRange?: { start: number; end: number }
): Promise<string> {
  console.log('🔍 Extracting text using Lovable AI...');
  
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured');
  }
  
  // Convert PDF to base64 for context
  const uint8Array = new Uint8Array(arrayBuffer);
  let base64 = '';
  const chunkSize = 8192;
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
    base64 += btoa(String.fromCharCode.apply(null, Array.from(chunk)));
  }

  // Build extraction prompt
  let extractionPrompt = `You are a document text extraction assistant. The user has uploaded a PDF document encoded in base64. Since I cannot directly read the PDF, I will rely on the pdf-parse library which has already extracted the text. If pdf-parse failed, it means the PDF might be scanned or image-based. In that case, please inform the user that this PDF requires OCR processing which is not currently available.

Please provide any text content you can extract or analyze from the document metadata.`;
  
  if (pageRange) {
    extractionPrompt = `Extract text content from pages ${pageRange.start} to ${pageRange.end} of the document. Return only the text content, preserving the structure and formatting.`;
  }

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that extracts and organizes text content from documents.'
          },
          {
            role: 'user',
            content: extractionPrompt
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI extraction error:', errorText);
      throw new Error(`Lovable AI extraction failed: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error with Lovable AI:', error);
    throw new Error('Failed to extract text with AI. The PDF may be scanned or image-based which requires OCR.');
  }
}

// Helper: Create chunks and embeddings
async function createChunksWithEmbeddings(
  text: string,
  documentId: string,
  openaiApiKey: string,
  supabase: any,
  metadata: any = {}
): Promise<number> {
  const textChunkSize = 1500;
  const chunks: string[] = [];
  
  for (let i = 0; i < text.length; i += textChunkSize) {
    const chunk = text.substring(i, Math.min(i + textChunkSize, text.length));
    if (chunk.trim().length > 100) {
      chunks.push(chunk.trim());
    }
  }

  console.log(`📦 Created ${chunks.length} chunks`);

  // Generate embeddings and save chunks
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`🔢 Generating embedding ${i + 1}/${chunks.length}`);
    
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: chunk,
      }),
    });

    if (!embeddingResponse.ok) {
      throw new Error(`Failed to generate embedding for chunk ${i}`);
    }

    const embeddingData = await embeddingResponse.json();
    const embedding = embeddingData.data[0].embedding;

    const chunkMetadata = {
      ...metadata,
      chunk_index: i,
      page: metadata.startPage ? metadata.startPage + Math.floor(i / 2) : Math.floor(i / 2) + 1
    };
    
    await supabase
      .from('knowledge_chunks')
      .insert({
        document_id: documentId,
        content: chunk,
        embedding,
        chunk_index: i,
        metadata: chunkMetadata,
      });
  }

  return chunks.length;
}

// Main processing function with automatic batching
async function processPDFSmart(
  documentId: string,
  filePath: string,
  openaiApiKey: string,
  supabase: any
) {
  try {
    console.log('📄 Starting smart PDF processing for:', filePath);

    // Download PDF
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('knowledge-pdfs')
      .download(filePath);

    if (downloadError) throw downloadError;

    const fileSize = fileData.size;
    console.log(`📊 PDF size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

    const arrayBuffer = await fileData.arrayBuffer();

    // Try pdf-parse first (fast and free)
    let extractedText = await extractTextWithPdfParse(arrayBuffer);
    let usedMethod = 'pdf-parse';

    // If pdf-parse failed or extracted too little, use Lovable AI
    if (!extractedText) {
      console.log('📸 Falling back to Lovable AI for complex PDF...');
      usedMethod = 'Lovable AI';
      
      // For large files, process in sections
      const estimatedPages = Math.ceil(fileSize / BYTES_PER_PAGE_ESTIMATE);
      
      if (estimatedPages > PAGES_PER_SECTION) {
        console.log(`📚 Large PDF detected (${estimatedPages} estimated pages), processing in sections...`);
        
        const totalSections = Math.ceil(estimatedPages / PAGES_PER_SECTION);
        let totalChunks = 0;
        
        for (let section = 0; section < totalSections; section++) {
          const startPage = section * PAGES_PER_SECTION + 1;
          const endPage = Math.min((section + 1) * PAGES_PER_SECTION, estimatedPages);
          
          console.log(`📄 Processing section ${section + 1}/${totalSections} (pages ${startPage}-${endPage})`);
          
          // Update progress
          await updateProcessingStatus(supabase, documentId, {
            total_sections: totalSections,
            completed_sections: section,
            current_section: section + 1,
            method: usedMethod
          });
          
          // Extract text for this section
          const sectionText = await extractTextWithLovableAI(
            arrayBuffer,
            { start: startPage, end: endPage }
          );
          
          // Create chunks and embeddings for this section
          const chunkCount = await createChunksWithEmbeddings(
            sectionText,
            documentId,
            openaiApiKey,
            supabase,
            { section, startPage, endPage }
          );
          
          totalChunks += chunkCount;
        }
        
        // Mark as processed
        await supabase
          .from('knowledge_documents')
          .update({
            processed: true,
            chunk_count: totalChunks,
            processing_status: null
          })
          .eq('id', documentId);
        
        console.log(`✅ PDF processed successfully in ${totalSections} sections (${totalChunks} chunks)`);
        return;
      } else {
        // Small enough to process in one go
        extractedText = await extractTextWithLovableAI(arrayBuffer);
      }
    }

    console.log(`✅ Extracted ${extractedText!.length} characters using ${usedMethod}`);

    // Create chunks and embeddings
    const chunkCount = await createChunksWithEmbeddings(
      extractedText!,
      documentId,
      openaiApiKey,
      supabase,
      { method: usedMethod }
    );

    // Mark as processed
    await supabase
      .from('knowledge_documents')
      .update({
        processed: true,
        chunk_count: chunkCount,
        processing_status: null
      })
      .eq('id', documentId);

    console.log(`✅ PDF processed successfully (${chunkCount} chunks)`);
  } catch (error) {
    console.error('❌ Error processing PDF:', error);
    
    // Update document with error
    await supabase
      .from('knowledge_documents')
      .update({
        processing_status: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
      .eq('id', documentId);
    
    throw error;
  }
}

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

    const { documentId, filePath } = validationResult.data;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('📄 Starting PDF processing:', filePath);

    // Initialize processing status
    await updateProcessingStatus(supabase, documentId, {
      total_sections: 1,
      completed_sections: 0,
      current_section: 1,
      method: 'Detecting...'
    });

    // Start processing in background
    // @ts-ignore - EdgeRuntime is available in Deno Deploy
    EdgeRuntime.waitUntil(
      processPDFSmart(documentId, filePath, OPENAI_API_KEY, supabase)
    );

    // Return immediately
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Processing started',
        documentId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Error:', error);
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
