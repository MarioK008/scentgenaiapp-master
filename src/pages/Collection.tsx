import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import PerfumeCard, { PerfumeData } from "@/components/PerfumeCard";
import PerfumeDetailModal from "@/components/PerfumeDetailModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Share2, ExternalLink } from "lucide-react";
import { toast as sonnerToast } from "sonner";

interface CollectionItem {
  id: string;
  perfume_id: string;
  status: "owned" | "wishlist";
  rating: number | null;
  perfumes: PerfumeData;
}

const Collection = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [collection, setCollection] = useState<CollectionItem[]>([]);
  const [loadingCollection, setLoadingCollection] = useState(true);
  const [selectedPerfume, setSelectedPerfume] = useState<{ perfume: PerfumeData; status: "owned" | "wishlist" } | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchCollection();
    }
  }, [user]);

  const fetchCollection = async () => {
    try {
      const { data, error } = await supabase
        .from("user_collections")
        .select(`id, perfume_id, status, rating`)
        .order("added_at", { ascending: false });

      if (error) throw error;

      // Fetch full perfume data with relations
      const perfumeIds = data?.map(item => item.perfume_id) || [];
      const { data: perfumesData, error: perfumesError } = await supabase
        .from("perfumes")
        .select(`
          id,
          name,
          image_url,
          longevity,
          sillage,
          description,
          year,
          concentration,
          brand:brands!brand_id(name),
          notes:perfume_notes(note:notes(name, type)),
          seasons:perfume_seasons(season:seasons(name)),
          accords:perfume_accords(accord:accords(name))
        `)
        .in("id", perfumeIds);

      if (perfumesError) throw perfumesError;

      // Combine collection items with perfume data
      const enrichedCollection = data?.map(item => {
        const perfume = perfumesData?.find(p => p.id === item.perfume_id);
        return {
          ...item,
          perfumes: {
            ...perfume,
            brand: Array.isArray(perfume?.brand) ? perfume.brand[0] : perfume?.brand,
            notes: perfume?.notes?.map((n: any) => Array.isArray(n.note) ? n.note[0] : n.note).filter(Boolean) || [],
            seasons: perfume?.seasons?.map((s: any) => Array.isArray(s.season) ? s.season[0] : s.season).filter(Boolean) || [],
            accords: perfume?.accords?.map((a: any) => Array.isArray(a.accord) ? a.accord[0] : a.accord).filter(Boolean) || [],
          }
        };
      }) || [];

      setCollection(enrichedCollection as CollectionItem[]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load collection",
        variant: "destructive"
      });
    } finally {
      setLoadingCollection(false);
    }
  };

  const handleRate = async (perfumeId: string, rating: number) => {
    const item = collection.find(c => c.perfume_id === perfumeId);
    if (!item) return;

    const { error } = await supabase
      .from("user_collections")
      .update({ rating })
      .eq("id", item.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update rating",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Rating updated"
      });
      fetchCollection();

      // Check for new badges after rating
      if (user) {
        setTimeout(() => {
          supabase.rpc("check_and_award_badges", { p_user_id: user.id });
        }, 500);
      }
    }
  };

  if (loading || loadingCollection) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const ownedPerfumes = collection.filter(c => c.status === "owned");
  const wishlist = collection.filter(c => c.status === "wishlist");

  const handleShareProfile = () => {
    const profileUrl = `${window.location.origin}/user/${user?.id}`;
    navigator.clipboard.writeText(profileUrl);
    sonnerToast.success("Profile link copied to clipboard!");
  };

  const handleViewPublicProfile = () => {
    navigate(`/user/${user?.id}`);
  };

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-muted-foreground mt-3 text-lg">Manage your perfume collection and wishlist</p>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost-gold" onClick={handleShareProfile} className="gap-2">
              <Share2 className="h-4 w-4" strokeWidth={1.5} />
              Share Profile
            </Button>
            <Button variant="premium" onClick={handleViewPublicProfile} className="gap-2">
              <ExternalLink className="h-4 w-4" strokeWidth={1.5} />
              Public View
            </Button>
          </div>
        </div>

        <Tabs defaultValue="owned" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 h-12 rounded-[20px] p-1">
            <TabsTrigger value="owned" className="rounded-[16px] transition-smooth">
              Owned ({ownedPerfumes.length})
            </TabsTrigger>
            <TabsTrigger value="wishlist" className="rounded-[16px] transition-smooth">
              Wishlist ({wishlist.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="owned" className="mt-8">
            {ownedPerfumes.length === 0 ? (
              <div className="gradient-accent border border-primary/20 rounded-[20px] p-12 text-center animate-fade-in">
                <p className="text-muted-foreground text-lg">No perfumes in your collection yet</p>
                <Button variant="premium" className="mt-6" onClick={() => navigate("/search")}>
                  Start Exploring
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                {ownedPerfumes.map(item => (
                  <PerfumeCard
                    key={item.id}
                    perfume={item.perfumes}
                    userRating={item.rating || undefined}
                    status="owned"
                    onRate={handleRate}
                    onClick={() => setSelectedPerfume({ perfume: item.perfumes, status: "owned" })}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="wishlist" className="mt-8">
            {wishlist.length === 0 ? (
              <div className="gradient-accent border border-primary/20 rounded-[20px] p-12 text-center animate-fade-in">
                <p className="text-muted-foreground text-lg">Your wishlist is empty</p>
                <Button variant="premium" className="mt-6" onClick={() => navigate("/search")}>
                  Find Perfumes
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                {wishlist.map(item => (
                  <PerfumeCard
                    key={item.id}
                    perfume={item.perfumes}
                    userRating={item.rating || undefined}
                    status="wishlist"
                    onRate={handleRate}
                    onClick={() => setSelectedPerfume({ perfume: item.perfumes, status: "wishlist" })}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <PerfumeDetailModal
        perfume={selectedPerfume?.perfume || null}
        isOpen={!!selectedPerfume}
        onClose={() => setSelectedPerfume(null)}
        userStatus={selectedPerfume?.status}
      />
    </Layout>
  );
};

export default Collection;
