import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface CustomCollection {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  item_count?: number;
}

export interface CollectionItem {
  id: string;
  collection_id: string;
  perfume_id: string;
  added_at: string;
  notes: string | null;
}

export const useCustomCollections = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [collections, setCollections] = useState<CustomCollection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCollections = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch collections with item counts
      const { data: collectionsData, error } = await supabase
        .from("custom_collections")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch item counts for each collection
      const { data: countData } = await supabase
        .from("collection_items")
        .select("collection_id");

      const countMap = new Map<string, number>();
      countData?.forEach(item => {
        countMap.set(item.collection_id, (countMap.get(item.collection_id) || 0) + 1);
      });

      const enrichedCollections = (collectionsData || []).map(c => ({
        ...c,
        item_count: countMap.get(c.id) || 0
      }));

      setCollections(enrichedCollections);
    } catch (error: any) {
      console.error("Error fetching collections:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const createCollection = async (name: string, description?: string, icon?: string, color?: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("custom_collections")
        .insert({
          user_id: user.id,
          name,
          description: description || null,
          icon: icon || "📁",
          color: color || "default",
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: "Success", description: "Collection created" });
      await fetchCollections();
      return data;
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return null;
    }
  };

  const updateCollection = async (id: string, updates: Partial<Pick<CustomCollection, 'name' | 'description' | 'icon' | 'color'>>) => {
    try {
      const { error } = await supabase
        .from("custom_collections")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Success", description: "Collection updated" });
      await fetchCollections();
      return true;
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    }
  };

  const deleteCollection = async (id: string) => {
    try {
      const { error } = await supabase
        .from("custom_collections")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Success", description: "Collection deleted" });
      await fetchCollections();
      return true;
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    }
  };

  const addToCollection = async (collectionId: string, perfumeId: string, notes?: string) => {
    try {
      const { error } = await supabase
        .from("collection_items")
        .insert({
          collection_id: collectionId,
          perfume_id: perfumeId,
          notes: notes || null,
        });

      if (error) {
        if (error.code === "23505") {
          toast({ title: "Already added", description: "This perfume is already in this collection", variant: "destructive" });
          return false;
        }
        throw error;
      }

      toast({ title: "Success", description: "Added to collection" });
      await fetchCollections();
      return true;
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    }
  };

  const removeFromCollection = async (collectionId: string, perfumeId: string) => {
    try {
      const { error } = await supabase
        .from("collection_items")
        .delete()
        .eq("collection_id", collectionId)
        .eq("perfume_id", perfumeId);

      if (error) throw error;

      toast({ title: "Success", description: "Removed from collection" });
      await fetchCollections();
      return true;
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    }
  };

  const getCollectionItems = async (collectionId: string) => {
    try {
      const { data, error } = await supabase
        .from("collection_items")
        .select(`
          id,
          collection_id,
          perfume_id,
          added_at,
          notes
        `)
        .eq("collection_id", collectionId)
        .order("added_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching collection items:", error);
      return [];
    }
  };

  return {
    collections,
    loading,
    createCollection,
    updateCollection,
    deleteCollection,
    addToCollection,
    removeFromCollection,
    getCollectionItems,
    refetch: fetchCollections,
  };
};
