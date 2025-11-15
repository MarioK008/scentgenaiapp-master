-- Create import_logs table to track CSV imports
CREATE TABLE IF NOT EXISTS public.import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  filename TEXT NOT NULL,
  total_rows INTEGER NOT NULL DEFAULT 0,
  successful_rows INTEGER NOT NULL DEFAULT 0,
  failed_rows INTEGER NOT NULL DEFAULT 0,
  error_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

-- Admin can view import logs
CREATE POLICY "Admins can view import logs"
ON public.import_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Service role can insert logs
CREATE POLICY "Service role can insert logs"
ON public.import_logs
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_import_logs_created_at ON public.import_logs(created_at DESC);
CREATE INDEX idx_import_logs_table_name ON public.import_logs(table_name);