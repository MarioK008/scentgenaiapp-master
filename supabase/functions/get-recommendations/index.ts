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

    console.log('Getting recommendations for:', { mood, occasion, season, userId });

    // Get user's collection to understand preferences
    let userOwnedPerfumeIds: string[] = [];
    if (userId) {
      const { data: userCollection } = await supabase
        .from("user_collections")
        .select("perfume_id")
        .eq("user_id", userId)
        .eq("status", "owned");
      
      userOwnedPerfumeIds = userCollection?.map(c => c.perfume_id) || [];
      console.log('User owns:', userOwnedPerfumeIds.length, 'perfumes');
    }

    // Get all perfumes with their related data using proper joins
    // Use explicit FK reference to disambiguate accords relationship
    const { data: allPerfumes, error } = await supabase
      .from("perfumes")
      .select(`
        *,
        brand:brands(name),
        main_accord:accords!perfumes_main_accord_id_fkey(name)
      `);

    if (error) {
      console.error('Error fetching perfumes:', error);
      throw error;
    }

    console.log('Fetched perfumes:', allPerfumes?.length);

    if (!allPerfumes || allPerfumes.length === 0) {
      return new Response(
        JSON.stringify({ recommendations: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Get perfume seasons for filtering
    let perfumeSeasonMap: Record<string, string[]> = {};
    if (season && season !== "all_season") {
      const { data: perfumeSeasons } = await supabase
        .from("perfume_seasons")
        .select(`
          perfume_id,
          season:seasons(name)
        `);
      
      if (perfumeSeasons) {
        for (const ps of perfumeSeasons) {
          if (!perfumeSeasonMap[ps.perfume_id]) {
            perfumeSeasonMap[ps.perfume_id] = [];
          }
          if (ps.season && typeof ps.season === 'object' && 'name' in ps.season) {
            perfumeSeasonMap[ps.perfume_id].push((ps.season as any).name.toLowerCase());
          }
        }
      }
    }

    // Get perfume notes for mood-based scoring
    const { data: perfumeNotes } = await supabase
      .from("perfume_notes")
      .select(`
        perfume_id,
        note:notes(name, type)
      `);
    
    // Build note map
    const noteMap: Record<string, { top: string[], heart: string[], base: string[] }> = {};
    if (perfumeNotes) {
      for (const pn of perfumeNotes) {
        if (!noteMap[pn.perfume_id]) {
          noteMap[pn.perfume_id] = { top: [], heart: [], base: [] };
        }
        if (pn.note && typeof pn.note === 'object' && 'name' in pn.note && 'type' in pn.note) {
          const note = pn.note as { name: string; type: string };
          const noteType = note.type as 'top' | 'heart' | 'base';
          if (noteMap[pn.perfume_id][noteType]) {
            noteMap[pn.perfume_id][noteType].push(note.name.toLowerCase());
          }
        }
      }
    }

    // Get perfume accords for mood scoring
    const { data: perfumeAccords } = await supabase
      .from("perfume_accords")
      .select(`
        perfume_id,
        accord:accords(name)
      `);
    
    const accordMap: Record<string, string[]> = {};
    if (perfumeAccords) {
      for (const pa of perfumeAccords) {
        if (!accordMap[pa.perfume_id]) {
          accordMap[pa.perfume_id] = [];
        }
        if (pa.accord && typeof pa.accord === 'object' && 'name' in pa.accord) {
          accordMap[pa.perfume_id].push((pa.accord as any).name.toLowerCase());
        }
      }
    }

    // Filter and score perfumes
    let recommendations = allPerfumes
      .filter(p => !userOwnedPerfumeIds.includes(p.id)) // Exclude owned perfumes
      .map((perfume: any) => {
        let score = perfume.rating_value || perfume.rating || 0;

        const perfumeSeasons = perfumeSeasonMap[perfume.id] || [];
        const notes = noteMap[perfume.id] || { top: [], heart: [], base: [] };
        const accords = accordMap[perfume.id] || [];
        const allNotes = [...notes.top, ...notes.heart, ...notes.base];

        // Season match
        if (season && season !== "all_season") {
          if (perfumeSeasons.includes(season.toLowerCase())) {
            score += 5;
          }
        }

        // Mood-based scoring using notes and accords
        if (mood === "romantic") {
          const romanticTerms = ["rose", "jasmine", "vanilla", "amber", "floral", "sweet"];
          if (allNotes.some(n => romanticTerms.some(t => n.includes(t))) ||
              accords.some(a => romanticTerms.some(t => a.includes(t)))) {
            score += 3;
          }
        }

        if (mood === "energetic") {
          const energeticTerms = ["citrus", "bergamot", "orange", "grapefruit", "lemon", "fresh"];
          if (allNotes.some(n => energeticTerms.some(t => n.includes(t))) ||
              accords.some(a => energeticTerms.some(t => a.includes(t)))) {
            score += 3;
          }
        }

        if (mood === "calm") {
          const calmTerms = ["lavender", "chamomile", "sandalwood", "cedar", "woody"];
          if (allNotes.some(n => calmTerms.some(t => n.includes(t))) ||
              accords.some(a => calmTerms.some(t => a.includes(t)))) {
            score += 3;
          }
        }

        if (mood === "confident") {
          const confidentTerms = ["oud", "leather", "tobacco", "musk", "spicy"];
          if (allNotes.some(n => confidentTerms.some(t => n.includes(t))) ||
              accords.some(a => confidentTerms.some(t => a.includes(t)))) {
            score += 3;
          }
        }

        if (mood === "fresh") {
          const freshTerms = ["aquatic", "sea", "mint", "green", "cucumber", "marine"];
          if (allNotes.some(n => freshTerms.some(t => n.includes(t))) ||
              accords.some(a => freshTerms.some(t => a.includes(t)))) {
            score += 3;
          }
        }

        // Occasion-based scoring using longevity/sillage strings
        if (occasion === "work") {
          // Prefer moderate projection for work
          if (perfume.sillage && ["soft", "moderate", "intimate"].some(s => 
            perfume.sillage.toLowerCase().includes(s))) {
            score += 2;
          }
        }

        if (occasion === "evening" || occasion === "date" || occasion === "special") {
          // Prefer longer lasting for events
          if (perfume.longevity && ["long", "very long", "eternal"].some(l => 
            perfume.longevity.toLowerCase().includes(l))) {
            score += 2;
          }
        }

        return { 
          ...perfume, 
          score,
          notes,
          accords
        };
      });

    // Sort by score and take top 6
    recommendations.sort((a: any, b: any) => b.score - a.score);
    recommendations = recommendations.slice(0, 6);

    console.log('Returning', recommendations.length, 'recommendations');

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
