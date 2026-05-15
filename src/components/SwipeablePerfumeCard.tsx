import { useRef, useState, ReactNode } from "react";
import { Check, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface SwipeablePerfumeCardProps {
  children: ReactNode;
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  thresholdPct?: number;
}

const SwipeablePerfumeCard = ({
  children,
  onSwipeRight,
  onSwipeLeft,
  thresholdPct = 0.4,
}: SwipeablePerfumeCardProps) => {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number | null>(null);
  const widthRef = useRef<number>(0);
  const [delta, setDelta] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [exitDir, setExitDir] = useState<"left" | "right" | null>(null);
  const [showCheck, setShowCheck] = useState(false);

  if (!isMobile) return <>{children}</>;

  const onTouchStart = (e: React.TouchEvent) => {
    if (animating || exitDir) return;
    startXRef.current = e.touches[0].clientX;
    widthRef.current = containerRef.current?.offsetWidth ?? 1;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (startXRef.current == null) return;
    const dx = e.touches[0].clientX - startXRef.current;
    setDelta(dx);
  };

  const onTouchEnd = () => {
    if (startXRef.current == null) return;
    const width = widthRef.current || 1;
    const ratio = delta / width;
    startXRef.current = null;

    if (ratio >= thresholdPct) {
      setExitDir("right");
      setAnimating(true);
      setShowCheck(true);
      setTimeout(() => {
        onSwipeRight?.();
      }, 280);
    } else if (ratio <= -thresholdPct) {
      setExitDir("left");
      setAnimating(true);
      setTimeout(() => {
        onSwipeLeft?.();
      }, 280);
    } else {
      setAnimating(true);
      setDelta(0);
      setTimeout(() => setAnimating(false), 250);
    }
  };

  const width = widthRef.current || 1;
  const ratio = Math.max(-1, Math.min(1, delta / width));
  const rightOpacity = Math.max(0, ratio);
  const leftOpacity = Math.max(0, -ratio);

  const translateX = exitDir === "right" ? "120%" : exitDir === "left" ? "-120%" : `${delta}px`;
  const opacity = exitDir ? 0 : 1;

  return (
    <div ref={containerRef} className="relative overflow-hidden rounded-[20px]">
      {/* Right (add) background */}
      <div
        className="absolute inset-0 flex items-center justify-start pl-8 bg-emerald-500 rounded-[20px]"
        style={{ opacity: rightOpacity }}
      >
        <Check className="h-10 w-10 text-white" strokeWidth={2.5} />
      </div>
      {/* Left (dismiss) background */}
      <div
        className="absolute inset-0 flex items-center justify-end pr-8 bg-muted rounded-[20px]"
        style={{ opacity: leftOpacity }}
      >
        <X className="h-10 w-10 text-muted-foreground" strokeWidth={2.5} />
      </div>

      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className={cn("relative", animating && "transition-all duration-300 ease-out")}
        style={{ transform: `translateX(${translateX})`, opacity }}
      >
        {children}
      </div>

      {showCheck && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center animate-fade-in">
          <div className="bg-emerald-500 text-white rounded-full p-4 shadow-lg">
            <Check className="h-8 w-8" strokeWidth={3} />
          </div>
        </div>
      )}
    </div>
  );
};

export default SwipeablePerfumeCard;
