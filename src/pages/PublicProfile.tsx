import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useProfileStats } from "@/hooks/useProfileStats";
import { useUserFollows } from "@/hooks/useUserFollows";
import { useBadges } from "@/hooks/useBadges";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import PerfumeCard, { PerfumeData } from "@/components/PerfumeCard";
import { BadgeDisplay } from "@/components/BadgeDisplay";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Star, Heart, Sparkles, TrendingUp, UserPlus, UserMinus, Lock } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";

interface Profile {
  id: string;
  username: string;
  bio: string | null;
  location: string | null;
  avatar_url: string | null;
  is_private: boolean;
}

interface CollectionItem {
  id: string;
  status: string;
  rating: number | null;
  personal_notes: string | null;
  perfumes: PerfumeData;
}

const PublicProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { stats, loading: statsLoading } = useProfileStats(userId);
  const { isFollowing, followerCount, followingCount, toggleFollow } = useUserFollows(
    userId,
    user?.id
  );
  const { badges } = useBadges(userId);

  useEffect(() => {
    if (userId) {
      fetchProfileData();
    }
  }, [userId]);

  const fetchProfileData = async () => {
    if (!userId) return;

    try {
      // Fetch profile - explicitly select only public fields (no email)
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, bio, location, avatar_url, is_private")
        .eq("id", userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Step 1: Fetch user collection rows (perfume_id + status/rating)
      const { data: collectionsData, error: collectionsError } = await supabase
        .from("user_collections")
        .select("id, status, rating, personal_notes, perfume_id")
        .eq("user_id", userId)
        .order("added_at", { ascending: false });

      if (collectionsError) throw collectionsError;

      const perfumeIds = (collectionsData || []).map((c) => c.perfume_id);

      if (perfumeIds.length === 0) {
        setCollections([]);
        return;
      }

      // Step 2: Fetch perfumes with normalized junction tables
      const { data: perfumesData, error: perfumesError } = await supabase
        .from("perfumes")
        .select(`
          id, name, image_url, longevity, sillage, description, year, concentration,
          brand:brands!brand_id(name),
          notes:perfume_notes(note:notes(name, type)),
          seasons:perfume_seasons(season:seasons(name)),
          accords:perfume_accords(accord:accords(name))
        `)
        .in("id", perfumeIds);

      if (perfumesError) throw perfumesError;

      // Step 3: Normalize nested arrays (same pattern as Collections.tsx)
      const enrichedPerfumes: Record<string, PerfumeData> = {};
      (perfumesData || []).forEach((p: any) => {
        enrichedPerfumes[p.id] = {
          ...p,
          brand: Array.isArray(p.brand) ? p.brand[0] : p.brand,
          notes: p.notes?.map((n: any) => (Array.isArray(n.note) ? n.note[0] : n.note)).filter(Boolean) || [],
          seasons: p.seasons?.map((s: any) => (Array.isArray(s.season) ? s.season[0] : s.season)).filter(Boolean) || [],
          accords: p.accords?.map((a: any) => (Array.isArray(a.accord) ? a.accord[0] : a.accord)).filter(Boolean) || [],
        };
      });

      // Step 4: Merge collection metadata with enriched perfume data
      const merged: CollectionItem[] = (collectionsData || [])
        .filter((c) => enrichedPerfumes[c.perfume_id])
        .map((c) => ({
          id: c.id,
          status: c.status,
          rating: c.rating,
          personal_notes: c.personal_notes,
          perfumes: enrichedPerfumes[c.perfume_id],
        }));

      setCollections(merged);
    } catch (error) {
      console.error("Error fetching profile data:", error);
      setCollections([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">User not found</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const ownedPerfumes = collections.filter((c) => c.status === "owned");
  const wishlistPerfumes = collections.filter((c) => c.status === "wishlist");

  // Check if current user can view the collection
  const isOwnProfile = user?.id === userId;
  const isPrivate = profile.is_private;
  const canViewCollection = isOwnProfile || !isPrivate || isFollowing;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <Avatar className="h-32 w-32 border-4 border-primary/20">
                <AvatarImage src={profile.avatar_url || undefined} alt={profile.username} />
                <AvatarFallback className="text-4xl">
                  {profile.username?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{profile.username}</h1>
                    {profile.location && (
                      <div className="flex items-center gap-2 text-muted-foreground mb-3">
                        <MapPin className="h-4 w-4" />
                        <span>{profile.location}</span>
                      </div>
                    )}
                    {profile.bio && (
                      <p className="text-muted-foreground">{profile.bio}</p>
                    )}
                  </div>
                  
                  {user && user.id !== userId && (
                    <Button
                      variant={isFollowing ? "outline" : "default"}
                      onClick={toggleFollow}
                      className="gap-2"
                    >
                      {isFollowing ? (
                        <>
                          <UserMinus className="h-4 w-4" />
                          Unfollow
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4" />
                          Follow
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-primary/10 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-primary">{stats.totalPerfumes}</div>
                    <div className="text-sm text-muted-foreground">Perfumes</div>
                  </div>
                  <div className="bg-secondary/10 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-secondary">{stats.wishlistCount}</div>
                    <div className="text-sm text-muted-foreground">Wishlist</div>
                  </div>
                  <div className="bg-accent/10 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-accent-foreground">{followerCount}</div>
                    <div className="text-sm text-muted-foreground">Followers</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold">{followingCount}</div>
                    <div className="text-sm text-muted-foreground">Following</div>
                  </div>
                  <div className="bg-muted rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold">
                      {ownedPerfumes.filter((c) => c.rating && c.rating >= 4).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Favorites</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Favorite Perfume & Top Notes */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Badges */}
          <BadgeDisplay
            badges={badges.map(b => ({
              ...b.badges,
              earned: true,
              earned_at: b.earned_at,
            }))}
            title="Achievements"
            description="Badges earned by this user"
            maxDisplay={6}
          />

          {/* Favorite Perfume */}
          {stats.favoritePerfume && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  Favorite Perfume
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 items-center">
                  {stats.favoritePerfume.image_url && (
                    <img
                      src={stats.favoritePerfume.image_url}
                      alt={stats.favoritePerfume.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold">{stats.favoritePerfume.name}</h3>
                    <p className="text-sm text-muted-foreground">{stats.favoritePerfume.brand}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {(stats.topNotes.top.length > 0 || stats.topNotes.heart.length > 0 || stats.topNotes.base.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Favorite Notes
                </CardTitle>
                <CardDescription>Most common notes in their collection</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.topNotes.top.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Top Notes</p>
                      <div className="flex flex-wrap gap-2">
                        {stats.topNotes.top.map((note) => (
                          <Badge key={note} variant="secondary" className="text-sm">
                            {note}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {stats.topNotes.heart.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Heart Notes</p>
                      <div className="flex flex-wrap gap-2">
                        {stats.topNotes.heart.map((note) => (
                          <Badge key={note} variant="secondary" className="text-sm">
                            {note}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {stats.topNotes.base.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Base Notes</p>
                      <div className="flex flex-wrap gap-2">
                        {stats.topNotes.base.map((note) => (
                          <Badge key={note} variant="secondary" className="text-sm">
                            {note}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Collection Tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Perfume Collection
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!canViewCollection ? (
              <div className="text-center py-12">
                <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <CardTitle className="mb-2">This Profile is Private</CardTitle>
                <CardDescription className="mb-4">
                  Follow this user to see their collection
                </CardDescription>
                {user && user.id !== userId && (
                  <Button onClick={toggleFollow} className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Follow
                  </Button>
                )}
              </div>
            ) : (
              <Tabs defaultValue="owned" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="owned" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Owned ({ownedPerfumes.length})
                </TabsTrigger>
                <TabsTrigger value="wishlist" className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Wishlist ({wishlistPerfumes.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="owned" className="mt-6">
                {ownedPerfumes.length === 0 ? (
                  <EmptyState
                    variant="collection"
                    title="No perfumes yet"
                    description="This collection is empty for now."
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ownedPerfumes.map((item) => (
                      <PerfumeCard
                        key={item.id}
                        perfume={item.perfumes}
                        userRating={item.rating || undefined}
                        showActions={false}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="wishlist" className="mt-6">
                {wishlistPerfumes.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No perfumes in wishlist yet
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wishlistPerfumes.map((item) => (
                      <PerfumeCard
                        key={item.id}
                        perfume={item.perfumes}
                        userRating={item.rating || undefined}
                        showActions={false}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PublicProfile;
