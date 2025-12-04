-- Add new columns to perfumes table
ALTER TABLE public.perfumes
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS rating_value double precision,
ADD COLUMN IF NOT EXISTS rating_count integer,
ADD COLUMN IF NOT EXISTS fragrantica_url text,
ADD COLUMN IF NOT EXISTS slug text;

-- Add unique constraint on slug
ALTER TABLE public.perfumes
ADD CONSTRAINT perfumes_slug_unique UNIQUE (slug);