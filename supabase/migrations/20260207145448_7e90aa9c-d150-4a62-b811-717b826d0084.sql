-- Fix #1: Create a public view for profiles that excludes the email column
-- This view can be used when viewing other users' profiles

CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = on)
AS SELECT 
  id,
  username,
  avatar_url,
  bio,
  location,
  is_private,
  preferred_families,
  preferred_occasions,
  preferred_seasons,
  created_at,
  updated_at
FROM public.profiles;

-- Add comment explaining the purpose
COMMENT ON VIEW public.profiles_public IS 'Public view of profiles table that excludes sensitive fields like email. Use this view when querying profiles for users other than the current user.';

-- The existing profile policies are fine for the base table since:
-- 1. Users can only INSERT their own profile (auth.uid() = id)
-- 2. Users can only UPDATE their own profile (auth.uid() = id) 
-- 3. SELECT allows viewing based on privacy settings
-- However, the email column is exposed. Since RLS works at row level, not column level,
-- the code should use explicit column selection when querying other users' profiles.

-- Note: The waitlist table already has proper admin-only SELECT policy:
-- "Admins can view waitlist" uses has_role(auth.uid(), 'admin'::app_role)
-- No changes needed for waitlist