import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

interface ScentProfileRevealProps {
  families: string[];
  onComplete: () => void;
}

const FAMILY_LABELS: Record<string, string> = {
  oriental: "Oriental",
  fresh: "Fresh",
  floral: "Floral",
  woody: "Woody",
  citrus: "Citrus",
  spicy: "Spicy",
  aquatic: "Aquatic",
  gourmand: "Gourmand",
};

export const ScentProfileReveal = ({ families, onComplete }: ScentProfileRevealProps) => {
  const top3 = families.slice(0, 3);
  const [revealed, setRevealed] = useState(0);
  const [showFinal, setShowFinal] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Reveal each family with 700ms cadence (300ms fade + 400ms hold)
    top3.forEach((_, i) => {
      timers.push(
        setTimeout(() => setRevealed(i + 1), 400 + i * 700)
      );
    });

    // After all revealed, show "Your profile is ready" for 1500ms then complete
    const finalDelay = 400 + top3.length * 700 + 200;
    timers.push(setTimeout(() => setShowFinal(true), finalDelay));
    timers.push(setTimeout(() => onComplete(), finalDelay + 1500));

    return () => timers.forEach(clearTimeout);
  }, [top3.length, onComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-background via-secondary to-background animate-fade-in">
      <div className="absolute inset-0 bg-gradient-to-tr from-accent/10 via-transparent to-gold/10 pointer-events-none" />

      <div className="relative text-center px-8 max-w-lg">
        {!showFinal ? (
          <>
            <div className="flex items-center justify-center gap-2 mb-8 text-muted-foreground tracking-widest text-xs uppercase">
              <Sparkles className="w-4 h-4 text-gold" />
              Your scent profile
              <Sparkles className="w-4 h-4 text-gold" />
            </div>
            <ul className="space-y-6">
              {top3.map((id, i) => (
                <li
                  key={id}
                  className="transition-all duration-300"
                  style={{
                    opacity: revealed > i ? 1 : 0,
                    transform: revealed > i ? "translateY(0)" : "translateY(8px)",
                  }}
                >
                  <span className="font-playfair text-4xl md:text-5xl bg-gradient-to-r from-accent to-gold bg-clip-text text-transparent">
                    {FAMILY_LABELS[id] ?? id}
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-accent to-gold flex items-center justify-center shadow-elegant">
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="font-playfair text-3xl md:text-4xl text-foreground">
              Your profile is ready
            </h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScentProfileReveal;
