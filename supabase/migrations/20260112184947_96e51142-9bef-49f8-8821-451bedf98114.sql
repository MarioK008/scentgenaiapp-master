-- Security Hardening: Fix RLS policy warnings

-- Fix 1: Update waitlist INSERT policy to validate email
DROP POLICY IF EXISTS "Anyone can join waitlist" ON waitlist;
CREATE POLICY "Anyone can join waitlist" ON waitlist
  FOR INSERT
  WITH CHECK (email IS NOT NULL AND email != '');

-- Fix 2: Remove overly permissive email_templates SELECT policy
-- Edge functions use service role which bypasses RLS anyway
DROP POLICY IF EXISTS "Service role can read templates" ON email_templates;

-- Fix 3: Replace user-visible rate_limits policy with admin-only
DROP POLICY IF EXISTS "Users can view their own rate limits" ON rate_limits;
CREATE POLICY "Admins can view rate limits" ON rate_limits
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));