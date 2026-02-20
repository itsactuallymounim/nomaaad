-- Force RLS on all three tables so the policies are always enforced,
-- even for the table owner / superuser connections used by the Supabase API.
ALTER TABLE public.trips FORCE ROW LEVEL SECURITY;
ALTER TABLE public.days FORCE ROW LEVEL SECURITY;
ALTER TABLE public.activities FORCE ROW LEVEL SECURITY;