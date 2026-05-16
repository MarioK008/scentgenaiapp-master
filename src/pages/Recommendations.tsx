import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSEO } from "@/hooks/useSEO";
import Layout from "@/components/Layout";
import PerfumeCard, { PerfumeData } from "@/components/PerfumeCard";
import PerfumeDetailModal from "@/components/PerfumeDetailModal";
import AddToCollectionDialog from "@/components/AddToCollectionDialog";
import CreateCollectionDialog from "@/components/CreateCollectionDialog";
import SwipeablePerfumeCard from "@/components/SwipeablePerfumeCard";
import RecentlyViewed from "@/components/RecentlyViewed";
import { AnimatedPage } from "@/components/AnimatedPage";
import { EmptyState } from "@/components/EmptyState";
import { PerfumeCardSkeletonGrid } from "@/components/skeletons/PerfumeCardSkeleton";
import { useCustomCollections } from "@/hooks/useCustomCollections";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2 } from "lucide-react";
import { useBadges } from "@/hooks/useBadges";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";

const Recommendations = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { collections, createCollection, addToCollection } = useCustomCollections();
  const { checkBadges } = useBadges(user?.id);

  useSEO({ 
    title: 'AI Recommendations', 
    description: 'Get personalized fragrance suggestions powered by AI' 
  });
  const [recommendations, setRecommendations] = useState<PerfumeData[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [mood, setMood] = useState("");
  const [occasion, setOccasion] = useState("");
  const [season, setSeason] = useState("");
  const [selectedPerfume, setSelectedPerfume] = useState<PerfumeData | null>(null);
  const [addingPerfume, setAddingPerfume] = useState<PerfumeData | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [optimisticStatus, setOptimisticStatus] = useState<Map<string, "owned" | "wishlist">>(new Map());
  const [preferredFamilies, setPreferredFamilies] = useState<string[]>([]);
  const { recentlyViewed, addRecentlyViewed } = useRecentlyViewed(user?.id);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("preferred_families")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const fams = (data as any)?.preferred_families;
        if (Array.isArray(fams)) setPreferredFamilies(fams.map((f: string) => f.toLowerCase()));
      });
  }, [user]);

  const buildReason = (perfume: PerfumeData): string => {
    const accordTokens = (perfume.accords ?? []).map((a) => a.name.toLowerCase());
    const noteTokens = (perfume.notes ?? []).map((n) => n.name.toLowerCase());
    const haystack = [...accordTokens, ...noteTokens].join(" ");
    const matches = preferredFamilies.filter((f) => haystack.includes(f)).slice(0, 2);
    if (matches.length > 0) {
      const list = matches.length === 2 ? `${matches[0]} and ${matches[1]}` : matches[0];
      return `Matches your love of ${list} notes`;
    }
    if (mood || occasion || season) {
      const v = mood || occasion || season;
      return `Picked for your ${v} vibe`;
    }
    return "Popular with users who share your taste profile";
  };

  const visibleRecs = useMemo(
    () => recommendations.filter((p) => !dismissed.has(p.id)),
    [recommendations, dismissed]
  );

  const openPerfume = (perfume: PerfumeData) => {
    setSelectedPerfume(perfume);
    addRecentlyViewed({
      id: perfume.id,
      name: perfume.name,
      image_url: perfume.image_url,
      brand: typeof perfume.brand === "string" ? perfume.brand : perfume.brand?.name ?? null,
    });
  };

  const openPerfumeById = (id: string) => {
    const p = recommendations.find((x) => x.id === id);
    if (p) openPerfume(p);
  };

  const handleGetRecommendations = async () => {
    if (!mood && !occasion && !season) {
      toast({
        title: "Selection required",
        description: "Please select at least one preference",
        variant: "destructive",
      });
      return;
    }

    setLoadingRecs(true);

    try {
      const { data, error } = await supabase.functions.invoke("get-recommendations", {
        body: { mood, occasion, season, userId: user?.id },
      });

      if (error) {
        console.error("Recommendation error:", error);
        throw error;
      }

      setRecommendations(data.recommendations || []);
      
      if (data.recommendations?.length === 0) {
        toast({
          title: "No recommendations",
          description: "Try different preferences or add more perfumes to the database",
        });
      } else {
        toast({
          title: "Success",
          description: `Found ${data.recommendations.length} recommendations for you!`,
        });
      }
    } catch (error: any) {
      console.error("Full error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to get recommendations",
        variant: "destructive",
      });
    } finally {
      setLoadingRecs(false);
    }
  };

  const handleAddToCollection = async (perfumeId: string, status: "owned" | "wishlist") => {
    if (!user) return;

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
    if (!addingPerfume) return false;
    const ok = await addToCollection(collectionId, addingPerfume.id);
    if (ok) checkBadges();
    return ok;
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-8">
          <div className="h-10 w-64 rounded-lg skeleton-shimmer" />
          <div className="rounded-[20px] border border-border/50 bg-card p-6">
            <div className="h-48 skeleton-shimmer rounded-lg" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <AnimatedPage className="space-y-10">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-playfair flex items-center gap-3">
            <Sparkles className="h-10 w-10 text-accent" strokeWidth={1.5} />
            <span>AI Recommendations</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Get personalized fragrance suggestions based on your preferences
          </p>
        </div>

        <RecentlyViewed items={recentlyViewed} onSelect={openPerfumeById} />

        <Card className="border-accent/20">
          <CardHeader>
            <CardTitle className="text-2xl">Tell us what you're looking for</CardTitle>
            <CardDescription className="text-base">Select your preferences to get AI-powered recommendations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Mood</Label>
                <Select value={mood} onValueChange={setMood}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Select mood" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="romantic">Romantic</SelectItem>
                    <SelectItem value="energetic">Energetic</SelectItem>
                    <SelectItem value="calm">Calm</SelectItem>
                    <SelectItem value="confident">Confident</SelectItem>
                    <SelectItem value="fresh">Fresh</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Occasion</Label>
                <Select value={occasion} onValueChange={setOccasion}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Select occasion" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="casual">Daily / Casual</SelectItem>
                    <SelectItem value="work">Work</SelectItem>
                    <SelectItem value="evening">Evening</SelectItem>
                    <SelectItem value="date">Date Night</SelectItem>
                    <SelectItem value="special">Special Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Season</Label>
                <Select value={season} onValueChange={setSeason}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Select season" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spring">Spring</SelectItem>
                    <SelectItem value="summer">Summer</SelectItem>
                    <SelectItem value="fall">Fall</SelectItem>
                    <SelectItem value="winter">Winter</SelectItem>
                    <SelectItem value="all_season">All Season</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleGetRecommendations}
              disabled={loadingRecs}
              variant="hero"
              size="lg"
              className="w-full"
            >
              {loadingRecs ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Finding perfect matches...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Get Recommendations
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {loadingRecs && (
          <div className="space-y-6">
            <h2 className="text-2xl font-playfair">Finding your perfect matches...</h2>
            <PerfumeCardSkeletonGrid count={6} />
          </div>
        )}

        {!loadingRecs && recommendations.length === 0 && (mood || occasion || season) && (
          <EmptyState
            variant="recommendations"
            title="Ready to discover"
            description="Select your preferences above and click the button to get personalized recommendations"
          />
        )}

        {visibleRecs.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-playfair">Recommended for you</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {visibleRecs.map((perfume, index) => (
                <div
                  key={perfume.id}
                  className="animate-fade-in opacity-0"
                  style={{ 
                    animationDelay: `${index * 100}ms`,
                    animationFillMode: "forwards"
                  }}
                >
                  <SwipeablePerfumeCard
                    onSwipeRight={() => handleAddToCollection(perfume.id, "owned")}
                    onSwipeLeft={() =>
                      setDismissed((prev) => new Set(prev).add(perfume.id))
                    }
                  >
                    <PerfumeCard
                      perfume={perfume}
                      status={optimisticStatus.get(perfume.id)}
                      reason={buildReason(perfume)}
                      onAddToCollection={handleAddToCollection}
                      onAddToCustomCollection={() => setAddingPerfume(perfume)}
                      onClick={() => openPerfume(perfume)}
                    />
                  </SwipeablePerfumeCard>
                </div>
              ))}
            </div>
          </div>
        )}
      </AnimatedPage>

      <PerfumeDetailModal
        perfume={selectedPerfume}
        isOpen={!!selectedPerfume}
        onClose={() => setSelectedPerfume(null)}
        onAddToCollection={handleAddToCollection}
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

export default Recommendations;
