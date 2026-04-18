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

export const usePerfumes = (searchQuery?: string) => {
  const [perfumes, setPerfumes] = useState<Perfume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPerfumes = async (query?: string) => {
    setLoading(true);
    setError(null);

    try {
      const trimmed = (query ?? "").trim();
      const hasSearch = trimmed.length >= 2;

      // If we have a search query, also resolve matching brand IDs so we can
      // include perfumes whose brand name matches.
      let matchingBrandIds: string[] = [];
      if (hasSearch) {
        const { data: brandMatches } = await supabase
          .from("brands")
          .select("id")
          .ilike("name", `%${trimmed}%`);
        matchingBrandIds = (brandMatches || []).map((b) => b.id);
      }

      let perfumesQuery = supabase
        .from("perfumes")
        .select(`
          *,
          brand:brands!brand_id(id, name),
          main_accord:accords!main_accord_id(id, name)
        `)
        .order("name");

      if (hasSearch) {
        const orFilters = [
          `name.ilike.%${trimmed}%`,
          `description.ilike.%${trimmed}%`,
        ];
        if (matchingBrandIds.length > 0) {
          orFilters.push(`brand_id.in.(${matchingBrandIds.join(",")})`);
        }
        perfumesQuery = perfumesQuery.or(orFilters.join(","));
      } else {
        perfumesQuery = perfumesQuery.limit(50);
      }

      const { data: perfumesData, error: perfumesError } = await perfumesQuery;

      if (perfumesError) throw perfumesError;

      if (!perfumesData || perfumesData.length === 0) {
        setPerfumes([]);
        return;
      }

      const perfumeIds = perfumesData.map((p) => p.id);

      const [{ data: notesData }, { data: seasonsData }, { data: accordsData }] =
        await Promise.all([
          supabase
            .from("perfume_notes")
            .select("perfume_id, note:notes(id, name, type)")
            .in("perfume_id", perfumeIds),
          supabase
            .from("perfume_seasons")
            .select("perfume_id, season:seasons(id, name)")
            .in("perfume_id", perfumeIds),
          supabase
            .from("perfume_accords")
            .select("perfume_id, accord:accords(id, name)")
            .in("perfume_id", perfumeIds),
        ]);

      const enrichedPerfumes = perfumesData.map((perfume: any) => ({
        ...perfume,
        brand: Array.isArray(perfume.brand) ? perfume.brand[0] : perfume.brand,
        main_accord: Array.isArray(perfume.main_accord) ? perfume.main_accord[0] : perfume.main_accord,
        notes: (notesData || [])
          .filter((n) => n.perfume_id === perfume.id)
          .map((n: any) => (Array.isArray(n.note) ? n.note[0] : n.note))
          .filter(Boolean),
        seasons: (seasonsData || [])
          .filter((s) => s.perfume_id === perfume.id)
          .map((s: any) => (Array.isArray(s.season) ? s.season[0] : s.season))
          .filter(Boolean),
        accords: (accordsData || [])
          .filter((a) => a.perfume_id === perfume.id)
          .map((a: any) => (Array.isArray(a.accord) ? a.accord[0] : a.accord))
          .filter(Boolean),
      }));

      setPerfumes(enrichedPerfumes);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const trimmed = (searchQuery ?? "").trim();

    // Debounce all refetches by 300ms
    const handle = setTimeout(() => {
      // If user typed only 1 character, treat as no search (show initial set)
      fetchPerfumes(trimmed.length >= 2 ? trimmed : "");
    }, 300);

    return () => clearTimeout(handle);
  }, [searchQuery]);

  return { perfumes, loading, error, refetch: () => fetchPerfumes(searchQuery) };
};
