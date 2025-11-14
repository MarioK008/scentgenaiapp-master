-- Create badges table
CREATE TABLE public.badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_badges table to track which badges users have earned
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Enable RLS
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Anyone can view badges
CREATE POLICY "Anyone can view badges"
ON public.badges
FOR SELECT
USING (true);

-- Anyone can view user badges
CREATE POLICY "Anyone can view user badges"
ON public.user_badges
FOR SELECT
USING (true);

-- System can insert user badges (we'll handle this through functions)
CREATE POLICY "Users can earn badges"
ON public.user_badges
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Insert initial badges
INSERT INTO public.badges (name, description, icon, category, requirement_type, requirement_value) VALUES
  ('First Step', 'Add your first perfume to your collection', '🎯', 'collection', 'total_perfumes', 1),
  ('Getting Started', 'Add 5 perfumes to your collection', '🌟', 'collection', 'total_perfumes', 5),
  ('Growing Collection', 'Add 10 perfumes to your collection', '✨', 'collection', 'total_perfumes', 10),
  ('Dedicated Collector', 'Add 25 perfumes to your collection', '🏆', 'collection', 'total_perfumes', 25),
  ('Master Collector', 'Add 50 perfumes to your collection', '👑', 'collection', 'total_perfumes', 50),
  ('Perfume Connoisseur', 'Add 100 perfumes to your collection', '💎', 'collection', 'total_perfumes', 100),
  
  ('Wish List Starter', 'Add 5 perfumes to your wishlist', '⭐', 'wishlist', 'wishlist_count', 5),
  ('Dreaming Big', 'Add 10 perfumes to your wishlist', '🌠', 'wishlist', 'wishlist_count', 10),
  ('Ultimate Wishlist', 'Add 25 perfumes to your wishlist', '🎁', 'wishlist', 'wishlist_count', 25),
  
  ('First Review', 'Rate your first perfume', '📝', 'engagement', 'rated_perfumes', 1),
  ('Active Reviewer', 'Rate 10 perfumes', '✍️', 'engagement', 'rated_perfumes', 10),
  ('Expert Critic', 'Rate 25 perfumes', '🎭', 'engagement', 'rated_perfumes', 25),
  ('Master Reviewer', 'Rate 50 perfumes', '📚', 'engagement', 'rated_perfumes', 50),
  
  ('Quality Seeker', 'Rate 5 perfumes with 5 stars', '⭐⭐⭐⭐⭐', 'engagement', 'five_star_ratings', 5),
  ('Perfectionist', 'Rate 10 perfumes with 5 stars', '🌟🌟🌟🌟🌟', 'engagement', 'five_star_ratings', 10),
  
  ('Note Explorer', 'Try perfumes with 10 different notes', '🌸', 'discovery', 'unique_notes', 10),
  ('Note Expert', 'Try perfumes with 25 different notes', '🌺', 'discovery', 'unique_notes', 25),
  ('Note Master', 'Try perfumes with 50 different notes', '🌹', 'discovery', 'unique_notes', 50),
  
  ('Social Butterfly', 'Follow 5 users', '🦋', 'social', 'following_count', 5),
  ('Community Member', 'Follow 10 users', '👥', 'social', 'following_count', 10),
  ('Influencer', 'Have 10 followers', '🎤', 'social', 'follower_count', 10),
  ('Popular', 'Have 25 followers', '🌟', 'social', 'follower_count', 25);

-- Create indexes
CREATE INDEX idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX idx_user_badges_badge_id ON public.user_badges(badge_id);

-- Create function to check and award badges
CREATE OR REPLACE FUNCTION public.check_and_award_badges(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_perfumes INTEGER;
  v_wishlist_count INTEGER;
  v_rated_perfumes INTEGER;
  v_five_star_ratings INTEGER;
  v_unique_notes INTEGER;
  v_following_count INTEGER;
  v_follower_count INTEGER;
  v_badge RECORD;
BEGIN
  -- Get user stats
  SELECT 
    COUNT(*) FILTER (WHERE status = 'owned'),
    COUNT(*) FILTER (WHERE status = 'wishlist'),
    COUNT(*) FILTER (WHERE rating IS NOT NULL),
    COUNT(*) FILTER (WHERE rating = 5)
  INTO v_total_perfumes, v_wishlist_count, v_rated_perfumes, v_five_star_ratings
  FROM user_collections
  WHERE user_id = p_user_id;

  -- Get unique notes count
  SELECT COUNT(DISTINCT note)
  INTO v_unique_notes
  FROM (
    SELECT unnest(top_notes || heart_notes || base_notes) as note
    FROM user_collections uc
    JOIN perfumes p ON uc.perfume_id = p.id
    WHERE uc.user_id = p_user_id
  ) notes;

  -- Get social stats
  SELECT 
    COUNT(*) FILTER (WHERE follower_id = p_user_id AND status = 'approved'),
    COUNT(*) FILTER (WHERE followed_id = p_user_id AND status = 'approved')
  INTO v_following_count, v_follower_count
  FROM user_follows;

  -- Check and award badges
  FOR v_badge IN 
    SELECT b.id, b.requirement_type, b.requirement_value
    FROM badges b
    WHERE NOT EXISTS (
      SELECT 1 FROM user_badges ub 
      WHERE ub.user_id = p_user_id AND ub.badge_id = b.id
    )
  LOOP
    IF (v_badge.requirement_type = 'total_perfumes' AND v_total_perfumes >= v_badge.requirement_value) OR
       (v_badge.requirement_type = 'wishlist_count' AND v_wishlist_count >= v_badge.requirement_value) OR
       (v_badge.requirement_type = 'rated_perfumes' AND v_rated_perfumes >= v_badge.requirement_value) OR
       (v_badge.requirement_type = 'five_star_ratings' AND v_five_star_ratings >= v_badge.requirement_value) OR
       (v_badge.requirement_type = 'unique_notes' AND v_unique_notes >= v_badge.requirement_value) OR
       (v_badge.requirement_type = 'following_count' AND v_following_count >= v_badge.requirement_value) OR
       (v_badge.requirement_type = 'follower_count' AND v_follower_count >= v_badge.requirement_value)
    THEN
      INSERT INTO user_badges (user_id, badge_id)
      VALUES (p_user_id, v_badge.id)
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
  END LOOP;
END;
$$;