-- Add unique constraint to enforce per-user unique migration key
ALTER TABLE qr_migration
ADD CONSTRAINT uq_qr_migration_user_key UNIQUE (user_id, key);
