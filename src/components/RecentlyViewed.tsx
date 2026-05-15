import { Clock } from "lucide-react";
import { RecentlyViewedItem } from "@/hooks/useRecentlyViewed";

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
            <div className="aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-card to-secondary/50 border border-border/30 group-hover:border-primary/40 transition-smooth">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-smooth"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl opacity-50">
                  🌸
                </div>
              )}
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
