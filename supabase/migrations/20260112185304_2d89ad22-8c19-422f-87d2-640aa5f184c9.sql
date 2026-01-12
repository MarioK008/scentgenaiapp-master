-- Add onboarding and preference columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_families TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_occasions TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_seasons TEXT[] DEFAULT '{}';