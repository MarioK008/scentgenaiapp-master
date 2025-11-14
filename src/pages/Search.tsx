import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import PerfumeCard from "@/components/PerfumeCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon } from "lucide-react";

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

const Search = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [perfumes, setPerfumes] = useState<Perfume[]>([]);
  const [filteredPerfumes, setFilteredPerfumes] = useState<Perfume[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingPerfumes, setLoadingPerfumes] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchPerfumes();
    }
  }, [user]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPerfumes(perfumes);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = perfumes.filter((perfume) => {
      return (
        perfume.name.toLowerCase().includes(query) ||
        perfume.brand.toLowerCase().includes(query) ||
        perfume.top_notes?.some((note) => note.toLowerCase().includes(query)) ||
        perfume.heart_notes?.some((note) => note.toLowerCase().includes(query)) ||
        perfume.base_notes?.some((note) => note.toLowerCase().includes(query)) ||
        perfume.description?.toLowerCase().includes(query)
      );
    });
    setFilteredPerfumes(filtered);
  }, [searchQuery, perfumes]);

  const fetchPerfumes = async () => {
    const { data, error } = await supabase
      .from("perfumes")
      .select("*")
      .order("name");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load perfumes",
        variant: "destructive",
      });
    } else {
      setPerfumes(data || []);
      setFilteredPerfumes(data || []);
    }
    setLoadingPerfumes(false);
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

  if (loading || loadingPerfumes) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Search Perfumes</h1>
          <p className="text-muted-foreground">
            Find perfumes by name, brand, notes, or description
          </p>
        </div>

        <div className="relative">
          <SearchIcon className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search for perfumes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="text-sm text-muted-foreground">
          Showing {filteredPerfumes.length} of {perfumes.length} perfumes
        </div>

        {filteredPerfumes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No perfumes found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPerfumes.map((perfume) => (
              <PerfumeCard
                key={perfume.id}
                perfume={perfume}
                onAddToCollection={handleAddToCollection}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Search;
