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
  SELECT 
    COUNT(*) FILTER (WHERE status = 'owned'),
    COUNT(*) FILTER (WHERE status = 'wishlist'),
    COUNT(*) FILTER (WHERE rating IS NOT NULL),
    COUNT(*) FILTER (WHERE rating = 5)
  INTO v_total_perfumes, v_wishlist_count, v_rated_perfumes, v_five_star_ratings
  FROM user_collections
  WHERE user_id = p_user_id;

  SELECT COUNT(DISTINCT pn.note_id)
  INTO v_unique_notes
  FROM user_collections uc
  JOIN perfume_notes pn ON uc.perfume_id = pn.perfume_id
  WHERE uc.user_id = p_user_id
    AND uc.status = 'owned';

  SELECT 
    COUNT(*) FILTER (WHERE follower_id = p_user_id AND status = 'approved'),
    COUNT(*) FILTER (WHERE followed_id = p_user_id AND status = 'approved')
  INTO v_following_count, v_follower_count
  FROM user_follows;

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