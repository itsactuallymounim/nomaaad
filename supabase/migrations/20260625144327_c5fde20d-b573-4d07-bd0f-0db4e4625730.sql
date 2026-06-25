
-- Fix trips/days/activities policies to be scoped to authenticated role
DROP POLICY IF EXISTS "Users can create own trips" ON public.trips;
DROP POLICY IF EXISTS "Users can delete own trips" ON public.trips;
DROP POLICY IF EXISTS "Users can update own trips" ON public.trips;
DROP POLICY IF EXISTS "Users can view own trips" ON public.trips;

CREATE POLICY "Users can create own trips" ON public.trips FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own trips" ON public.trips FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update own trips" ON public.trips FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can view own trips" ON public.trips FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own days" ON public.days;
DROP POLICY IF EXISTS "Users can delete own days" ON public.days;
DROP POLICY IF EXISTS "Users can update own days" ON public.days;
DROP POLICY IF EXISTS "Users can view own days" ON public.days;

CREATE POLICY "Users can create own days" ON public.days FOR INSERT TO authenticated WITH CHECK (public.is_trip_owner(trip_id));
CREATE POLICY "Users can delete own days" ON public.days FOR DELETE TO authenticated USING (public.is_trip_owner(trip_id));
CREATE POLICY "Users can update own days" ON public.days FOR UPDATE TO authenticated USING (public.is_trip_owner(trip_id));
CREATE POLICY "Users can view own days" ON public.days FOR SELECT TO authenticated USING (public.is_trip_owner(trip_id));

DROP POLICY IF EXISTS "Users can create own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can delete own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can update own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can view own activities" ON public.activities;

CREATE POLICY "Users can create own activities" ON public.activities FOR INSERT TO authenticated WITH CHECK (public.is_day_owner(day_id));
CREATE POLICY "Users can delete own activities" ON public.activities FOR DELETE TO authenticated USING (public.is_day_owner(day_id));
CREATE POLICY "Users can update own activities" ON public.activities FOR UPDATE TO authenticated USING (public.is_day_owner(day_id));
CREATE POLICY "Users can view own activities" ON public.activities FOR SELECT TO authenticated USING (public.is_day_owner(day_id));

-- Move the vector extension out of the public schema
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO authenticated, anon, service_role;
ALTER EXTENSION vector SET SCHEMA extensions;

-- Ensure functions that use the vector type can still find it
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
  LOOP
    BEGIN
      EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = public, extensions', r.nspname, r.proname, r.args);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;
END $$;
