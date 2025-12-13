-- Create custom collections table
CREATE TABLE public.custom_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '📁',
  color TEXT DEFAULT 'default',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create collection items junction table
CREATE TABLE public.collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES public.custom_collections(id) ON DELETE CASCADE NOT NULL,
  perfume_id UUID REFERENCES public.perfumes(id) ON DELETE CASCADE NOT NULL,
  added_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  UNIQUE(collection_id, perfume_id)
);

-- Enable RLS
ALTER TABLE public.custom_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for custom_collections
CREATE POLICY "Users can view own collections"
ON public.custom_collections FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own collections"
ON public.custom_collections FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections"
ON public.custom_collections FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections"
ON public.custom_collections FOR DELETE
USING (auth.uid() = user_id AND is_default = false);

-- RLS policies for collection_items
CREATE POLICY "Users can view own collection items"
ON public.collection_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.custom_collections
    WHERE id = collection_items.collection_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can add to own collections"
ON public.collection_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.custom_collections
    WHERE id = collection_items.collection_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can remove from own collections"
ON public.collection_items FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.custom_collections
    WHERE id = collection_items.collection_id
    AND user_id = auth.uid()
  )
);

-- Indexes for performance
CREATE INDEX idx_custom_collections_user_id ON public.custom_collections(user_id);
CREATE INDEX idx_collection_items_collection_id ON public.collection_items(collection_id);
CREATE INDEX idx_collection_items_perfume_id ON public.collection_items(perfume_id);

-- Trigger for updated_at
CREATE TRIGGER update_custom_collections_updated_at
BEFORE UPDATE ON public.custom_collections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();