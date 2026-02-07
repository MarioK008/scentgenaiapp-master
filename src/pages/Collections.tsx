import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSEO } from "@/hooks/useSEO";
import Layout from "@/components/Layout";
import PerfumeCard, { PerfumeData } from "@/components/PerfumeCard";
import PerfumeDetailModal from "@/components/PerfumeDetailModal";
import CreateCollectionDialog from "@/components/CreateCollectionDialog";
import { useCustomCollections, CustomCollection } from "@/hooks/useCustomCollections";
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
import { Plus, Trash2, Share2, ExternalLink, FolderOpen, Heart, Star } from "lucide-react";
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
  const [activeView, setActiveView] = useState<"owned" | "wishlist" | "custom">("owned");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Fetch legacy collections (owned/wishlist)
  useEffect(() => {
    if (!user) return;

    const fetchLegacy = async () => {
      setLoadingLegacy(true);
      try {
        const { data, error } = await supabase
          .from("user_collections")
          .select("perfume_id, status")
          .order("added_at", { ascending: false });

        if (error) throw error;

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
      } catch (error) {
        console.error("Error fetching legacy collections:", error);
      } finally {
        setLoadingLegacy(false);
      }
    };

    fetchLegacy();
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
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
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

  return (
    <Layout>
      <div className="flex flex-col lg:flex-row gap-6 animate-fade-in">
        {/* Sidebar */}
        <div className="lg:w-64 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg">Collections</h2>
            <Button variant="ghost" size="icon" onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="lg:h-[calc(100vh-200px)]">
            <div className="space-y-1 pr-2">
              {/* Default Collections */}
              <button
                onClick={() => {
                  setActiveView("owned");
                  setSelectedCollection(null);
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                  activeView === "owned" ? "bg-primary/10 border border-primary/30" : "hover:bg-secondary/50"
                }`}
              >
                <Heart className="h-5 w-5 text-primary" />
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
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                  activeView === "wishlist" ? "bg-accent/10 border border-accent/30" : "hover:bg-secondary/50"
                }`}
              >
                <Star className="h-5 w-5 text-accent" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">Wishlist</p>
                  <p className="text-xs text-muted-foreground">{legacyWishlist.length} perfumes</p>
                </div>
              </button>

              {collections.length > 0 && (
                <div className="border-t border-border my-3 pt-3">
                  <p className="text-xs text-muted-foreground mb-2 px-1">Custom Collections</p>
                </div>
              )}

              {/* Custom Collections */}
              {collections.map((collection) => (
                <div
                  key={collection.id}
                  className={`group flex items-center gap-3 p-3 rounded-xl transition-all ${
                    activeView === "custom" && selectedCollection?.id === collection.id
                      ? "bg-secondary border border-border"
                      : "hover:bg-secondary/50"
                  }`}
                >
                  <button
                    onClick={() => {
                      setActiveView("custom");
                      setSelectedCollection(collection);
                    }}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    <span className="text-xl">{collection.icon}</span>
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-display">{currentTitle}</h1>
              <p className="text-muted-foreground">
                {currentPerfumes.length} {currentPerfumes.length === 1 ? "perfume" : "perfumes"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost-gold" onClick={handleShareProfile} size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="premium" onClick={() => navigate(`/user/${user?.id}`)} size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Public View
              </Button>
            </div>
          </div>

          {loadingPerfumes ? (
            <div className="flex items-center justify-center py-12">Loading...</div>
          ) : currentPerfumes.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No perfumes yet</p>
                <p className="text-muted-foreground text-center mb-4">
                  {activeView === "custom"
                    ? "Add perfumes to this collection from the Search page"
                    : "Start exploring to add perfumes to your collection"}
                </p>
                <Button onClick={() => navigate("/search")}>
                  Explore Perfumes
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {currentPerfumes.map((perfume) => (
                <PerfumeCard
                  key={perfume.id}
                  perfume={perfume}
                  status={activeView === "owned" ? "owned" : activeView === "wishlist" ? "wishlist" : undefined}
                  showActions={false}
                  onClick={() => setSelectedPerfume(perfume)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

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
