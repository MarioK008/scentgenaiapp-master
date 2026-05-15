import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Heart, 
  MessageSquare, 
  Mic, 
  TrendingUp, 
  ChevronRight, 
  ChevronLeft,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OnboardingPreferences } from "@/hooks/useOnboarding";

interface OnboardingWizardProps {
  open: boolean;
  onComplete: (preferences: OnboardingPreferences) => void;
  onSkip: () => void;
  saving?: boolean;
  initialStep?: number;
  onStepChange?: (step: number) => void;
  onStartOver?: () => void;
}

const FRAGRANCE_FAMILIES = [
  { id: "oriental", label: "Oriental", emoji: "🌙" },
  { id: "fresh", label: "Fresh", emoji: "🍃" },
  { id: "floral", label: "Floral", emoji: "🌸" },
  { id: "woody", label: "Woody", emoji: "🌲" },
  { id: "citrus", label: "Citrus", emoji: "🍊" },
  { id: "spicy", label: "Spicy", emoji: "🌶️" },
  { id: "aquatic", label: "Aquatic", emoji: "🌊" },
  { id: "gourmand", label: "Gourmand", emoji: "🍫" },
];

const OCCASIONS = [
  { id: "daily", label: "Daily Wear", emoji: "☀️" },
  { id: "evening", label: "Evening Out", emoji: "🌙" },
  { id: "work", label: "Office/Work", emoji: "💼" },
  { id: "special", label: "Special Events", emoji: "✨" },
  { id: "romantic", label: "Romantic", emoji: "💕" },
  { id: "casual", label: "Casual", emoji: "🎽" },
];

const SEASONS = [
  { id: "spring", label: "Spring", emoji: "🌷" },
  { id: "summer", label: "Summer", emoji: "☀️" },
  { id: "fall", label: "Fall", emoji: "🍂" },
  { id: "winter", label: "Winter", emoji: "❄️" },
];

const FEATURES = [
  {
    icon: MessageSquare,
    title: "AI Chat Assistant",
    description: "Get personalized fragrance advice and recommendations",
  },
  {
    icon: Mic,
    title: "Voice Assistant",
    description: "Talk naturally about perfumes and get instant answers",
  },
  {
    icon: Heart,
    title: "Smart Collections",
    description: "Organize your perfumes with custom collections",
  },
  {
    icon: TrendingUp,
    title: "Trends & Insights",
    description: "Stay updated with the latest fragrance trends",
  },
];

export const OnboardingWizard = ({
  open,
  onComplete,
  onSkip,
  saving,
  initialStep = 0,
  onStepChange,
  onStartOver,
}: OnboardingWizardProps) => {
  const totalSteps = 5;
  const [step, setStep] = useState(Math.min(Math.max(initialStep, 0), totalSteps - 1));
  const [preferences, setPreferences] = useState<OnboardingPreferences>({
    preferred_families: [],
    preferred_occasions: [],
    preferred_seasons: [],
  });

  // Sync to a new initialStep when the wizard re-opens
  useEffect(() => {
    if (open) {
      setStep(Math.min(Math.max(initialStep, 0), totalSteps - 1));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const goToStep = (next: number) => {
    setStep(next);
    onStepChange?.(next);
  };

  const handleStartOver = () => {
    setPreferences({
      preferred_families: [],
      preferred_occasions: [],
      preferred_seasons: [],
    });
    setStep(0);
    onStartOver?.();
  };

  const toggleSelection = (
    key: keyof OnboardingPreferences,
    value: string
  ) => {
    setPreferences((prev) => {
      const current = prev[key];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [key]: updated };
    });
  };

  const handleComplete = () => {
    onComplete(preferences);
  };

  const canProceed = () => {
    if (step === 1) return preferences.preferred_families.length > 0;
    if (step === 2) return preferences.preferred_occasions.length > 0;
    if (step === 3) return preferences.preferred_seasons.length > 0;
    return true;
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-accent to-gold rounded-full flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-playfair font-bold text-foreground mb-2">
                Welcome to ScentGenAI
              </h2>
              <p className="text-muted-foreground">
                Your personal AI fragrance assistant. Let's personalize your
                experience in just a few steps.
              </p>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-playfair font-bold text-foreground mb-1">
                What fragrance families do you love?
              </h2>
              <p className="text-sm text-muted-foreground">
                Select all that appeal to you
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {FRAGRANCE_FAMILIES.map((family) => (
                <button
                  key={family.id}
                  onClick={() =>
                    toggleSelection("preferred_families", family.id)
                  }
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all text-left",
                    preferences.preferred_families.includes(family.id)
                      ? "border-accent bg-accent/10"
                      : "border-border hover:border-accent/50"
                  )}
                >
                  <span className="text-2xl mb-1 block">{family.emoji}</span>
                  <span className="font-medium text-foreground">
                    {family.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-playfair font-bold text-foreground mb-1">
                When do you wear fragrance?
              </h2>
              <p className="text-sm text-muted-foreground">
                Select your typical occasions
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {OCCASIONS.map((occasion) => (
                <button
                  key={occasion.id}
                  onClick={() =>
                    toggleSelection("preferred_occasions", occasion.id)
                  }
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all text-left",
                    preferences.preferred_occasions.includes(occasion.id)
                      ? "border-accent bg-accent/10"
                      : "border-border hover:border-accent/50"
                  )}
                >
                  <span className="text-2xl mb-1 block">{occasion.emoji}</span>
                  <span className="font-medium text-foreground">
                    {occasion.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-playfair font-bold text-foreground mb-1">
                Your favorite seasons for fragrance?
              </h2>
              <p className="text-sm text-muted-foreground">
                Select one or more seasons
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {SEASONS.map((season) => (
                <button
                  key={season.id}
                  onClick={() =>
                    toggleSelection("preferred_seasons", season.id)
                  }
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all text-left",
                    preferences.preferred_seasons.includes(season.id)
                      ? "border-accent bg-accent/10"
                      : "border-border hover:border-accent/50"
                  )}
                >
                  <span className="text-2xl mb-1 block">{season.emoji}</span>
                  <span className="font-medium text-foreground">
                    {season.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-playfair font-bold text-foreground mb-1">
                Discover What ScentGenAI Can Do
              </h2>
              <p className="text-sm text-muted-foreground">
                Powerful features to enhance your fragrance journey
              </p>
            </div>
            <div className="space-y-3">
              {FEATURES.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 rounded-xl bg-muted/50"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent to-gold flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const totalSteps = 5;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-md p-0 gap-0 overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Progress indicator */}
        <div className="flex gap-1 p-4 pb-0">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i <= step ? "bg-accent" : "bg-muted"
              )}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-6 min-h-[400px] flex flex-col">
          <div className="flex-1">{renderStep()}</div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
            <div>
              {step === 0 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSkip}
                  className="text-muted-foreground"
                >
                  Skip for now
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep((s) => s - 1)}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {step + 1} of {totalSteps}
              </Badge>
              {step < totalSteps - 1 ? (
                <Button
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canProceed()}
                  className="bg-accent hover:bg-accent/90"
                >
                  Continue
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  disabled={saving}
                  className="bg-gradient-to-r from-accent to-gold hover:opacity-90"
                >
                  {saving ? (
                    "Saving..."
                  ) : (
                    <>
                      Get Started
                      <Check className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
