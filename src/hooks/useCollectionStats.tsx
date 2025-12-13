import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CollectionStats {
  ownedCount: number;
  wishlistCount: number;
  reviewsCount: number;
  favoritesCount: number;
}

export function useCollectionStats(userId: string | undefined) {
  const [stats, setStats] = useState<CollectionStats>({
    ownedCount: 0,
    wishlistCount: 0,
    reviewsCount: 0,
    favoritesCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        // Fetch owned perfumes count
        const { count: ownedCount } = await supabase
          .from('user_collections')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('status', 'owned');

        // Fetch wishlist count
        const { count: wishlistCount } = await supabase
          .from('user_collections')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('status', 'wishlist');

        // Fetch reviews count (items with a rating)
        const { count: reviewsCount } = await supabase
          .from('user_collections')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .not('rating', 'is', null);

        // Fetch favorites count (items rated 5 stars)
        const { count: favoritesCount } = await supabase
          .from('user_collections')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('rating', 5);

        setStats({
          ownedCount: ownedCount || 0,
          wishlistCount: wishlistCount || 0,
          reviewsCount: reviewsCount || 0,
          favoritesCount: favoritesCount || 0,
        });
      } catch (error) {
        console.error('Error fetching collection stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  return { stats, loading };
}
