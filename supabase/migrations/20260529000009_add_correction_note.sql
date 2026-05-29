-- Add correction_note column for user-submitted OCR error reports
ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS correction_note TEXT;
