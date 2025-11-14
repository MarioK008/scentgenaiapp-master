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
    rating: number;
  } | null;
  topNotes: string[];
}

export const useProfileStats = (userId: string | undefined) => {
  const [stats, setStats] = useState<ProfileStats>({
    totalPerfumes: 0,
    wishlistCount: 0,
    favoritePerfume: null,
    topNotes: [],
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
        .select("rating, perfumes(id, name, brand, image_url)")
        .eq("user_id", userId)
        .not("rating", "is", null)
        .order("rating", { ascending: false })
        .limit(1);

      const favoritePerfume = favoriteData?.[0]
        ? {
            id: favoriteData[0].perfumes.id,
            name: favoriteData[0].perfumes.name,
            brand: favoriteData[0].perfumes.brand,
            image_url: favoriteData[0].perfumes.image_url,
            rating: favoriteData[0].rating || 0,
          }
        : null;

      // Query 4: Top notes analysis
      const { data: collections } = await supabase
        .from("user_collections")
        .select("perfumes(top_notes, heart_notes, base_notes)")
        .eq("user_id", userId);

      // Analyze most frequent notes
      const allNotes: string[] = [];
      collections?.forEach((c) => {
        if (c.perfumes) {
          allNotes.push(
            ...(c.perfumes.top_notes || []),
            ...(c.perfumes.heart_notes || []),
            ...(c.perfumes.base_notes || [])
          );
        }
      });

      const noteCounts: Record<string, number> = {};
      allNotes.forEach((note) => {
        noteCounts[note] = (noteCounts[note] || 0) + 1;
      });

      const topNotes = Object.entries(noteCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([note]) => note);

      setStats({
        totalPerfumes: totalPerfumes || 0,
        wishlistCount: wishlistCount || 0,
        favoritePerfume,
        topNotes,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading, refetch: fetchStats };
};
