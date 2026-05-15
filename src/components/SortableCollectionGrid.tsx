import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import PerfumeCard, { PerfumeData } from "@/components/PerfumeCard";
import { GripVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SortableItemProps {
  perfume: PerfumeData;
  onClick?: () => void;
  wearSlot?: React.ReactNode;
}

const SortableItem = ({ perfume, onClick, wearSlot }: SortableItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: perfume.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <button
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 z-20 bg-background/80 backdrop-blur-sm rounded-full p-1.5 border border-border/50 cursor-grab active:cursor-grabbing touch-none"
        aria-label="Drag to reorder"
        onClick={(e) => e.preventDefault()}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <PerfumeCard perfume={perfume} showActions={false} onClick={onClick} />
      {wearSlot && <div className="mt-2">{wearSlot}</div>}
    </div>
  );
};

interface SortableCollectionGridProps {
  collectionId: string;
  perfumes: PerfumeData[];
  onSelect?: (perfume: PerfumeData) => void;
  renderWearSlot?: (perfume: PerfumeData) => React.ReactNode;
}

export const SortableCollectionGrid = ({
  collectionId,
  perfumes,
  onSelect,
  renderWearSlot,
}: SortableCollectionGridProps) => {
  const [items, setItems] = useState<PerfumeData[]>(perfumes);

  useEffect(() => {
    setItems(perfumes);
  }, [perfumes]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);

    try {
      await Promise.all(
        next.map((p, idx) =>
          supabase
            .from("collection_items")
            .update({ sort_order: idx } as any)
            .eq("collection_id", collectionId)
            .eq("perfume_id", p.id)
        )
      );
    } catch (e) {
      console.error("Failed to persist order", e);
      toast.error("Could not save new order");
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
          {items.map((perfume) => (
            <SortableItem
              key={perfume.id}
              perfume={perfume}
              onClick={() => onSelect?.(perfume)}
              wearSlot={renderWearSlot?.(perfume)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
