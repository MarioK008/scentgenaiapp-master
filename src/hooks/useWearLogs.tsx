import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface WearStats {
  count: number;
  wornToday: boolean;
}

const startOfTodayIso = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

export const useWearLogs = (perfumeIds: string[]) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Record<string, WearStats>>({});
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!user || perfumeIds.length === 0) {
      setStats({});
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("wear_logs" as any)
        .select("perfume_id, worn_at")
        .eq("user_id", user.id)
        .in("perfume_id", perfumeIds);
      if (error) throw error;

      const today = startOfTodayIso();
      const next: Record<string, WearStats> = {};
      perfumeIds.forEach((id) => (next[id] = { count: 0, wornToday: false }));
      (data ?? []).forEach((row: any) => {
        const s = next[row.perfume_id] || { count: 0, wornToday: false };
        s.count += 1;
        if (row.worn_at >= today) s.wornToday = true;
        next[row.perfume_id] = s;
      });
      setStats(next);
    } catch (e) {
      console.error("Error fetching wear logs:", e);
    } finally {
      setLoading(false);
    }
  }, [user, perfumeIds.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const logWear = async (perfumeId: string) => {
    if (!user) return false;
    const current = stats[perfumeId];
    if (current?.wornToday) return false;
    try {
      const { error } = await supabase.from("wear_logs" as any).insert({
        user_id: user.id,
        perfume_id: perfumeId,
      });
      if (error) throw error;
      setStats((prev) => ({
        ...prev,
        [perfumeId]: {
          count: (prev[perfumeId]?.count ?? 0) + 1,
          wornToday: true,
        },
      }));
      toast.success("Logged today's wear");
      return true;
    } catch (e: any) {
      toast.error("Could not log wear");
      console.error(e);
      return false;
    }
  };

  return { stats, loading, logWear, refetch: fetchStats };
};
