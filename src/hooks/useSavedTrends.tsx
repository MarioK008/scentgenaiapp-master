import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface SavedTrend {
  id: string;
  user_id: string;
  query: string;
  content: string;
  citations: string[];
  created_at: string;
}

export const useSavedTrends = () => {
  const [savedTrends, setSavedTrends] = useState<SavedTrend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSavedTrends = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("saved_trends")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setSavedTrends(
        (data || []).map((trend) => ({
          ...trend,
          citations: (trend.citations as string[]) || [],
        }))
      );
    } catch (error) {
      console.error("Error fetching saved trends:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedTrends();
  }, [user]);

  const saveTrend = async (query: string, content: string, citations: string[]) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save trends.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { data, error } = await supabase
        .from("saved_trends")
        .insert({
          user_id: user.id,
          query,
          content,
          citations,
        })
        .select()
        .single();

      if (error) throw error;

      setSavedTrends((prev) => [
        {
          ...data,
          citations: (data.citations as string[]) || [],
        },
        ...prev,
      ]);

      toast({
        title: "Trend saved",
        description: "This insight has been bookmarked to your collection.",
      });

      return true;
    } catch (error: any) {
      console.error("Error saving trend:", error);
      toast({
        title: "Failed to save",
        description: error.message || "Could not save this trend.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteTrend = async (id: string) => {
    try {
      const { error } = await supabase
        .from("saved_trends")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setSavedTrends((prev) => prev.filter((trend) => trend.id !== id));

      toast({
        title: "Trend removed",
        description: "The saved trend has been deleted.",
      });

      return true;
    } catch (error: any) {
      console.error("Error deleting trend:", error);
      toast({
        title: "Failed to delete",
        description: error.message || "Could not delete this trend.",
        variant: "destructive",
      });
      return false;
    }
  };

  const isTrendSaved = (query: string, content: string) => {
    return savedTrends.some(
      (trend) => trend.query === query && trend.content === content
    );
  };

  return {
    savedTrends,
    isLoading,
    saveTrend,
    deleteTrend,
    isTrendSaved,
    refetch: fetchSavedTrends,
  };
};
