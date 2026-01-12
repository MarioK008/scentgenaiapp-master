-- Remove unnecessary service role INSERT policies
-- Edge functions use service role which bypasses RLS, making these redundant
DROP POLICY IF EXISTS "Service role can insert logs" ON email_logs;
DROP POLICY IF EXISTS "Service role can insert logs" ON import_logs;