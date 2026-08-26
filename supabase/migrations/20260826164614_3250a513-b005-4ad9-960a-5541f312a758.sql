create schema if not exists private;
revoke all on schema private from anon, authenticated;

create or replace function private.is_trip_owner(trip_id uuid)
returns boolean language sql stable security definer set search_path to 'public','extensions' as $$
  select exists (select 1 from public.trips where id = trip_id and user_id = auth.uid())
$$;

create or replace function private.is_day_owner(day_id uuid)
returns boolean language sql stable security definer set search_path to 'public','extensions' as $$
  select exists (
    select 1 from public.days d join public.trips t on t.id = d.trip_id
    where d.id = day_id and t.user_id = auth.uid()
  )
$$;

revoke all on function private.is_trip_owner(uuid), private.is_day_owner(uuid) from public;

drop policy "Users can view own days" on public.days;
drop policy "Users can create own days" on public.days;
drop policy "Users can update own days" on public.days;
drop policy "Users can delete own days" on public.days;
create policy "Users can view own days" on public.days for select to authenticated using (private.is_trip_owner(trip_id));
create policy "Users can create own days" on public.days for insert to authenticated with check (private.is_trip_owner(trip_id));
create policy "Users can update own days" on public.days for update to authenticated using (private.is_trip_owner(trip_id)) with check (private.is_trip_owner(trip_id));
create policy "Users can delete own days" on public.days for delete to authenticated using (private.is_trip_owner(trip_id));

drop policy "Users can view own activities" on public.activities;
drop policy "Users can create own activities" on public.activities;
drop policy "Users can update own activities" on public.activities;
drop policy "Users can delete own activities" on public.activities;
create policy "Users can view own activities" on public.activities for select to authenticated using (private.is_day_owner(day_id));
create policy "Users can create own activities" on public.activities for insert to authenticated with check (private.is_day_owner(day_id));
create policy "Users can update own activities" on public.activities for update to authenticated using (private.is_day_owner(day_id)) with check (private.is_day_owner(day_id));
create policy "Users can delete own activities" on public.activities for delete to authenticated using (private.is_day_owner(day_id));

drop function if exists public.is_trip_owner(uuid);
drop function if exists public.is_day_owner(uuid);

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.match_saved_places(vector, uuid, double precision, integer) from public, anon, authenticated;
grant execute on function public.match_saved_places(vector, uuid, double precision, integer) to service_role;