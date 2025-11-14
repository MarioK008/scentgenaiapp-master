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
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="h-48 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
        {perfume.image_url ? (
          <img
            src={perfume.image_url}
            alt={perfume.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-6xl">🌸</div>
        )}
      </div>
      
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{perfume.name}</CardTitle>
            <CardDescription>{perfume.brand}</CardDescription>
          </div>
          {perfume.season && (
            <Badge variant="secondary" className="capitalize">
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
              <span className="text-xs font-semibold text-muted-foreground">Top: </span>
              <span className="text-xs">{perfume.top_notes.join(", ")}</span>
            </div>
          )}
          {perfume.heart_notes && perfume.heart_notes.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-muted-foreground">Heart: </span>
              <span className="text-xs">{perfume.heart_notes.join(", ")}</span>
            </div>
          )}
          {perfume.base_notes && perfume.base_notes.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-muted-foreground">Base: </span>
              <span className="text-xs">{perfume.base_notes.join(", ")}</span>
            </div>
          )}
        </div>

        <div className="flex gap-4 text-sm">
          {perfume.longevity && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{perfume.longevity}/10</span>
            </div>
          )}
          {perfume.sillage && (
            <div className="flex items-center gap-1">
              <Wind className="h-4 w-4 text-muted-foreground" />
              <span>{perfume.sillage}/10</span>
            </div>
          )}
        </div>

        {showActions && (
          <div className="space-y-2 pt-2">
            {!status && onAddToCollection && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => onAddToCollection(perfume.id, "owned")}
                >
                  <Heart className="h-4 w-4 mr-1" />
                  Own
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => onAddToCollection(perfume.id, "wishlist")}
                >
                  Wishlist
                </Button>
              </div>
            )}

            {status && onRate && (
              <div className="flex gap-1 justify-center">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => onRate(perfume.id, rating)}
                    className="hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`h-5 w-5 ${
                        userRating && rating <= userRating
                          ? "fill-accent text-accent"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PerfumeCard;
