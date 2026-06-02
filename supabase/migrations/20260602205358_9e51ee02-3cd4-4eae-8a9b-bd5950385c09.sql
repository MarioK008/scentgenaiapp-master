-- 1) Enable RLS on scan_submissions (table had no RLS, exposed via PostgREST)
ALTER TABLE public.scan_submissions ENABLE ROW LEVEL SECURITY;

-- Restrict access: only admins and the submitting user can read; users can insert their own
CREATE POLICY "Users can view own scan submissions"
  ON public.scan_submissions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create own scan submissions"
  ON public.scan_submissions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage scan submissions"
  ON public.scan_submissions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2) Pin search_path on SECURITY DEFINER queue helper functions
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pg_temp;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pg_temp;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pg_temp;

-- 3) Lock down SECURITY DEFINER queue helpers: only service_role (edge functions) may call them
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;