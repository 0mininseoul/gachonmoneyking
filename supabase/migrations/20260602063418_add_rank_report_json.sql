alter table public.leaderboard
  add column if not exists result_report_json jsonb,
  add column if not exists result_report_generated_at timestamp with time zone;
