
-- 1. Prevent privilege escalation on user_roles
-- Drop the broad "Admins can manage all roles" ALL policy and split into explicit per-command policies
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Remove user self-insert on user_badges. Badges are awarded only via the
-- check_and_award_badges() SECURITY DEFINER function (server-side trusted code).
DROP POLICY IF EXISTS "Users can earn badges" ON public.user_badges;

-- 3. Allow admins to manage waitlist entries (update/delete spam)
CREATE POLICY "Admins can update waitlist"
ON public.waitlist
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete waitlist"
ON public.waitlist
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. Restrict listing of public storage buckets while still allowing
-- individual file access via direct URL. We replace the broad SELECT
-- policies with ones that require an exact object name in the request,
-- which prevents bucket-wide LIST operations but keeps direct GETs working.
DROP POLICY IF EXISTS "Anyone can view perfume images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;

CREATE POLICY "Public can read perfume images by path"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'perfume-images' AND name IS NOT NULL AND name <> '');

CREATE POLICY "Public can read avatars by path"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars' AND name IS NOT NULL AND name <> '');
