-- Migration: Add composite indexes for performance on retention & per-user analytics lookups
-- Generated manually (ensure this directory name is chronological & unique)

-- Safety: Only create if not exists (PostgreSQL 9.5+ supports IF NOT EXISTS for indexes?)
-- We will defensively check via DO block to avoid duplicate creation errors on older versions.

-- PostgreSQL 9.5+ supports IF NOT EXISTS for CREATE INDEX directly.
CREATE INDEX IF NOT EXISTS idx_click_events_user_clicked_at ON click_events(user_id, clicked_at);
CREATE INDEX IF NOT EXISTS idx_scan_events_user_scanned_at ON scan_events(user_id, scanned_at);

-- user_activity already has (user_id, created_at) via idx_user_activity_user_created
-- No action needed for user_activity.
