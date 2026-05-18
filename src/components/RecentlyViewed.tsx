import { Clock } from "lucide-react";
import { RecentlyViewedItem } from "@/hooks/useRecentlyViewed";
import { getPerfumeImageUrl } from "@/lib/perfumeImage";
import PerfumeBottleIcon from "@/components/PerfumeBottleIcon";

interface RecentlyViewedProps {
  items: RecentlyViewedItem[];
  onSelect: (id: string) => void;
}

const RecentlyViewed = ({ items, onSelect }: RecentlyViewedProps) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Recently Viewed
        </h2>
      </div>
      <div className="flex gap-3 overflow-x-auto snap-x pb-2 -mx-2 px-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className="flex-shrink-0 w-28 snap-start group text-left"
          >
            <div className="aspect-square rounded-xl overflow-hidden bg-[#F8F6F2] border border-border/30 group-hover:border-primary/40 transition-smooth flex items-center justify-center p-2">
              {(() => {
                const safeUrl = getPerfumeImageUrl(item.image_url);
                return safeUrl ? (
                  <img
                    src={safeUrl}
                    alt={item.name}
                    className="max-w-full max-h-full w-auto h-auto object-contain group-hover:scale-105 transition-smooth"
                  />
                ) : (
                  <PerfumeBottleIcon className="w-16 h-16 text-foreground/30" />
                );
              })()}
            </div>
            <div className="mt-2 space-y-0.5">
              <p className="text-xs font-medium line-clamp-1">{item.name}</p>
              {item.brand && (
                <p className="text-[10px] text-muted-foreground line-clamp-1 uppercase tracking-wide">
                  {item.brand}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RecentlyViewed;
