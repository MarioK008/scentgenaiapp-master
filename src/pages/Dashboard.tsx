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
  const { user, loading } = useAuth();
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

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold">Welcome back!</h1>
          <p className="text-muted-foreground mt-2">
            Discover new perfumes and manage your collection
          </p>
        </div>

        <FollowRequests />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/collection")}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                <CardTitle>My Collection</CardTitle>
              </div>
              <CardDescription>Browse and manage your perfumes</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                View Collection
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/recommendations")}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" />
                <CardTitle>Get Recommendations</CardTitle>
              </div>
              <CardDescription>AI-powered fragrance suggestions</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Get Started
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/search")}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                <CardTitle>Search Perfumes</CardTitle>
              </div>
              <CardDescription>Find perfumes by name, brand, or notes</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Start Search
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/user/${user?.id}`)}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-secondary" />
                <CardTitle>Public Profile</CardTitle>
              </div>
              <CardDescription>View and share your public profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full">
                View Profile
              </Button>
              <Button 
                variant="secondary" 
                className="w-full gap-2" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleShareProfile();
                }}
              >
                <Share2 className="h-4 w-4" />
                Share Link
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent" />
              <CardTitle>Quick Tip</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/90">
              Add perfumes to your collection and rate them to get more accurate AI recommendations based on your preferences!
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
