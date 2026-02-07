import { cn } from "@/lib/utils";

interface DashboardSkeletonProps {
  className?: string;
}

export const StatCardSkeleton = () => (
  <div className="text-center p-6 rounded-[20px] bg-card/50 backdrop-blur-sm border border-border/30">
    <div className="h-10 w-16 mx-auto rounded-lg skeleton-shimmer mb-2" />
    <div className="h-4 w-20 mx-auto rounded-full skeleton-shimmer" />
  </div>
);

export const FeatureCardSkeleton = () => (
  <div className="rounded-[20px] border border-border/50 bg-card p-6 space-y-4">
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-full skeleton-shimmer" />
      <div className="h-6 w-32 rounded-lg skeleton-shimmer" />
    </div>
    <div className="h-4 w-full rounded-lg skeleton-shimmer" />
    <div className="h-10 w-full rounded-[28px] skeleton-shimmer" />
  </div>
);

export const DashboardSkeleton = ({ className }: DashboardSkeletonProps) => {
  return (
    <div className={cn("space-y-8 animate-fade-in", className)}>
      {/* Welcome section skeleton */}
      <div className="space-y-2">
        <div className="h-10 w-64 rounded-lg skeleton-shimmer" />
        <div className="h-5 w-48 rounded-lg skeleton-shimmer" />
      </div>

      {/* Feature cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <FeatureCardSkeleton key={i} />
        ))}
      </div>

      {/* Stats section */}
      <div className="rounded-[20px] border border-border/50 bg-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-6 w-6 rounded-full skeleton-shimmer" />
          <div className="h-6 w-32 rounded-lg skeleton-shimmer" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
