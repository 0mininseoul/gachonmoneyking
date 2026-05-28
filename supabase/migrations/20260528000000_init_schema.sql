-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (stores user private details)
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    nickname text not null,
    nationality text not null,
    real_name text not null,
    phone_number text not null,
    gender text not null,
    marketing_consent boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Leaderboard table (public ranking dashboard)
create table public.leaderboard (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) on delete cascade unique,
    nickname text not null,
    nationality text not null,
    balance numeric default 0 not null,
    screenshot_url text not null,
    status text default 'pending_ocr'::text not null check (status in ('pending_ocr', 'verified', 'rejected')),
    rank_cached integer,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.profiles enable row level security;
alter table public.leaderboard enable row level security;

-- Read policies
create policy "Allow public read for leaderboard" on public.leaderboard
    for select using (true);

create policy "Allow authenticated users to read their own profile" on public.profiles
    for select using (auth.uid() = id);

-- Write policies
create policy "Allow authenticated users to insert/update their profiles" on public.profiles
    for all using (auth.uid() = id);

create policy "Allow authenticated users to insert/update their leaderboard record" on public.leaderboard
    for all using (auth.uid() = user_id);
