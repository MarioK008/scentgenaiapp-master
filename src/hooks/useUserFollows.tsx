import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useUserFollows = (userId: string | undefined, currentUserId: string | undefined) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchFollowData();
    }
  }, [userId, currentUserId]);

  const fetchFollowData = async () => {
    if (!userId) return;

    try {
      // Get follower count
      const { count: followers } = await supabase
        .from("user_follows")
        .select("*", { count: "exact", head: true })
        .eq("followed_id", userId);

      // Get following count
      const { count: following } = await supabase
        .from("user_follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", userId);

      // Check if current user follows this user
      if (currentUserId && currentUserId !== userId) {
        const { data } = await supabase
          .from("user_follows")
          .select("id")
          .eq("follower_id", currentUserId)
          .eq("followed_id", userId)
          .maybeSingle();

        setIsFollowing(!!data);
      }

      setFollowerCount(followers || 0);
      setFollowingCount(following || 0);
    } catch (error) {
      console.error("Error fetching follow data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFollow = async () => {
    if (!currentUserId || !userId) {
      toast({
        title: "Error",
        description: "You must be logged in to follow users",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from("user_follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("followed_id", userId);

        if (error) throw error;

        setIsFollowing(false);
        setFollowerCount((prev) => prev - 1);
        toast({
          title: "Unfollowed",
          description: "You are no longer following this user",
        });
      } else {
        // Follow
        const { error } = await supabase
          .from("user_follows")
          .insert({
            follower_id: currentUserId,
            followed_id: userId,
          });

        if (error) throw error;

        setIsFollowing(true);
        setFollowerCount((prev) => prev + 1);
        toast({
          title: "Following",
          description: "You are now following this user",
        });
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive",
      });
    }
  };

  return {
    isFollowing,
    followerCount,
    followingCount,
    loading,
    toggleFollow,
  };
};
