
CREATE TABLE public.saved_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  icon text DEFAULT '📍',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.saved_places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES public.saved_lists(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  address text DEFAULT '',
  lat double precision DEFAULT 0,
  lng double precision DEFAULT 0,
  category text DEFAULT 'activity',
  rating numeric DEFAULT NULL,
  price numeric DEFAULT NULL,
  image_url text DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own lists" ON public.saved_lists FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can create own lists" ON public.saved_lists FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own lists" ON public.saved_lists FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own lists" ON public.saved_lists FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can view own places" ON public.saved_places FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can create own places" ON public.saved_places FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own places" ON public.saved_places FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own places" ON public.saved_places FOR DELETE TO authenticated USING (user_id = auth.uid());
