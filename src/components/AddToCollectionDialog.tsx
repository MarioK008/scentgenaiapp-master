import { useState, useEffect } from "react";
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

export interface LegacyCollectionOption {
  id: string; // e.g. "__owned" | "__wishlist"
  label: string;
  icon: string;
}

interface AddToCollectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  collections: CustomCollection[];
  onAddToCollection: (collectionId: string) => Promise<boolean>;
  onCreateNew: () => void;
  perfumeName?: string;
  legacyOptions?: LegacyCollectionOption[];
  onAddToLegacy?: (legacyId: string) => Promise<boolean>;
  /** IDs the perfume is already a member of — both legacy ("__owned") and custom collection UUIDs. */
  alreadyAddedIds?: Set<string>;
}

const AddToCollectionDialog = ({
  isOpen,
  onClose,
  collections,
  onAddToCollection,
  onCreateNew,
  perfumeName,
  legacyOptions = [],
  onAddToLegacy,
  alreadyAddedIds,
}: AddToCollectionDialogProps) => {
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedTo, setAddedTo] = useState<Set<string>>(new Set());

  // Reset local "just added" state whenever the dialog opens for a new perfume
  useEffect(() => {
    if (isOpen) setAddedTo(new Set());
  }, [isOpen, perfumeName]);

  const isAddedFor = (id: string) =>
    addedTo.has(id) || !!alreadyAddedIds?.has(id);

  const handleAdd = async (id: string, kind: "legacy" | "custom") => {
    setAddingId(id);
    const ok =
      kind === "legacy"
        ? !!(await onAddToLegacy?.(id))
        : await onAddToCollection(id);
    setAddingId(null);
    if (ok) setAddedTo((prev) => new Set([...prev, id]));
  };

  const handleClose = () => {
    setAddedTo(new Set());
    onClose();
  };

  const renderRow = (
    opt: { id: string; label: string; icon: string; meta?: string },
    kind: "legacy" | "custom"
  ) => {
    const added = isAddedFor(opt.id);
    const adding = addingId === opt.id;
    return (
      <button
        key={opt.id}
        type="button"
        onClick={() => !added && handleAdd(opt.id, kind)}
        disabled={adding || added}
        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
          added
            ? "bg-primary/10 border border-primary/30"
            : "bg-secondary/30 hover:bg-secondary/50 border border-transparent"
        }`}
      >
        <span className="text-2xl">{opt.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{opt.label}</p>
          {opt.meta && (
            <p className="text-xs text-muted-foreground">{opt.meta}</p>
          )}
        </div>
        {added ? (
          <Check className="h-5 w-5 text-primary" />
        ) : adding ? (
          <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        ) : (
          <Plus className="h-5 w-5 text-muted-foreground" />
        )}
      </button>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && handleClose()}>
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
            {legacyOptions.map((opt) => renderRow(opt, "legacy"))}

            {collections.length === 0 && legacyOptions.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No collections yet. Create one to get started!
              </p>
            ) : (
              collections.map((c) =>
                renderRow(
                  {
                    id: c.id,
                    label: c.name,
                    icon: c.icon,
                    meta: `${c.item_count || 0} ${
                      c.item_count === 1 ? "perfume" : "perfumes"
                    }`,
                  },
                  "custom"
                )
              )
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
