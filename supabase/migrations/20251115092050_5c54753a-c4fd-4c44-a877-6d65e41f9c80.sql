-- Drop old perfumes table and enum
DROP TABLE IF EXISTS public.perfumes CASCADE;
DROP TYPE IF EXISTS public.perfume_season CASCADE;

-- Create brands table
CREATE TABLE public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create notes table
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('top', 'heart', 'base')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create accords table
CREATE TABLE public.accords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create seasons table
CREATE TABLE public.seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default seasons
INSERT INTO public.seasons (name) VALUES 
  ('Spring'),
  ('Summer'),
  ('Fall'),
  ('Winter'),
  ('All Season');

-- Create perfumes table with new structure
CREATE TABLE public.perfumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  year INTEGER,
  concentration TEXT,
  description TEXT,
  image_url TEXT,
  main_accord_id UUID REFERENCES public.accords(id) ON DELETE SET NULL,
  rating NUMERIC(3, 2) DEFAULT 0,
  votes INTEGER DEFAULT 0,
  longevity TEXT,
  sillage TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create junction tables
CREATE TABLE public.perfume_notes (
  perfume_id UUID REFERENCES public.perfumes(id) ON DELETE CASCADE,
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,
  PRIMARY KEY (perfume_id, note_id)
);

CREATE TABLE public.perfume_accords (
  perfume_id UUID REFERENCES public.perfumes(id) ON DELETE CASCADE,
  accord_id UUID REFERENCES public.accords(id) ON DELETE CASCADE,
  PRIMARY KEY (perfume_id, accord_id)
);

CREATE TABLE public.perfume_similar (
  perfume_id UUID REFERENCES public.perfumes(id) ON DELETE CASCADE,
  similar_id UUID REFERENCES public.perfumes(id) ON DELETE CASCADE,
  PRIMARY KEY (perfume_id, similar_id),
  CHECK (perfume_id != similar_id)
);

CREATE TABLE public.perfume_seasons (
  perfume_id UUID REFERENCES public.perfumes(id) ON DELETE CASCADE,
  season_id UUID REFERENCES public.seasons(id) ON DELETE CASCADE,
  PRIMARY KEY (perfume_id, season_id)
);

-- Create indexes for performance
CREATE INDEX idx_perfumes_brand ON public.perfumes(brand_id);
CREATE INDEX idx_perfumes_main_accord ON public.perfumes(main_accord_id);
CREATE INDEX idx_perfume_notes_perfume ON public.perfume_notes(perfume_id);
CREATE INDEX idx_perfume_notes_note ON public.perfume_notes(note_id);
CREATE INDEX idx_perfume_accords_perfume ON public.perfume_accords(perfume_id);
CREATE INDEX idx_perfume_seasons_perfume ON public.perfume_seasons(perfume_id);

-- Enable RLS on all tables
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfume_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfume_accords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfume_similar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfume_seasons ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public read, admin write
CREATE POLICY "Anyone can view brands" ON public.brands FOR SELECT USING (true);
CREATE POLICY "Admins can manage brands" ON public.brands FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view notes" ON public.notes FOR SELECT USING (true);
CREATE POLICY "Admins can manage notes" ON public.notes FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view accords" ON public.accords FOR SELECT USING (true);
CREATE POLICY "Admins can manage accords" ON public.accords FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view seasons" ON public.seasons FOR SELECT USING (true);
CREATE POLICY "Admins can manage seasons" ON public.seasons FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view perfumes" ON public.perfumes FOR SELECT USING (true);
CREATE POLICY "Admins can manage perfumes" ON public.perfumes FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view perfume_notes" ON public.perfume_notes FOR SELECT USING (true);
CREATE POLICY "Admins can manage perfume_notes" ON public.perfume_notes FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view perfume_accords" ON public.perfume_accords FOR SELECT USING (true);
CREATE POLICY "Admins can manage perfume_accords" ON public.perfume_accords FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view perfume_similar" ON public.perfume_similar FOR SELECT USING (true);
CREATE POLICY "Admins can manage perfume_similar" ON public.perfume_similar FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view perfume_seasons" ON public.perfume_seasons FOR SELECT USING (true);
CREATE POLICY "Admins can manage perfume_seasons" ON public.perfume_seasons FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON public.brands
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_perfumes_updated_at BEFORE UPDATE ON public.perfumes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();