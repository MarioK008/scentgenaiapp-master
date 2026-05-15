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
        const { data, error } = await supabase
          .from('user_collections')
          .select('status, rating')
          .eq('user_id', userId);

        if (error) throw error;

        const rows = data || [];
        setStats({
          ownedCount: rows.filter(r => r.status === 'owned').length,
          wishlistCount: rows.filter(r => r.status === 'wishlist').length,
          reviewsCount: rows.filter(r => r.rating !== null).length,
          favoritesCount: rows.filter(r => r.rating === 5).length,
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
