alter database postgres
  set timezone to 'Asia/Seoul';

alter table public.profiles
  alter column created_at set default now();

alter table public.leaderboard
  alter column updated_at set default now();

alter table public.profiles
  add column if not exists created_at_kst timestamp without time zone,
  add column if not exists terms_agreed_at_kst timestamp without time zone,
  add column if not exists privacy_agreed_at_kst timestamp without time zone;

alter table public.leaderboard
  add column if not exists updated_at_kst timestamp without time zone,
  add column if not exists result_report_generated_at_kst timestamp without time zone;

alter table public.profiles
  drop constraint if exists profiles_required_contact_fields_not_blank,
  drop constraint if exists profiles_required_consents;

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

alter table public.profiles
  add constraint profiles_required_contact_fields_not_blank
  check (
    char_length(btrim(nickname)) > 0
    and char_length(btrim(nationality)) > 0
    and char_length(btrim(phone_number)) > 0
  )
  not valid,
  add constraint profiles_required_consents
  check (
    is_dummy
    or (
      terms_agreed = true
      and terms_agreed_at is not null
      and privacy_agreed = true
      and privacy_agreed_at is not null
    )
  )
  not valid;

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
