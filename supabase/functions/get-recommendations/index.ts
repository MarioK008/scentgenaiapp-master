import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Define allowed values for mood, occasion, season
const moodValues = ['romantic', 'energetic', 'calm', 'confident', 'fresh'] as const;
const occasionValues = ['work', 'evening', 'date', 'casual', 'special'] as const;
const seasonValues = ['spring', 'summer', 'fall', 'winter', 'all_season'] as const;

// Input validation schema
const requestSchema = z.object({
  mood: z.enum(moodValues).optional(),
  occasion: z.enum(occasionValues).optional(),
  season: z.enum(seasonValues).optional(),
  userId: z.string().uuid().optional(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // Validate input with Zod
    const validationResult = requestSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error.issues);
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validationResult.error.issues }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { mood, occasion, season, userId } = validationResult.data;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user's collection to understand preferences
    let userPreferences: any[] = [];
    if (userId) {
      const { data } = await supabase
        .from("user_collections")
        .select("perfumes(*), rating")
        .eq("user_id", userId)
        .eq("status", "owned")
        .order("rating", { ascending: false, nullsFirst: false });
      
      userPreferences = data || [];
    }

    // Build query to get perfumes
    let query = supabase
      .from("perfumes")
      .select("*");

    // Filter by season if provided
    if (season && season !== "all_season") {
      query = query.or(`season.eq.${season},season.eq.all_season`);
    }

    const { data: allPerfumes, error } = await query;

    if (error) {
      throw error;
    }

    // Simple recommendation logic
    let recommendations = allPerfumes || [];

    // Filter out perfumes user already owns
    if (userPreferences.length > 0) {
      const ownedIds = userPreferences.map(p => p.perfumes.id);
      recommendations = recommendations.filter(p => !ownedIds.includes(p.id));
    }

    // Score perfumes based on criteria
    recommendations = recommendations.map((perfume: any) => {
      let score = 0;

      // Season match
      if (season && (perfume.season === season || perfume.season === "all_season")) {
        score += 3;
      }

      // Mood-based scoring
      if (mood === "romantic" && perfume.top_notes?.some((note: string) => 
        ["rose", "jasmine", "vanilla", "amber"].some(romantic => note.toLowerCase().includes(romantic))
      )) {
        score += 2;
      }

      if (mood === "energetic" && perfume.top_notes?.some((note: string) => 
        ["citrus", "bergamot", "orange", "grapefruit", "lemon"].some(fresh => note.toLowerCase().includes(fresh))
      )) {
        score += 2;
      }

      if (mood === "calm" && perfume.top_notes?.some((note: string) => 
        ["lavender", "chamomile", "sandalwood", "cedar"].some(calming => note.toLowerCase().includes(calming))
      )) {
        score += 2;
      }

      if (mood === "confident" && perfume.base_notes?.some((note: string) => 
        ["oud", "leather", "tobacco", "musk"].some(bold => note.toLowerCase().includes(bold))
      )) {
        score += 2;
      }

      if (mood === "fresh" && perfume.top_notes?.some((note: string) => 
        ["aquatic", "sea", "mint", "green", "cucumber"].some(fresh => note.toLowerCase().includes(fresh))
      )) {
        score += 2;
      }

      // Occasion-based scoring
      if (occasion === "work" && perfume.sillage && perfume.sillage <= 6) {
        score += 2; // Prefer moderate sillage for work
      }

      if (occasion === "evening" && perfume.longevity && perfume.longevity >= 7) {
        score += 2; // Prefer long-lasting for evening
      }

      if (occasion === "date" && perfume.base_notes?.some((note: string) => 
        ["vanilla", "amber", "musk", "sandalwood"].some(romantic => note.toLowerCase().includes(romantic))
      )) {
        score += 2;
      }

      // If user has preferences, boost similar notes
      if (userPreferences.length > 0) {
        const highRatedPerfumes = userPreferences.filter(p => p.rating && p.rating >= 4);
        const preferredNotes = new Set(
          highRatedPerfumes.flatMap(p => [
            ...(p.perfumes.top_notes || []),
            ...(p.perfumes.heart_notes || []),
            ...(p.perfumes.base_notes || [])
          ].map((n: string) => n.toLowerCase()))
        );

        const perfumeNotes = [
          ...(perfume.top_notes || []),
          ...(perfume.heart_notes || []),
          ...(perfume.base_notes || [])
        ].map((n: string) => n.toLowerCase());

        const matchingNotes = perfumeNotes.filter((note: string) => preferredNotes.has(note));
        score += matchingNotes.length;
      }

      return { ...perfume, score };
    });

    // Sort by score and take top 6
    recommendations.sort((a: any, b: any) => b.score - a.score);
    recommendations = recommendations.slice(0, 6);

    return new Response(
      JSON.stringify({ recommendations }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error in get-recommendations:', error);
    return new Response(
      JSON.stringify({ error: error?.message || "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
