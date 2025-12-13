import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Check } from "lucide-react";
import { CustomCollection } from "@/hooks/useCustomCollections";

interface AddToCollectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  collections: CustomCollection[];
  onAddToCollection: (collectionId: string) => Promise<boolean>;
  onCreateNew: () => void;
  perfumeName?: string;
}

const AddToCollectionDialog = ({
  isOpen,
  onClose,
  collections,
  onAddToCollection,
  onCreateNew,
  perfumeName,
}: AddToCollectionDialogProps) => {
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [addedTo, setAddedTo] = useState<Set<string>>(new Set());

  const handleAdd = async (collectionId: string) => {
    setAddingTo(collectionId);
    const success = await onAddToCollection(collectionId);
    setAddingTo(null);
    
    if (success) {
      setAddedTo(prev => new Set([...prev, collectionId]));
    }
  };

  const handleClose = () => {
    setAddedTo(new Set());
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Add to Collection
            {perfumeName && (
              <span className="block text-sm font-normal text-muted-foreground mt-1">
                {perfumeName}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-80">
          <div className="space-y-2 pr-4">
            {collections.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No collections yet. Create one to get started!
              </p>
            ) : (
              collections.map((collection) => {
                const isAdded = addedTo.has(collection.id);
                const isAdding = addingTo === collection.id;

                return (
                  <button
                    key={collection.id}
                    onClick={() => !isAdded && handleAdd(collection.id)}
                    disabled={isAdding || isAdded}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                      isAdded
                        ? "bg-primary/10 border border-primary/30"
                        : "bg-secondary/30 hover:bg-secondary/50 border border-transparent"
                    }`}
                  >
                    <span className="text-2xl">{collection.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{collection.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {collection.item_count || 0} {collection.item_count === 1 ? "perfume" : "perfumes"}
                      </p>
                    </div>
                    {isAdded ? (
                      <Check className="h-5 w-5 text-primary" />
                    ) : isAdding ? (
                      <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Plus className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>

        <Button
          variant="outline"
          className="w-full mt-2"
          onClick={() => {
            handleClose();
            onCreateNew();
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Collection
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default AddToCollectionDialog;
