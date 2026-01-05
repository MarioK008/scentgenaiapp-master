-- Create saved_trends table for bookmarking trend insights
CREATE TABLE public.saved_trends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  query TEXT NOT NULL,
  content TEXT NOT NULL,
  citations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_trends ENABLE ROW LEVEL SECURITY;

-- Users can view their own saved trends
CREATE POLICY "Users can view their own saved trends"
ON public.saved_trends
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own saved trends
CREATE POLICY "Users can create their own saved trends"
ON public.saved_trends
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own saved trends
CREATE POLICY "Users can delete their own saved trends"
ON public.saved_trends
FOR DELETE
USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_saved_trends_user_id ON public.saved_trends(user_id);
CREATE INDEX idx_saved_trends_created_at ON public.saved_trends(created_at DESC);