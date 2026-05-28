-- Add columns to public.profiles
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists is_dummy boolean default false not null;

-- Add columns to public.leaderboard
alter table public.leaderboard add column if not exists is_dummy boolean default false not null;

-- Trigger function to automatically sync profiles (nickname, nationality) changes to the leaderboard
create or replace function public.sync_profile_to_leaderboard()
returns trigger as $$
begin
    update public.leaderboard
    set nickname = new.nickname,
        nationality = new.nationality
    where user_id = new.id;
    return new;
end;
$$ language plpgsql;

-- Recreate trigger on profiles
drop trigger if exists tr_sync_profile_to_leaderboard on public.profiles;
create trigger tr_sync_profile_to_leaderboard
after update of nickname, nationality on public.profiles
for each row
execute function public.sync_profile_to_leaderboard();

-- Enable Postgres Realtime for profiles and leaderboard tables safely
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'leaderboard'
  ) then
    alter publication supabase_realtime add table public.leaderboard;
  end if;
end $$;
