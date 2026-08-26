grant usage on schema private to authenticated;
grant execute on function private.is_trip_owner(uuid), private.is_day_owner(uuid) to authenticated;