import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useBadges } from "./useBadges";
import { toast } from "sonner";

export interface OnboardingPreferences {
  preferred_families: string[];
  preferred_occasions: string[];
  preferred_seasons: string[];
}

export const useOnboarding = () => {
  const { user } = useAuth();
  const { checkBadges } = useBadges(user?.id);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      checkOnboardingStatus();
    }
  }, [user]);

  const checkOnboardingStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      // Show onboarding if not completed
      setShowOnboarding(data?.onboarding_completed !== true);
    } catch (error) {
      console.error("Error checking onboarding status:", error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (preferences: OnboardingPreferences) => {
    if (!user) return false;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          preferred_families: preferences.preferred_families,
          preferred_occasions: preferences.preferred_occasions,
          preferred_seasons: preferences.preferred_seasons,
          onboarding_completed: true,
        })
        .eq("id", user.id);

      if (error) throw error;

      setShowOnboarding(false);
      toast.success("Preferences saved! Welcome to ScentGenAI");
      checkBadges();
      return true;
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save preferences");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const skipOnboarding = async () => {
    if (!user) return;

    try {
      await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", user.id);

      setShowOnboarding(false);
    } catch (error) {
      console.error("Error skipping onboarding:", error);
    }
  };

  return {
    showOnboarding,
    loading,
    saving,
    savePreferences,
    skipOnboarding,
  };
};
