import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Search, Sparkles, ExternalLink, Clock, Flame } from "lucide-react";

interface TrendResult {
  content: string;
  citations: string[];
}

const TRENDING_TOPICS = [
  { label: "Trending 2025", query: "What are the most trending perfumes and fragrances for 2025?" },
  { label: "New Releases", query: "What are the latest new perfume releases this month?" },
  { label: "Niche Fragrances", query: "What niche fragrances are gaining popularity right now?" },
  { label: "Celebrity Launches", query: "What celebrity perfume launches have happened recently?" },
  { label: "Sustainable Scents", query: "What are the trending sustainable and eco-friendly perfumes?" },
  { label: "Summer Picks", query: "What are the best trending summer fragrances for 2025?" },
];

const Trends = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [result, setResult] = useState<TrendResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeQuery, setActiveQuery] = useState<string | null>(null);
  const { toast } = useToast();

  const searchTrends = async (query: string) => {
    setIsLoading(true);
    setActiveQuery(query);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("search-trends", {
        body: { query, searchRecency: "month" },
      });

      if (error) throw error;

      setResult({
        content: data.content,
        citations: data.citations || [],
      });
    } catch (error: any) {
      console.error("Error searching trends:", error);
      toast({
        title: "Search Failed",
        description: error.message || "Unable to fetch trends. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchTrends(searchQuery.trim());
    }
  };

  const handleTopicClick = (query: string) => {
    setSearchQuery(query);
    searchTrends(query);
  };

  const formatContent = (content: string) => {
    // Split by double newlines for paragraphs and render with proper spacing
    return content.split("\n\n").map((paragraph, idx) => (
      <p key={idx} className="mb-4 leading-relaxed text-foreground/90">
        {paragraph}
      </p>
    ));
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
            <TrendingUp className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium text-accent">Real-Time Insights</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-playfair font-bold text-foreground">
            Perfume Trends
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover the latest fragrance industry news, trending scents, and upcoming releases powered by AI
          </p>
        </div>

        {/* Search Form */}
        <Card className="gradient-card border-border/30">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Ask about perfume trends, news, or releases..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 bg-background/50 border-border/50 focus:border-accent"
                />
              </div>
              <Button 
                type="submit" 
                variant="premium" 
                className="h-12 px-6"
                disabled={isLoading || !searchQuery.trim()}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Search
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Trending Topics */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-foreground">Trending Topics</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {TRENDING_TOPICS.map((topic) => (
              <Button
                key={topic.label}
                variant="outline"
                size="sm"
                onClick={() => handleTopicClick(topic.query)}
                disabled={isLoading}
                className={`rounded-full transition-all ${
                  activeQuery === topic.query 
                    ? "bg-accent/20 border-accent text-accent" 
                    : "hover:bg-accent/10 hover:border-accent/50"
                }`}
              >
                {topic.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Results */}
        {isLoading && (
          <Card className="gradient-card border-border/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-6 w-48" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </CardContent>
          </Card>
        )}

        {result && !isLoading && (
          <Card className="gradient-card border-border/30 animate-fade-in">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Sparkles className="h-5 w-5 text-accent" />
                  AI Insights
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  Just now
                </Badge>
              </div>
              {activeQuery && (
                <p className="text-sm text-muted-foreground italic">"{activeQuery}"</p>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Content */}
              <div className="prose prose-invert max-w-none">
                {formatContent(result.content)}
              </div>

              {/* Citations */}
              {result.citations.length > 0 && (
                <div className="pt-4 border-t border-border/30">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Sources ({result.citations.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {result.citations.map((url, idx) => {
                      const domain = new URL(url).hostname.replace("www.", "");
                      return (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-full bg-secondary/50 hover:bg-accent/20 text-muted-foreground hover:text-accent transition-colors border border-border/30"
                        >
                          <span className="truncate max-w-[150px]">{domain}</span>
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!result && !isLoading && (
          <Card className="gradient-card border-border/30 border-dashed">
            <CardContent className="py-12 text-center">
              <TrendingUp className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Explore Perfume Trends
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Search for the latest fragrance news or click a trending topic above to discover what's happening in the perfume world
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Trends;
