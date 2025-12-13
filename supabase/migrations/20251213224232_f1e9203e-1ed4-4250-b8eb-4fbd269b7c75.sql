-- Create storage bucket for AI-generated perfume images
INSERT INTO storage.buckets (id, name, public)
VALUES ('perfume-images', 'perfume-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to perfume images
CREATE POLICY "Anyone can view perfume images"
ON storage.objects FOR SELECT
USING (bucket_id = 'perfume-images');

-- Allow authenticated users to upload perfume images (for edge function via service role)
CREATE POLICY "Service role can upload perfume images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'perfume-images');

-- Allow service role to update/delete perfume images
CREATE POLICY "Service role can manage perfume images"
ON storage.objects FOR ALL
USING (bucket_id = 'perfume-images');