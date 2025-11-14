import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import PerfumeCard from "@/components/PerfumeCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles } from "lucide-react";

interface Perfume {
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
}

const Recommendations = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [recommendations, setRecommendations] = useState<Perfume[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [mood, setMood] = useState("");
  const [occasion, setOccasion] = useState("");
  const [season, setSeason] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

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
        description: `Added to ${status === "owned" ? "collection" : "wishlist"}`,
      });
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-accent" />
            AI Recommendations
          </h1>
          <p className="text-muted-foreground">
            Get personalized fragrance suggestions based on your preferences
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tell us what you're looking for</CardTitle>
            <CardDescription>Select your preferences to get AI-powered recommendations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Mood</Label>
                <Select value={mood} onValueChange={setMood}>
                  <SelectTrigger>
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

              <div className="space-y-2">
                <Label>Occasion</Label>
                <Select value={occasion} onValueChange={setOccasion}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select occasion" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily Wear</SelectItem>
                    <SelectItem value="work">Work</SelectItem>
                    <SelectItem value="evening">Evening</SelectItem>
                    <SelectItem value="date">Date Night</SelectItem>
                    <SelectItem value="special">Special Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Season</Label>
                <Select value={season} onValueChange={setSeason}>
                  <SelectTrigger>
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
              className="w-full"
            >
              {loadingRecs ? "Getting recommendations..." : "Get Recommendations"}
            </Button>
          </CardContent>
        </Card>

        {recommendations.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Recommended for you</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((perfume) => (
                <PerfumeCard
                  key={perfume.id}
                  perfume={perfume}
                  onAddToCollection={handleAddToCollection}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Recommendations;
