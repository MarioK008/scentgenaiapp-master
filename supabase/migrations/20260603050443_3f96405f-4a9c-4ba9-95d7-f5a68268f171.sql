
-- Tighten EXECUTE on SECURITY DEFINER functions to least privilege

-- Trigger-only: never called via API
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Called only from edge functions (service_role)
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.match_knowledge_chunks(vector, double precision, integer, uuid) FROM PUBLIC, anon, authenticated;

-- Used by RLS policies and client badge checks — keep authenticated, drop anon/public
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.check_and_award_badges(uuid) FROM PUBLIC, anon;
