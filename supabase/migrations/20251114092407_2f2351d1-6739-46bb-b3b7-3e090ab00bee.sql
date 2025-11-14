-- Drop the existing restrictive policy for viewing collections
DROP POLICY IF EXISTS "Users can view own collections" ON public.user_collections;

-- Create new policy to allow public viewing of all collections
CREATE POLICY "Anyone can view collections" 
ON public.user_collections 
FOR SELECT 
USING (true);

-- Add index for better performance when querying by user_id
CREATE INDEX IF NOT EXISTS idx_user_collections_user_id ON public.user_collections(user_id);