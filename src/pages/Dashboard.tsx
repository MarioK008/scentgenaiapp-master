import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCollectionStats } from "@/hooks/useCollectionStats";
import { useOnboarding, OnboardingPreferences } from "@/hooks/useOnboarding";
import { useProfile } from "@/hooks/useProfile";
import { useSEO } from "@/hooks/useSEO";
import Layout from "@/components/Layout";
import { FollowRequests } from "@/components/FollowRequests";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { ScentProfileReveal } from "@/components/ScentProfileReveal";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";
import { WearReengagementBanner } from "@/components/WearReengagementBanner";
import { AnimatedPage } from "@/components/AnimatedPage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Sparkles, Search, TrendingUp, Share2, User, MessageSquare } from "lucide-react";
import { toast } from "sonner";

const Dashboard = () => {
  const { user, loading } = useAuth();
  const { profile } = useProfile();
  const { stats, loading: statsLoading } = useCollectionStats(user?.id);
  const {
    showOnboarding,
    loading: onboardingLoading,
    saving,
    savedStep,
    savePreferences,
    skipOnboarding,
    updateStep,
    resetStep,
  } = useOnboarding();
  const navigate = useNavigate();
  const [revealFamilies, setRevealFamilies] = useState<string[] | null>(null);

  const handleOnboardingComplete = async (prefs: OnboardingPreferences) => {
    const ok = await savePreferences(prefs);
    if (ok && prefs.preferred_families.length > 0) {
      setRevealFamilies(prefs.preferred_families);
    }
  };


  useSEO({ 
    title: 'Dashboard', 
    description: 'Manage your fragrance collection and get personalized recommendations' 
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading || statsLoading) {
    return (
      <Layout>
        <DashboardSkeleton />
      </Layout>
    );
  }

  const handleShareProfile = () => {
    const profileUrl = `${window.location.origin}/user/${user?.id}`;
    navigator.clipboard.writeText(profileUrl);
    toast.success("Profile link copied to clipboard!");
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const userName = profile?.username || user?.email?.split('@')[0] || 'there';

  return (
    <Layout>
      {/* Onboarding Wizard */}
      <OnboardingWizard
        open={showOnboarding && !onboardingLoading && !revealFamilies}
        onComplete={handleOnboardingComplete}
        onSkip={skipOnboarding}
        saving={saving}
        initialStep={savedStep}
        onStepChange={updateStep}
        onStartOver={resetStep}
      />

      {/* Scent Profile Reveal */}
      {revealFamilies && (
        <ScentProfileReveal
          families={revealFamilies}
          onComplete={() => setRevealFamilies(null)}
        />
      )}

      <AnimatedPage className="space-y-10">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-playfair">
            {getGreeting()}, <span className="gradient-text">{userName}</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Discover, organize, and explore your fragrance journey
          </p>
        </div>

        <FollowRequests />

        {user && <WearReengagementBanner userId={user.id} />}

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          <Card 
            className="group cursor-pointer card-hover-lift border-primary/20 hover:border-primary/40" 
            onClick={() => navigate("/collections")}
          >
            <CardHeader className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-elegant group-hover:shadow-glow transition-smooth">
                  <Heart className="h-7 w-7 text-white" strokeWidth={1.5} />
                </div>
                <div>
                  <CardTitle className="text-2xl">My Collection</CardTitle>
                  <CardDescription className="text-base">Browse and manage your favorites</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="hero" className="w-full">
                View Collection
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="group cursor-pointer card-hover-lift border-accent/20 hover:border-accent/40" 
            onClick={() => navigate("/recommendations")}
          >
            <CardHeader className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center shadow-gold group-hover:animate-glow-pulse transition-smooth">
                  <Sparkles className="h-7 w-7 text-accent" strokeWidth={1.5} />
                </div>
                <div>
                  <CardTitle className="text-2xl">Get Recommendations</CardTitle>
                  <CardDescription className="text-base">AI-powered fragrance suggestions</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="hero" className="w-full">
                Discover Now
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="group cursor-pointer card-hover-lift" 
            onClick={() => navigate("/voice-assistant")}
          >
            <CardHeader className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center shadow-elegant group-hover:shadow-glow transition-smooth">
                  <MessageSquare className="h-7 w-7 text-primary" strokeWidth={1.5} />
                </div>
                <div>
                  <CardTitle className="text-2xl">MyScentGenAI</CardTitle>
                  <CardDescription className="text-base">Chat with your AI consultant</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="hero" className="w-full">
                Start Chat
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="group cursor-pointer card-hover-lift" 
            onClick={() => navigate("/search")}
          >
            <CardHeader className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center group-hover:bg-secondary/80 transition-smooth">
                  <Search className="h-7 w-7 text-foreground" strokeWidth={1.5} />
                </div>
                <div>
                  <CardTitle className="text-2xl">Search Perfumes</CardTitle>
                  <CardDescription className="text-base">Find by name, brand, or notes</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="hero" className="w-full">
                Start Search
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats - Premium Design */}
        <Card className="relative border-primary/20 overflow-hidden">
          <div className="absolute inset-0 gradient-accent opacity-30" />
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-primary" strokeWidth={1.5} />
                <CardTitle className="text-2xl">Your Journey</CardTitle>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost-gold" size="sm" className="gap-2" onClick={handleShareProfile}>
                  <Share2 className="h-4 w-4" strokeWidth={1.5} />
                  Share
                </Button>
                <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate(`/user/${user?.id}`)}>
                  <User className="h-4 w-4" strokeWidth={1.5} />
                  Profile
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <div className="text-center p-6 rounded-2xl glass">
                <p className="text-4xl md:text-5xl font-bold font-playfair gradient-text mb-2">
                  {stats.ownedCount}
                </p>
                <p className="text-sm text-muted-foreground font-medium">Favorites</p>
              </div>
              <div className="text-center p-6 rounded-2xl glass">
                <p className="text-4xl md:text-5xl font-bold font-playfair text-accent mb-2">
                  {stats.wishlistCount}
                </p>
                <p className="text-sm text-muted-foreground font-medium">Wishlist</p>
              </div>
              <div className="text-center p-6 rounded-2xl glass">
                <p className="text-4xl md:text-5xl font-bold font-playfair gradient-text mb-2">
                  {stats.reviewsCount}
                </p>
                <p className="text-sm text-muted-foreground font-medium">Reviews</p>
              </div>
              <div className="text-center p-6 rounded-2xl glass">
                <p className="text-4xl md:text-5xl font-bold font-playfair text-accent mb-2">
                  {stats.favoritesCount}
                </p>
                <p className="text-sm text-muted-foreground font-medium">Top Rated</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </AnimatedPage>
    </Layout>
  );
};

export default Dashboard;
