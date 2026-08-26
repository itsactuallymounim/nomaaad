CREATE TABLE public.businesses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'restaurant',
  description text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  phone text,
  website text,
  contact_email text,
  price_min numeric,
  price_max numeric,
  currency text NOT NULL DEFAULT 'EUR',
  price_level integer NOT NULL DEFAULT 2,
  image_url text,
  lat double precision,
  lng double precision,
  google_place_id text,
  google_name text,
  google_address text,
  google_rating numeric,
  google_review_count integer,
  google_reviews jsonb NOT NULL DEFAULT '[]'::jsonb,
  google_synced_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.businesses TO anon;
GRANT SELECT, INSERT ON public.businesses TO authenticated;
GRANT ALL ON public.businesses TO service_role;

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view businesses"
  ON public.businesses FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Anyone can submit a business"
  ON public.businesses FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(name) BETWEEN 2 AND 120
    AND char_length(description) <= 2000
    AND char_length(address) <= 300
    AND char_length(city) <= 120
    AND price_level BETWEEN 1 AND 4
    AND (price_min IS NULL OR price_min >= 0)
    AND (price_max IS NULL OR price_max >= 0)
  );

CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX businesses_city_idx ON public.businesses (city);
CREATE INDEX businesses_created_at_idx ON public.businesses (created_at DESC);