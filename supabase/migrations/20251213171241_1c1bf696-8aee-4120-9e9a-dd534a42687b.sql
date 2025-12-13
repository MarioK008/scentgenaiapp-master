-- 1. Fix rate_limits table - remove overly permissive policy
DROP POLICY IF EXISTS "Service role can manage rate limits" ON rate_limits;

-- 2. Update profiles SELECT policy to respect privacy settings
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;

CREATE POLICY "Users can view profiles based on privacy"
ON profiles FOR SELECT TO authenticated
USING (
  auth.uid() = id  -- Own profile
  OR is_private = false  -- Public profiles
  OR EXISTS (  -- Approved followers can see private profiles
    SELECT 1 FROM user_follows
    WHERE followed_id = profiles.id
    AND follower_id = auth.uid()
    AND status = 'approved'
  )
);

-- 3. Fix avatars storage bucket - add WITH CHECK to restrict upload paths
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;

CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Also fix UPDATE policy for avatars
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);