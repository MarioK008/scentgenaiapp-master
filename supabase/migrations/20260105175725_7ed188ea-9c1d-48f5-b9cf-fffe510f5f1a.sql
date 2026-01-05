-- Add RLS policies for rate_limits table
-- This table is used by edge functions for rate limiting
-- Only authenticated users should be able to see their own rate limit records
-- Service role bypasses RLS for full access

-- Policy: Allow users to view their own rate limit entries (by identifier)
CREATE POLICY "Users can view their own rate limits"
ON public.rate_limits
FOR SELECT
USING (identifier = auth.uid()::text OR identifier = current_setting('request.headers', true)::json->>'x-forwarded-for');

-- Policy: Service role handles all inserts/updates/deletes via edge functions
-- Edge functions run with service role which bypasses RLS
-- No explicit policies needed for those operations as they use service_role key