import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSEO } from "@/hooks/useSEO";
import Layout from "@/components/Layout";
import PerfumeCard, { PerfumeData } from "@/components/PerfumeCard";
import PerfumeDetailModal from "@/components/PerfumeDetailModal";
import CreateCollectionDialog from "@/components/CreateCollectionDialog";
import { AnimatedPage } from "@/components/AnimatedPage";
import { PerfumeCardSkeletonGrid } from "@/components/skeletons/PerfumeCardSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { useCustomCollections, CustomCollection } from "@/hooks/useCustomCollections";
import { useWearLogs } from "@/hooks/useWearLogs";
import { WearTodayButton } from "@/components/WearTodayButton";
import { SortableCollectionGrid } from "@/components/SortableCollectionGrid";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, Share2, ExternalLink, Heart, Star } from "lucide-react";
import { toast as sonnerToast } from "sonner";

const Collections = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    collections,
    loading: collectionsLoading,
    createCollection,
    deleteCollection,
    getCollectionItems,
    removeFromCollection,
  } = useCustomCollections();

  useSEO({ 
    title: 'My Collection', 
    description: 'Browse and organize your favorite perfumes' 
  });

  const [selectedCollection, setSelectedCollection] = useState<CustomCollection | null>(null);
  const [collectionPerfumes, setCollectionPerfumes] = useState<PerfumeData[]>([]);
  const [loadingPerfumes, setLoadingPerfumes] = useState(false);
  const [selectedPerfume, setSelectedPerfume] = useState<PerfumeData | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CustomCollection | null>(null);

  // Legacy collection data (owned/wishlist from user_collections)
  const [legacyOwned, setLegacyOwned] = useState<PerfumeData[]>([]);
  const [legacyWishlist, setLegacyWishlist] = useState<PerfumeData[]>([]);
  const [loadingLegacy, setLoadingLegacy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"owned" | "wishlist" | "custom">("owned");

  const fetchLegacy = async () => {
    if (!user) return;
    setLoadingLegacy(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from("user_collections")
        .select("perfume_id, status")
        .order("added_at", { ascending: false });

      if (fetchErr) throw fetchErr;

      const perfumeIds = data?.map(d => d.perfume_id) || [];
      if (perfumeIds.length === 0) {
        setLegacyOwned([]);
        setLegacyWishlist([]);
        setLoadingLegacy(false);
        return;
      }

      const { data: perfumesData } = await supabase
        .from("perfumes")
        .select(`
          id, name, image_url, longevity, sillage, description, year, concentration,
          brand:brands!brand_id(name),
          notes:perfume_notes(note:notes(name, type)),
          seasons:perfume_seasons(season:seasons(name)),
          accords:perfume_accords(accord:accords(name))
        `)
        .in("id", perfumeIds);

      const enriched = (perfumesData || []).map(p => ({
        ...p,
        brand: Array.isArray(p.brand) ? p.brand[0] : p.brand,
        notes: p.notes?.map((n: any) => Array.isArray(n.note) ? n.note[0] : n.note).filter(Boolean) || [],
        seasons: p.seasons?.map((s: any) => Array.isArray(s.season) ? s.season[0] : s.season).filter(Boolean) || [],
        accords: p.accords?.map((a: any) => Array.isArray(a.accord) ? a.accord[0] : a.accord).filter(Boolean) || [],
      }));

      const ownedIds = new Set(data?.filter(d => d.status === "owned").map(d => d.perfume_id));
      const wishlistIds = new Set(data?.filter(d => d.status === "wishlist").map(d => d.perfume_id));

      setLegacyOwned(enriched.filter(p => ownedIds.has(p.id)));
      setLegacyWishlist(enriched.filter(p => wishlistIds.has(p.id)));
    } catch (err) {
      console.error("Error fetching legacy collections:", err);
      setError('Failed to load your collection. Please try again.');
    } finally {
      setLoadingLegacy(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Fetch legacy collections (owned/wishlist)
  useEffect(() => {
    if (user) fetchLegacy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Fetch custom collection perfumes
  useEffect(() => {
    if (!selectedCollection) {
      setCollectionPerfumes([]);
      return;
    }

    const fetchPerfumes = async () => {
      setLoadingPerfumes(true);
      try {
        const items = await getCollectionItems(selectedCollection.id);
        const perfumeIds = items.map(i => i.perfume_id);

        if (perfumeIds.length === 0) {
          setCollectionPerfumes([]);
          setLoadingPerfumes(false);
          return;
        }

        const { data: perfumesData } = await supabase
          .from("perfumes")
          .select(`
            id, name, image_url, longevity, sillage, description, year, concentration,
            brand:brands!brand_id(name),
            notes:perfume_notes(note:notes(name, type)),
            seasons:perfume_seasons(season:seasons(name)),
            accords:perfume_accords(accord:accords(name))
          `)
          .in("id", perfumeIds);

        const enriched = (perfumesData || []).map(p => ({
          ...p,
          brand: Array.isArray(p.brand) ? p.brand[0] : p.brand,
          notes: p.notes?.map((n: any) => Array.isArray(n.note) ? n.note[0] : n.note).filter(Boolean) || [],
          seasons: p.seasons?.map((s: any) => Array.isArray(s.season) ? s.season[0] : s.season).filter(Boolean) || [],
          accords: p.accords?.map((a: any) => Array.isArray(a.accord) ? a.accord[0] : a.accord).filter(Boolean) || [],
        }));

        setCollectionPerfumes(enriched);
      } catch (error) {
        console.error("Error fetching collection perfumes:", error);
      } finally {
        setLoadingPerfumes(false);
      }
    };

    fetchPerfumes();
  }, [selectedCollection]);

  const handleRemoveFromCollection = async (perfumeId: string) => {
    if (!selectedCollection) return;
    await removeFromCollection(selectedCollection.id, perfumeId);
    setCollectionPerfumes(prev => prev.filter(p => p.id !== perfumeId));
  };

  const handleDeleteCollection = async () => {
    if (!deleteTarget) return;
    await deleteCollection(deleteTarget.id);
    if (selectedCollection?.id === deleteTarget.id) {
      setSelectedCollection(null);
      setActiveView("owned");
    }
    setDeleteTarget(null);
  };

  const handleShareProfile = () => {
    const profileUrl = `${window.location.origin}/user/${user?.id}`;
    navigator.clipboard.writeText(profileUrl);
    sonnerToast.success("Profile link copied to clipboard!");
  };

  if (authLoading || collectionsLoading || loadingLegacy) {
    return (
      <Layout>
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-64 shrink-0 space-y-4">
            <div className="h-8 w-32 rounded-lg skeleton-shimmer" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 w-full rounded-xl skeleton-shimmer" />
            ))}
          </div>
          <div className="flex-1">
            <PerfumeCardSkeletonGrid count={6} />
          </div>
        </div>
      </Layout>
    );
  }

  const currentPerfumes = activeView === "owned" 
    ? legacyOwned 
    : activeView === "wishlist" 
    ? legacyWishlist 
    : collectionPerfumes;

  const currentTitle = activeView === "owned"
    ? "My Favorites"
    : activeView === "wishlist"
    ? "Wishlist"
    : selectedCollection?.name || "Collection";

  const emptyVariant = activeView === "owned" ? "collection" : activeView === "wishlist" ? "wishlist" : "collection";

  return (
    <Layout>
      <AnimatedPage className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="lg:w-64 shrink-0">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-playfair">Collections</h2>
            <Button variant="ghost" size="icon" onClick={() => setShowCreateDialog(true)} className="touch-target">
              <Plus className="h-5 w-5" />
            </Button>
          </div>

          <ScrollArea className="lg:h-[calc(100vh-240px)]">
            <div className="space-y-2 pr-2">
              {/* Default Collections */}
              <button
                onClick={() => {
                  setActiveView("owned");
                  setSelectedCollection(null);
                }}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-smooth text-left touch-target ${
                  activeView === "owned" ? "glass border-primary/30" : "hover:bg-secondary/50"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  activeView === "owned" ? "gradient-primary shadow-elegant" : "bg-primary/10"
                }`}>
                  <Heart className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">My Favorites</p>
                  <p className="text-xs text-muted-foreground">{legacyOwned.length} perfumes</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveView("wishlist");
                  setSelectedCollection(null);
                }}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-smooth text-left touch-target ${
                  activeView === "wishlist" ? "glass border-accent/30" : "hover:bg-secondary/50"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  activeView === "wishlist" ? "bg-accent shadow-gold" : "bg-accent/10"
                }`}>
                  <Star className="h-5 w-5 text-accent-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">Wishlist</p>
                  <p className="text-xs text-muted-foreground">{legacyWishlist.length} perfumes</p>
                </div>
              </button>

              {collections.length > 0 && (
                <div className="border-t border-border/50 my-4 pt-4">
                  <p className="text-xs text-muted-foreground mb-3 px-1 uppercase tracking-wide">Custom Collections</p>
                </div>
              )}

              {/* Custom Collections */}
              {collections.map((collection) => (
                <div
                  key={collection.id}
                  className={`group flex items-center gap-3 p-4 rounded-2xl transition-smooth ${
                    activeView === "custom" && selectedCollection?.id === collection.id
                      ? "glass border-border"
                      : "hover:bg-secondary/50"
                  }`}
                >
                  <button
                    onClick={() => {
                      setActiveView("custom");
                      setSelectedCollection(collection);
                    }}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left touch-target"
                  >
                    <span className="text-2xl">{collection.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{collection.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {collection.item_count || 0} perfumes
                      </p>
                    </div>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(collection);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-playfair">{currentTitle}</h1>
              <p className="text-muted-foreground mt-1">
                {currentPerfumes.length} {currentPerfumes.length === 1 ? "perfume" : "perfumes"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost-gold" onClick={handleShareProfile} size="sm" className="touch-target">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="premium" onClick={() => navigate(`/user/${user?.id}`)} size="sm" className="touch-target">
                <ExternalLink className="h-4 w-4 mr-2" />
                Public View
              </Button>
            </div>
          </div>

          {loadingPerfumes ? (
            <PerfumeCardSkeletonGrid count={6} />
          ) : error && activeView !== "custom" ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center space-y-4">
              <p className="text-destructive font-medium">{error}</p>
              <Button variant="outline" onClick={() => fetchLegacy()}>
                Retry
              </Button>
            </div>
          ) : currentPerfumes.length === 0 ? (
            <EmptyState
              variant={emptyVariant}
              actionLabel="Explore Perfumes"
              onAction={() => navigate("/search")}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
              {currentPerfumes.map((perfume, index) => (
                <div
                  key={perfume.id}
                  className="animate-fade-in opacity-0"
                  style={{ 
                    animationDelay: `${Math.min(index * 50, 300)}ms`,
                    animationFillMode: "forwards"
                  }}
                >
                  <PerfumeCard
                    perfume={perfume}
                    status={activeView === "owned" ? "owned" : activeView === "wishlist" ? "wishlist" : undefined}
                    showActions={false}
                    onClick={() => setSelectedPerfume(perfume)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </AnimatedPage>

      <PerfumeDetailModal
        perfume={selectedPerfume}
        isOpen={!!selectedPerfume}
        onClose={() => setSelectedPerfume(null)}
        userStatus={activeView === "owned" ? "owned" : activeView === "wishlist" ? "wishlist" : undefined}
      />

      <CreateCollectionDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSubmit={createCollection}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Collection?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteTarget?.name}" and remove all perfumes from it.
              The perfumes themselves won't be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCollection} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Collections;
