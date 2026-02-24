-- Adds priority and weight columns to activity_types table (idempotent)
-- Run manually; does NOT depend on Prisma migrate.

BEGIN;

-- Add columns individually (PostgreSQL supports IF NOT EXISTS)
ALTER TABLE activity_types ADD COLUMN IF NOT EXISTS priority INT DEFAULT 100;
ALTER TABLE activity_types ADD COLUMN IF NOT EXISTS weight INT DEFAULT 0;

-- Optional: index to support ordering by priority then code
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'i'
      AND c.relname = 'idx_activity_types_priority_code'
  ) THEN
    EXECUTE 'CREATE INDEX idx_activity_types_priority_code ON activity_types (priority ASC, code ASC)';
  END IF;
END$$;

COMMIT;

-- Verification:
-- \d+ activity_types
-- SELECT code, priority, weight FROM activity_types ORDER BY priority, code LIMIT 20;