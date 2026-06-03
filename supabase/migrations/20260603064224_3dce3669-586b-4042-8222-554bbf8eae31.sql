CREATE OR REPLACE FUNCTION public.get_user_collection_context(p_user_id uuid)
 RETURNS TABLE(perfume_name text, brand_name text, status text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT p.name, b.name, uc.status::text
  FROM user_collections uc
  JOIN perfumes p ON uc.perfume_id = p.id
  JOIN brands b ON p.brand_id = b.id
  WHERE uc.user_id = p_user_id
  AND uc.status IN ('owned', 'wishlist')
  ORDER BY uc.status
  LIMIT 70;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_user_collection_context(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_collection_context(uuid) TO service_role;