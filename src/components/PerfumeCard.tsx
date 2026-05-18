import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Heart, Star, Clock, Wind, FolderPlus, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPerfumeImageUrl } from "@/lib/perfumeImage";
import PerfumeBottleIcon from "@/components/PerfumeBottleIcon";

export interface CollectionOption {
  id: string;
  label: string;
  icon?: string;
}

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
  className?: string;
  reason?: string;
  // Inline-dropdown variant: when provided, replaces the legacy 3-button action row
  collectionOptions?: CollectionOption[];
  memberOfIds?: Set<string>;
  onSelectCollectionOption?: (optionId: string) => void | Promise<void>;
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
  className,
  reason,
  collectionOptions,
  memberOfIds,
  onSelectCollectionOption,
}: PerfumeCardProps) => {
  const brandName = typeof perfume.brand === 'string' ? perfume.brand : perfume.brand?.name || 'Unknown';
  const topNotes = perfume.notes?.filter(n => n.type === 'top') || [];
  const heartNotes = perfume.notes?.filter(n => n.type === 'heart') || [];
  const baseNotes = perfume.notes?.filter(n => n.type === 'base') || [];

  return (
    <Card 
      className={cn(
        "overflow-hidden group cursor-pointer card-hover-lift border-border/30",
        "hover:border-primary/30",
        className
      )}
      onClick={onClick}
    >
      {/* Magazine-style image with overlay */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[#F8F6F2]">
        {(() => {
          const safeUrl = getPerfumeImageUrl(perfume.image_url);
          return safeUrl ? (
            <img
              src={safeUrl}
              alt={perfume.name}
              className="absolute inset-0 m-auto max-w-[200px] max-h-[200px] w-auto h-auto object-contain p-4 image-zoom"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-6">
              <PerfumeBottleIcon className="w-[140px] h-[140px] text-foreground/30 group-hover:scale-105 transition-bounce" />
            </div>
          );
        })()}
        
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-background/95 via-background/40 to-transparent pointer-events-none" />
        
        {/* Brand badge positioned elegantly */}
        <div className="absolute top-4 left-4">
          <span className="text-xs font-medium tracking-widest uppercase text-foreground/80 bg-background/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
            {brandName}
          </span>
        </div>

        {/* Season badge hidden until MVP v2 — seasons data not reliable */}

        {/* Title overlay at bottom of image */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h3 className="font-playfair text-2xl font-semibold text-foreground leading-tight mb-1">
            {perfume.name}
          </h3>
          {perfume.year && (
            <span className="text-sm text-muted-foreground">{perfume.year}</span>
          )}
        </div>

        {/* Quick view overlay on hover */}
        {onClick && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            aria-label={`View details for ${perfume.name}`}
            className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-smooth flex items-center justify-center cursor-pointer"
          >
            <span className="text-sm font-medium text-foreground bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 delay-100">
              View Details
            </span>
          </button>
        )}
      </div>

      <CardContent className="p-5 space-y-4">
        {/* Description */}
        {/* Description (hide placeholder text from seed data) */}
        {perfume.description &&
          perfume.description.trim() !== "A luxurious fragrance with carefully crafted notes for a memorable experience." && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {perfume.description}
            </p>
          )}

        {reason && (
          <p className="text-xs italic text-muted-foreground line-clamp-1">
            ✨ {reason}
          </p>
        )}

        {/* Notes pyramid - elegant pills */}
        <div className="space-y-2">
          {topNotes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-accent w-12">Top</span>
              {topNotes.slice(0, 3).map((note, i) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-accent/10 text-accent-foreground border border-accent/20">
                  {note.name}
                </span>
              ))}
            </div>
          )}
          {heartNotes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary w-12">Heart</span>
              {heartNotes.slice(0, 3).map((note, i) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {note.name}
                </span>
              ))}
            </div>
          )}
          {baseNotes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-12">Base</span>
              {baseNotes.slice(0, 3).map((note, i) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-muted/50 text-muted-foreground border border-border/50">
                  {note.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Performance stats */}
        <div className="flex items-center gap-4 pt-2 border-t border-border/30">
          {perfume.longevity && (
            <div className="flex items-center gap-1.5 text-sm">
              <Clock className="h-4 w-4 text-primary" strokeWidth={1.5} />
              <span className="font-medium">{perfume.longevity}</span>
            </div>
          )}
          {perfume.sillage && (
            <div className="flex items-center gap-1.5 text-sm">
              <Wind className="h-4 w-4 text-accent" strokeWidth={1.5} />
              <span className="font-medium">{perfume.sillage}</span>
            </div>
          )}
          {perfume.concentration && (
            <Badge variant="outline" className="rounded-full text-xs ml-auto">
              {perfume.concentration}
            </Badge>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="space-y-3 pt-2">
            {collectionOptions && collectionOptions.length > 0 && onSelectCollectionOption ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="hero"
                    className="w-full touch-target"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FolderPlus className="h-4 w-4 mr-2" strokeWidth={1.5} />
                    Add to Collection
                    <ChevronDown className="h-4 w-4 ml-2 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56"
                  onClick={(e) => e.stopPropagation()}
                >
                  {collectionOptions.map((opt) => {
                    const added = memberOfIds?.has(opt.id);
                    return (
                      <DropdownMenuItem
                        key={opt.id}
                        disabled={added}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!added) onSelectCollectionOption(opt.id);
                        }}
                        className="cursor-pointer"
                      >
                        {opt.icon && <span className="mr-2">{opt.icon}</span>}
                        <span className="flex-1 truncate">{opt.label}</span>
                        {added && <Check className="h-4 w-4 ml-2 text-primary" />}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : !status && (onAddToCollection || onAddToCustomCollection) ? (
              <div className="flex gap-2">
                {onAddToCollection && (
                  <>
                    <Button
                      size="sm"
                      variant="hero"
                      className="touch-target"
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
                      className="flex-1 touch-target"
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
                    className="flex-1 touch-target"
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
            ) : null}

            {onRate && (
              <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Your Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => onRate(perfume.id, rating)}
                      className={cn(
                        "transition-all duration-200 hover:scale-125 touch-target flex items-center justify-center",
                        userRating && rating <= userRating
                          ? "text-accent"
                          : "text-muted-foreground/40 hover:text-accent/60"
                      )}
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
