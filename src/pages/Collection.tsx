import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import PerfumeCard from "@/components/PerfumeCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CollectionItem {
  id: string;
  perfume_id: string;
  status: "owned" | "wishlist";
  rating: number | null;
  perfumes: {
    id: string;
    name: string;
    brand: string;
    image_url: string | null;
    top_notes: string[];
    heart_notes: string[];
    base_notes: string[];
    season: string | null;
    longevity: number | null;
    sillage: number | null;
    description: string | null;
  };
}

const Collection = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [collection, setCollection] = useState<CollectionItem[]>([]);
  const [loadingCollection, setLoadingCollection] = useState(true);

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
    const { data, error } = await supabase
      .from("user_collections")
      .select(`
        id,
        perfume_id,
        status,
        rating,
        perfumes (
          id,
          name,
          brand,
          image_url,
          top_notes,
          heart_notes,
          base_notes,
          season,
          longevity,
          sillage,
          description
        )
      `)
      .order("added_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load collection",
        variant: "destructive",
      });
    } else {
      setCollection(data || []);
    }
    setLoadingCollection(false);
  };

  const handleRate = async (perfumeId: string, rating: number) => {
    const item = collection.find((c) => c.perfume_id === perfumeId);
    if (!item) return;

    const { error } = await supabase
      .from("user_collections")
      .update({ rating })
      .eq("id", item.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update rating",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Rating updated",
      });
      fetchCollection();
    }
  };

  if (loading || loadingCollection) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const ownedPerfumes = collection.filter((c) => c.status === "owned");
  const wishlist = collection.filter((c) => c.status === "wishlist");

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">My Collection</h1>
          <p className="text-muted-foreground">
            Manage your perfumes and wishlist
          </p>
        </div>

        <Tabs defaultValue="owned" className="w-full">
          <TabsList>
            <TabsTrigger value="owned">Owned ({ownedPerfumes.length})</TabsTrigger>
            <TabsTrigger value="wishlist">Wishlist ({wishlist.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="owned" className="mt-6">
            {ownedPerfumes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No perfumes in your collection yet.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Visit the search page to add perfumes!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ownedPerfumes.map((item) => (
                  <PerfumeCard
                    key={item.id}
                    perfume={item.perfumes}
                    userRating={item.rating || undefined}
                    status={item.status}
                    onRate={handleRate}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="wishlist" className="mt-6">
            {wishlist.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Your wishlist is empty.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Visit the search page to add perfumes!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishlist.map((item) => (
                  <PerfumeCard
                    key={item.id}
                    perfume={item.perfumes}
                    status={item.status}
                    showActions={false}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Collection;
