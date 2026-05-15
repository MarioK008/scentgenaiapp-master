
-- Wear logs table
CREATE TABLE public.wear_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  perfume_id UUID NOT NULL,
  worn_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_wear_logs_user_perfume ON public.wear_logs(user_id, perfume_id);
CREATE INDEX idx_wear_logs_user_worn_at ON public.wear_logs(user_id, worn_at DESC);

ALTER TABLE public.wear_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wear logs"
ON public.wear_logs FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wear logs"
ON public.wear_logs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own wear logs"
ON public.wear_logs FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Sort order on collection items
ALTER TABLE public.collection_items
  ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;

CREATE INDEX idx_collection_items_collection_sort
  ON public.collection_items(collection_id, sort_order);
