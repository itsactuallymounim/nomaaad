-- Ensure RLS is forced on all data tables (idempotent)
ALTER TABLE public.trips FORCE ROW LEVEL SECURITY;
ALTER TABLE public.days FORCE ROW LEVEL SECURITY;
ALTER TABLE public.activities FORCE ROW LEVEL SECURITY;