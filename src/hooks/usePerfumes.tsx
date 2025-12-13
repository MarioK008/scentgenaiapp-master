import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Note {
  id: string;
  name: string;
  type: 'top' | 'heart' | 'base';
}

export interface Brand {
  id: string;
  name: string;
}

export interface Season {
  id: string;
  name: string;
}

export interface Accord {
  id: string;
  name: string;
}

export interface Perfume {
  id: string;
  name: string;
  brand_id: string | null;
  brand?: Brand;
  year: number | null;
  concentration: string | null;
  description: string | null;
  image_url: string | null;
  main_accord_id: string | null;
  main_accord?: Accord;
  rating: number | null;
  votes: number | null;
  longevity: string | null;
  sillage: string | null;
  notes: Note[];
  seasons: Season[];
  accords: Accord[];
}

export const usePerfumes = () => {
  const [perfumes, setPerfumes] = useState<Perfume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPerfumes = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching perfumes...');
      
      // Fetch perfumes with brand and main accord
      const { data: perfumesData, error: perfumesError } = await supabase
        .from("perfumes")
        .select(`
          *,
          brand:brands(id, name),
          main_accord:accords(id, name)
        `)
        .order("name");

      console.log('Perfumes query result:', { count: perfumesData?.length, error: perfumesError });

      if (perfumesError) throw perfumesError;

      if (!perfumesData || perfumesData.length === 0) {
        console.log('No perfumes found in database');
        setPerfumes([]);
        return;
      }

      // Fetch all notes for these perfumes
      const perfumeIds = perfumesData.map(p => p.id);
      
      const { data: notesData, error: notesError } = await supabase
        .from("perfume_notes")
        .select("perfume_id, note:notes(id, name, type)")
        .in("perfume_id", perfumeIds);

      if (notesError) {
        console.error('Notes query error:', notesError);
      }

      // Fetch all seasons for these perfumes
      const { data: seasonsData, error: seasonsError } = await supabase
        .from("perfume_seasons")
        .select("perfume_id, season:seasons(id, name)")
        .in("perfume_id", perfumeIds);

      if (seasonsError) {
        console.error('Seasons query error:', seasonsError);
      }

      // Fetch all accords for these perfumes
      const { data: accordsData, error: accordsError } = await supabase
        .from("perfume_accords")
        .select("perfume_id, accord:accords(id, name)")
        .in("perfume_id", perfumeIds);

      if (accordsError) {
        console.error('Accords query error:', accordsError);
      }

      // Combine all data
      const enrichedPerfumes = perfumesData.map(perfume => ({
        ...perfume,
        brand: Array.isArray(perfume.brand) ? perfume.brand[0] : perfume.brand,
        main_accord: Array.isArray(perfume.main_accord) ? perfume.main_accord[0] : perfume.main_accord,
        notes: (notesData || [])
          .filter(n => n.perfume_id === perfume.id)
          .map(n => Array.isArray(n.note) ? n.note[0] : n.note)
          .filter(Boolean),
        seasons: (seasonsData || [])
          .filter(s => s.perfume_id === perfume.id)
          .map(s => Array.isArray(s.season) ? s.season[0] : s.season)
          .filter(Boolean),
        accords: (accordsData || [])
          .filter(a => a.perfume_id === perfume.id)
          .map(a => Array.isArray(a.accord) ? a.accord[0] : a.accord)
          .filter(Boolean),
      }));

      console.log('Enriched perfumes count:', enrichedPerfumes.length);
      setPerfumes(enrichedPerfumes);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerfumes();
  }, []);

  return { perfumes, loading, error, refetch: fetchPerfumes };
};
