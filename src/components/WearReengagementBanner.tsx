import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles, X } from "lucide-react";

const STORAGE_KEY = (userId: string) => `scentgenai:wear_banner_dismissed:${userId}`;
const DISMISS_HOURS = 24;

interface WearReengagementBannerProps {
  userId: string;
}

export const WearReengagementBanner = ({ userId }: WearReengagementBannerProps) => {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // Respect dismissal window
    const dismissedAt = localStorage.getItem(STORAGE_KEY(userId));
    if (dismissedAt) {
      const hoursSince = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60);
      if (hoursSince < DISMISS_HOURS) return;
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    (async () => {
      const { count, error } = await supabase
        .from("wear_logs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("worn_at", sevenDaysAgo);

      if (error) {
        console.error("wear_logs check failed", error);
        return;
      }
      if ((count ?? 0) === 0) setShow(true);
    })();
  }, [userId]);

  if (!show) return null;

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY(userId), Date.now().toString());
    setShow(false);
  };

  return (
    <div className="relative flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl border border-accent/30 bg-gradient-to-r from-accent/10 via-primary/5 to-transparent animate-fade-in">
      <div className="flex items-start sm:items-center gap-3 flex-1">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0">
          <Sparkles className="h-5 w-5 text-white" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm sm:text-base font-medium">
            What are you wearing today?
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Log your current scent to keep your story going.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:ml-auto">
        <Button
          variant="hero"
          size="sm"
          onClick={() => navigate("/collections")}
          className="rounded-full"
        >
          Log a scent →
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="h-8 w-8 rounded-full"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default WearReengagementBanner;
