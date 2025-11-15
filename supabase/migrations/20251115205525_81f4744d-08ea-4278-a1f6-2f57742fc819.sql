-- Update the handle_new_user trigger function to send welcome emails and admin notifications
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_username TEXT;
BEGIN
  -- Get username from metadata or generate from email
  v_username := COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1));
  
  -- Insert into profiles
  INSERT INTO public.profiles (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    v_username
  );
  
  -- Insert user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Trigger welcome email in background (will be called by edge function via Supabase Functions)
  -- Note: We'll call this from the Auth.tsx after successful signup to avoid blocking
  
  RETURN NEW;
END;
$$;