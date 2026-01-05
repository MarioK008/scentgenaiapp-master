import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { ImageIcon, RefreshCw, Sparkles, CheckCircle, XCircle, FlaskConical } from "lucide-react";
import Layout from "@/components/Layout";

interface GenerationResult {
  id: string;
  success: boolean;
  imageUrl?: string;
  error?: string;
}

interface PerfumeWithImage {
  id: string;
  name: string;
  image_url: string;
  updated_at: string;
  brand: { name: string }[] | null;
}

const AdminImages = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<GenerationResult[]>([]);

  // Fetch perfume stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["perfume-image-stats"],
    queryFn: async () => {
      const { data: all, error: allError } = await supabase
        .from("perfumes")
        .select("id, image_url", { count: "exact" });

      if (allError) throw allError;

      const withImages = all?.filter((p) => p.image_url) || [];
      const withoutImages = all?.filter((p) => !p.image_url) || [];

      return {
        total: all?.length || 0,
        withImages: withImages.length,
        withoutImages: withoutImages.length,
        perfumesWithoutImages: withoutImages,
      };
    },
  });

  // Fetch recently generated images
  const { data: recentImages, isLoading: imagesLoading } = useQuery({
    queryKey: ["recent-perfume-images"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("perfumes")
        .select("id, name, image_url, updated_at, brand:brands!brand_id(name)")
        .not("image_url", "is", null)
        .order("updated_at", { ascending: false })
        .limit(12);

      if (error) throw error;
      return data as PerfumeWithImage[];
    },
  });

  // Generate images for a batch of perfumes
  const generateBatch = async (ids: string[]): Promise<GenerationResult[]> => {
    const { data, error } = await supabase.functions.invoke("generate-perfume-image", {
      body: { perfumeIds: ids },
    });

    if (error) {
      console.error("Batch generation error:", error);
      return ids.map((id) => ({ id, success: false, error: error.message }));
    }

    return data.results || [];
  };

  // Generate images for specified count of perfumes
  const handleGenerate = async (count?: number) => {
    if (!stats?.perfumesWithoutImages.length) {
      toast({
        title: "No images to generate",
        description: "All perfumes already have images!",
      });
      return;
    }

    setIsGenerating(true);
    setResults([]);

    const allIds = stats.perfumesWithoutImages.map((p) => p.id);
    const idsToProcess = count ? allIds.slice(0, count) : allIds;
    
    setProgress({ current: 0, total: idsToProcess.length });

    const batchSize = 5;
    const allResults: GenerationResult[] = [];

    try {
      for (let i = 0; i < idsToProcess.length; i += batchSize) {
        const batch = idsToProcess.slice(i, i + batchSize);
        const batchResults = await generateBatch(batch);
        allResults.push(...batchResults);
        setResults([...allResults]);
        setProgress({ current: Math.min(i + batchSize, idsToProcess.length), total: idsToProcess.length });

        // Check for rate limiting
        const rateLimited = batchResults.some((r) => r.error?.includes("Rate limited"));
        if (rateLimited) {
          toast({
            title: "Rate Limited",
            description: "Pausing for 30 seconds before continuing...",
            variant: "destructive",
          });
          await new Promise((resolve) => setTimeout(resolve, 30000));
        }

        // Delay between batches
        if (i + batchSize < idsToProcess.length) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      const successCount = allResults.filter((r) => r.success).length;
      toast({
        title: "Generation Complete",
        description: `Successfully generated ${successCount}/${idsToProcess.length} images`,
      });

      queryClient.invalidateQueries({ queryKey: ["perfume-image-stats"] });
      queryClient.invalidateQueries({ queryKey: ["recent-perfume-images"] });
      queryClient.invalidateQueries({ queryKey: ["perfumes"] });
    } catch (error) {
      console.error("Generation error:", error);
      toast({
        title: "Generation Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate image for a single perfume
  const regenerateMutation = useMutation({
    mutationFn: async (perfumeId: string) => {
      const { data, error } = await supabase.functions.invoke("generate-perfume-image", {
        body: { perfumeId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Image regenerated successfully" });
      queryClient.invalidateQueries({ queryKey: ["perfume-image-stats"] });
      queryClient.invalidateQueries({ queryKey: ["recent-perfume-images"] });
      queryClient.invalidateQueries({ queryKey: ["perfumes"] });
    },
    onError: (error) => {
      toast({
        title: "Regeneration failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-playfair">AI Image Generation</h1>
          <p className="text-muted-foreground mt-2">
            Generate elegant product images for perfumes using AI
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Perfumes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {statsLoading ? "..." : stats?.total || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                With Images
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-500">
                {statsLoading ? "..." : stats?.withImages || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <XCircle className="h-4 w-4 text-orange-500" />
                Without Images
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-500">
                {statsLoading ? "..." : stats?.withoutImages || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Generate All Button */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Batch Image Generation
            </CardTitle>
            <CardDescription>
              Generate AI images for all perfumes that don't have images yet.
              This process may take several minutes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                variant="outline"
                onClick={() => handleGenerate(5)}
                disabled={isGenerating || !stats?.withoutImages}
              >
                {isGenerating && progress.total === 5 ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <FlaskConical className="h-4 w-4 mr-2" />
                    Test with 5 Perfumes
                  </>
                )}
              </Button>
              
              <Button
                size="lg"
                variant="premium"
                onClick={() => handleGenerate()}
                disabled={isGenerating || !stats?.withoutImages}
              >
                {isGenerating && progress.total > 5 ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Generate All ({stats?.withoutImages || 0})
                  </>
                )}
              </Button>
            </div>

            {isGenerating && progress.total > 0 && (
              <div className="space-y-2">
                <Progress value={(progress.current / progress.total) * 100} />
                <p className="text-sm text-muted-foreground">
                  Progress: {progress.current} / {progress.total} perfumes
                  {successCount > 0 && ` • ${successCount} successful`}
                  {failCount > 0 && ` • ${failCount} failed`}
                </p>
              </div>
            )}

            {results.length > 0 && !isGenerating && (
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <p className="font-medium">Generation Results:</p>
                <p className="text-sm text-muted-foreground">
                  ✅ {successCount} images generated successfully
                </p>
                {failCount > 0 && (
                  <p className="text-sm text-destructive">
                    ❌ {failCount} images failed to generate
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recently Generated Images Gallery */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              Recently Generated Images
            </CardTitle>
            <CardDescription>
              Preview of the most recently updated perfume images
            </CardDescription>
          </CardHeader>
          <CardContent>
            {imagesLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-lg bg-muted animate-pulse"
                  />
                ))}
              </div>
            ) : recentImages && recentImages.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {recentImages.map((perfume) => (
                  <div
                    key={perfume.id}
                    className="group relative aspect-square rounded-lg overflow-hidden bg-muted border border-border/50 hover:border-primary/50 transition-colors"
                  >
                    <img
                      src={perfume.image_url}
                      alt={perfume.name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-sm font-medium truncate">{perfume.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {perfume.brand?.[0]?.name || "Unknown brand"}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background"
                      onClick={() => regenerateMutation.mutate(perfume.id)}
                      disabled={regenerateMutation.isPending}
                    >
                      <RefreshCw className={`h-4 w-4 ${regenerateMutation.isPending ? "animate-spin" : ""}`} />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No generated images yet</p>
                <p className="text-sm text-muted-foreground/70">
                  Use the batch generation above to create images
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Results */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Generation Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {results.slice(-20).reverse().map((result, idx) => (
                  <div
                    key={`${result.id}-${idx}`}
                    className={`flex items-center justify-between p-2 rounded text-sm ${
                      result.success ? "bg-green-500/10" : "bg-destructive/10"
                    }`}
                  >
                    <span className="font-mono text-xs truncate max-w-[200px]">
                      {result.id}
                    </span>
                    {result.success ? (
                      <span className="text-green-500 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Success
                      </span>
                    ) : (
                      <span className="text-destructive flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        {result.error || "Failed"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default AdminImages;
