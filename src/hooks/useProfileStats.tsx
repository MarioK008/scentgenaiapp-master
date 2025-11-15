import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProfileStats {
  totalPerfumes: number;
  wishlistCount: number;
  favoritePerfume: {
    id: string;
    name: string;
    brand: string;
    image_url: string | null;
  } | null;
  topNotes: {
    top: string[];
    heart: string[];
    base: string[];
  };
}

export const useProfileStats = (userId: string | undefined) => {
  const [stats, setStats] = useState<ProfileStats>({
    totalPerfumes: 0,
    wishlistCount: 0,
    favoritePerfume: null,
    topNotes: { top: [], heart: [], base: [] },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchStats();
    }
  }, [userId]);

  const fetchStats = async () => {
    if (!userId) return;

    try {
      // Query 1: Total perfumes owned
      const { count: totalPerfumes } = await supabase
        .from("user_collections")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "owned");

      // Query 2: Wishlist count
      const { count: wishlistCount } = await supabase
        .from("user_collections")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "wishlist");

      // Query 3: Favorite perfume (highest rated)
      const { data: favoriteData } = await supabase
        .from("user_collections")
        .select("rating, perfume_id")
        .eq("user_id", userId)
        .not("rating", "is", null)
        .order("rating", { ascending: false })
        .limit(1)
        .single();

      let favoritePerfume = null;
      if (favoriteData) {
        const { data: perfumeData } = await supabase
          .from("perfumes")
          .select(`
            id,
            name,
            image_url,
            brand:brands(name)
          `)
          .eq("id", favoriteData.perfume_id)
          .single();

        if (perfumeData) {
          const brandData: any = Array.isArray(perfumeData.brand) ? perfumeData.brand[0] : perfumeData.brand;
          favoritePerfume = {
            id: perfumeData.id,
            name: perfumeData.name,
            brand: brandData?.name || 'Unknown',
            image_url: perfumeData.image_url,
          };
        }
      }

      // Query 4: Most common notes
      const { data: collectionData } = await supabase
        .from("user_collections")
        .select("perfume_id")
        .eq("user_id", userId)
        .eq("status", "owned");

      const perfumeIds = collectionData?.map(c => c.perfume_id) || [];

      if (perfumeIds.length > 0) {
        const { data: notesData } = await supabase
          .from("perfume_notes")
          .select("note:notes(name, type)")
          .in("perfume_id", perfumeIds);

        const noteCounts: Record<string, Record<string, number>> = {
          top: {},
          heart: {},
          base: {},
        };

        notesData?.forEach((item: any) => {
          const note = Array.isArray(item.note) ? item.note[0] : item.note;
          if (note && note.type && note.name) {
            noteCounts[note.type][note.name] = (noteCounts[note.type][note.name] || 0) + 1;
          }
        });

        const getTopNotes = (type: 'top' | 'heart' | 'base') => {
          return Object.entries(noteCounts[type])
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([name]) => name);
        };

        setStats({
          totalPerfumes: totalPerfumes || 0,
          wishlistCount: wishlistCount || 0,
          favoritePerfume,
          topNotes: {
            top: getTopNotes('top'),
            heart: getTopNotes('heart'),
            base: getTopNotes('base'),
          },
        });
      } else {
        setStats({
          totalPerfumes: totalPerfumes || 0,
          wishlistCount: wishlistCount || 0,
          favoritePerfume,
          topNotes: { top: [], heart: [], base: [] },
        });
      }
    } catch (error) {
      console.error("Error fetching profile stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading, refetch: fetchStats };
};
