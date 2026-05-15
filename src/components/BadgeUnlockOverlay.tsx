import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface UnlockedBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const COLORS = ["#FF2E92", "#F7B731", "#FFFFFF", "#B0C4DE", "#FF6BB3"];

const Confetti = () => {
  const pieces = Array.from({ length: 60 });
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {pieces.map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.6;
        const duration = 1.4 + Math.random() * 0.8;
        const size = 6 + Math.random() * 8;
        const rotate = Math.random() * 360;
        const color = COLORS[i % COLORS.length];
        return (
          <span
            key={i}
            className="absolute top-[-20px] block animate-confetti-fall"
            style={{
              left: `${left}%`,
              width: `${size}px`,
              height: `${size * 0.4}px`,
              backgroundColor: color,
              transform: `rotate(${rotate}deg)`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              borderRadius: "2px",
            }}
          />
        );
      })}
    </div>
  );
};

export const BadgeUnlockOverlay = () => {
  const [badge, setBadge] = useState<UnlockedBadge | null>(null);
  const [queue, setQueue] = useState<UnlockedBadge[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<UnlockedBadge>).detail;
      if (!detail) return;
      setQueue((q) => [...q, detail]);
    };
    window.addEventListener("badge:unlocked", handler);
    return () => window.removeEventListener("badge:unlocked", handler);
  }, []);

  // Pump queue
  useEffect(() => {
    if (!badge && queue.length > 0) {
      setBadge(queue[0]);
      setQueue((q) => q.slice(1));
    }
  }, [badge, queue]);

  // Auto-dismiss
  useEffect(() => {
    if (!badge) return;
    const t = setTimeout(() => setBadge(null), 3000);
    return () => clearTimeout(t);
  }, [badge]);

  if (!badge) return null;

  return createPortal(
    <div
      role="dialog"
      aria-label={`Badge unlocked: ${badge.name}`}
      onClick={() => setBadge(null)}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in cursor-pointer"
    >
      <Confetti />
      <div className="relative flex flex-col items-center gap-6 text-center px-8 max-w-md">
        <div className="text-xs uppercase tracking-[0.3em] text-accent font-semibold">
          Badge unlocked
        </div>
        <div
          className="w-32 h-32 rounded-full gradient-primary flex items-center justify-center text-6xl shadow-glow animate-badge-pop"
          style={{ animationDelay: "0.05s" }}
        >
          <span>{badge.icon}</span>
        </div>
        <div className="space-y-2 animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <h2 className="text-3xl font-playfair gradient-text">{badge.name}</h2>
          <p className="text-base text-muted-foreground">{badge.description}</p>
        </div>
        <p className="text-xs text-muted-foreground/70 mt-2">Tap anywhere to continue</p>
      </div>
    </div>,
    document.body
  );
};

export default BadgeUnlockOverlay;
