do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'gender'
  ) then
    alter table public.profiles
      alter column gender drop not null;
  end if;
end $$;

alter table public.profiles
  add column if not exists terms_agreed boolean default false not null,
  add column if not exists terms_agreed_at timestamp with time zone,
  add column if not exists privacy_agreed boolean default false not null,
  add column if not exists privacy_agreed_at timestamp with time zone;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_required_contact_fields_not_blank'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_required_contact_fields_not_blank
      check (
        char_length(btrim(nickname)) > 0
        and char_length(btrim(nationality)) > 0
        and char_length(btrim(phone_number)) > 0
      )
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_required_consents'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
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
  end if;
end $$;
