import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
}

interface UserBadge {
  id: string;
  earned_at: string;
  badges: Badge;
}

export const useBadges = (userId: string | undefined) => {
  const [badges, setbadges] = useState<UserBadge[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchBadges();
      fetchAllBadges();
    }
  }, [userId]);

  const fetchBadges = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from("user_badges")
        .select(`
          id,
          earned_at,
          badge_id,
          badges!inner (
            id,
            name,
            description,
            icon,
            category,
            requirement_type,
            requirement_value
          )
        `)
        .eq("user_id", userId)
        .order("earned_at", { ascending: false });

      if (error) throw error;
      
      const transformedData = (data || []).map(item => ({
        id: item.id,
        earned_at: item.earned_at,
        badges: Array.isArray(item.badges) ? item.badges[0] : item.badges
      }));
      
      setbadges(transformedData as UserBadge[]);
    } catch (error) {
      console.error("Error fetching badges:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllBadges = async () => {
    try {
      const { data, error } = await supabase
        .from("badges")
        .select("*")
        .order("requirement_value", { ascending: true });

      if (error) throw error;
      setAllBadges(data || []);
    } catch (error) {
      console.error("Error fetching all badges:", error);
    }
  };

  const checkBadges = async () => {
    if (!userId) return;

    try {
      // Call the database function to check and award badges
      const { error } = await supabase.rpc("check_and_award_badges", {
        p_user_id: userId,
      });

      if (error) throw error;

      // Refetch badges to get any newly awarded ones
      const previousCount = badges.length;
      await fetchBadges();
      
      // Check if new badges were awarded
      const { data: newBadgesData } = await supabase
        .from("user_badges")
        .select(`
          id,
          earned_at,
          badges!inner (
            id,
            name,
            description,
            icon
          )
        `)
        .eq("user_id", userId)
        .order("earned_at", { ascending: false });

      if (newBadgesData && newBadgesData.length > previousCount) {
        const newBadges = newBadgesData.slice(0, newBadgesData.length - previousCount);
        newBadges.forEach((badge) => {
          const badgeData = Array.isArray(badge.badges) ? badge.badges[0] : badge.badges;
          // Trigger the global full-screen unlock animation
          window.dispatchEvent(
            new CustomEvent("badge:unlocked", {
              detail: {
                id: badgeData.id,
                name: badgeData.name,
                description: badgeData.description,
                icon: badgeData.icon,
              },
            })
          );
        });
      }
    } catch (error) {
      console.error("Error checking badges:", error);
    }
  };

  const earnedBadgeIds = new Set(badges.map(b => b.badges.id));
  const progressBadges = allBadges.map(badge => ({
    ...badge,
    earned: earnedBadgeIds.has(badge.id),
  }));

  return {
    badges,
    allBadges: progressBadges,
    loading,
    checkBadges,
    refetch: fetchBadges,
  };
};
