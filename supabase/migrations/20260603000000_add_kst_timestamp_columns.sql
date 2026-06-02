alter table public.profiles
  add column if not exists created_at_kst timestamp without time zone,
  add column if not exists terms_agreed_at_kst timestamp without time zone,
  add column if not exists privacy_agreed_at_kst timestamp without time zone;

alter table public.leaderboard
  add column if not exists updated_at_kst timestamp without time zone,
  add column if not exists result_report_generated_at_kst timestamp without time zone;

update public.profiles
set
  created_at_kst = created_at at time zone 'Asia/Seoul',
  terms_agreed_at_kst = case
    when terms_agreed_at is null then null
    else terms_agreed_at at time zone 'Asia/Seoul'
  end,
  privacy_agreed_at_kst = case
    when privacy_agreed_at is null then null
    else privacy_agreed_at at time zone 'Asia/Seoul'
  end;

update public.leaderboard
set
  updated_at_kst = updated_at at time zone 'Asia/Seoul',
  result_report_generated_at_kst = case
    when result_report_generated_at is null then null
    else result_report_generated_at at time zone 'Asia/Seoul'
  end;

create or replace function public.sync_profiles_kst_timestamps()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.created_at_kst = case
    when new.created_at is null then null
    else new.created_at at time zone 'Asia/Seoul'
  end;
  new.terms_agreed_at_kst = case
    when new.terms_agreed_at is null then null
    else new.terms_agreed_at at time zone 'Asia/Seoul'
  end;
  new.privacy_agreed_at_kst = case
    when new.privacy_agreed_at is null then null
    else new.privacy_agreed_at at time zone 'Asia/Seoul'
  end;
  return new;
end;
$$;

drop trigger if exists profiles_sync_kst_timestamps on public.profiles;
create trigger profiles_sync_kst_timestamps
before insert or update of created_at, terms_agreed_at, privacy_agreed_at
on public.profiles
for each row
execute function public.sync_profiles_kst_timestamps();

create or replace function public.sync_leaderboard_kst_timestamps()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at_kst = case
    when new.updated_at is null then null
    else new.updated_at at time zone 'Asia/Seoul'
  end;
  new.result_report_generated_at_kst = case
    when new.result_report_generated_at is null then null
    else new.result_report_generated_at at time zone 'Asia/Seoul'
  end;
  return new;
end;
$$;

drop trigger if exists leaderboard_sync_kst_timestamps on public.leaderboard;
create trigger leaderboard_sync_kst_timestamps
before insert or update of updated_at, result_report_generated_at
on public.leaderboard
for each row
execute function public.sync_leaderboard_kst_timestamps();
