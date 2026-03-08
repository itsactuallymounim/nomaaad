
CREATE TABLE public.preference_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  city text NOT NULL,
  activity_title text NOT NULL,
  activity_category text NOT NULL DEFAULT 'activity',
  rating integer CHECK (rating >= 1 AND rating <= 5),
  feedback text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.preference_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preference_logs FORCE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own preferences" ON public.preference_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can view own preferences" ON public.preference_logs FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own preferences" ON public.preference_logs FOR DELETE TO authenticated USING (user_id = auth.uid());
