import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { checkRateLimit } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 2000;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateImageWithRetry(
  prompt: string,
  openaiApiKey: string,
  perfumeId: string
): Promise<{ success: boolean; base64Data?: string; error?: string; shouldStop?: boolean }> {
  let lastError = "";
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${MAX_RETRIES} for perfume ${perfumeId}`);
      
      const aiResponse = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: prompt,
          size: "1024x1024",
          quality: "standard",
          response_format: "b64_json",
          n: 1,
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const base64Data = aiData.data?.[0]?.b64_json;
        
        if (base64Data) {
          return { success: true, base64Data };
        }
        lastError = "No image data in response";
        console.error(`No image data returned for ${perfumeId}:`, JSON.stringify(aiData));
      } else {
        const errorText = await aiResponse.text();
        console.error(`OpenAI DALL-E error (attempt ${attempt}) for ${perfumeId}:`, aiResponse.status, errorText);
        
        // Non-retryable errors
        if (aiResponse.status === 401) {
          return { success: false, error: "Invalid API key", shouldStop: true };
        }
        
        if (aiResponse.status === 429) {
          lastError = "Rate limited";
          // Exponential backoff for rate limits
          const delayMs = INITIAL_DELAY_MS * Math.pow(2, attempt - 1);
          console.log(`Rate limited, waiting ${delayMs}ms before retry...`);
          await sleep(delayMs);
          continue;
        }
        
        // Other server errors - retry with backoff
        if (aiResponse.status >= 500) {
          lastError = `Server error: ${aiResponse.status}`;
          const delayMs = INITIAL_DELAY_MS * Math.pow(2, attempt - 1);
          console.log(`Server error, waiting ${delayMs}ms before retry...`);
          await sleep(delayMs);
          continue;
        }
        
        // Content policy violation - don't retry
        if (aiResponse.status === 400) {
          return { success: false, error: `Content policy violation or invalid request` };
        }
        
        // Client errors (4xx except 429) - don't retry
        return { success: false, error: `OpenAI DALL-E error: ${aiResponse.status}` };
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Unknown error";
      console.error(`Network error (attempt ${attempt}) for ${perfumeId}:`, lastError);
      
      if (attempt < MAX_RETRIES) {
        const delayMs = INITIAL_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`Waiting ${delayMs}ms before retry...`);
        await sleep(delayMs);
      }
    }
  }
  
  return { success: false, error: `Failed after ${MAX_RETRIES} attempts: ${lastError}` };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiApiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: authData, error: authError } = await authClient.auth.getClaims(token);
    
    if (authError || !authData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authenticatedUserId = authData.claims.sub as string;
    console.log('Authenticated user:', authenticatedUserId);

    // Rate limiting check (10 requests per 60 minutes)
    try {
      await checkRateLimit(req, 'generate-perfume-image', 10, 60);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Rate limit')) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { perfumeId, perfumeIds } = await req.json();

    const idsToProcess = perfumeIds || (perfumeId ? [perfumeId] : []);

    if (idsToProcess.length === 0) {
      return new Response(
        JSON.stringify({ error: "No perfume IDs provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${idsToProcess.length} perfumes for image generation`);

    const results: { id: string; success: boolean; imageUrl?: string; error?: string }[] = [];

    for (const id of idsToProcess) {
      try {
        // Fetch perfume details with brand and notes
        const { data: perfume, error: perfumeError } = await supabase
          .from("perfumes")
          .select(`
            id,
            name,
            concentration,
            gender,
            description,
            brand:brands!brand_id(name),
            main_accord:accords!main_accord_id(name)
          `)
          .eq("id", id)
          .single();

        if (perfumeError || !perfume) {
          console.error(`Failed to fetch perfume ${id}:`, perfumeError);
          results.push({ id, success: false, error: "Perfume not found" });
          continue;
        }

        // Fetch notes for this perfume
        const { data: notesData } = await supabase
          .from("perfume_notes")
          .select("note:notes(name, type)")
          .eq("perfume_id", id);

        const topNotes = notesData
          ?.filter((n: any) => n.note?.type === "top")
          .map((n: any) => n.note?.name)
          .filter(Boolean)
          .slice(0, 3) || [];

        const brandName = (perfume.brand as any)?.name || "Unknown";
        const accordName = (perfume.main_accord as any)?.name || "";
        const genderText = perfume.gender === "unisex" ? "unisex" : perfume.gender === "female" ? "feminine" : "masculine";

        // Build a rich prompt for consistent, elegant product photography
        const prompt = `Create an elegant, professional perfume bottle product photograph.
Brand: ${brandName}
Fragrance: ${perfume.name}
Style: ${genderText} ${perfume.concentration || "perfume"}
${accordName ? `Main accord: ${accordName}` : ""}
${topNotes.length > 0 ? `Key notes: ${topNotes.join(", ")}` : ""}

Photography style requirements:
- Dark navy background (#0E2A47) with subtle gradient
- Soft, warm gold and amber lighting from the side
- Elegant glass perfume bottle with refined details
- Minimalist, luxury product photography composition
- Clean, professional studio lighting
- Slight reflection on surface beneath bottle
- High-end cosmetics advertising aesthetic
- Ultra high resolution, photorealistic
- 1:1 aspect ratio, centered composition`;

        console.log(`Generating image for: ${brandName} - ${perfume.name}`);

        // Call OpenAI DALL-E 3 with retry logic
        const imageResult = await generateImageWithRetry(prompt, openaiApiKey, id);
        
        if (!imageResult.success) {
          results.push({ id, success: false, error: imageResult.error });
          if (imageResult.shouldStop) {
            console.log("Stopping batch due to non-recoverable error");
            break;
          }
          continue;
        }

        // Convert base64 to binary
        const binaryData = Uint8Array.from(atob(imageResult.base64Data!), (c) => c.charCodeAt(0));

        // Upload to storage bucket
        const fileName = `${id}.png`;
        const { error: uploadError } = await supabase.storage
          .from("perfume-images")
          .upload(fileName, binaryData, {
            contentType: "image/png",
            upsert: true,
          });

        if (uploadError) {
          console.error(`Upload error for ${id}:`, uploadError);
          results.push({ id, success: false, error: "Failed to upload image" });
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("perfume-images")
          .getPublicUrl(fileName);

        const publicUrl = urlData.publicUrl;

        // Update perfume record with image URL
        const { error: updateError } = await supabase
          .from("perfumes")
          .update({ image_url: publicUrl })
          .eq("id", id);

        if (updateError) {
          console.error(`Update error for ${id}:`, updateError);
          results.push({ id, success: false, error: "Failed to update perfume record" });
          continue;
        }

        console.log(`Successfully generated image for ${brandName} - ${perfume.name}`);
        results.push({ id, success: true, imageUrl: publicUrl });

        // Small delay between generations to avoid rate limiting
        if (idsToProcess.length > 1) {
          await sleep(1500);
        }
      } catch (err) {
        console.error(`Error processing perfume ${id}:`, err);
        results.push({ id, success: false, error: err instanceof Error ? err.message : "Unknown error" });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return new Response(
      JSON.stringify({
        message: `Generated ${successCount} images, ${failCount} failed`,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-perfume-image:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
