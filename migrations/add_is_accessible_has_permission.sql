-- Migration: add is_accessible & has_permission to menu_role_permissions
-- Note: If run multiple times may error on existing columns. Remove lines if already applied.
ALTER TABLE menu_role_permissions ADD COLUMN is_accessible boolean DEFAULT true;
ALTER TABLE menu_role_permissions ADD COLUMN has_permission boolean DEFAULT true;

-- Backfill explicit true values for any existing rows (should already be defaulted)
UPDATE menu_role_permissions SET is_accessible = true WHERE is_accessible IS NULL;
UPDATE menu_role_permissions SET has_permission = true WHERE has_permission IS NULL;

-- (Optional) enforce NOT NULL after verifying data
-- ALTER TABLE menu_role_permissions ALTER COLUMN is_accessible SET NOT NULL;
-- ALTER TABLE menu_role_permissions ALTER COLUMN has_permission SET NOT NULL;