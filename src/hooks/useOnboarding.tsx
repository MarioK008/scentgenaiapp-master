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

const stepKey = (uid: string) => `scentgenai:onboarding_step:${uid}`;

export const useOnboarding = () => {
  const { user } = useAuth();
  const { checkBadges } = useBadges(user?.id);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedStep, setSavedStep] = useState(0);

  useEffect(() => {
    if (user) {
      checkOnboardingStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const checkOnboardingStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("onboarding_completed, onboarding_step")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      const completed = data?.onboarding_completed === true;
      setShowOnboarding(!completed);

      // Resume from saved step (DB first, then localStorage fallback)
      const dbStep = (data as any)?.onboarding_step ?? 0;
      let resumeStep = dbStep;
      try {
        const local = localStorage.getItem(stepKey(user.id));
        if (local !== null && Number.isFinite(Number(local))) {
          resumeStep = Math.max(resumeStep, Number(local));
        }
      } catch {
        // ignore
      }
      setSavedStep(resumeStep);
    } catch (error) {
      console.error("Error checking onboarding status:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStep = async (step: number) => {
    if (!user) return;
    setSavedStep(step);
    try {
      localStorage.setItem(stepKey(user.id), String(step));
    } catch {
      // ignore
    }
    try {
      await supabase
        .from("profiles")
        .update({ onboarding_step: step } as any)
        .eq("id", user.id);
    } catch (err) {
      console.warn("Failed to persist onboarding step", err);
    }
  };

  const resetStep = async () => {
    await updateStep(0);
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
          onboarding_step: 0,
        } as any)
        .eq("id", user.id);

      if (error) throw error;

      try {
        localStorage.removeItem(stepKey(user.id));
      } catch {
        // ignore
      }

      setShowOnboarding(false);
      setSavedStep(0);
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
    savedStep,
    savePreferences,
    skipOnboarding,
    updateStep,
    resetStep,
  };
};
