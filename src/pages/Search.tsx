import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSEO } from "@/hooks/useSEO";
import Layout from "@/components/Layout";
import PerfumeCard from "@/components/PerfumeCard";
import PerfumeDetailModal from "@/components/PerfumeDetailModal";
import AddToCollectionDialog from "@/components/AddToCollectionDialog";
import CreateCollectionDialog from "@/components/CreateCollectionDialog";
import SwipeablePerfumeCard from "@/components/SwipeablePerfumeCard";
import RecentlyViewed from "@/components/RecentlyViewed";
import { AnimatedPage } from "@/components/AnimatedPage";
import { PerfumeCardSkeletonGrid } from "@/components/skeletons/PerfumeCardSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { useCustomCollections } from "@/hooks/useCustomCollections";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon } from "lucide-react";
import { usePerfumes, Perfume } from "@/hooks/usePerfumes";
import { useBadges } from "@/hooks/useBadges";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { supabase } from "@/integrations/supabase/client";

const Search = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const { perfumes, loading: loadingPerfumes, error: perfumesError } = usePerfumes(searchQuery);
  const { collections, createCollection, addToCollection } = useCustomCollections();
  const { checkBadges } = useBadges(user?.id);

  useSEO({ 
    title: 'Search Perfumes', 
    description: 'Find perfumes by name, brand, or fragrance notes' 
  });

  const [selectedPerfume, setSelectedPerfume] = useState<Perfume | null>(null);
  const [addingPerfume, setAddingPerfume] = useState<Perfume | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const { recentlyViewed, addRecentlyViewed } = useRecentlyViewed(user?.id);

  const visiblePerfumes = useMemo(
    () => perfumes.filter((p) => !dismissed.has(p.id)),
    [perfumes, dismissed]
  );

  const openPerfume = (perfume: Perfume) => {
    setSelectedPerfume(perfume);
    addRecentlyViewed({
      id: perfume.id,
      name: perfume.name,
      image_url: perfume.image_url,
      brand: typeof perfume.brand === "string" ? perfume.brand : perfume.brand?.name ?? null,
    });
  };

  const openPerfumeById = (id: string) => {
    const p = perfumes.find((x) => x.id === id);
    if (p) openPerfume(p);
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleAddToLegacyCollection = async (perfumeId: string, status: "owned" | "wishlist") => {
    if (!user) return;

    const { error } = await supabase
      .from("user_collections")
      .insert({
        user_id: user.id,
        perfume_id: perfumeId,
        status,
      });

    if (error) {
      if (error.code === "23505") {
        toast({
          title: "Already added",
          description: "This perfume is already in your collection",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add to collection",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Success",
        description: `Added to ${status === "owned" ? "favorites" : "wishlist"}`,
      });
      checkBadges();
    }
  };

  const handleAddToCustomCollection = async (collectionId: string) => {
    if (!addingPerfume) return false;
    const ok = await addToCollection(collectionId, addingPerfume.id);
    if (ok) checkBadges();
    return ok;
  };

  if (loading || loadingPerfumes) {
    return (
      <Layout>
        <div className="space-y-8">
          <div className="space-y-2">
            <div className="h-10 w-64 rounded-lg skeleton-shimmer" />
            <div className="h-5 w-96 rounded-lg skeleton-shimmer" />
          </div>
          <div className="h-12 w-full rounded-xl skeleton-shimmer" />
          <PerfumeCardSkeletonGrid count={6} />
        </div>
      </Layout>
    );
  }

  if (perfumesError) {
    return (
      <Layout>
        <EmptyState
          variant="search"
          title="Error loading perfumes"
          description={perfumesError}
          actionLabel="Try Again"
          onAction={() => window.location.reload()}
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <AnimatedPage className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-playfair">Search Perfumes</h1>
          <p className="text-lg text-muted-foreground">
            Find perfumes by name, brand, notes, or description
          </p>
        </div>

        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search for perfumes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 text-lg rounded-2xl glass"
          />
        </div>

        <RecentlyViewed items={recentlyViewed} onSelect={openPerfumeById} />

        <div className="text-sm text-muted-foreground">
          Showing {visiblePerfumes.length} perfumes
        </div>

        {visiblePerfumes.length === 0 ? (
          <EmptyState
            variant="search"
            title="No fragrances found"
            description="Try adjusting your search terms or explore our recommendations"
            actionLabel="Get Recommendations"
            onAction={() => navigate("/recommendations")}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {visiblePerfumes.map((perfume, index) => (
              <div
                key={perfume.id}
                className="animate-fade-in opacity-0"
                style={{ 
                  animationDelay: `${Math.min(index * 50, 300)}ms`,
                  animationFillMode: "forwards"
                }}
              >
                <SwipeablePerfumeCard
                  onSwipeRight={() => handleAddToLegacyCollection(perfume.id, "owned")}
                  onSwipeLeft={() =>
                    setDismissed((prev) => new Set(prev).add(perfume.id))
                  }
                >
                  <PerfumeCard
                    perfume={perfume}
                    onAddToCollection={(id, status) => {
                      if (status === "owned" || status === "wishlist") {
                        handleAddToLegacyCollection(id, status);
                      }
                    }}
                    onAddToCustomCollection={() => setAddingPerfume(perfume)}
                    onClick={() => openPerfume(perfume)}
                  />
                </SwipeablePerfumeCard>
              </div>
            ))}
          </div>
        )}
      </AnimatedPage>

      <PerfumeDetailModal
        perfume={selectedPerfume}
        isOpen={!!selectedPerfume}
        onClose={() => setSelectedPerfume(null)}
        onAddToCollection={handleAddToLegacyCollection}
      />

      <AddToCollectionDialog
        isOpen={!!addingPerfume}
        onClose={() => setAddingPerfume(null)}
        collections={collections}
        onAddToCollection={handleAddToCustomCollection}
        onCreateNew={() => setShowCreateDialog(true)}
        perfumeName={addingPerfume?.name}
      />

      <CreateCollectionDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSubmit={createCollection}
      />
    </Layout>
  );
};

export default Search;
