import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Star, Clock, Wind, FolderPlus } from "lucide-react";

export interface PerfumeData {
  id: string;
  name: string;
  brand?: { name: string } | string;
  image_url?: string | null;
  notes?: Array<{ name: string; type: 'top' | 'heart' | 'base' }>;
  seasons?: Array<{ name: string }>;
  accords?: Array<{ name: string }>;
  longevity?: string | null;
  sillage?: string | null;
  description?: string | null;
  rating?: number | null;
  year?: number | null;
  concentration?: string | null;
  gender?: string | null;
}

interface PerfumeCardProps {
  perfume: PerfumeData;
  userRating?: number;
  status?: "owned" | "wishlist";
  onAddToCollection?: (perfumeId: string, status: "owned" | "wishlist") => void;
  onAddToCustomCollection?: (perfume: PerfumeData) => void;
  onRate?: (perfumeId: string, rating: number) => void;
  showActions?: boolean;
  onClick?: () => void;
}

const PerfumeCard = ({
  perfume,
  userRating,
  status,
  onAddToCollection,
  onAddToCustomCollection,
  onRate,
  showActions = true,
  onClick,
}: PerfumeCardProps) => {
  return (
    <Card 
      className="overflow-hidden hover:shadow-elegant transition-smooth group animate-scale-in cursor-pointer"
      onClick={onClick}
    >
      <div className="h-56 gradient-card flex items-center justify-center relative overflow-hidden">
        {perfume.image_url ? (
          <img
            src={perfume.image_url}
            alt={perfume.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-smooth"
          />
        ) : (
          <div className="text-7xl group-hover:scale-110 transition-bounce">🌸</div>
        )}
      </div>
      
      <CardHeader className="space-y-3">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl truncate">{perfume.name}</CardTitle>
            <CardDescription className="truncate">
              {typeof perfume.brand === 'string' ? perfume.brand : perfume.brand?.name || 'Unknown'}
              {perfume.year && ` (${perfume.year})`}
            </CardDescription>
          </div>
          {perfume.seasons && perfume.seasons.length > 0 && (
            <Badge variant="secondary" className="capitalize shrink-0 rounded-[12px]">
              {perfume.seasons[0].name}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {perfume.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {perfume.description}
          </p>
        )}

        <div className="space-y-2">
          {perfume.notes && perfume.notes.filter(n => n.type === 'top').length > 0 && (
            <div>
              <span className="text-xs font-semibold text-accent">Top: </span>
              <span className="text-xs text-muted-foreground">
                {perfume.notes.filter(n => n.type === 'top').map(n => n.name).join(", ")}
              </span>
            </div>
          )}
          {perfume.notes && perfume.notes.filter(n => n.type === 'heart').length > 0 && (
            <div>
              <span className="text-xs font-semibold text-primary">Heart: </span>
              <span className="text-xs text-muted-foreground">
                {perfume.notes.filter(n => n.type === 'heart').map(n => n.name).join(", ")}
              </span>
            </div>
          )}
          {perfume.notes && perfume.notes.filter(n => n.type === 'base').length > 0 && (
            <div>
              <span className="text-xs font-semibold text-accent">Base: </span>
              <span className="text-xs text-muted-foreground">
                {perfume.notes.filter(n => n.type === 'base').map(n => n.name).join(", ")}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-4 text-sm">
          {perfume.longevity && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-primary" strokeWidth={1.5} />
              <span className="font-medium">{perfume.longevity}</span>
            </div>
          )}
          {perfume.sillage && (
            <div className="flex items-center gap-1.5">
              <Wind className="h-4 w-4 text-accent" strokeWidth={1.5} />
              <span className="font-medium">{perfume.sillage}</span>
            </div>
          )}
          {perfume.concentration && (
            <Badge variant="outline" className="rounded-[12px]">
              {perfume.concentration}
            </Badge>
          )}
        </div>

        {showActions && (
          <div className="space-y-2 pt-2">
            {!status && (onAddToCollection || onAddToCustomCollection) && (
              <div className="flex gap-2">
                {onAddToCollection && (
                  <>
                    <Button
                      size="sm"
                      variant="hero"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCollection(perfume.id, "owned");
                      }}
                    >
                      <Heart className="h-4 w-4" strokeWidth={1.5} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost-gold"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCollection(perfume.id, "wishlist");
                      }}
                    >
                      <Star className="h-4 w-4" strokeWidth={1.5} />
                      Wishlist
                    </Button>
                  </>
                )}
                {onAddToCustomCollection && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCustomCollection(perfume);
                    }}
                  >
                    <FolderPlus className="h-4 w-4" strokeWidth={1.5} />
                    Collection
                  </Button>
                )}
              </div>
            )}

            {onRate && (
              <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
                <label className="text-xs font-semibold text-muted-foreground">Your Rating</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => onRate(perfume.id, rating)}
                      className={`transition-smooth hover:scale-110 ${
                        userRating && rating <= userRating
                          ? "text-accent"
                          : "text-muted-foreground hover:text-accent/60"
                      }`}
                    >
                      <Star
                        className="h-5 w-5"
                        strokeWidth={1.5}
                        fill={userRating && rating <= userRating ? "currentColor" : "none"}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PerfumeCard;
