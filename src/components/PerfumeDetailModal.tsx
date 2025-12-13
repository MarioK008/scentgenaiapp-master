import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Heart, Star, Clock, Wind, Droplets, Calendar, X } from "lucide-react";

interface PerfumeNote {
  name: string;
  type: 'top' | 'heart' | 'base';
}

interface PerfumeSeason {
  name: string;
}

interface PerfumeAccord {
  name: string;
}

interface Perfume {
  id: string;
  name: string;
  brand?: { name: string } | string;
  image_url?: string | null;
  notes?: PerfumeNote[];
  seasons?: PerfumeSeason[];
  accords?: PerfumeAccord[];
  longevity?: string | null;
  sillage?: string | null;
  description?: string | null;
  rating?: number | null;
  year?: number | null;
  concentration?: string | null;
  gender?: string | null;
}

interface PerfumeDetailModalProps {
  perfume: Perfume | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCollection?: (perfumeId: string, status: "owned" | "wishlist") => void;
  userStatus?: "owned" | "wishlist";
}

const PerfumeDetailModal = ({
  perfume,
  isOpen,
  onClose,
  onAddToCollection,
  userStatus,
}: PerfumeDetailModalProps) => {
  if (!perfume) return null;

  const brandName = typeof perfume.brand === 'string' ? perfume.brand : perfume.brand?.name || 'Unknown Brand';
  const topNotes = perfume.notes?.filter(n => n.type === 'top') || [];
  const heartNotes = perfume.notes?.filter(n => n.type === 'heart') || [];
  const baseNotes = perfume.notes?.filter(n => n.type === 'base') || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden bg-card border-border">
        <ScrollArea className="max-h-[90vh]">
          <div className="relative">
            {/* Hero Image */}
            <div className="h-64 gradient-card flex items-center justify-center relative">
              {perfume.image_url ? (
                <img
                  src={perfume.image_url}
                  alt={perfume.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-9xl animate-pulse-glow">🌸</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
            </div>

            {/* Content */}
            <div className="p-6 -mt-16 relative z-10">
              <DialogHeader className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <DialogTitle className="text-2xl font-display">
                      {perfume.name}
                    </DialogTitle>
                    <p className="text-muted-foreground text-lg">{brandName}</p>
                  </div>
                  {perfume.rating && (
                    <div className="flex items-center gap-1 bg-accent/20 px-3 py-1 rounded-full">
                      <Star className="h-4 w-4 text-accent fill-accent" />
                      <span className="font-semibold text-accent">{perfume.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </DialogHeader>

              {/* Meta Info */}
              <div className="flex flex-wrap gap-2 mt-4">
                {perfume.year && (
                  <Badge variant="outline" className="rounded-full gap-1">
                    <Calendar className="h-3 w-3" />
                    {perfume.year}
                  </Badge>
                )}
                {perfume.concentration && (
                  <Badge variant="outline" className="rounded-full gap-1">
                    <Droplets className="h-3 w-3" />
                    {perfume.concentration}
                  </Badge>
                )}
                {perfume.gender && (
                  <Badge variant="secondary" className="rounded-full capitalize">
                    {perfume.gender}
                  </Badge>
                )}
                {perfume.seasons?.map((season, i) => (
                  <Badge key={i} variant="secondary" className="rounded-full capitalize">
                    {season.name}
                  </Badge>
                ))}
              </div>

              {/* Description */}
              {perfume.description && (
                <div className="mt-6">
                  <p className="text-muted-foreground leading-relaxed">
                    {perfume.description}
                  </p>
                </div>
              )}

              <Separator className="my-6" />

              {/* Performance */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {perfume.longevity && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                    <Clock className="h-5 w-5 text-primary" strokeWidth={1.5} />
                    <div>
                      <p className="text-xs text-muted-foreground">Longevity</p>
                      <p className="font-semibold capitalize">{perfume.longevity}</p>
                    </div>
                  </div>
                )}
                {perfume.sillage && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                    <Wind className="h-5 w-5 text-accent" strokeWidth={1.5} />
                    <div>
                      <p className="text-xs text-muted-foreground">Sillage</p>
                      <p className="font-semibold capitalize">{perfume.sillage}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes Pyramid */}
              {(topNotes.length > 0 || heartNotes.length > 0 || baseNotes.length > 0) && (
                <div className="space-y-4 mb-6">
                  <h3 className="font-display text-lg">Fragrance Notes</h3>
                  <div className="space-y-3">
                    {topNotes.length > 0 && (
                      <div className="p-3 rounded-xl bg-accent/10 border border-accent/20">
                        <p className="text-xs font-semibold text-accent mb-2">Top Notes</p>
                        <div className="flex flex-wrap gap-2">
                          {topNotes.map((note, i) => (
                            <Badge key={i} variant="outline" className="rounded-full border-accent/30 text-accent">
                              {note.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {heartNotes.length > 0 && (
                      <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                        <p className="text-xs font-semibold text-primary mb-2">Heart Notes</p>
                        <div className="flex flex-wrap gap-2">
                          {heartNotes.map((note, i) => (
                            <Badge key={i} variant="outline" className="rounded-full border-primary/30 text-primary">
                              {note.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {baseNotes.length > 0 && (
                      <div className="p-3 rounded-xl bg-muted border border-muted-foreground/20">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Base Notes</p>
                        <div className="flex flex-wrap gap-2">
                          {baseNotes.map((note, i) => (
                            <Badge key={i} variant="outline" className="rounded-full">
                              {note.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Accords */}
              {perfume.accords && perfume.accords.length > 0 && (
                <div className="space-y-3 mb-6">
                  <h3 className="font-display text-lg">Accords</h3>
                  <div className="flex flex-wrap gap-2">
                    {perfume.accords.map((accord, i) => (
                      <Badge key={i} className="rounded-full bg-gradient-accent text-foreground">
                        {accord.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {!userStatus && onAddToCollection && (
                <div className="flex gap-3 mt-6">
                  <Button
                    variant="hero"
                    className="flex-1"
                    onClick={() => {
                      onAddToCollection(perfume.id, "owned");
                      onClose();
                    }}
                  >
                    <Heart className="h-4 w-4 mr-2" strokeWidth={1.5} />
                    Add to Collection
                  </Button>
                  <Button
                    variant="ghost-gold"
                    className="flex-1"
                    onClick={() => {
                      onAddToCollection(perfume.id, "wishlist");
                      onClose();
                    }}
                  >
                    <Star className="h-4 w-4 mr-2" strokeWidth={1.5} />
                    Add to Wishlist
                  </Button>
                </div>
              )}

              {userStatus && (
                <div className="flex items-center justify-center gap-2 mt-6 p-3 rounded-xl bg-primary/10 border border-primary/20">
                  {userStatus === "owned" ? (
                    <>
                      <Heart className="h-4 w-4 text-primary fill-primary" />
                      <span className="text-primary font-medium">In your collection</span>
                    </>
                  ) : (
                    <>
                      <Star className="h-4 w-4 text-accent fill-accent" />
                      <span className="text-accent font-medium">On your wishlist</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default PerfumeDetailModal;
