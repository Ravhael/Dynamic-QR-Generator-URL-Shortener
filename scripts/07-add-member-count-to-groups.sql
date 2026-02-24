-- Add persistent member_count column to groups table
-- IMPORTANT: We're managing SQL manually (no prisma migrate) per project policy.
-- Safe to run multiple times: uses IF NOT EXISTS checks.

ALTER TABLE groups
ADD COLUMN IF NOT EXISTS member_count INTEGER DEFAULT 0;

-- Backfill existing counts
WITH counts AS (
  SELECT g.id, COUNT(u.id)::int AS c
  FROM groups g
  LEFT JOIN users u ON u.group_id = g.id
  GROUP BY g.id
)
UPDATE groups g
SET member_count = counts.c
FROM counts
WHERE g.id = counts.id;

-- Optional: create trigger to keep member_count consistent automatically.
-- If you prefer to manage counts only in application code, skip this section.
-- Uncomment to enable database-level enforcement.
/*
CREATE OR REPLACE FUNCTION trg_update_group_member_count() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.group_id IS NOT NULL THEN
      UPDATE groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.group_id IS DISTINCT FROM NEW.group_id THEN
      IF OLD.group_id IS NOT NULL THEN
        UPDATE groups SET member_count = member_count - 1 WHERE id = OLD.group_id;
      END IF;
      IF NEW.group_id IS NOT NULL THEN
        UPDATE groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.group_id IS NOT NULL THEN
      UPDATE groups SET member_count = member_count - 1 WHERE id = OLD.group_id;
    END IF;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_member_count ON users;
CREATE TRIGGER trg_users_member_count
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION trg_update_group_member_count();
*/

-- Verification query
-- SELECT id, name, member_count FROM groups ORDER BY id;
