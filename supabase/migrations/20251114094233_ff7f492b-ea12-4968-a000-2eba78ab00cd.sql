-- Add privacy settings to profiles
ALTER TABLE public.profiles 
ADD COLUMN is_private BOOLEAN DEFAULT false;

-- Add status to user_follows for follow requests
CREATE TYPE follow_status AS ENUM ('pending', 'approved', 'rejected');

ALTER TABLE public.user_follows 
ADD COLUMN status follow_status DEFAULT 'approved';

-- Update existing follows to be approved
UPDATE public.user_follows SET status = 'approved' WHERE status IS NULL;

-- Make status required
ALTER TABLE public.user_follows 
ALTER COLUMN status SET NOT NULL;

-- Update RLS policy for user_collections to respect privacy
DROP POLICY IF EXISTS "Anyone can view collections" ON public.user_collections;

CREATE POLICY "Users can view public collections"
ON public.user_collections
FOR SELECT
USING (
  -- User can always see their own collections
  auth.uid() = user_id
  OR
  -- Can see collections from non-private profiles
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = user_collections.user_id
    AND profiles.is_private = false
  )
  OR
  -- Can see collections from private profiles if approved follower
  EXISTS (
    SELECT 1 FROM public.user_follows
    WHERE user_follows.followed_id = user_collections.user_id
    AND user_follows.follower_id = auth.uid()
    AND user_follows.status = 'approved'
  )
);

-- Update RLS policy for profiles to show privacy status
-- (profiles are still visible to show username/avatar, but collections are hidden)

-- Add policy for managing follow requests
CREATE POLICY "Users can approve/reject their follow requests"
ON public.user_follows
FOR UPDATE
USING (auth.uid() = followed_id)
WITH CHECK (auth.uid() = followed_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_follows_status ON public.user_follows(status);
CREATE INDEX IF NOT EXISTS idx_profiles_is_private ON public.profiles(is_private);