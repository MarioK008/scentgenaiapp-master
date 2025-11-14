import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import PerfumeCard from "@/components/PerfumeCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

interface FeedItem {
  id: string;
  added_at: string;
  user_id: string;
  status: "owned" | "wishlist";
  profiles: {
    username: string;
    avatar_url: string | null;
  };
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

const Feed = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchFeed();
    }
  }, [user]);

  const fetchFeed = async () => {
    if (!user) return;

    try {
      // Get approved followed users
      const { data: follows, error: followsError } = await supabase
        .from("user_follows")
        .select("followed_id")
        .eq("follower_id", user.id)
        .eq("status", "approved");

      if (followsError) throw followsError;

      if (!follows || follows.length === 0) {
        setLoadingFeed(false);
        return;
      }

      const followedIds = follows.map((f) => f.followed_id);

      // Get recent additions from followed users with perfume details
      const { data: collections, error: collectionsError } = await supabase
        .from("user_collections")
        .select(`
          id,
          added_at,
          user_id,
          status,
          perfumes!inner (
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
        .in("user_id", followedIds)
        .order("added_at", { ascending: false })
        .limit(20);

      if (collectionsError) throw collectionsError;

      // Get profiles separately
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", followedIds);

      if (profilesError) throw profilesError;

      // Merge the data
      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const mergedData = collections?.map(item => ({
        ...item,
        perfumes: Array.isArray(item.perfumes) ? item.perfumes[0] : item.perfumes,
        profiles: profilesMap.get(item.user_id) || { username: "Unknown", avatar_url: null }
      })) || [];

      setFeedItems(mergedData as FeedItem[]);
    } catch (error) {
      console.error("Error fetching feed:", error);
      toast({
        title: "Error",
        description: "Failed to load feed",
        variant: "destructive",
      });
    } finally {
      setLoadingFeed(false);
    }
  };

  if (loading || loadingFeed) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (feedItems.length === 0) {
    return (
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">Feed</h1>
            <p className="text-muted-foreground">
              See what perfumes your followed users are adding
            </p>
          </div>

          <Card className="text-center py-12">
            <CardContent className="space-y-4">
              <Users className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <CardTitle className="mb-2">No Updates Yet</CardTitle>
                <CardDescription>
                  Follow other users to see their collection updates here
                </CardDescription>
              </div>
              <Button onClick={() => navigate("/search")}>
                Discover Perfumes
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Feed</h1>
          <p className="text-muted-foreground">
            Recent additions from users you follow
          </p>
        </div>

        <div className="space-y-6">
          {feedItems.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Avatar
                    className="h-10 w-10 cursor-pointer"
                    onClick={() => navigate(`/user/${item.user_id}`)}
                  >
                    <AvatarImage src={item.profiles.avatar_url || undefined} />
                    <AvatarFallback>
                      {item.profiles.username?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="font-semibold cursor-pointer hover:underline"
                        onClick={() => navigate(`/user/${item.user_id}`)}
                      >
                        {item.profiles.username}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        added to {item.status === "owned" ? "collection" : "wishlist"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(item.added_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-w-sm">
                  <PerfumeCard
                    perfume={item.perfumes}
                    status={item.status}
                    showActions={false}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Feed;
