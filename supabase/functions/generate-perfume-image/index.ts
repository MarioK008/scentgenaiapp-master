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
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
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

        // Call Lovable AI to generate the image
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image-preview",
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
            modalities: ["image", "text"],
          }),
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error(`Lovable AI error for ${id}:`, aiResponse.status, errorText);
          
          if (aiResponse.status === 429) {
            results.push({ id, success: false, error: "Rate limited, try again later" });
            break;
          }
          
          if (aiResponse.status === 402) {
            results.push({ id, success: false, error: "Payment required - add credits to workspace" });
            break;
          }
          
          results.push({ id, success: false, error: `Lovable AI error: ${aiResponse.status}` });
          continue;
        }

        const aiData = await aiResponse.json();
        // Lovable AI returns images in choices[0].message.images[0].image_url.url as base64
        const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        
        if (!imageUrl || !imageUrl.startsWith("data:image")) {
          console.error(`No image data returned for ${id}:`, JSON.stringify(aiData));
          results.push({ id, success: false, error: "No image generated" });
          continue;
        }
        
        // Extract base64 data from data URL (remove "data:image/png;base64," prefix)
        const base64Data = imageUrl.split(",")[1];

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
