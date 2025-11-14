-- Add email tracking columns to waitlist table
ALTER TABLE public.waitlist 
ADD COLUMN IF NOT EXISTS email_sent_at timestamptz,
ADD COLUMN IF NOT EXISTS welcome_email_status text DEFAULT 'pending';

-- Create index for email status queries
CREATE INDEX IF NOT EXISTS idx_waitlist_email_status ON public.waitlist(welcome_email_status);

-- Add comment for clarity
COMMENT ON COLUMN public.waitlist.email_sent_at IS 'Timestamp when the welcome email was successfully sent';
COMMENT ON COLUMN public.waitlist.welcome_email_status IS 'Status of welcome email: pending, sent, failed';