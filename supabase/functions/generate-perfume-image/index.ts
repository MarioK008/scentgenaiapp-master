import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiApiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
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

        const heartNotes = notesData
          ?.filter((n: any) => n.note?.type === "heart")
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

        // Call OpenAI to generate the image
        const aiResponse = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openaiApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-image-1",
            prompt: prompt,
            n: 1,
            size: "1024x1024",
          }),
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error(`OpenAI API error for ${id}:`, aiResponse.status, errorText);
          
          if (aiResponse.status === 429) {
            results.push({ id, success: false, error: "Rate limited, try again later" });
            // If rate limited, stop processing more
            break;
          }
          
          results.push({ id, success: false, error: `OpenAI API error: ${aiResponse.status}` });
          continue;
        }

        const aiData = await aiResponse.json();
        // gpt-image-1 returns base64 data in data[0].b64_json
        const base64Data = aiData.data?.[0]?.b64_json;

        if (!base64Data) {
          console.error(`No image data returned for ${id}:`, JSON.stringify(aiData));
          results.push({ id, success: false, error: "No image generated" });
          continue;
        }

        // Convert base64 to binary
        const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

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
          await new Promise((resolve) => setTimeout(resolve, 1000));
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
