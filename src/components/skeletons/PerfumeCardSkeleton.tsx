import { cn } from "@/lib/utils";
import { CSSProperties } from "react";

interface PerfumeCardSkeletonProps {
  className?: string;
  style?: CSSProperties;
}

export const PerfumeCardSkeleton = ({ className, style }: PerfumeCardSkeletonProps) => {
  return (
    <div
      className={cn(
        "rounded-[20px] border border-border/50 bg-card overflow-hidden",
        className
      )}
      style={style}
    >
      {/* Image placeholder */}
      <div className="aspect-[3/4] skeleton-shimmer" />
      
      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Brand */}
        <div className="h-3 w-20 rounded-full skeleton-shimmer" />
        
        {/* Title */}
        <div className="space-y-2">
          <div className="h-6 w-3/4 rounded-lg skeleton-shimmer" />
          <div className="h-4 w-1/2 rounded-lg skeleton-shimmer" />
        </div>
        
        {/* Notes section */}
        <div className="space-y-2 pt-2">
          <div className="flex gap-2">
            <div className="h-6 w-16 rounded-full skeleton-shimmer" />
            <div className="h-6 w-20 rounded-full skeleton-shimmer" />
            <div className="h-6 w-14 rounded-full skeleton-shimmer" />
          </div>
        </div>
        
        {/* Stats */}
        <div className="flex gap-4 pt-2">
          <div className="h-5 w-16 rounded-lg skeleton-shimmer" />
          <div className="h-5 w-16 rounded-lg skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
};

export const PerfumeCardSkeletonGrid = ({ count = 6 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <PerfumeCardSkeleton 
          key={i} 
          className="animate-fade-in"
          style={{ animationDelay: `${i * 100}ms` } as React.CSSProperties}
        />
      ))}
    </div>
  );
};

export default PerfumeCardSkeleton;
