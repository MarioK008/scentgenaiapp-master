import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import PerfumeCard from "@/components/PerfumeCard";
import PerfumeDetailModal from "@/components/PerfumeDetailModal";
import AddToCollectionDialog from "@/components/AddToCollectionDialog";
import CreateCollectionDialog from "@/components/CreateCollectionDialog";
import { useCustomCollections } from "@/hooks/useCustomCollections";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon } from "lucide-react";
import { usePerfumes, Perfume } from "@/hooks/usePerfumes";
import { supabase } from "@/integrations/supabase/client";

const Search = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { perfumes, loading: loadingPerfumes, error: perfumesError } = usePerfumes();
  const { collections, createCollection, addToCollection } = useCustomCollections();
  
  const [filteredPerfumes, setFilteredPerfumes] = useState<Perfume[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPerfume, setSelectedPerfume] = useState<Perfume | null>(null);
  const [addingPerfume, setAddingPerfume] = useState<Perfume | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPerfumes(perfumes);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = perfumes.filter((perfume) => {
      const brandName = typeof perfume.brand === 'string' ? perfume.brand : perfume.brand?.name || '';
      return (
        perfume.name.toLowerCase().includes(query) ||
        brandName.toLowerCase().includes(query) ||
        perfume.notes?.some((note) => note.name.toLowerCase().includes(query)) ||
        perfume.description?.toLowerCase().includes(query) ||
        perfume.concentration?.toLowerCase().includes(query)
      );
    });
    setFilteredPerfumes(filtered);
  }, [searchQuery, perfumes]);

  const handleAddToLegacyCollection = async (perfumeId: string, status: "owned" | "wishlist") => {
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

  const handleAddToCustomCollection = async (collectionId: string) => {
    if (!addingPerfume) return false;
    return await addToCollection(collectionId, addingPerfume.id);
  };

  if (loading || loadingPerfumes) {
    return <div className="min-h-screen flex items-center justify-center text-foreground">Loading perfumes...</div>;
  }

  if (perfumesError) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-destructive">Error loading perfumes: {perfumesError}</p>
        </div>
      </Layout>
    );
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
                onAddToCollection={(id, status) => {
                  if (status === "owned" || status === "wishlist") {
                    handleAddToLegacyCollection(id, status);
                  }
                }}
                onAddToCustomCollection={() => setAddingPerfume(perfume)}
                onClick={() => setSelectedPerfume(perfume)}
              />
            ))}
          </div>
        )}
      </div>

      <PerfumeDetailModal
        perfume={selectedPerfume}
        isOpen={!!selectedPerfume}
        onClose={() => setSelectedPerfume(null)}
        onAddToCollection={handleAddToLegacyCollection}
      />

      <AddToCollectionDialog
        isOpen={!!addingPerfume}
        onClose={() => setAddingPerfume(null)}
        collections={collections}
        onAddToCollection={handleAddToCustomCollection}
        onCreateNew={() => setShowCreateDialog(true)}
        perfumeName={addingPerfume?.name}
      />

      <CreateCollectionDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSubmit={createCollection}
      />
    </Layout>
  );
};

export default Search;
