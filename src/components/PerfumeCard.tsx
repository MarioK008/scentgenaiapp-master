import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Star, Clock, Wind } from "lucide-react";

interface PerfumeCardProps {
  perfume: {
    id: string;
    name: string;
    brand: string;
    image_url?: string;
    top_notes?: string[];
    heart_notes?: string[];
    base_notes?: string[];
    season?: string;
    longevity?: number;
    sillage?: number;
    description?: string;
  };
  userRating?: number;
  status?: "owned" | "wishlist";
  onAddToCollection?: (perfumeId: string, status: "owned" | "wishlist") => void;
  onRate?: (perfumeId: string, rating: number) => void;
  showActions?: boolean;
}

const PerfumeCard = ({
  perfume,
  userRating,
  status,
  onAddToCollection,
  onRate,
  showActions = true,
}: PerfumeCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-elegant transition-smooth group animate-scale-in">
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
            <CardDescription className="truncate">{perfume.brand}</CardDescription>
          </div>
          {perfume.season && (
            <Badge variant="secondary" className="capitalize shrink-0 rounded-[12px]">
              {perfume.season.replace("_", " ")}
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
          {perfume.top_notes && perfume.top_notes.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-accent">Top: </span>
              <span className="text-xs text-muted-foreground">{perfume.top_notes.join(", ")}</span>
            </div>
          )}
          {perfume.heart_notes && perfume.heart_notes.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-primary">Heart: </span>
              <span className="text-xs text-muted-foreground">{perfume.heart_notes.join(", ")}</span>
            </div>
          )}
          {perfume.base_notes && perfume.base_notes.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-accent">Base: </span>
              <span className="text-xs text-muted-foreground">{perfume.base_notes.join(", ")}</span>
            </div>
          )}
        </div>

        <div className="flex gap-4 text-sm">
          {perfume.longevity && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-primary" strokeWidth={1.5} />
              <span className="font-medium">{perfume.longevity}/10</span>
            </div>
          )}
          {perfume.sillage && (
            <div className="flex items-center gap-1.5">
              <Wind className="h-4 w-4 text-accent" strokeWidth={1.5} />
              <span className="font-medium">{perfume.sillage}/10</span>
            </div>
          )}
        </div>

        {showActions && (
          <div className="space-y-2 pt-2">
            {!status && onAddToCollection && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="hero"
                  className="flex-1"
                  onClick={() => onAddToCollection(perfume.id, "owned")}
                >
                  <Heart className="h-4 w-4" strokeWidth={1.5} />
                  Add
                </Button>
                <Button
                  size="sm"
                  variant="ghost-gold"
                  className="flex-1"
                  onClick={() => onAddToCollection(perfume.id, "wishlist")}
                >
                  <Star className="h-4 w-4" strokeWidth={1.5} />
                  Wishlist
                </Button>
              </div>
            )}

            {onRate && (
              <div className="space-y-1.5">
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
