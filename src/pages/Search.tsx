import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSEO } from "@/hooks/useSEO";
import Layout from "@/components/Layout";
import PerfumeCard, { CollectionOption } from "@/components/PerfumeCard";
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
import { toast as sonnerToast } from "sonner";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon } from "lucide-react";
import { usePerfumes, Perfume, GenderFilter } from "@/hooks/usePerfumes";
import { useBadges } from "@/hooks/useBadges";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { supabase } from "@/integrations/supabase/client";

const Search = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [gender, setGender] = useState<GenderFilter>("all");
  const { perfumes, loading: loadingPerfumes, error: perfumesError } = usePerfumes(searchQuery, gender);
  const { collections, createCollection, addToCollection, refetch: refetchCollections } = useCustomCollections();
  const { checkBadges } = useBadges(user?.id);

  useSEO({ 
    title: 'Search Perfumes', 
    description: 'Find perfumes by name, brand, or fragrance notes' 
  });

  const [selectedPerfume, setSelectedPerfume] = useState<Perfume | null>(null);
  const [addingPerfume, setAddingPerfume] = useState<Perfume | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [optimisticStatus, setOptimisticStatus] = useState<Map<string, "owned" | "wishlist">>(new Map());
  // perfumeId -> set of optionIds the perfume already belongs to ("__owned", "__wishlist", or a custom_collections.id)
  const [memberships, setMemberships] = useState<Map<string, Set<string>>>(new Map());
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

    // Optimistic update
    const prev = optimisticStatus.get(perfumeId);
    setOptimisticStatus((m) => new Map(m).set(perfumeId, status));

    const { error } = await supabase
      .from("user_collections")
      .insert({
        user_id: user.id,
        perfume_id: perfumeId,
        status,
      });

    if (error) {
      // Revert
      setOptimisticStatus((m) => {
        const n = new Map(m);
        if (prev) n.set(perfumeId, prev);
        else n.delete(perfumeId);
        return n;
      });
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
    if (!addingPerfume || !user) return false;
    const perfumeId = addingPerfume.id;
    const collection = collections.find((c) => c.id === collectionId);
    const label = collection?.name ?? "collection";

    const { error } = await supabase
      .from("collection_items")
      .insert({ collection_id: collectionId, perfume_id: perfumeId });

    if (error) {
      if (error.code === "23505") {
        sonnerToast.error(`Already in ${label}`);
        // Reflect membership so the row shows checked
        setMemberships((prev) => {
          const m = new Map(prev);
          const s = new Set(m.get(perfumeId) ?? []);
          s.add(collectionId);
          m.set(perfumeId, s);
          return m;
        });
        return false;
      }
      sonnerToast.error("Failed to add to collection");
      return false;
    }

    setMemberships((prev) => {
      const m = new Map(prev);
      const s = new Set(m.get(perfumeId) ?? []);
      s.add(collectionId);
      m.set(perfumeId, s);
      return m;
    });
    sonnerToast.success(`Added to ${label} ✓`);
    refetchCollections();
    checkBadges();
    return true;
  };

  const handleAddToLegacyFromDialog = async (legacyId: string) => {
    if (!addingPerfume || !user) return false;
    const perfumeId = addingPerfume.id;
    const status: "owned" | "wishlist" = legacyId === "__owned" ? "owned" : "wishlist";
    const label = status === "owned" ? "My Favorites" : "Wishlist";

    const { error } = await supabase
      .from("user_collections")
      .upsert(
        { user_id: user.id, perfume_id: perfumeId, status },
        { onConflict: "user_id,perfume_id" }
      );

    if (error) {
      sonnerToast.error("Failed to add to collection");
      return false;
    }

    setOptimisticStatus((m) => new Map(m).set(perfumeId, status));
    setMemberships((prev) => {
      const m = new Map(prev);
      const s = new Set(m.get(perfumeId) ?? []);
      s.delete(legacyId === "__owned" ? "__wishlist" : "__owned");
      s.add(legacyId);
      m.set(perfumeId, s);
      return m;
    });
    sonnerToast.success(`Added to ${label} ✓`);
    checkBadges();
    return true;
  };

  // Fetch which collections each visible perfume is already a member of
  useEffect(() => {
    if (!user || perfumes.length === 0) {
      setMemberships(new Map());
      return;
    }
    const ids = perfumes.map((p) => p.id);
    let cancelled = false;
    (async () => {
      const [legacyRes, customRes] = await Promise.all([
        supabase
          .from("user_collections")
          .select("perfume_id, status")
          .eq("user_id", user.id)
          .in("perfume_id", ids),
        supabase
          .from("collection_items")
          .select("perfume_id, collection_id")
          .in("perfume_id", ids),
      ]);
      if (cancelled) return;
      const m = new Map<string, Set<string>>();
      const ensure = (pid: string) => {
        let s = m.get(pid);
        if (!s) {
          s = new Set();
          m.set(pid, s);
        }
        return s;
      };
      legacyRes.data?.forEach((r: any) => {
        ensure(r.perfume_id).add(r.status === "owned" ? "__owned" : "__wishlist");
      });
      customRes.data?.forEach((r: any) => {
        ensure(r.perfume_id).add(r.collection_id);
      });
      setMemberships(m);
    })();
    return () => {
      cancelled = true;
    };
  }, [perfumes, user]);

  const legacyDialogOptions = useMemo(
    () => [
      { id: "__owned", label: "My Favorites", icon: "❤️" },
      { id: "__wishlist", label: "Wishlist", icon: "⭐" },
    ],
    []
  );


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

        <div className="flex flex-wrap gap-2">
          {(["all", "female", "male", "unisex"] as GenderFilter[]).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGender(g)}
              className={`px-4 py-2 rounded-full text-sm capitalize transition-smooth border ${
                gender === g
                  ? "bg-primary text-primary-foreground border-primary shadow-elegant"
                  : "bg-background/40 border-border/50 hover:border-primary/40"
              }`}
            >
              {g}
            </button>
          ))}
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
                    status={optimisticStatus.get(perfume.id)}
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
        legacyOptions={legacyDialogOptions}
        onAddToLegacy={handleAddToLegacyFromDialog}
        alreadyAddedIds={addingPerfume ? memberships.get(addingPerfume.id) : undefined}
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
