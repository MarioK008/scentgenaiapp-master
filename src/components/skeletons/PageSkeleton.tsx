import { cn } from "@/lib/utils";

interface PageSkeletonProps {
  className?: string;
  variant?: "default" | "branded" | "minimal";
}

export const PageSkeleton = ({ className, variant = "default" }: PageSkeletonProps) => {
  if (variant === "branded") {
    return (
      <div className={cn("min-h-[60vh] flex flex-col items-center justify-center", className)}>
        {/* Animated perfume bottle loader */}
        <div className="relative mb-8">
          <div className="w-20 h-28 rounded-[12px] border-2 border-primary/30 relative overflow-hidden">
            {/* Liquid animation */}
            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-primary/40 to-primary/20 animate-liquid-fill" />
            {/* Bottle neck */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-4 rounded-t-lg border-2 border-primary/30 bg-background" />
          </div>
          {/* Glow effect */}
          <div className="absolute inset-0 animate-glow-pulse rounded-[12px]" />
        </div>
        
        {/* Brand text with shimmer */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-playfair text-primary animate-pulse">ScentGenAI</h2>
          <p className="text-sm text-muted-foreground">Loading your experience...</p>
        </div>
      </div>
    );
  }

  if (variant === "minimal") {
    return (
      <div className={cn("min-h-[40vh] flex items-center justify-center", className)}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Default skeleton with content placeholders
  return (
    <div className={cn("space-y-8 animate-fade-in", className)}>
      {/* Header */}
      <div className="space-y-2">
        <div className="h-10 w-48 rounded-lg skeleton-shimmer" />
        <div className="h-5 w-72 rounded-lg skeleton-shimmer" />
      </div>

      {/* Content area */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[20px] border border-border/50 bg-card p-6 space-y-4"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="h-40 rounded-lg skeleton-shimmer" />
            <div className="h-5 w-3/4 rounded-lg skeleton-shimmer" />
            <div className="h-4 w-1/2 rounded-lg skeleton-shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PageSkeleton;
