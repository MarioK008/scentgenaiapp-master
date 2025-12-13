import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { FollowRequests } from "@/components/FollowRequests";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Sparkles, Search, TrendingUp, Share2, User } from "lucide-react";
import { toast } from "sonner";
const Dashboard = () => {
  const {
    user,
    loading
  } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  const handleShareProfile = () => {
    const profileUrl = `${window.location.origin}/user/${user?.id}`;
    navigator.clipboard.writeText(profileUrl);
    toast.success("Profile link copied to clipboard!");
  };
  return <Layout>
      <div className="space-y-8 animate-fade-in">
        <div>
          
        </div>

        <FollowRequests />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="hover:shadow-elegant transition-smooth cursor-pointer group animate-scale-in" onClick={() => navigate("/collection")}>
            <CardHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <Heart className="h-6 w-6 text-primary group-hover:scale-110 transition-bounce" strokeWidth={1.5} />
                <CardTitle className="text-2xl">My Collection</CardTitle>
              </div>
              <CardDescription className="text-base">Browse and manage your perfumes</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="hero" className="w-full">
                View Collection
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-elegant transition-smooth cursor-pointer group animate-scale-in" onClick={() => navigate("/recommendations")}>
            <CardHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-accent group-hover:scale-110 transition-bounce" strokeWidth={1.5} />
                <CardTitle className="text-2xl">Get Recommendations</CardTitle>
              </div>
              <CardDescription className="text-base">AI-powered fragrance suggestions</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="hero" className="w-full">
                Get Started
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-elegant transition-smooth cursor-pointer group animate-scale-in" onClick={() => navigate("/search")}>
            <CardHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <Search className="h-6 w-6 text-primary group-hover:scale-110 transition-bounce" strokeWidth={1.5} />
                <CardTitle className="text-2xl">Search Perfumes</CardTitle>
              </div>
              <CardDescription className="text-base">Find perfumes by name, brand, or notes</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="hero" className="w-full">
                Start Search
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-elegant transition-smooth cursor-pointer group animate-scale-in" onClick={() => navigate(`/user/${user?.id}`)}>
            <CardHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-6 w-6 text-accent group-hover:scale-110 transition-bounce" strokeWidth={1.5} />
                <CardTitle className="text-2xl">Public Profile</CardTitle>
              </div>
              <CardDescription className="text-base">View and share your public profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="hero" className="w-full">
                View Profile
              </Button>
              <Button variant="ghost-gold" className="w-full gap-2" onClick={e => {
              e.stopPropagation();
              handleShareProfile();
            }}>
                <Share2 className="h-4 w-4" strokeWidth={1.5} />
                Share Profile
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="gradient-accent border-primary/20 animate-fade-in">
          <CardHeader>
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-primary" strokeWidth={1.5} />
              <CardTitle className="text-2xl">Quick Stats</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-4 rounded-[20px] bg-card/50 backdrop-blur-sm">
                <p className="text-3xl font-bold text-primary font-playfair">0</p>
                <p className="text-sm text-muted-foreground mt-1">Perfumes Owned</p>
              </div>
              <div className="text-center p-4 rounded-[20px] bg-card/50 backdrop-blur-sm">
                <p className="text-3xl font-bold text-accent font-playfair">0</p>
                <p className="text-sm text-muted-foreground mt-1">Wishlist Items</p>
              </div>
              <div className="text-center p-4 rounded-[20px] bg-card/50 backdrop-blur-sm">
                <p className="text-3xl font-bold text-primary font-playfair">0</p>
                <p className="text-sm text-muted-foreground mt-1">Reviews</p>
              </div>
              <div className="text-center p-4 rounded-[20px] bg-card/50 backdrop-blur-sm">
                <p className="text-3xl font-bold text-accent font-playfair">0</p>
                <p className="text-sm text-muted-foreground mt-1">Favorites</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>;
};
export default Dashboard;