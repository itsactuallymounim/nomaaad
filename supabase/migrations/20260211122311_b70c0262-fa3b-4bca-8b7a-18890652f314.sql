
-- Trips table
CREATE TABLE public.trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  destination TEXT NOT NULL DEFAULT '',
  start_date DATE,
  end_date DATE,
  cover_image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Days table
CREATE TABLE public.days (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  date DATE,
  title TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Activities table
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day_id UUID NOT NULL REFERENCES public.days(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  lat DOUBLE PRECISION NOT NULL DEFAULT 0,
  lng DOUBLE PRECISION NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'activity',
  time_slot TEXT NOT NULL DEFAULT 'morning',
  media_url TEXT,
  duration INTEGER,
  price NUMERIC,
  rating NUMERIC,
  address TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_trips_user_id ON public.trips(user_id);
CREATE INDEX idx_days_trip_id ON public.days(trip_id);
CREATE INDEX idx_activities_day_id ON public.activities(day_id);

-- Enable RLS
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION public.is_trip_owner(trip_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trips WHERE id = trip_id AND user_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION public.is_day_owner(day_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.days d
    JOIN public.trips t ON t.id = d.trip_id
    WHERE d.id = day_id AND t.user_id = auth.uid()
  )
$$;

-- Trips RLS
CREATE POLICY "Users can view own trips" ON public.trips FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own trips" ON public.trips FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own trips" ON public.trips FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own trips" ON public.trips FOR DELETE USING (user_id = auth.uid());

-- Days RLS
CREATE POLICY "Users can view own days" ON public.days FOR SELECT USING (public.is_trip_owner(trip_id));
CREATE POLICY "Users can create own days" ON public.days FOR INSERT WITH CHECK (public.is_trip_owner(trip_id));
CREATE POLICY "Users can update own days" ON public.days FOR UPDATE USING (public.is_trip_owner(trip_id));
CREATE POLICY "Users can delete own days" ON public.days FOR DELETE USING (public.is_trip_owner(trip_id));

-- Activities RLS
CREATE POLICY "Users can view own activities" ON public.activities FOR SELECT USING (public.is_day_owner(day_id));
CREATE POLICY "Users can create own activities" ON public.activities FOR INSERT WITH CHECK (public.is_day_owner(day_id));
CREATE POLICY "Users can update own activities" ON public.activities FOR UPDATE USING (public.is_day_owner(day_id));
CREATE POLICY "Users can delete own activities" ON public.activities FOR DELETE USING (public.is_day_owner(day_id));

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
